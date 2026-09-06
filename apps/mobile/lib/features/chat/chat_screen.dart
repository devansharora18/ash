import 'package:flutter/material.dart';

import '../../theme.dart';
import 'channel_bar.dart';
import 'chat_header.dart';
import 'composer.dart';
import 'leave_dialog.dart';
import 'message_bubble.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _SentMessage {
  const _SentMessage({required this.text, required this.time});

  final String text;
  final String time;
}

class _ChatScreenState extends State<ChatScreen> {
  final _scrollController = ScrollController();
  final List<_SentMessage> _sent = [];

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage(String text) {
    final now = DateTime.now();
    final time =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    setState(() => _sent.add(_SentMessage(text: text, time: time)));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _confirmLeave() async {
    final leave = await showDialog<bool>(
      context: context,
      barrierColor: AshColors.surfaceContainerLowest.withValues(alpha: 0.8),
      builder: (_) => const LeaveDialog(),
    );
    if (leave == true && mounted && Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 680),
            child: Column(
              children: [
                ChatHeader(onBack: () => Navigator.of(context).pop()),
                ChannelBar(onLeave: _confirmLeave),
                Expanded(
                  child: ListView(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                    children: [
                      const VerificationPill(),
                      const SizedBox(height: 16),
                      const PeerBubble(
                        initial: 'M',
                        initialColor: AshColors.tertiary,
                        time: '14:02',
                        text: 'Shared ephemeral key verified via ed25519.',
                        peerLabel: 'peer_0',
                      ),
                      const SizedBox(height: 16),
                      const SelfMessageBubble(
                        time: '14:03',
                        text: 'Connected. Relay latency 18ms. Ready to send seed file.',
                        delivered: true,
                      ),
                      const SizedBox(height: 16),
                      const PeerBubble(
                        initial: 'K',
                        initialColor: AshColors.primary,
                        time: '14:04',
                        text: 'Audio stream initialized. Discarding on exit.',
                        headerLabel: 'peer_1 • volatile',
                        fingerprint: 'b78a::32fc::8812',
                      ),
                      const EmptyStateDivider(),
                      for (final message in _sent) ...[
                        const SizedBox(height: 16),
                        SelfMessageBubble(
                          time: message.time,
                          text: message.text,
                        ),
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
