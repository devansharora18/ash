import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:http/http.dart' as http;

import 'settings_service.dart';

/// Build the ICE server list for flutter_webrtc: always the STUN fallback,
/// plus an optional TURN relay from settings.
List<Map<String, dynamic>> iceServersFor(AppSettings settings) => [
      {'urls': 'stun:stun.l.google.com:19302'},
      if (settings.turnUrl.isNotEmpty)
        {
          'urls': settings.turnUrl,
          if (settings.turnUsername.isNotEmpty) 'username': settings.turnUsername,
          if (settings.turnCredential.isNotEmpty)
            'credential': settings.turnCredential,
        },
    ];

/// Resolve ICE servers for the connection. When a Metered-style credentials
/// endpoint is configured, fetch the rotating list from it (its response is
/// already a ready-to-use `iceServers` array); otherwise fall back to the
/// static STUN + TURN list.
Future<List<Map<String, dynamic>>> resolveIceServers(
  AppSettings settings,
) async {
  if (settings.turnCredentialsUrl.isNotEmpty) {
    try {
      final res = await http
          .get(Uri.parse(settings.turnCredentialsUrl))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        if (json is List && json.isNotEmpty) {
          return json.cast<Map<String, dynamic>>();
        }
      }
    } catch (_) {
      // fall through to static servers
    }
  }
  return iceServersFor(settings);
}

/// Callbacks a chat screen uses to render mesh events. Keep it as a plain
/// class so tests can wire them without the real transport.
class RtcMeshCallbacks {
  void Function(String from, String text)? onMessage;
  void Function(String peerId, bool connected)? onConnectionChange;
  void Function(String from, String id, String name, int size)? onFileOffer;
  void Function(
    String peerId,
    String id,
    String name,
    int size,
    int sent,
    bool isSend,
  )? onFileProgress;
  void Function(String from, String id, String name, Uint8List bytes)?
      onFileComplete;
  void Function(String? peerId)? onFileCancelled;
  void Function(String from, String name, Uint8List bytes, int durationSec)?
      onVoice;
}

class _PeerConn {
  _PeerConn(this.pc);

  final RTCPeerConnection pc;
  RTCDataChannel? channel;
  bool connected = false;
  bool remoteSet = false;
  final List<Map<String, dynamic>> queuedCandidates = [];

  // outgoing file transfer
  String? outId;
  String? outName;
  int outSize = 0;
  int outSeq = 0;
  Uint8List? outBytes;

  // incoming file/voice transfer
  String? inId;
  String? inName;
  int inSize = 0;
  int inReceived = 0;
  final List<Uint8List> inParts = [];
  String? inKind;
  int inDurationMs = 0;

  Map<String, dynamic>? pendingOffer;

  bool get sending => outBytes != null;
  bool get receiving => inId != null;
}

/// Full-mesh WebRTC DataChannel layer. SDP/ICE ride the signaling relay; chat
/// text flows directly between peers once each DataChannel opens.
///
/// Offerer/answerer roles are assigned deterministically by peer id so two
/// peers never both send an offer. The wire format matches the web client so
/// web and mobile peers can interoperate.
class RtcMesh {
  RtcMesh(this.selfId, this.sendSignal, this.callbacks, [this.iceServers]);

  final String selfId;
  final void Function(String to, Object data) sendSignal;
  final RtcMeshCallbacks callbacks;
  final List<Map<String, dynamic>>? iceServers;

  final Map<String, _PeerConn> _conns = {};

  Future<void> addPeer(String peerId) async {
    if (_conns.containsKey(peerId)) return;
    final config = {
      'iceServers':
          iceServers ?? [{'urls': 'stun:stun.l.google.com:19302'}],
    };
    final pc = await createPeerConnection(config);
    final conn = _PeerConn(pc);
    _conns[peerId] = conn;
    _bindIce(peerId, pc);
    pc.onDataChannel = (channel) => _attachChannel(peerId, channel);
    if (selfId.compareTo(peerId) < 0) {
      final channel = await pc.createDataChannel('chat', RTCDataChannelInit());
      _attachChannel(peerId, channel);
      await _negotiateOffer(peerId);
    }
  }

  Future<void> removePeer(String peerId) async {
    final conn = _conns.remove(peerId);
    if (conn != null) {
      await conn.pc.close();
      conn.pc.dispose();
    }
  }

