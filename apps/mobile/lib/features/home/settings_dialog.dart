import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../services/settings_service.dart';
import '../../theme.dart';

class SettingsDialog extends StatefulWidget {
  const SettingsDialog({super.key, required this.settings});

  final AppSettings settings;

  @override
  State<SettingsDialog> createState() => _SettingsDialogState();
}

class _SettingsDialogState extends State<SettingsDialog> {
  late final TextEditingController _name;
  late final TextEditingController _url;
  late final TextEditingController _turnUrl;
  late final TextEditingController _turnUsername;
  late final TextEditingController _turnCredential;
  late final TextEditingController _turnCredentialsUrl;
  String? _error;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.settings.displayName);
    _url = TextEditingController(text: widget.settings.backendUrl);
    _turnUrl = TextEditingController(text: widget.settings.turnUrl);
    _turnUsername = TextEditingController(text: widget.settings.turnUsername);
    _turnCredential = TextEditingController(text: widget.settings.turnCredential);
    _turnCredentialsUrl =
        TextEditingController(text: widget.settings.turnCredentialsUrl);
  }

  @override
  void dispose() {
    _name.dispose();
    _url.dispose();
    _turnUrl.dispose();
    _turnUsername.dispose();
    _turnCredential.dispose();
    _turnCredentialsUrl.dispose();
    super.dispose();
  }

  void _save() {
    final name = _name.text.trim();
    var url = _url.text.trim();
    final turnUrl = _turnUrl.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Display name cannot be empty.');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setState(() => _error = 'Backend URL must start with http:// or https://');
      return;
    }
    if (turnUrl.isNotEmpty &&
        !turnUrl.startsWith('turn:') &&
        !turnUrl.startsWith('turns:')) {
      setState(() => _error = 'TURN URL must start with turn: or turns:');
      return;
    }
    url = url.replaceAll(RegExp(r'/+$'), '');
    Navigator.of(context).pop(AppSettings(
      displayName: name,
      backendUrl: url,
      turnUrl: turnUrl,
      turnUsername: _turnUsername.text.trim(),
      turnCredential: _turnCredential.text.trim(),
      turnCredentialsUrl: _turnCredentialsUrl.text.trim(),
    ));
  }

  void _useOpenRelay() {
    _turnUrl.text = 'turn:openrelay.metered.ca:80';
    _turnUsername.text = 'openrelayproject';
    _turnCredential.text = 'openrelayproject';
    setState(() => _error = null);
  }

  InputDecoration _decoration(String hint) => InputDecoration(
        hintText: hint,
        hintStyle: AshText.bodyMd(AshColors.outline),
        filled: true,
        fillColor: AshColors.surfaceContainer,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AshColors.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AshColors.tint),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16),
      backgroundColor: AshColors.surfaceContainer,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 400, maxHeight: 560),
        child: SingleChildScrollView(
          child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(Icons.tune, size: 20, color: AshColors.tint),
                  const SizedBox(width: 10),
                  Text(
                    'Settings',
                    style: AshText.titleMd(AshColors.onSurface)
                        .copyWith(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Text('Display Name', style: AshText.labelSm(AshColors.outline)),
              const SizedBox(height: 6),
              TextField(
                controller: _name,
                maxLength: 64,
                inputFormatters: [LengthLimitingTextInputFormatter(64)],
                style: AshText.bodyMd(AshColors.onSurface),
                cursorColor: AshColors.tint,
                decoration: _decoration('e.g. cipher_wolf'),
              ),
              const SizedBox(height: 12),
              Text('Backend URL', style: AshText.labelSm(AshColors.outline)),
              const SizedBox(height: 6),
              TextField(
                controller: _url,
                keyboardType: TextInputType.url,
                style: AshText.codeMd(AshColors.onSurface),
                cursorColor: AshColors.tint,
                decoration: _decoration('http://localhost:8000'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Text(
                    'TURN server (optional)',
                    style: AshText.labelSm(AshColors.outline),
                  ),
                  const Spacer(),
                  InkWell(
                    onTap: _useOpenRelay,
                    child: Text(
                      'Use OpenRelay (free)',
                      style: AshText.labelSm(AshColors.tint),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _turnUrl,
                keyboardType: TextInputType.url,
                style: AshText.codeMd(AshColors.onSurface),
                cursorColor: AshColors.tint,
                decoration: _decoration('turn:turn.example.com:3478'),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _turnUsername,
                      style: AshText.codeMd(AshColors.onSurface),
                      cursorColor: AshColors.tint,
                      decoration: _decoration('username'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _turnCredential,
                      obscureText: true,
                      style: AshText.codeMd(AshColors.onSurface),
                      cursorColor: AshColors.tint,
                      decoration: _decoration('password'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Credentials endpoint (Metered API — overrides above)',
                style: AshText.labelSm(AshColors.outline),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _turnCredentialsUrl,
                keyboardType: TextInputType.url,
                style: AshText.codeMd(AshColors.onSurface),
                cursorColor: AshColors.tint,
                decoration: _decoration(
                  'https://your-app.metered.live/api/v1/turn/credentials?apiKey=…',
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 10),
                Text(
                  _error!,
                  style: AshText.bodySm(AshColors.error),
                ),
              ],
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: Material(
                      color: AshColors.surfaceContainerHigh,
                      borderRadius: BorderRadius.circular(8),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () => Navigator.of(context).pop(),
                        child: SizedBox(
                          height: 44,
                          child: Center(
                            child: Text(
                              'Cancel',
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
                      color: AshColors.inverseSurface,
                      borderRadius: BorderRadius.circular(8),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: _save,
                        child: SizedBox(
                          height: 44,
                          child: Center(
                            child: Text(
                              'Save',
                              style: AshText.labelMd(
                                AshColors.onSecondaryFixed,
                                weight: FontWeight.w600,
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
      ),
    );
  }
}