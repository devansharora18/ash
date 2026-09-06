import 'dart:async';

import 'package:flutter/material.dart';

import '../../services/signaling.dart';
import '../../theme.dart';
import 'channel_bar.dart';
import 'chat_header.dart';
import 'composer.dart';
import 'leave_dialog.dart';
import 'message_bubble.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({
    super.key,
    required this.displayName,
    required this.backendUrl,
    required this.roomId,
    this.connectClient,
  });

  final String displayName;
  final String backendUrl;
  final String roomId;

  /// Overridable for testing. Defaults to [Signaling.connect].
  final SignalClient Function({
    required String backendUrl,
    required String roomId,
    required String peerId,
  })? connectClient;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatMessage {
  const _ChatMessage({
    required this.self,
    required this.author,
    required this.time,
    required this.text,
  });

  final bool self;
  final String author;
  final String time;
  final String text;
}

enum _ChatStatus { connecting, connected, error }

class _ChatScreenState extends State<ChatScreen> {
  final _scrollController = ScrollController();
  final List<_ChatMessage> _messages = [];
  final List<String> _peers = [];

  SignalClient? _signaling;
  StreamSubscription<SignalEvent>? _sub;
  _ChatStatus _status = _ChatStatus.connecting;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _connect();
  }

  void _connect() {
    final connect = widget.connectClient ?? Signaling.connect;
    _signaling = connect(
      backendUrl: widget.backendUrl,
      roomId: widget.roomId,
      peerId: widget.displayName,
    );
    _sub = _signaling!.events.listen(_onEvent);
  }

  void _onEvent(SignalEvent event) {
    switch (event) {
      case WelcomeEvent(:final peers):
        setState(() {
          _peers
            ..clear()
            ..addAll(peers);
          _status = _ChatStatus.connected;
        });
      case PeerJoinedEvent(:final peerId):
        setState(() {
          if (!_peers.contains(peerId)) _peers.add(peerId);
        });
      case PeerLeftEvent(:final peerId):
        setState(() => _peers.remove(peerId));
      case SignalRelayEvent(:final from, :final data):
        final payload = ChatPayload.tryFrom(data);
        if (payload != null) {
          _addMessage(
            self: false,
            author: from,
            text: payload.text,
          );
        }
      case SignalClosedEvent(:final code):
        if (_status == _ChatStatus.connected) {
          setState(() {
            _status = _ChatStatus.error;
            _errorMessage = 'Disconnected from the room.';
          });
        } else {
          setState(() {
            _status = _ChatStatus.error;
            _errorMessage = _closeReason(code);
          });
        }
    }
  }

  String _closeReason(int code) {
    switch (code) {
      case 4404:
        return 'Room not found. It may have expired or the code is wrong.';
      case 4400:
        return 'Invalid display name.';
      case 4409:
        return 'Display name already in use in this room.';
      case 4408:
        return 'Room expired.';
      default:
        return 'Could not connect to the backend.';
    }
  }

  String _formatTime(DateTime now) {
    final h = now.hour.toString().padLeft(2, '0');
    final m = now.minute.toString().padLeft(2, '0');
    final s = now.second.toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  void _addMessage({
    required bool self,
    required String author,
    required String text,
  }) {
    setState(() {
      _messages.add(_ChatMessage(
        self: self,
        author: author,
        time: _formatTime(DateTime.now()),
        text: text,
      ));
    });
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  void _sendMessage(String text) {
    if (_signaling == null) return;
    _addMessage(self: true, author: widget.displayName, text: text);
    final payload = ChatPayload(text: text);
    for (final peer in _peers) {
      _signaling!.send(peer, payload.toJson());
    }
  }

  Future<void> _confirmLeave() async {
    final leave = await showDialog<bool>(
      context: context,
      barrierColor: AshColors.surfaceContainerLowest.withValues(alpha: 0.8),
      builder: (_) => const LeaveDialog(),
    );
    if (leave == true && mounted) {
      _signaling?.close();
      if (Navigator.of(context).canPop()) Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    _signaling?.close();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final connected = _status == _ChatStatus.connected;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 680),
            child: Column(
              children: [
                ChatHeader(
                  onBack: () => Navigator.of(context).pop(),
                  displayName: widget.displayName,
                  connected: connected,
                ),
                ChannelBar(
                  roomId: widget.roomId,
                  peerCount: _peers.length,
                  connected: connected,
                  onLeave: _confirmLeave,
                ),
                if (_status == _ChatStatus.error) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AshColors.errorContainer.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.link_off,
                              size: 16, color: AshColors.error),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage ?? 'Connection error.',
                              style: AshText.bodySm(AshColors.error),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                Expanded(
                  child: ListView(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                    children: [
                      for (var i = 0; i < _messages.length; i++) ...[
                        _messages[i].self
                            ? SelfMessageBubble(
                                time: _messages[i].time,
                                text: _messages[i].text,
                                delivered: true,
                              )
                            : PeerBubble(
                                initial: _messages[i].author.isEmpty
                                    ? '?'
                                    : _messages[i].author[0].toUpperCase(),
                                initialColor: AshColors.tertiary,
                                time: _messages[i].time,
                                text: _messages[i].text,
                                peerLabel: _messages[i].author,
                              ),
                        if (i != _messages.length - 1)
                          const SizedBox(height: 16),
                      ],
                      if (_messages.isEmpty) ...[
                        const EmptyStateDivider(),
                        const SizedBox(height: 16),
                      ],
                    ],
                  ),
                ),
                Composer(onSend: _sendMessage),
              ],
            ),
          ),
        ),
      ),
    );
  }
}