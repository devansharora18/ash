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
  String? _error;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.settings.displayName);
    _url = TextEditingController(text: widget.settings.backendUrl);
  }

  @override
  void dispose() {
    _name.dispose();
    _url.dispose();
    super.dispose();
  }

  void _save() {
    final name = _name.text.trim();
    var url = _url.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Display name cannot be empty.');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setState(() => _error = 'Backend URL must start with http:// or https://');
      return;
    }
    url = url.replaceAll(RegExp(r'/+$'), '');
    Navigator.of(context).pop(AppSettings(displayName: name, backendUrl: url));
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
        constraints: const BoxConstraints(maxWidth: 400),
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
    );
  }
}