  void _bindIce(String peerId, RTCPeerConnection pc) {
    pc.onIceCandidate = (candidate) {
      sendSignal(peerId, {'type': 'candidate', 'candidate': candidate.toMap()});
    };
    pc.onConnectionState = (state) {
      final connected =
          state == RTCPeerConnectionState.RTCPeerConnectionStateConnected;
      final conn = _conns[peerId];
      if (conn != null && conn.connected != connected) {
        conn.connected = connected;
        callbacks.onConnectionChange?.call(peerId, connected);
      }
    };
  }

  void _attachChannel(String peerId, RTCDataChannel channel) {
    final conn = _conns[peerId];
    if (conn != null) conn.channel = channel;
    channel.stateChangeStream.listen((state) {
      if (state == RTCDataChannelState.RTCDataChannelOpen) {
        callbacks.onConnectionChange?.call(peerId, true);
      } else if (state == RTCDataChannelState.RTCDataChannelClosed) {
        callbacks.onConnectionChange?.call(peerId, false);
      }
    });
    channel.messageStream.listen((message) {
      if (message.isBinary) {
        _handleFileChunk(peerId, message.binary);
        return;
      }
      try {
        final data = jsonDecode(message.text) as Map<String, dynamic>;
        if (data['kind'] == 'chat' && data['text'] is String) {
          callbacks.onMessage?.call(peerId, data['text'] as String);
        } else if (data['kind'] == 'file' || data['kind'] == 'voice') {
          _handleFileControl(peerId, channel, data);
        }
      } catch (_) {
        // ignore malformed frames
      }
    });
  }

  static String _fileId() {
    final rand = math.Random();
    final t = DateTime.now().millisecondsSinceEpoch.toRadixString(36);
    final r = rand.nextInt(0xFFFFFF).toRadixString(36);
    return '$t-$r';
  }

  /// Propose a file to one peer; the peer must accept before chunks flow.
  void sendFile(String peerId, String name, Uint8List bytes) {
    final conn = _conns[peerId];
    final channel = conn?.channel;
    if (conn == null ||
        channel == null ||
        channel.state != RTCDataChannelState.RTCDataChannelOpen ||
        conn.sending) {
      return;
    }
    final id = _fileId();
    conn
      ..outId = id
      ..outName = name
      ..outSize = bytes.length
      ..outSeq = 0
      ..outBytes = bytes;
    channel.send(RTCDataChannelMessage(jsonEncode({
      'kind': 'file',
      'action': 'offer',
      'id': id,
      'name': name,
      'size': bytes.length,
      'mime': '',
    })));
  }

  /// Send a voice recording blob to one peer (auto-accepted on receive).
  void sendVoice(String peerId, Uint8List bytes, int durationSec) {
    final conn = _conns[peerId];
    final channel = conn?.channel;
    if (conn == null ||
        channel == null ||
        channel.state != RTCDataChannelState.RTCDataChannelOpen ||
        conn.sending) {
      return;
    }
    final id = _fileId();
    conn
      ..outId = id
      ..outName = 'Voice message'
      ..outSize = bytes.length
      ..outSeq = 0
      ..outBytes = bytes;
    channel.send(RTCDataChannelMessage(jsonEncode({
      'kind': 'voice',
      'action': 'offer',
      'id': id,
      'name': 'Voice message',
      'size': bytes.length,
      'mime': 'audio/m4a',
      'durationMs': durationSec * 1000,
    })));
  }

  void acceptFile(String peerId, String id) {
    final conn = _conns[peerId];
    final channel = conn?.channel;
    final offer = conn?.pendingOffer;
    if (conn == null || channel == null || offer == null) return;
    if (offer['id'] != id) return;
    conn
      ..inId = offer['id'] as String
      ..inName = offer['name'] as String
      ..inSize = (offer['size'] as num).toInt()
      ..inReceived = 0
      ..inParts.clear()
      ..pendingOffer = null;
    channel.send(RTCDataChannelMessage(jsonEncode({
      'kind': 'file',
      'action': 'accept',
      'id': id,
    })));
  }

  void declineFile(String peerId, String id) {
    final conn = _conns[peerId];
    final channel = conn?.channel;
    if (conn == null || channel == null) return;
    if (conn.pendingOffer?['id'] == id) conn.pendingOffer = null;
    channel.send(RTCDataChannelMessage(jsonEncode({
      'kind': 'file',
      'action': 'decline',
      'id': id,
    })));
  }

