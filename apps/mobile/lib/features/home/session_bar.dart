import 'package:flutter/material.dart';

import '../../theme.dart';

class SessionBar extends StatelessWidget {
  const SessionBar({super.key, required this.onToggleSimulatedDrop});

  final VoidCallback onToggleSimulatedDrop;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      decoration: BoxDecoration(
        color: AshColors.surfaceContainerLow,
        border: Border.all(color: AshColors.outlineVariant),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Wrap(
        spacing: 12,
        runSpacing: 8,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.verified_user, size: 16, color: AshColors.tint),
              const SizedBox(width: 8),
              Text(
                'STUN/TURN: Ice Candidate Ready',
                style: AshText.codeSm(AshColors.onSurfaceVariant),
              ),
            ],
          ),
          InkWell(
            onTap: onToggleSimulatedDrop,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text(
                'Simulate Drop',
                style: AshText.codeSm(AshColors.outline),
              ),
            ),
          ),
          Text('•', style: AshText.codeSm(AshColors.outlineVariant)),
          Text('NAT: Symmetric OK', style: AshText.codeSm(AshColors.outline)),
        ],
      ),
    );
  }
}
