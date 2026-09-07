import 'dart:convert';
import 'dart:math';

import 'package:shared_preferences/shared_preferences.dart';

class AppSettings {
  const AppSettings({
    required this.displayName,
    required this.backendUrl,
    this.turnUrl = '',
    this.turnUsername = '',
    this.turnCredential = '',
    this.turnCredentialsUrl = '',
  });

  final String displayName;
  final String backendUrl;
  final String turnUrl;
  final String turnUsername;
  final String turnCredential;
  final String turnCredentialsUrl;

  AppSettings copyWith({
    String? displayName,
    String? backendUrl,
    String? turnUrl,
    String? turnUsername,
    String? turnCredential,
    String? turnCredentialsUrl,
  }) =>
      AppSettings(
        displayName: displayName ?? this.displayName,
        backendUrl: backendUrl ?? this.backendUrl,
        turnUrl: turnUrl ?? this.turnUrl,
        turnUsername: turnUsername ?? this.turnUsername,
        turnCredential: turnCredential ?? this.turnCredential,
        turnCredentialsUrl: turnCredentialsUrl ?? this.turnCredentialsUrl,
      );
}

abstract final class SettingsService {
  static const _storageKey = 'ash.settings';
  static const defaultBackendUrl = 'http://localhost:8000';

  static AppSettings defaultSettings() {
    final suffix = Random().nextInt(0xFFFF).toRadixString(16).padLeft(4, '0');
    return AppSettings(displayName: 'peer_$suffix', backendUrl: defaultBackendUrl);
  }

  static AppSettings loadFromMap(Map<String, dynamic> map, AppSettings fallback) {
    String s(String? value) => (value ?? '').trim();
    final name = s(map['displayName'] as String?);
    final url = s(map['backendUrl'] as String?);
    return AppSettings(
      displayName: name.isEmpty ? fallback.displayName : name,
      backendUrl: url.isEmpty
          ? fallback.backendUrl
          : url.replaceAll(RegExp(r'/+$'), ''),
      turnUrl: s(map['turnUrl'] as String?),
      turnUsername: s(map['turnUsername'] as String?),
      turnCredential: s(map['turnCredential'] as String?),
      turnCredentialsUrl: s(map['turnCredentialsUrl'] as String?),
    );
  }

  static Future<AppSettings> load() async {
    final fallback = defaultSettings();
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null) return fallback;
    try {
      return loadFromMap(jsonDecode(raw) as Map<String, dynamic>, fallback);
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
        'turnUrl': settings.turnUrl,
        'turnUsername': settings.turnUsername,
        'turnCredential': settings.turnCredential,
        'turnCredentialsUrl': settings.turnCredentialsUrl,
      }),
    );
  }
}