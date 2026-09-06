import 'package:flutter/material.dart';

import '../../theme.dart';

class VerificationPill extends StatelessWidget {
  const VerificationPill({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: AshColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(2),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.key, size: 14, color: AshColors.tint),
            const SizedBox(width: 8),
            Text(
              'Ephemeral session initiated: 9f0a...d7b2',
              style: AshText.codeSm(AshColors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

class PeerBubble extends StatelessWidget {
  const PeerBubble({
    super.key,
    required this.initial,
    required this.initialColor,
    required this.time,
    required this.text,
    this.peerLabel,
    this.headerLabel,
    this.fingerprint,
  });

  final String initial;
  final Color initialColor;
  final String time;
  final String text;
  final String? peerLabel;
  final String? headerLabel;
  final String? fingerprint;

  @override
  Widget build(BuildContext context) {
    final maxWidth = MediaQuery.sizeOf(context).width * 0.85;
    return Align(
      alignment: Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AshColors.surfaceContainerHighest,
              ),
              child: Center(
                child: Text(
                  initial,
                  style: AshText.codeMd(initialColor)
                      .copyWith(fontWeight: FontWeight.w700),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _PeerBubbleBody(
                    text: text,
                    headerLabel: headerLabel,
                    fingerprint: fingerprint,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(time, style: AshText.codeSm(AshColors.outline)),
                      if (peerLabel != null) ...[
                        const SizedBox(width: 4),
                        Container(
                          width: 4,
                          height: 4,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AshColors.outline,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          peerLabel!,
                          style: AshText.codeSm(AshColors.tint),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PeerBubbleBody extends StatefulWidget {
  const _PeerBubbleBody({
    required this.text,
    this.headerLabel,
    this.fingerprint,
  });

  final String text;
  final String? headerLabel;
  final String? fingerprint;

  @override
  State<_PeerBubbleBody> createState() => _PeerBubbleBodyState();
}

class _PeerBubbleBodyState extends State<_PeerBubbleBody> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final expandable = widget.fingerprint != null;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AshColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.headerLabel != null) ...[
            InkWell(
              onTap: expandable
                  ? () => setState(() => _expanded = !_expanded)
                  : null,
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.headerLabel!,
                      style: AshText.codeSm(AshColors.outline),
                    ),
                  ),
                  if (expandable)
                    const Icon(Icons.info, size: 14, color: AshColors.outline),
                ],
              ),
            ),
            const SizedBox(height: 6),
          ],
          Text(
            widget.text,
            style: AshText.bodyMd(AshColors.onSurface).copyWith(height: 1.375),
          ),
          if (_expanded)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AshColors.surfaceContainerLowest,
                borderRadius: BorderRadius.circular(2),
              ),
              child: Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: 'Fingerprint: ',
                      style: AshText.codeSm(AshColors.onSurfaceVariant),
                    ),
                    TextSpan(
                      text: widget.fingerprint,
                      style: AshText.codeSm(AshColors.tint),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class SelfMessageBubble extends StatelessWidget {
  const SelfMessageBubble({
    super.key,
    required this.time,
    required this.text,
    this.delivered = false,
  });

  final String time;
  final String text;
  final bool delivered;

  @override
  Widget build(BuildContext context) {
    final maxWidth = MediaQuery.sizeOf(context).width * 0.85;
    return Align(
      alignment: Alignment.centerRight,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AshColors.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.lock_clock,
                        size: 13,
                        color: AshColors.tint,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Self',
                        style: AshText.codeSm(
                          AshColors.tint,
                          weight: FontWeight.w600,
                        ).copyWith(letterSpacing: 0.6),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    text,
                    style:
                        AshText.bodyMd(AshColors.onSurface).copyWith(height: 1.375),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(time, style: AshText.codeSm(AshColors.outline)),
                const SizedBox(width: 4),
                Icon(
                  delivered ? Icons.done_all : Icons.done,
                  size: 14,
                  color: AshColors.tint,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class EmptyStateDivider extends StatelessWidget {
  const EmptyStateDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AshColors.surfaceContainer,
            ),
            child:
                const Icon(Icons.security, size: 20, color: AshColors.outline),
          ),
          const SizedBox(height: 8),
          Text(
            'Encrypted messages will appear here',
            textAlign: TextAlign.center,
            style: AshText.labelSm(AshColors.outline),
          ),
          const SizedBox(height: 2),
          Text(
            'zero disk trace • pure forward secrecy',
            style: AshText.codeSm(AshColors.outlineVariant),
          ),
        ],
      ),
    );
  }
}
