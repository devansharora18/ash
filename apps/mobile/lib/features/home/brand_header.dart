import 'package:flutter/material.dart';

import '../../theme.dart';

class BrandHeader extends StatelessWidget {
  const BrandHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          const Icon(Icons.shield_outlined, size: 28, color: AshColors.tint),
          const SizedBox(width: 8),
          Text(
            'ash',
            style: AshText.titleMd(AshColors.onSurface)
                .copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AshColors.surfaceContainerLow,
              border: Border.all(color: AshColors.outlineVariant),
              borderRadius: BorderRadius.circular(2),
            ),
            child: Text('v1.0 p2p', style: AshText.codeSm(AshColors.outline)),
          ),
          const Spacer(),
          const _RelayStatusPill(),
        ],
      ),
    );
  }
}

class _RelayStatusPill extends StatelessWidget {
  const _RelayStatusPill();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AshColors.surfaceContainerLow,
        border: Border.all(color: AshColors.outlineVariant),
        borderRadius: BorderRadius.circular(2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const _PulseDot(),
          const SizedBox(width: 6),
          Text(
            'Relay ready',
            style: AshText.codeSm(
              AshColors.onSurfaceVariant,
              weight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _PulseDot extends StatefulWidget {
  const _PulseDot();

  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween<double>(begin: 1, end: 0.3).animate(_controller),
      child: Container(
        width: 8,
        height: 8,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: AshColors.tint,
        ),
      ),
    );
  }
}
