import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/tts_service.dart';
import '../../theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final TtsService _ttsService = TtsService();
  bool _isTtsEnabled = true;

  @override
  void initState() {
    super.initState();
    _isTtsEnabled = _ttsService.isEnabled;
  }

  void _testTts() async {
    await _ttsService.speak(
      "Test voice reminder active. Your medicine details will be read aloud at medicine time."
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text("Preferences & Settings"),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // Voice Assistant Settings
          Text(
            "ACCESSIBILITY OPTIONS",
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppTheme.textMuted,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Column(
                children: [
                  SwitchListTile(
                    title: Text(
                      "Voice Reminders (Text-to-Speech)",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    subtitle: Text(
                      "Reads medicine details aloud when alarm triggers. Ideal for elderly patients.",
                      style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                    value: _isTtsEnabled,
                    activeThumbColor: AppTheme.primary,
                    onChanged: (val) {
                      setState(() {
                        _isTtsEnabled = val;
                        _ttsService.isEnabled = val;
                      });
                    },
                  ),
                  const Divider(color: AppTheme.borderLight),
                  ListTile(
                    leading: const Icon(Icons.volume_up, color: AppTheme.primary),
                    title: Text(
                      "Test Speech Assistant",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    subtitle: Text(
                      "Play a sample text-to-speech audio",
                      style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                    onTap: _isTtsEnabled ? _testTts : null,
                    enabled: _isTtsEnabled,
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Device Notifications
          Text(
            "NOTIFICATION PREFERENCES",
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppTheme.textMuted,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.notifications_active, color: AppTheme.primary),
                    title: Text(
                      "Sound & Vibe Configuration",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    subtitle: Text(
                      "Reminders use loud alarm ringtones",
                      style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                    trailing: const Icon(Icons.check, color: AppTheme.success),
                  ),
                  const Divider(color: AppTheme.borderLight),
                  ListTile(
                    leading: const Icon(Icons.phonelink_ring, color: AppTheme.primary),
                    title: Text(
                      "Draw over other apps",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    subtitle: Text(
                      "Works on Lock screen or when locked",
                      style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                    trailing: const Icon(Icons.check, color: AppTheme.success),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 40),
          
          // Footer
          Center(
            child: Text(
              "Medicare+ v1.0.0 (Flutter & Firebase)",
              style: GoogleFonts.outfit(fontSize: 11, color: AppTheme.textMuted),
            ),
          )
        ],
      ),
    );
  }
}
