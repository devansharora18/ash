import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'features/home/home_screen.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: AshColors.background,
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  runApp(const AshApp());
}

class AshApp extends StatelessWidget {
  const AshApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ash',
      debugShowCheckedModeBanner: false,
      theme: ashTheme(),
      home: const HomeScreen(),
    );
  }
}
