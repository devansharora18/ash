import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';

/// Payload relayed between peers via the signaling server's `signal` messages.
class ChatPayload {
  const ChatPayload({required this.text});

  final String text;

  Map<String, dynamic> toJson() => {'kind': 'chat', 'text': text};

  static ChatPayload? tryFrom(Object? data) {
    if (data is! Map<String, dynamic>) return null;
    if (data['kind'] != 'chat' || data['text'] is! String) return null;
    return ChatPayload(text: data['text'] as String);
  }
}

sealed class SignalEvent {
  const SignalEvent();
}

class WelcomeEvent extends SignalEvent {
  const WelcomeEvent({required this.peers});

  final List<String> peers;
}

class PeerJoinedEvent extends SignalEvent {
  const PeerJoinedEvent({required this.peerId});

  final String peerId;
}

class PeerLeftEvent extends SignalEvent {
  const PeerLeftEvent({required this.peerId});

  final String peerId;
}

class SignalRelayEvent extends SignalEvent {
  const SignalRelayEvent({required this.from, required this.data});

  final String from;
  final Object? data;
}

class SignalClosedEvent extends SignalEvent {
  const SignalClosedEvent({required this.code, required this.reason});

  final int code;
  final String reason;
}

/// The parts of [Signaling] that a chat screen depends on, so it can be
/// substituted for unit/widget testing without a live network connection.
abstract interface class SignalClient {
  Stream<SignalEvent> get events;

  /// Relays [data] to peer [to] via the signaling server.
  void send(String to, Object data);

  void close();
}

class Signaling implements SignalClient {
  Signaling._(
    this.backendUrl,
    this.roomId,
    this.peerId,
    this._channel,
    this._events,
  );

  final String backendUrl;
  final String roomId;
  final String peerId;
  final WebSocketChannel _channel;
  final StreamController<SignalEvent> _events;

  @override
  Stream<SignalEvent> get events => _events.stream;

  /// Creates a room on the signaling server and returns its id.
  static Future<String> createRoom(String backendUrl) async {
    final res = await http
        .post(Uri.parse('$backendUrl/rooms'))
        .timeout(const Duration(seconds: 10));
    if (res.statusCode != 200) {
      throw Exception('create room failed: HTTP ${res.statusCode}');
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    return body['room_id'] as String;
  }

  static Uri _websocketUri(String backendUrl, String roomId, String peerId) {
    final base = Uri.parse(backendUrl);
    final scheme = base.scheme == 'https' ? 'wss' : 'ws';
    return Uri(
      scheme: scheme,
      host: base.host,
      port: base.port,
      pathSegments: ['ws', roomId],
      queryParameters: {'peer_id': peerId},
    );
  }

  static Signaling connect({
    required String backendUrl,
    required String roomId,
    required String peerId,
  }) {
    final events = StreamController<SignalEvent>();
    final channel = WebSocketChannel.connect(
      _websocketUri(backendUrl, roomId, peerId),
    );
    final signaling = Signaling._(backendUrl, roomId, peerId, channel, events);

    channel.stream.listen(
      (raw) {
        try {
          final message = jsonDecode(raw as String) as Map<String, dynamic>;
          final type = message['type'];
          switch (type) {
            case 'welcome':
              events.add(WelcomeEvent(
                peers: List<String>.from(message['peers'] as List),
              ));
            case 'peer-joined':
              events.add(PeerJoinedEvent(peerId: message['peer_id'] as String));
            case 'peer-left':
              events.add(PeerLeftEvent(peerId: message['peer_id'] as String));
            case 'signal':
              events.add(SignalRelayEvent(
                from: message['from'] as String,
                data: message['data'],
              ));
            default:
              break;
          }
        } catch (_) {
          // ignore malformed frames
        }
      },
      onError: (_) => events.add(const SignalClosedEvent(code: 1006, reason: '')),
      onDone: () => events.add(const SignalClosedEvent(code: 1000, reason: '')),
    );

    return signaling;
  }

  /// Relays [data] to peer [to] via the signaling server.
  @override
  void send(String to, Object data) {
    _channel.sink.add(jsonEncode({'type': 'signal', 'to': to, 'data': data}));
  }

  @override
  void close() {
    _channel.sink.add(jsonEncode({'type': 'leave'}));
    _channel.sink.close();
  }
}