  void cancelFile(String peerId, String id) {
    final conn = _conns[peerId];
    final channel = conn?.channel;
    if (conn != null) {
      if (conn.outId == id) {
        conn
          ..outId = null
          ..outName = null
          ..outSize = 0
          ..outSeq = 0
          ..outBytes = null;
      }
      if (conn.inId == id) {
        conn
          ..inId = null
          ..inName = null
          ..inSize = 0
          ..inReceived = 0
          ..inParts.clear();
      }
      if (conn.pendingOffer?['id'] == id) conn.pendingOffer = null;
    }
    if (channel != null) {
      channel.send(RTCDataChannelMessage(jsonEncode({
        'kind': 'file',
        'action': 'cancel',
        'id': id,
      })));
    }
  }

  void _handleFileControl(
    String peerId,
    RTCDataChannel channel,
    Map<String, dynamic> msg,
  ) {
    final conn = _conns[peerId];
    if (conn == null) return;
    final action = msg['action'] as String?;
    final id = msg['id'] as String?;
    switch (action) {
      case 'offer':
        if (msg['kind'] == 'voice') {
          if (id != null && !conn.receiving && !conn.sending) {
            conn
              ..inKind = 'voice'
              ..inDurationMs = (msg['durationMs'] as num?)?.toInt() ?? 0
              ..inId = id
              ..inName = 'Voice message'
              ..inSize = (msg['size'] as num?)?.toInt() ?? 0
              ..inReceived = 0
              ..inParts.clear();
            channel.send(RTCDataChannelMessage(jsonEncode({
              'kind': 'voice',
              'action': 'accept',
              'id': id,
            })));
          }
        } else if (id != null && conn.pendingOffer == null && !conn.receiving) {
          conn.pendingOffer = msg;
          callbacks.onFileOffer?.call(
            peerId,
            id,
            msg['name'] as String? ?? 'file',
            (msg['size'] as num?)?.toInt() ?? 0,
          );
        } else if (id != null) {
          channel.send(RTCDataChannelMessage(jsonEncode({
            'kind': 'file',
            'action': 'decline',
            'id': id,
          })));
        }
      case 'accept':
        if (conn.sending && conn.outId == id) {
          unawaited(_pump(peerId, conn, channel));
        }
      case 'decline':
        if (conn.sending && conn.outId == id) {
          conn
            ..outId = null
            ..outName = null
            ..outSize = 0
            ..outSeq = 0
            ..outBytes = null;
          callbacks.onFileCancelled?.call(peerId);
        }
      case 'cancel':
        if (conn.outId == id) {
          conn
            ..outId = null
            ..outName = null
            ..outSize = 0
            ..outSeq = 0
            ..outBytes = null;
        }
        if (conn.inId == id) {
          conn
            ..inId = null
            ..inName = null
            ..inSize = 0
            ..inReceived = 0
            ..inKind = null
            ..inDurationMs = 0
            ..inParts.clear();
        }
        if (conn.pendingOffer?['id'] == id) conn.pendingOffer = null;
        callbacks.onFileCancelled?.call(peerId);
    }
  }

  Future<void> _pump(
    String peerId,
    _PeerConn conn,
    RTCDataChannel channel,
  ) async {
    final bytes = conn.outBytes;
    if (bytes == null) return;
    const chunk = 16384;
    const backpressure = 1 << 21; // ~2MB queued before we wait
    while (conn.outSeq < conn.outSize) {
      if (conn.outBytes == null) break; // cancelled
      while ((channel.bufferedAmount ?? 0) > backpressure) {
        await Future<void>.delayed(const Duration(milliseconds: 25));
        if (channel.state != RTCDataChannelState.RTCDataChannelOpen) break;
      }
      if (channel.state != RTCDataChannelState.RTCDataChannelOpen) break;
      final end = math.min(conn.outSize, conn.outSeq + chunk);
      final slice = Uint8List.fromList(bytes.sublist(conn.outSeq, end));
      await channel.send(RTCDataChannelMessage.fromBinary(slice));
      conn.outSeq = end;
      callbacks.onFileProgress?.call(
        peerId,
        conn.outId!,
        conn.outName!,
        conn.outSize,
        conn.outSeq,
        true,
      );
    }
    final id = conn.outId;
    final name = conn.outName;
    final size = conn.outSize;
    conn
      ..outId = null
      ..outName = null
      ..outSize = 0
      ..outSeq = 0
      ..outBytes = null;
    if (id != null && name != null) {
      callbacks.onFileProgress?.call(peerId, id, name, size, size, true);
    }
  }

