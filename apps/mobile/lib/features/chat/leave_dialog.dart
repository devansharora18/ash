import 'package:flutter/material.dart';

import '../../theme.dart';

class LeaveDialog extends StatelessWidget {
  const LeaveDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16),
      backgroundColor: AshColors.surfaceContainer,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 320),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AshColors.errorContainer.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.delete_sweep,
                      size: 22,
                      color: AshColors.error,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Destroy Session?',
                          style: AshText.titleMd(AshColors.onSurface)
                              .copyWith(fontWeight: FontWeight.w600, height: 1.1),
                        ),
                        Text(
                          'Ephemeral keys will vanish',
                          style: AshText.codeSm(AshColors.outline),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Leaving will zero all keys and purge volatile message history from local memory immediately.',
                style: AshText.bodyMd(AshColors.onSurfaceVariant)
                    .copyWith(height: 1.5),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Material(
                      color: AshColors.surfaceContainerHigh,
                      borderRadius: BorderRadius.circular(8),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () => Navigator.of(context).pop(false),
                        child: SizedBox(
                          height: 44,
                          child: Center(
                            child: Text(
                              'Stay',
                              style: AshText.labelMd(AshColors.onSurface),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Material(
                      color: AshColors.errorContainer,
                      borderRadius: BorderRadius.circular(8),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () => Navigator.of(context).pop(true),
                        child: SizedBox(
                          height: 44,
                          child: Center(
                            child: Text(
                              'Leave & Wipe',
                              style: AshText.labelMd(
                                AshColors.onErrorContainer,
                                weight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
