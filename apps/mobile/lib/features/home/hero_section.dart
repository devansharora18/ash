import 'package:flutter/material.dart';

import '../../theme.dart';

class HeroSection extends StatelessWidget {
  const HeroSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 24, bottom: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AshColors.surfaceContainerHigh,
              border: Border.all(color: AshColors.outlineVariant),
              borderRadius: BorderRadius.circular(2),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.lock_clock, size: 16, color: AshColors.tint),
                const SizedBox(width: 8),
                Text(
                  'In-Memory Volatile Session',
                  style: AshText.codeSm(AshColors.primary),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Ephemeral, disposable end-to-end encrypted messaging.',
            style: AshText.titleLg(AshColors.onSurface).copyWith(height: 1.3),
          ),
          const SizedBox(height: 8),
          Text(
            'No phone numbers. Zero server persistence. Session keys evaporate upon disconnect.',
            style: AshText.bodyMd(AshColors.onSurfaceVariant).copyWith(height: 1.5),
          ),
        ],
      ),
    );
  }
}
