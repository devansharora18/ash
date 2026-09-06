import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract final class AshColors {
  static const background = Color(0xFF121414);
  static const surfaceContainerLowest = Color(0xFF0D0E0F);
  static const surfaceContainerLow = Color(0xFF1B1C1C);
  static const surfaceContainer = Color(0xFF1F2020);
  static const surfaceContainerHigh = Color(0xFF292A2A);
  static const surfaceContainerHighest = Color(0xFF343535);
  static const inverseSurface = Color(0xFFE3E2E2);
  static const onSurface = Color(0xFFE3E2E2);
  static const onSurfaceVariant = Color(0xFFBBC9CE);
  static const onSecondaryFixed = Color(0xFF454747);
  static const outline = Color(0xFF859398);
  static const outlineVariant = Color(0xFF3C494D);
  static const tint = Color(0xFF00D9FF);
  static const primary = Color(0xFFAFECFF);
  static const tertiary = Color(0xFFFFDEAA);
  static const error = Color(0xFFFFB4AB);
  static const errorContainer = Color(0xFF93000A);
}

abstract final class AshText {
  static TextStyle titleLg(Color color) => GoogleFonts.inter(
        fontSize: 28,
        height: 36 / 28,
        letterSpacing: -0.56,
        fontWeight: FontWeight.w600,
        color: color,
      );

  static TextStyle titleMd(Color color) => GoogleFonts.inter(
        fontSize: 20,
        height: 24 / 20,
        letterSpacing: -0.3,
        fontWeight: FontWeight.w500,
        color: color,
      );

  static TextStyle bodyMd(Color color, {FontWeight weight = FontWeight.w400}) =>
      GoogleFonts.inter(
        fontSize: 14,
        height: 20 / 14,
        letterSpacing: -0.07,
        fontWeight: weight,
        color: color,
      );

  static TextStyle bodySm(Color color) =>
      GoogleFonts.inter(fontSize: 12, height: 16 / 12, color: color);

  static TextStyle labelMd(Color color, {FontWeight weight = FontWeight.w500}) =>
      GoogleFonts.inter(
        fontSize: 14,
        height: 20 / 14,
        letterSpacing: -0.07,
        fontWeight: weight,
        color: color,
      );

  static TextStyle labelSm(Color color, {double letterSpacing = 0.24}) =>
      GoogleFonts.inter(
        fontSize: 12,
        height: 16 / 12,
        letterSpacing: letterSpacing,
        fontWeight: FontWeight.w500,
        color: color,
      );

  static TextStyle codeSm(Color color, {FontWeight weight = FontWeight.w400}) =>
      GoogleFonts.jetBrainsMono(
        fontSize: 12,
        height: 16 / 12,
        letterSpacing: -0.12,
        fontWeight: weight,
        color: color,
      );

  static TextStyle codeMd(Color color) => GoogleFonts.jetBrainsMono(
        fontSize: 14,
        height: 20 / 14,
        letterSpacing: -0.28,
        fontWeight: FontWeight.w500,
        color: color,
      );
}

ThemeData ashTheme() => ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AshColors.background,
      colorScheme: const ColorScheme.dark(
        primary: AshColors.tint,
        surface: AshColors.background,
        onSurface: AshColors.onSurface,
        error: AshColors.error,
      ),
    );
