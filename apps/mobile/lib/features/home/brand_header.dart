import 'package:flutter/material.dart';

import '../../theme.dart';
import '../../widgets/pulse_dot.dart';

class BrandHeader extends StatelessWidget {
  const BrandHeader({super.key, this.onSettings});

  final VoidCallback? onSettings;

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
          _RelayStatusPill(),
          const SizedBox(width: 8),
          if (onSettings != null)
            Material(
              color: AshColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(8),
              child: InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: onSettings,
                child: const SizedBox(
                  width: 40,
                  height: 40,
                  child: Icon(
                    Icons.settings_outlined,
                    size: 20,
                    color: AshColors.onSurfaceVariant,
                  ),
                ),
              ),
            ),
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
          const PulseDot(color: AshColors.tint),
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
