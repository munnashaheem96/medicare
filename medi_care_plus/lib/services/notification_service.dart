import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'tts_service.dart';
import 'firebase_service.dart';
import '../models/medicine.dart';

/// Maps a timing slot name to the hour (24h) at which the alarm fires.
const Map<String, int> _timingHours = {
  'morning':   7,
  'afternoon': 13,
  'evening':   18,
  'night':     21,
};

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();
  final AudioPlayer _audioPlayer = AudioPlayer();
  final TtsService _ttsService = TtsService();

  bool _initialized = false;
  bool _isAlarmPlaying = false;
  bool get isAlarmPlaying => _isAlarmPlaying;

  // Holds a medicine that was loaded from a cold-start notification tap
  Medicine? _pendingAlarmMedicine;
  Medicine? get pendingAlarmMedicine => _pendingAlarmMedicine;
  void clearPendingAlarm() => _pendingAlarmMedicine = null;

  // Stream to notify UI when a medicine alarm is triggered
  final StreamController<Medicine> _alarmStreamController =
      StreamController<Medicine>.broadcast();
  Stream<Medicine> get onAlarmTriggered => _alarmStreamController.stream;

  // ─── Initialization ────────────────────────────────────────────────────────

  /// Call once on startup. Initializes timezone data + local notifications.
  Future<void> init(FirebaseService firebaseService) async {
    if (_initialized) return;
    _initialized = true;

    // Initialize timezone database
    tz_data.initializeTimeZones();
    try {
      final tzInfo = await FlutterTimezone.getLocalTimezone();
      // flutter_timezone 5.x returns a TimezoneInfo object; .toString() gives the tz name
      tz.setLocalLocation(tz.getLocation(tzInfo.toString()));
    } catch (_) {
      tz.setLocalLocation(tz.getLocation('Asia/Kolkata'));
    }

    // Android settings
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS settings
    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notificationsPlugin.initialize(
      settings,
      onDidReceiveNotificationResponse: (NotificationResponse response) async {
        // Notification tapped while app is in foreground / background
        final medicineId = response.payload;
        if (medicineId != null && medicineId.isNotEmpty) {
          final medicine = await firebaseService.getMedicine(medicineId);
          if (medicine != null) {
            triggerAlarm(medicine);
          }
        }
      },
      onDidReceiveBackgroundNotificationResponse: _backgroundNotificationHandler,
    );

    // Request Android permission (API 33+)
    final androidPlugin = _notificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.requestNotificationsPermission();
    await androidPlugin?.requestExactAlarmsPermission();

    // Handle cold-start: app was killed and user tapped the notification
    final launchDetails =
        await _notificationsPlugin.getNotificationAppLaunchDetails();
    if (launchDetails != null &&
        launchDetails.didNotificationLaunchApp &&
        launchDetails.notificationResponse?.payload != null) {
      final medicineId = launchDetails.notificationResponse!.payload!;
      final medicine = await firebaseService.getMedicine(medicineId);
      if (medicine != null) {
        _pendingAlarmMedicine = medicine;
      }
    }
  }

  // ─── Schedule Medicine Reminders ──────────────────────────────────────────

  /// Cancels any existing reminders for [medicine], then schedules daily
  /// alarms for each timing slot for every day until the end date.
  Future<void> scheduleMedicineReminders(Medicine medicine) async {
    // Cancel old ones first
    await cancelMedicineReminders(medicine);

    final now = tz.TZDateTime.now(tz.local);

    for (final timing in medicine.timings) {
      final hour = _timingHours[timing] ?? 8;
      final notifId = _notifId(medicine.id, timing);

      // Compute the next occurrence of this timing today (or tomorrow if past)
      var scheduledDate = tz.TZDateTime(
        tz.local,
        now.year,
        now.month,
        now.day,
        hour,
        0, // minute
        0, // second
      );
      if (scheduledDate.isBefore(now)) {
        scheduledDate = scheduledDate.add(const Duration(days: 1));
      }

      final androidDetails = AndroidNotificationDetails(
        'medication_alarms_v4',
        'Medication Alarms',
        channelDescription: 'Daily medicine dose alarms',
        importance: Importance.max,
        priority: Priority.high,
        sound: const RawResourceAndroidNotificationSound('alarm_sound'),
        playSound: true,
        enableVibration: true,
        vibrationPattern: Int64List.fromList([0, 500, 500, 500]),
        fullScreenIntent: true,
        category: AndroidNotificationCategory.alarm,
        visibility: NotificationVisibility.public,
        ticker: '💊 Medicine reminder',
        ongoing: false,
      );

      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentSound: true,
        presentBadge: true,
        sound: 'alarm_sound.aiff',
        interruptionLevel: InterruptionLevel.critical,
      );

      final details = NotificationDetails(android: androidDetails, iOS: iosDetails);

      try {
        await _notificationsPlugin.zonedSchedule(
          notifId,
          '💊 Time for ${medicine.medicineName}',
          '${timing[0].toUpperCase()}${timing.substring(1)} dose · Take ${medicine.mealInstruction} food',
          scheduledDate,
          details,
          payload: medicine.id,
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          matchDateTimeComponents: DateTimeComponents.time,
          uiLocalNotificationDateInterpretation:
              UILocalNotificationDateInterpretation.absoluteTime,
        );
      } catch (_) {
        // Fall back to inexact if exact alarms permission is denied
        try {
          await _notificationsPlugin.zonedSchedule(
            notifId,
            '💊 Time for ${medicine.medicineName}',
            '${timing[0].toUpperCase()}${timing.substring(1)} dose · Take ${medicine.mealInstruction} food',
            scheduledDate,
            details,
            payload: medicine.id,
            androidScheduleMode: AndroidScheduleMode.inexact,
            matchDateTimeComponents: DateTimeComponents.time,
            uiLocalNotificationDateInterpretation:
                UILocalNotificationDateInterpretation.absoluteTime,
          );
        } catch (_) {}
      }
    }
  }

  // ─── Cancel Reminders for a Single Medicine ────────────────────────────────

  Future<void> cancelMedicineReminders(Medicine medicine) async {
    for (final timing in _timingHours.keys) {
      await _notificationsPlugin.cancel(_notifId(medicine.id, timing));
    }
  }

  // ─── Cancel All Notifications ──────────────────────────────────────────────

  Future<void> cancelAllNotifications() async {
    await _notificationsPlugin.cancelAll();
  }

  // ─── Show Immediate Alarm Notification (for testing / foreground) ──────────

  /// Shows an immediate popup notification with alarm styling.
  Future<void> showImmediateAlarm(Medicine medicine, String timing) async {
    final androidDetails = AndroidNotificationDetails(
      'medication_alarms_v4',
      'Medication Alarms',
      channelDescription: 'Daily medicine dose alarms',
      importance: Importance.max,
      priority: Priority.high,
      sound: const RawResourceAndroidNotificationSound('alarm_sound'),
      playSound: true,
      enableVibration: true,
      vibrationPattern: Int64List.fromList([0, 500, 500, 500]),
      fullScreenIntent: true,
      category: AndroidNotificationCategory.alarm,
      visibility: NotificationVisibility.public,
      ticker: '💊 Medicine reminder',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentSound: true,
      presentBadge: true,
      interruptionLevel: InterruptionLevel.critical,
    );

    await _notificationsPlugin.show(
      _notifId(medicine.id, timing),
      '💊 Time for ${medicine.medicineName}!',
      '${timing[0].toUpperCase()}${timing.substring(1)} dose · Take ${medicine.mealInstruction} food',
      NotificationDetails(android: androidDetails, iOS: iosDetails),
      payload: medicine.id,
    );
  }

  // ─── Trigger In-App Alarm (plays sound + TTS + opens overlay stream) ───────

  Future<void> triggerAlarm(Medicine medicine) async {
    if (_isAlarmPlaying) return;
    _isAlarmPlaying = true;

    // Notify the UI to show the overlay
    _alarmStreamController.add(medicine);

    // Speak out loud (TTS)
    final instruction = 'It is time to take ${medicine.medicineName}. '
        'Take ${medicine.mealInstruction} food. '
        'Please confirm if you have taken this dose.';
    await _ttsService.speak(instruction);

    // Play looping custom alarm sound
    try {
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
      await _audioPlayer.play(AssetSource('audio/alarm.mp3'));
    } catch (_) {
      // Audio playback failed — TTS still works
    }
  }

  // ─── Stop Alarm ───────────────────────────────────────────────────────────

  Future<void> stopAlarm() async {
    if (!_isAlarmPlaying) return;
    _isAlarmPlaying = false;
    try {
      await _audioPlayer.stop();
      await _ttsService.stop();
    } catch (_) {
      // Best-effort stop
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /// Stable, unique notification ID from medicine ID + timing
  int _notifId(String medicineId, String timing) =>
      '${medicineId}_$timing'.hashCode.abs() % 2147483647;
}

// Must be a top-level function — called when notification arrives while
// app is terminated (background isolate).
@pragma('vm:entry-point')
void _backgroundNotificationHandler(NotificationResponse response) {
  // We cannot navigate here (no BuildContext). The pending alarm mechanism
  // in init() handles the cold-start case when the user taps the notification.
}
