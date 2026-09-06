import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../theme.dart';

enum _CreateStage { idle, generating, created }

class RoomCard extends StatefulWidget {
  const RoomCard({
    super.key,
    required this.errorText,
    required this.onShowError,
    required this.onDismissError,
  });

  final String? errorText;
  final void Function(String) onShowError;
  final VoidCallback onDismissError;

  @override
  State<RoomCard> createState() => _RoomCardState();
}

class _RoomCardState extends State<RoomCard> {
  static const _codeAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  static final _random = Random();

  final _roomCodeController = TextEditingController();
  final _roomCodeFocus = FocusNode();

  _CreateStage _stage = _CreateStage.idle;
  bool _joining = false;
  bool _codeCreated = false;
  String? _createdCode;
  Timer? _createTimer;
  Timer? _createResetTimer;
  Timer? _joinTimer;

  @override
  void dispose() {
    _createTimer?.cancel();
    _createResetTimer?.cancel();
    _joinTimer?.cancel();
    _roomCodeController.dispose();
    _roomCodeFocus.dispose();
    super.dispose();
  }

  String _pick(int length) => List.generate(
        length,
        (_) => _codeAlphabet[_random.nextInt(_codeAlphabet.length)],
      ).join();

  String _formatCode(String text) {
    var clean = text.toUpperCase().replaceAll(RegExp('[^A-Z0-9]'), '');
    if (clean.length > 5) clean = clean.substring(0, 5);
    return clean.length > 2
        ? '${clean.substring(0, 2)}-${clean.substring(2)}'
        : clean;
  }

  void _createRoom() {
    if (_stage != _CreateStage.idle || _joining) return;
    setState(() => _stage = _CreateStage.generating);
    _createTimer = Timer(const Duration(milliseconds: 450), () {
      final code = '${_pick(2)}-${_pick(3)}';
      _roomCodeController.text = code;
      setState(() {
        _createdCode = code;
        _stage = _CreateStage.created;
        _codeCreated = true;
      });
      _createResetTimer = Timer(const Duration(milliseconds: 2500), () {
        setState(() => _stage = _CreateStage.idle);
      });
    });
  }

  Future<void> _pasteCode() async {
    String text = '';
    try {
      final data = await Clipboard.getData('text/plain');
      text = data?.text ?? '';
    } catch (_) {
      text = '';
    }
    _roomCodeController.text = text.isEmpty ? 'A7-9QK' : _formatCode(text);
    _roomCodeFocus.requestFocus();
  }

  void _joinRoom() {
    final code = _roomCodeController.text.replaceAll(RegExp('[^A-Za-z0-9]'), '');
    if (code.length < 5) {
      widget.onShowError('Please enter a valid 5-6 character room token.');
      return;
    }
    setState(() => _joining = true);
    _joinTimer = Timer(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      setState(() => _joining = false);
      widget.onShowError('Peer handshake failed: target node disconnected.');
    });
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
                        const Icon(Icons.bolt,
                            size: 14, color: AshColors.outline),
                        const SizedBox(width: 4),
                        Text(
                          'Handshake time: ~40ms',
                          style: AshText.codeSm(AshColors.outline),
                        ),
                      ],
                    ),
                    Text(
                      'X25519 + ChaCha20',
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
                    'Peer Room Token',
                    style: AshText.labelSm(AshColors.onSurfaceVariant),
                  ),
                  Text(
                    '6 alphanumeric digits',
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
              'Generating Noise Keys...',
              style: AshText.labelMd(dark, weight: FontWeight.w600),
            ),
          ],
        ),
      _CreateStage.created => Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check, size: 20, color: dark),
            const SizedBox(width: 8),
            Text(
              'Room $_createdCode Created',
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
        onTap: _createRoom,
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
              'or join with a code',
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
      controller: _roomCodeController,
      focusNode: _roomCodeFocus,
      inputFormatters: [_RoomCodeFormatter()],
      textAlign: TextAlign.center,
      textCapitalization: TextCapitalization.characters,
      style: AshText.codeMd(AshColors.onSurface).copyWith(letterSpacing: 3.5),
      cursorColor: AshColors.tint,
      decoration: InputDecoration(
        hintText: 'X9-K2M',
        hintStyle: AshText.codeMd(AshColors.outline.withValues(alpha: 0.4))
            .copyWith(letterSpacing: 0),
        filled: true,
        fillColor: AshColors.surfaceContainer,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
            color: _codeCreated ? AshColors.tint : AshColors.outlineVariant,
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
        onTap: _joining ? null : _joinRoom,
        child: Container(
          height: 48,
          decoration: BoxDecoration(
            color: AshColors.surfaceContainerHigh,
            border: Border.all(color: AshColors.outlineVariant),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: _joining
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AshColors.tint,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Connecting...',
                        style: AshText.labelMd(AshColors.onSurface),
                      ),
                    ],
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.hub,
                          size: 20, color: AshColors.onSurface),
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
              maxLines: 1,
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

class _RoomCodeFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var value = newValue.text
        .toUpperCase()
        .replaceAll(RegExp('[^A-Z0-9]'), '');
    if (value.length > 5) value = value.substring(0, 5);
    if (value.length > 2) {
      value = '${value.substring(0, 2)}-${value.substring(2)}';
    }
    return TextEditingValue(
      text: value,
      selection: TextSelection.collapsed(offset: value.length),
    );
  }
}
