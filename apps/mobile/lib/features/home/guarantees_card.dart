import 'package:flutter/material.dart';

import '../../theme.dart';

class GuaranteesCard extends StatelessWidget {
  const GuaranteesCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ARCHITECTURE GUARANTEES',
                style: AshText.labelSm(
                  AshColors.outline,
                  letterSpacing: 0.6,
                ),
              ),
              Text('Zero Trace', style: AshText.codeSm(AshColors.outline)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AshColors.surfaceContainerLowest.withValues(alpha: 0.6),
            border: Border.all(color: AshColors.outlineVariant),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              const _GuaranteeItem(
                icon: Icons.sync_alt,
                color: AshColors.tint,
                title: 'Direct WebRTC P2P Mesh',
                body:
                    'Encrypted end-to-end with ECDH P-256 + AES-256-GCM session keys. Messages travel strictly peer-to-peer without central transit.',
              ),
              const _Divider(),
              const _GuaranteeItem(
                icon: Icons.memory,
                color: AshColors.primary,
                title: 'Zero Server-Side State',
                body:
                    'Content exists only in memory during a session. The device E2EE keypair is stored on your device and its private key never leaves it.',
              ),
              const _Divider(),
              const _GuaranteeItem(
                icon: Icons.local_fire_department,
                color: AshColors.tertiary,
                title: 'Autonomous Dissolution',
                body:
                    'When the last peer leaves, the room descriptor, hash tables, and message buffers immediately vaporize.',
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Divider(
        height: 1,
        color: AshColors.outlineVariant.withValues(alpha: 0.6),
      ),
    );
  }
}

class _GuaranteeItem extends StatelessWidget {
  const _GuaranteeItem({
    required this.icon,
    required this.color,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: AshColors.surfaceContainerHigh,
            border: Border.all(color: AshColors.outlineVariant),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AshText.bodyMd(
                  AshColors.onSurface,
                  weight: FontWeight.w500,
                ).copyWith(height: 1.3),
              ),
              const SizedBox(height: 4),
              Text(
                body,
                style:
                    AshText.bodySm(AshColors.onSurfaceVariant).copyWith(height: 1.5),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
