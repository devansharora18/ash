import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:http/http.dart' as http;

import 'crypto_service.dart';
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
  void Function(String from, Map<String, dynamic> event)? onBoard;
  void Function(String from, MediaStream stream)? onRemoteStream;
  void Function(String from)? onRemoteStreamEnd;
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

  final List<RTCRtpSender> shareSenders = [];

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
  RtcMesh(this.selfId, this.sendSignal, this.callbacks, this.identity,
      [this.iceServers]);

  final String selfId;
  final void Function(String to, Object data) sendSignal;
  final RtcMeshCallbacks callbacks;
  final Identity identity;
  final List<Map<String, dynamic>>? iceServers;

  final Map<String, _PeerConn> _conns = {};
  MediaStream? _shareStream;
  final Map<String, Uint8List> _sessionKey = {};
  final Map<String, String> _peerPub = {};

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
    pc.onTrack = (event) {
      final streams = event.streams;
      if (streams.isNotEmpty) {
        callbacks.onRemoteStream?.call(peerId, streams.first);
      }
      event.track.onEnded = () => callbacks.onRemoteStreamEnd?.call(peerId);
    };
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
        unawaited(channel.send(RTCDataChannelMessage(jsonEncode({
          'kind': 'e2ee',
          'action': 'key',
          'pub': identity.pubB64,
        }))));
      } else if (state == RTCDataChannelState.RTCDataChannelClosed) {
        callbacks.onConnectionChange?.call(peerId, false);
      }
    });
    channel.messageStream.listen((message) {
      if (message.isBinary) {
        unawaited(_handleFileChunk(peerId, message.binary));
        return;
      }
      try {
        final data = jsonDecode(message.text) as Map<String, dynamic>;
        if (data['kind'] == 'e2ee' &&
            data['action'] == 'key' &&
            data['pub'] is String) {
          _peerPub[peerId] = data['pub'] as String;
          unawaited(ensureSessionKey(peerId));
        } else if (data['kind'] == 'esc' &&
            data['nonce'] is String &&
            data['ct'] is String) {
          unawaited(handleDecrypted(peerId, channel,
              data['nonce'] as String, data['ct'] as String));
        }
      } catch (_) {
        // ignore malformed frames
      }
    });
  }

  Future<Uint8List?> ensureSessionKey(String peerId) async {
    final cached = _sessionKey[peerId];
    if (cached != null) return cached;
    final pub = _peerPub[peerId];
    if (pub == null) return null;
    try {
      final key = deriveSessionKey(identity, pub);
      _sessionKey[peerId] = key;
      return key;
    } catch (_) {
      return null;
    }
  }

  /// Encrypt an inner message with the peer's session key and send it as an
  /// `{kind:'esc'}` frame.
  Future<bool> encryptJsonTo(
    String peerId,
    RTCDataChannel channel,
    Object inner,
  ) async {
    final key = await ensureSessionKey(peerId);
    if (key == null) return false;
    try {
      final data = Uint8List.fromList(utf8.encode(jsonEncode(inner)));
      final nonce = newNonce();
      final ct = encryptBlock(key, nonce, data);
      unawaited(channel.send(RTCDataChannelMessage(jsonEncode({
        'kind': 'esc',
        'nonce': base64Encode(nonce),
        'ct': base64Encode(ct),
      }))));
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> handleDecrypted(
    String peerId,
    RTCDataChannel channel,
    String nonceB64,
    String ctB64,
  ) async {
    final key = await ensureSessionKey(peerId);
    if (key == null) return;
    try {
      final plain = decryptBlock(key, base64Decode(nonceB64), base64Decode(ctB64));
      final inner = jsonDecode(utf8.decode(plain)) as Map<String, dynamic>;
      if (inner['kind'] == 'chat' && inner['text'] is String) {
        callbacks.onMessage?.call(peerId, inner['text'] as String);
      } else if (inner['kind'] == 'file' || inner['kind'] == 'voice') {
        _handleFileControl(peerId, channel, inner);
      } else if (inner['kind'] == 'board') {
        callbacks.onBoard?.call(peerId, inner);
      }
    } on DecryptFailure {
      // drop unreadable payloads
    } catch (_) {
      // ignore
    }
  }

  static String _fileId() {
    final rand = math.Random();
    final t = DateTime.now().millisecondsSinceEpoch.toRadixString(36);
    final r = rand.nextInt(0xFFFFFF).toRadixString(36);
    return '$t-$r';
  }

  /// Propose a file to one peer; the peer must accept before chunks flow.
  Future<void> sendFile(String peerId, String name, Uint8List bytes) async {
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
    await encryptJsonTo(peerId, channel, {
      'kind': 'file',
      'action': 'offer',
      'id': id,
      'name': name,
      'size': bytes.length,
      'mime': '',
    });
  }

  /// Send a voice recording blob to one peer (auto-accepted on receive).
  Future<void> sendVoice(String peerId, Uint8List bytes, int durationSec) async {
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
    await encryptJsonTo(peerId, channel, {
      'kind': 'voice',
      'action': 'offer',
      'id': id,
      'name': 'Voice message',
      'size': bytes.length,
      'mime': 'audio/m4a',
      'durationMs': durationSec * 1000,
    });
  }

  Future<void> acceptFile(String peerId, String id) async {
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
    await encryptJsonTo(peerId, channel, {'kind': 'file', 'action': 'accept', 'id': id});
  }

  Future<void> declineFile(String peerId, String id) async {
    final conn = _conns[peerId];
    final channel = conn?.channel;
    if (conn == null || channel == null) return;
    if (conn.pendingOffer?['id'] == id) conn.pendingOffer = null;
    await encryptJsonTo(peerId, channel, {'kind': 'file', 'action': 'decline', 'id': id});
  }

  Future<void> cancelFile(String peerId, String id) async {
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
      await encryptJsonTo(peerId, channel, {'kind': 'file', 'action': 'cancel', 'id': id});
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
            unawaited(encryptJsonTo(peerId, channel, {
              'kind': 'voice',
              'action': 'accept',
              'id': id,
            }));
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
          unawaited(encryptJsonTo(peerId, channel, {
            'kind': 'file',
            'action': 'decline',
            'id': id,
          }));
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
    final key = await ensureSessionKey(peerId);
    if (key == null) return;
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
      try {
        final nonce = newNonce();
        final ct = encryptBlock(key, nonce, slice);
        final framed = Uint8List(12 + ct.length);
        framed.setRange(0, 12, nonce);
        framed.setRange(12, framed.length, ct);
        await channel.send(RTCDataChannelMessage.fromBinary(framed));
      } catch (_) {
        break; // encryption failure
      }
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

  Future<void> _handleFileChunk(String peerId, Uint8List data) async {
    final conn = _conns[peerId];
    if (conn == null || conn.inId == null) return;
    final key = await ensureSessionKey(peerId);
    if (key == null) return;
    Uint8List plain;
    try {
      plain = decryptBlock(key, data.sublist(0, 12), data.sublist(12));
    } on DecryptFailure {
      conn
        ..inId = null
        ..inName = null
        ..inSize = 0
        ..inReceived = 0
        ..inKind = null
        ..inDurationMs = 0
        ..inParts.clear();
      return;
    }
    conn.inParts.add(plain);
    conn.inReceived += plain.length;
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

  Future<void> broadcast(String text) async {
    for (final entry in _conns.entries) {
      final channel = entry.value.channel;
      if (channel != null &&
          channel.state == RTCDataChannelState.RTCDataChannelOpen) {
        await encryptJsonTo(entry.key, channel, {'kind': 'chat', 'text': text});
      }
    }
  }

  /// Stream a whiteboard drawing event to every connected peer.
  Future<void> broadcastBoard(Map<String, dynamic> event) async {
    for (final entry in _conns.entries) {
      final channel = entry.value.channel;
      if (channel != null &&
          channel.state == RTCDataChannelState.RTCDataChannelOpen) {
        await encryptJsonTo(entry.key, channel, {'kind': 'board', ...event});
      }
    }
  }

  /// Send the full board state to one peer (late-join sync).
  Future<void> sendBoardSync(String peerId, List<Map<String, dynamic>> strokes) async {
    final conn = _conns[peerId];
    final channel = conn?.channel;
    if (conn == null ||
        channel == null ||
        channel.state != RTCDataChannelState.RTCDataChannelOpen) {
      return;
    }
    await encryptJsonTo(peerId, channel, {
      'kind': 'board',
      'type': 'sync',
      'strokes': strokes,
    });
  }

  Future<void> close() async {
    await stopScreenShare();
    for (final conn in _conns.values) {
      await conn.pc.close();
      conn.pc.dispose();
    }
    _conns.clear();
  }

  /// Start broadcasting a screen/display stream to every connected peer.
  Future<void> startScreenShare(MediaStream stream) async {
    _shareStream = stream;
    for (final peerId in _conns.keys) {
      await attachScreenShare(peerId);
    }
  }

  /// Add the active share stream to one peer and renegotiate (late join).
  Future<void> attachScreenShare(String peerId) async {
    final conn = _conns[peerId];
    final stream = _shareStream;
    if (conn == null || conn.shareSenders.isNotEmpty || stream == null) return;
    for (final track in stream.getTracks()) {
      final sender = await conn.pc.addTrack(track, stream);
      conn.shareSenders.add(sender);
    }
    await _negotiateOffer(peerId);
  }

  /// Stop sharing and renegotiate the tracks away from every peer.
  Future<void> stopScreenShare() async {
    final stream = _shareStream;
    _shareStream = null;
    for (final entry in _conns.entries) {
      final conn = entry.value;
      final had = conn.shareSenders.isNotEmpty;
      for (final sender in conn.shareSenders) {
        await conn.pc.removeTrack(sender);
      }
      conn.shareSenders.clear();
      if (had) await _negotiateOffer(entry.key);
    }
    for (final track in stream?.getTracks() ?? const <MediaStreamTrack>[]) {
      await track.stop();
    }
  }
}