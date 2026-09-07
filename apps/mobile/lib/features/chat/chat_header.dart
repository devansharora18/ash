import 'package:flutter/material.dart';

import '../../theme.dart';

class ChatHeader extends StatelessWidget {
  const ChatHeader({
    super.key,
    required this.onBack,
    required this.displayName,
    required this.connected,
  });

  final VoidCallback onBack;
  final String displayName;
  final bool connected;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 64,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          children: [
            Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(8),
              child: InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: onBack,
                child: const SizedBox(
                  width: 44,
                  height: 44,
                  child: Icon(
                    Icons.arrow_back,
                    size: 20,
                    color: AshColors.onSurface,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.shield_outlined,
              size: 24,
              color: AshColors.tint,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    displayName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AshText.titleMd(AshColors.onSurface)
                        .copyWith(fontWeight: FontWeight.w600, height: 1.1),
                  ),
                  Text(
                    connected ? 'webrtc::direct' : 'connecting...',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AshText.codeSm(
                      connected ? AshColors.tint : AshColors.outline,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 32,
              height: 32,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: AshColors.primary,
              ),
              child: const Icon(
                Icons.person,
                size: 18,
                color: AshColors.onPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
