import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';

class TtsService {
  static final TtsService _instance = TtsService._internal();
  factory TtsService() => _instance;
  TtsService._internal();

  final FlutterTts _flutterTts = FlutterTts();
  bool _initialized = false;
  bool isEnabled = true;

  Future<void> init() async {
    if (_initialized) return;
    try {
      await _flutterTts.setLanguage("en-US");
      await _flutterTts.setSpeechRate(0.45); // comfortable rate for elderly
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.0);
      _initialized = true;
    } catch (e) {
      debugPrint("Error initializing TTS: $e");
    }
  }

  Future<void> speak(String text) async {
    if (!isEnabled) return;
    await init();
    try {
      await _flutterTts.speak(text);
    } catch (e) {
      debugPrint("TTS Speak error: $e");
    }
  }

  Future<void> stop() async {
    try {
      await _flutterTts.stop();
    } catch (e) {
      debugPrint("TTS Stop error: $e");
    }
  }
}
