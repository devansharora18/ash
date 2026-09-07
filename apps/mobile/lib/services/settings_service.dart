import 'dart:convert';
import 'dart:math';

import 'package:shared_preferences/shared_preferences.dart';

class AppSettings {
  const AppSettings({
    required this.displayName,
    required this.backendUrl,
  });

  final String displayName;
  final String backendUrl;

  AppSettings copyWith({String? displayName, String? backendUrl}) =>
      AppSettings(
        displayName: displayName ?? this.displayName,
        backendUrl: backendUrl ?? this.backendUrl,
      );
}

abstract final class SettingsService {
  static const _storageKey = 'ash.settings';
  static const defaultBackendUrl = 'http://localhost:8000';

  static AppSettings defaultSettings() {
    final suffix = Random().nextInt(0xFFFF).toRadixString(16).padLeft(4, '0');
    return AppSettings(displayName: 'peer_$suffix', backendUrl: defaultBackendUrl);
  }

  static Future<AppSettings> load() async {
    final fallback = defaultSettings();
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null) return fallback;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final name = map['displayName'] as String?;
      final url = map['backendUrl'] as String?;
      return AppSettings(
        displayName: (name ?? '').trim().isNotEmpty
            ? name!.trim()
            : fallback.displayName,
        backendUrl: (url ?? '').trim().isNotEmpty
            ? url!.trim().replaceAll(RegExp(r'/+$'), '')
            : fallback.backendUrl,
      );
    } catch (_) {
      return fallback;
    }
  }

  static Future<void> save(AppSettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _storageKey,
      jsonEncode({
        'displayName': settings.displayName,
        'backendUrl': settings.backendUrl,
      }),
    );
  }
}