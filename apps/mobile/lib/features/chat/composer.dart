import 'package:flutter/material.dart';

import '../../theme.dart';

class Composer extends StatefulWidget {
  const Composer({super.key, required this.onSend});

  final void Function(String text) onSend;

  @override
  State<Composer> createState() => _ComposerState();
}

class _ComposerState extends State<Composer> {
  final _controller = TextEditingController();

  bool get _hasText => _controller.text.trim().isNotEmpty;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _send() {
    if (!_hasText) return;
    widget.onSend(_controller.text.trim());
    _controller.clear();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AshColors.surfaceContainer,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AshColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.timer,
                    size: 20,
                    color: AshColors.outline,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    height: 36,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: AshColors.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.centerLeft,
                    child: TextField(
                      controller: _controller,
                      onChanged: (_) => setState(() {}),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      style: AshText.bodyMd(AshColors.onSurface),
                      cursorColor: AshColors.tint,
                      decoration: InputDecoration(
                        isDense: true,
                        border: InputBorder.none,
                        hintText: 'Write an encrypted message...',
                        hintStyle: AshText.bodyMd(AshColors.outline),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Material(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: _hasText ? _send : null,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: _hasText
                            ? AshColors.tint
                            : AshColors.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.arrow_upward,
                        size: 20,
                        color: _hasText
                            ? AshColors.onPrimaryFixed
                            : AshColors.outline,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AshColors.tertiary,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'RAM-only queue: 3 pkts',
                        style: AshText.codeSm(AshColors.onSurfaceVariant),
                      ),
                    ],
                  ),
                  Text('TTL: 180s', style: AshText.codeSm(AshColors.outline)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