  void _handleFileChunk(String peerId, Uint8List data) {
    final conn = _conns[peerId];
    if (conn == null || conn.inId == null) return;
    conn.inParts.add(data);
    conn.inReceived += data.length;
    callbacks.onFileProgress?.call(
      peerId,
      conn.inId!,
      conn.inName!,
      conn.inSize,
      conn.inReceived,
      false,
    );
    if (conn.inReceived >= conn.inSize) {
      final bytes = Uint8List(conn.inSize);
      var offset = 0;
      for (final part in conn.inParts) {
        bytes.setRange(offset, offset + part.length, part);
        offset += part.length;
      }
      final id = conn.inId!;
      final name = conn.inName!;
      final kind = conn.inKind;
      final durationSec = (conn.inDurationMs / 1000).round();
      conn
        ..inId = null
        ..inName = null
        ..inSize = 0
        ..inReceived = 0
        ..inKind = null
        ..inDurationMs = 0
        ..inParts.clear();
      if (kind == 'voice') {
        callbacks.onVoice?.call(peerId, 'Voice message', bytes, durationSec);
      } else {
        callbacks.onFileComplete?.call(peerId, id, name, bytes);
      }
    }
  }

  Future<void> _negotiateOffer(String peerId) async {
    final conn = _conns[peerId];
    if (conn == null) return;
    try {
      final offer = await conn.pc.createOffer();
      await conn.pc.setLocalDescription(offer);
      sendSignal(peerId, {'type': 'offer', 'description': offer.toMap()});
    } catch (_) {
      // ignore
    }
  }

  Future<void> handleSignal(String from, Object? data) async {
    if (!_conns.containsKey(from)) await addPeer(from);
    final conn = _conns[from];
    if (conn == null) return;
    final msg = data as Map<String, dynamic>;
    try {
      final type = msg['type'];
      if (type == 'offer' || type == 'answer') {
        final desc = msg['description'] as Map<String, dynamic>;
        await conn.pc.setRemoteDescription(RTCSessionDescription(
          desc['sdp'] as String?,
          desc['type'] as String?,
        ));
        conn.remoteSet = true;
        await _flushCandidates(conn);
        if (type == 'offer') {
          final answer = await conn.pc.createAnswer();
          await conn.pc.setLocalDescription(answer);
          sendSignal(from, {'type': 'answer', 'description': answer.toMap()});
        }
      } else if (type == 'candidate') {
        final candidate = _iceFrom(msg['candidate'] as Map<String, dynamic>);
        if (conn.remoteSet) {
          await conn.pc.addCandidate(candidate);
        } else {
          conn.queuedCandidates.add(msg['candidate'] as Map<String, dynamic>);
        }
      }
    } catch (_) {
      // ignore failed signal handling
    }
  }

  Future<void> _flushCandidates(_PeerConn conn) async {
    final pending = List<Map<String, dynamic>>.from(conn.queuedCandidates);
    conn.queuedCandidates.clear();
    for (final raw in pending) {
      try {
        await conn.pc.addCandidate(_iceFrom(raw));
      } catch (_) {
        // ignore invalid/duplicate candidates
      }
    }
  }

  RTCIceCandidate _iceFrom(Map<String, dynamic> raw) => RTCIceCandidate(
        raw['candidate'] as String?,
        raw['sdpMid'] as String?,
        raw['sdpMLineIndex'] as int?,
      );

  void broadcast(String text) {
    final payload = jsonEncode({'kind': 'chat', 'text': text});
    for (final conn in _conns.values) {
      final channel = conn.channel;
      if (channel != null &&
          channel.state == RTCDataChannelState.RTCDataChannelOpen) {
        unawaited(channel.send(RTCDataChannelMessage(payload)));
      }
    }
  }

  Future<void> close() async {
    for (final conn in _conns.values) {
      await conn.pc.close();
      conn.pc.dispose();
    }
    _conns.clear();
  }
}