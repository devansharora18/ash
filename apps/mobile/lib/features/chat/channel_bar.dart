import 'package:flutter/material.dart';

import '../../theme.dart';
import '../../widgets/pulse_dot.dart';

class ChannelBar extends StatelessWidget {
  const ChannelBar({super.key, required this.onLeave});

  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AshColors.surfaceContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AshColors.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Icon(Icons.lock, size: 18, color: AshColors.tint),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '#x9-k2m',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AshText.codeMd(AshColors.onSurface)
                            .copyWith(fontWeight: FontWeight.w600),
                      ),
                      Text(
                        'ed25519::p2p',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AshText.codeSm(AshColors.outline),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AshColors.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const PulseDot(color: AshColors.tint, size: 6),
                      const SizedBox(width: 6),
                      const Icon(
                        Icons.group,
                        size: 14,
                        color: AshColors.onSurfaceVariant,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '3 peers',
                        style: AshText.codeSm(
                          AshColors.onSurface,
                          weight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Material(
                  color: AshColors.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: onLeave,
                    child: const SizedBox(
                      width: 44,
                      height: 44,
                      child: Icon(
                        Icons.logout,
                        size: 20,
                        color: AshColors.outline,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AshColors.surfaceContainerLowest,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.verified_user,
                    size: 14,
                    color: AshColors.tint,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'All messages stored in volatile RAM only',
                    style: AshText.codeSm(AshColors.onSurfaceVariant),
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
