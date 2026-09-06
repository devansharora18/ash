import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../services/signaling.dart';
import '../../theme.dart';

enum _CreateStage { idle, generating }

class RoomCard extends StatefulWidget {
  const RoomCard({
    super.key,
    required this.errorText,
    required this.onShowError,
    required this.onDismissError,
    required this.backendUrl,
    required this.onCreateRoom,
    required this.onJoinRoom,
  });

  final String? errorText;
  final void Function(String) onShowError;
  final VoidCallback onDismissError;
  final String backendUrl;
  final void Function(String roomId) onCreateRoom;
  final void Function(String roomId) onJoinRoom;

  @override
  State<RoomCard> createState() => _RoomCardState();
}

class _RoomCardState extends State<RoomCard> {
  final _roomIdController = TextEditingController();
  final _roomIdFocus = FocusNode();

  _CreateStage _stage = _CreateStage.idle;

  @override
  void dispose() {
    _roomIdController.dispose();
    _roomIdFocus.dispose();
    super.dispose();
  }

  Future<void> _createRoom() async {
    if (_stage != _CreateStage.idle) return;
    setState(() => _stage = _CreateStage.generating);
    widget.onDismissError();
    try {
      final roomId = await Signaling.createRoom(widget.backendUrl);
      if (!mounted) return;
      widget.onCreateRoom(roomId);
    } catch (_) {
      if (!mounted) return;
      setState(() => _stage = _CreateStage.idle);
      widget.onShowError(
        'Could not reach the signaling server at ${widget.backendUrl}. '
        'Check the backend URL in Settings.',
      );
    }
  }

  Future<void> _pasteCode() async {
    widget.onDismissError();
    String text = '';
    try {
      final data = await Clipboard.getData('text/plain');
      text = data?.text ?? '';
    } catch (_) {
      text = '';
    }
    if (!mounted) return;
    _roomIdController.text = text.trim();
  }

  void _joinRoom() {
    final roomId = _roomIdController.text.trim();
    if (!RegExp(r'^[A-Za-z0-9_-]{4,64}$').hasMatch(roomId)) {
      widget.onShowError('Enter a valid room ID from the invite link.');
      return;
    }
    widget.onDismissError();
    widget.onJoinRoom(roomId);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AshColors.surfaceContainerLow,
        border: Border.all(color: AshColors.outlineVariant),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -48,
            right: -48,
            child: IgnorePointer(
              child: Container(
                width: 144,
                height: 144,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AshColors.tint.withValues(alpha: 0.06),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildCreateButton(),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.hub,
                            size: 14, color: AshColors.outline),
                        const SizedBox(width: 4),
                        Text(
                          'Signaling: ${widget.backendUrl.replaceAll(RegExp(r'^https?://'), '')}',
                          style: AshText.codeSm(AshColors.outline),
                        ),
                      ],
                    ),
                    Text(
                      'relay',
                      style: AshText.codeSm(AshColors.tint),
                    ),
                  ],
                ),
              ),
              _buildDivider(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Room ID',
                    style: AshText.labelSm(AshColors.onSurfaceVariant),
                  ),
                  Text(
                    'invite link or code',
                    style: AshText.codeSm(AshColors.outline),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              _buildCodeInput(),
              const SizedBox(height: 12),
              _buildJoinButton(),
              if (widget.errorText != null) ...[
                const SizedBox(height: 12),
                _buildErrorBanner(),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCreateButton() {
    final dark = AshColors.onSecondaryFixed;
    final content = switch (_stage) {
      _CreateStage.idle => Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.add_circle, size: 20, color: dark),
            const SizedBox(width: 8),
            Text(
              'Create instant room',
              style: AshText.labelMd(dark, weight: FontWeight.w600),
            ),
          ],
        ),
      _CreateStage.generating => Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2, color: dark),
            ),
            const SizedBox(width: 12),
            Text(
              'Creating room...',
              style: AshText.labelMd(dark, weight: FontWeight.w600),
            ),
          ],
        ),
    };
    return Material(
      color: AshColors.inverseSurface,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: _stage == _CreateStage.idle ? _createRoom : null,
        child: SizedBox(
          height: 48,
          child: Center(child: content),
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          const Expanded(child: Divider(color: AshColors.outlineVariant)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              'or join with a room ID',
              style: AshText.labelSm(AshColors.outline),
            ),
          ),
          const Expanded(child: Divider(color: AshColors.outlineVariant)),
        ],
      ),
    );
  }

  Widget _buildCodeInput() {
    return TextField(
      controller: _roomIdController,
      focusNode: _roomIdFocus,
      autocorrect: false,
      enableSuggestions: false,
      style: AshText.codeMd(AshColors.onSurface),
      cursorColor: AshColors.tint,
      decoration: InputDecoration(
        hintText: 'e.g. 8oJtCvIROEw',
        hintStyle: AshText.codeMd(AshColors.outline.withValues(alpha: 0.4)),
        filled: true,
        fillColor: AshColors.surfaceContainer,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
            color: _roomIdController.text.isNotEmpty
                ? AshColors.tint
                : AshColors.outlineVariant,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AshColors.tint),
        ),
        suffixIcon: Center(
          widthFactor: 1,
          child: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              borderRadius: BorderRadius.circular(4),
              onTap: _pasteCode,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color:
                      AshColors.surfaceContainerHighest.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.content_paste,
                        size: 14, color: AshColors.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text(
                      'Paste',
                      style: AshText.codeSm(AshColors.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildJoinButton() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: _joinRoom,
        child: Container(
          height: 48,
          decoration: BoxDecoration(
            color: AshColors.surfaceContainerHigh,
            border: Border.all(color: AshColors.outlineVariant),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.hub, size: 20, color: AshColors.onSurface),
                const SizedBox(width: 8),
                Text(
                  'Join room',
                  style: AshText.labelMd(AshColors.onSurface),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildErrorBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AshColors.errorContainer.withValues(alpha: 0.3),
        border: Border.all(color: AshColors.error.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        children: [
          const Icon(Icons.link_off, size: 18, color: AshColors.error),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              widget.errorText!,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: AshText.bodySm(AshColors.error),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: widget.onDismissError,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: Text(
                'Dismiss',
                style: AshText.codeSm(AshColors.error)
                    .copyWith(decoration: TextDecoration.underline),
              ),
            ),
          ),
        ],
      ),
    );
  }
}