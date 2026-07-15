import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand colors
  static const Color primary = Color(0xFF0EA5E9); // Premium Sky Blue/Teal
  static const Color primaryDark = Color(0xFF0284C7);
  static const Color primaryLight = Color(0xFFE0F2FE);
  
  static const Color background = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFF8FAFC); // Very light blue-grey surface
  static const Color cardBg = Color(0xFFFFFFFF);
  
  static const Color textPrimary = Color(0xFF0F172A); // Slate 900
  static const Color textSecondary = Color(0xFF475569); // Slate 600
  static const Color textMuted = Color(0xFF94A3B8); // Slate 400
  
  static const Color border = Color(0xFFE2E8F0); // Slate 200
  static const Color borderLight = Color(0xFFF1F5F9); // Slate 100
  
  // Status colors
  static const Color success = Color(0xFF10B981); // Emerald (Taken)
  static const Color warning = Color(0xFFF59E0B); // Amber (Pending)
  static const Color danger = Color(0xFFEF4444); // Rose (Skipped/Missed)

  // Premium Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF0EA5E9), Color(0xFF2563EB)], // Sky Blue to Royal Blue
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFF0D9488), Color(0xFF0EA5E9)], // Teal to Sky Blue
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient successGradient = LinearGradient(
    colors: [Color(0xFF10B981), Color(0xFF059669)], // Emerald to Green
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient dangerGradient = LinearGradient(
    colors: [Color(0xFFF43F5E), Color(0xFFE11D48)], // Rose to Red
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient warningGradient = LinearGradient(
    colors: [Color(0xFFF59E0B), Color(0xFFD97706)], // Amber to Dark Amber
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Soft Premium Box Shadows
  static List<BoxShadow> get premiumShadow => [
    BoxShadow(
      color: const Color(0xFF0F172A).withValues(alpha: 0.04),
      blurRadius: 20,
      offset: const Offset(0, 8),
    ),
    BoxShadow(
      color: const Color(0xFF0F172A).withValues(alpha: 0.02),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> get glowShadow => [
    BoxShadow(
      color: const Color(0xFF0EA5E9).withValues(alpha: 0.15),
      blurRadius: 16,
      offset: const Offset(0, 6),
    ),
  ];
  
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primary,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: primaryDark,
        surface: background,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textPrimary,
        error: danger,
      ),
      textTheme: TextTheme(
        displayLarge: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.bold, color: textPrimary),
        displayMedium: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: textPrimary),
        displaySmall: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w600, color: textPrimary),
        headlineMedium: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary),
        titleLarge: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary),
        titleMedium: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w500, color: textSecondary),
        bodyLarge: GoogleFonts.outfit(fontSize: 16, color: textSecondary),
        bodyMedium: GoogleFonts.outfit(fontSize: 14, color: textSecondary),
        bodySmall: GoogleFonts.outfit(fontSize: 12, color: textMuted),
      ),
      cardTheme: CardThemeData(
        color: cardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border, width: 1),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: textPrimary),
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
      ),
      buttonTheme: const ButtonThemeData(
        buttonColor: primary,
        textTheme: ButtonTextTheme.primary,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: textPrimary,
          side: const BorderSide(color: border, width: 1.5),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: danger, width: 1),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        hintStyle: GoogleFonts.outfit(color: textMuted, fontSize: 14),
        labelStyle: GoogleFonts.outfit(color: textSecondary, fontSize: 14),
      ),
    );
  }
}
