import 'dart:async';
import 'dart:convert';

import 'package:flutter_webrtc/flutter_webrtc.dart';

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

/// Callbacks a chat screen uses to render mesh events. Keep it as a plain
/// class so tests can wire them without the real transport.
class RtcMeshCallbacks {
  void Function(String from, String text)? onMessage;
  void Function(String peerId, bool connected)? onConnectionChange;
}

class _PeerConn {
  _PeerConn(this.pc);

  final RTCPeerConnection pc;
  RTCDataChannel? channel;
  bool connected = false;
  bool remoteSet = false;
  final List<Map<String, dynamic>> queuedCandidates = [];
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
      if (message.isBinary) return;
      try {
        final data = jsonDecode(message.text) as Map<String, dynamic>;
        if (data['kind'] == 'chat' && data['text'] is String) {
          callbacks.onMessage?.call(peerId, data['text'] as String);
        }
      } catch (_) {
        // ignore malformed frames
      }
    });
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