import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'features/home/home_screen.dart';
import 'services/settings_service.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final settings = await SettingsService.load();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: AshColors.background,
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  runApp(AshApp(initialSettings: settings));
}

class AshApp extends StatefulWidget {
  const AshApp({super.key, required this.initialSettings});

  final AppSettings initialSettings;

  @override
  State<AshApp> createState() => _AshAppState();
}

class _AshAppState extends State<AshApp> {
  late AppSettings _settings = widget.initialSettings;

  void _updateSettings(AppSettings settings) {
    setState(() => _settings = settings);
    SettingsService.save(settings);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ash',
      debugShowCheckedModeBanner: false,
      theme: ashTheme(),
      home: HomeScreen(
        settings: _settings,
        onSettingsChanged: _updateSettings,
      ),
    );
  }
}