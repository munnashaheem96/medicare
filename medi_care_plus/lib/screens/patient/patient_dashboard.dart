import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../models/medicine.dart';
import '../../models/compliance.dart';
import '../../services/firebase_service.dart';
import '../../services/notification_service.dart';
import '../../theme/app_theme.dart';
import 'medicine_list_screen.dart';
import 'chat_screen.dart';
import 'chatbot_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';
import 'reminder_overlay.dart';

class PatientDashboard extends StatefulWidget {
  const PatientDashboard({super.key});

  @override
  State<PatientDashboard> createState() => _PatientDashboardState();
}

class _PatientDashboardState extends State<PatientDashboard> {
  int _currentIndex = 0;
  late StreamSubscription<Medicine> _alarmSubscription;
  StreamSubscription<List<Medicine>>? _medicineScheduleSubscription;
  Set<String> _lastScheduledMedicineIds = {};

  @override
  void initState() {
    super.initState();
    // Initialize notification service (needs FirebaseService to resolve notification payloads)
    final notificationService = Provider.of<NotificationService>(context, listen: false);
    final firebaseService = Provider.of<FirebaseService>(context, listen: false);
    notificationService.init(firebaseService);

    // Listen for alarms triggered while app is in foreground/background and open overlay
    _alarmSubscription = notificationService.onAlarmTriggered.listen((medicine) {
      _showOverlay(medicine);
    });

    // Handle cold-start: app was launched by tapping a notification
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final pending = notificationService.pendingAlarmMedicine;
      if (pending != null) {
        notificationService.clearPendingAlarm();
        _showOverlay(pending);
      }

      // Start watching medicines for alarm scheduling
      _startMedicineAlarmScheduler(firebaseService, notificationService);
    });
  }

  void _startMedicineAlarmScheduler(
    FirebaseService firebaseService,
    NotificationService notificationService,
  ) {
    final profile = firebaseService.currentUserProfile;
    if (profile == null || profile.patientId == null) return;

    _medicineScheduleSubscription = firebaseService
        .streamMedicines(profile.patientId!)
        .listen((medicines) {
      final newIds = medicines.map((m) => m.id).toSet();
      if (newIds == _lastScheduledMedicineIds) return; // no change

      _lastScheduledMedicineIds = newIds;

      // Schedule alarms for all active medicines
      for (final med in medicines) {
        notificationService.scheduleMedicineReminders(med);
      }
    });
  }

  @override
  void dispose() {
    _alarmSubscription.cancel();
    _medicineScheduleSubscription?.cancel();
    super.dispose();
  }


  void _showOverlay(Medicine medicine) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ReminderOverlay(
          medicine: medicine,
          timing: medicine.timings.isNotEmpty ? medicine.timings.first : 'morning',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context);
    final profile = firebaseService.currentUserProfile;

    if (profile == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final String patientId = profile.patientId ?? 'P001';

    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: firebaseService.streamPatientProfile(patientId),
      builder: (context, profileSnapshot) {
        String patientName = profile.name;
        String doctorName = profile.doctor ?? 'Dr. Mehta (Cardiologist)';
        
        if (profileSnapshot.hasData && profileSnapshot.data!.exists) {
          final data = profileSnapshot.data!.data();
          if (data != null) {
            patientName = data['name'] ?? patientName;
            doctorName = data['doctor'] ?? doctorName;
          }
        }

        final List<Widget> pages = [
          _PatientHomeView(patientId: patientId, patientName: patientName),
          MedicineListScreen(patientId: patientId),
          ChatScreen(patientId: patientId, patientName: patientName, doctorName: doctorName),
          HistoryScreen(patientId: patientId),
          const ChatbotScreen(),
          const ProfileScreen(),
        ];

        return Scaffold(
          backgroundColor: AppTheme.background,
          body: pages[_currentIndex],
          bottomNavigationBar: Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 20),
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: AppTheme.premiumShadow,
              border: Border.all(color: AppTheme.borderLight, width: 1.5),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.home_rounded, "Home"),
                _buildNavItem(1, Icons.medication_rounded, "Meds"),
                _buildNavItem(2, Icons.chat_bubble_rounded, "Chat"),
                _buildNavItem(3, Icons.history_rounded, "Logs"),
                _buildNavItem(4, Icons.smart_toy_rounded, "AI Bot"),
                _buildNavItem(5, Icons.person_rounded, "Profile"),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _currentIndex == index;
    return InkWell(
      onTap: () => setState(() => _currentIndex = index),
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryLight : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isSelected ? AppTheme.primary : AppTheme.textMuted,
              size: 24,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? AppTheme.primary : AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PatientHomeView extends StatelessWidget {
  final String patientId;
  final String patientName;

  const _PatientHomeView({required this.patientId, required this.patientName});

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'morning':
        return Icons.wb_sunny_rounded;
      case 'afternoon':
        return Icons.light_mode_rounded;
      case 'evening':
        return Icons.wb_twilight_rounded;
      case 'night':
        return Icons.nights_stay_rounded;
      default:
        return Icons.schedule_rounded;
    }
  }

  String _getFormattedDate() {
    final now = DateTime.now();
    final List<String> weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final List<String> months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return "${weekdays[now.weekday - 1]}, ${months[now.month - 1]} ${now.day}";
  }

  Widget _buildModernStatItem(String label, int count, Color color, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 16),
        ),
        const SizedBox(height: 6),
        Text(
          "$count",
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            fontSize: 15,
            color: AppTheme.textPrimary,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 10,
            color: AppTheme.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context);

    final hour = DateTime.now().hour;
    String greeting = "Good Morning";
    if (hour >= 12 && hour < 17) {
      greeting = "Good Afternoon";
    } else if (hour >= 17) {
      greeting = "Good Evening";
    }

    final todayStr = DateTime.now().toIso8601String().split('T')[0];

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        toolbarHeight: 0,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: StreamBuilder<List<Medicine>>(
        stream: firebaseService.streamMedicines(patientId),
        builder: (context, medSnapshot) {
          // Show error if Firestore permission denied or network error
          if (medSnapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 48),
                    const SizedBox(height: 12),
                    Text('Could not load medicines', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 6),
                    Text('${medSnapshot.error}', style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textSecondary), textAlign: TextAlign.center),
                  ],
                ),
              ),
            );
          }
          return StreamBuilder<List<Compliance>>(
            stream: firebaseService.streamCompliance(patientId),
            builder: (context, compSnapshot) {
              final medicines = medSnapshot.data ?? [];
              final complianceLogs = compSnapshot.data ?? [];

              final todayLogs = complianceLogs.where((l) => l.date == todayStr).toList();
              
              int totalDosesCount = 0;
              for (var med in medicines) {
                totalDosesCount += med.timings.length;
              }

              final takenCount = todayLogs.where((l) => l.status == 'taken').length;
              final skippedCount = todayLogs.where((l) => l.status == 'skipped').length;
              final pendingCount = totalDosesCount - todayLogs.length;

              final complianceRate = totalDosesCount > 0 
                  ? ((takenCount / totalDosesCount) * 100).round()
                  : 100;

              return SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Dynamic Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getFormattedDate(),
                              style: GoogleFonts.outfit(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textMuted,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "$greeting, $patientName",
                              style: GoogleFonts.outfit(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        // Top Settings Trigger and User Initials
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.settings_outlined, color: AppTheme.textSecondary),
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (context) => const SettingsScreen()),
                                );
                              },
                            ),
                            const SizedBox(width: 4),
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: AppTheme.primaryGradient,
                                boxShadow: AppTheme.glowShadow,
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                patientName.isNotEmpty ? patientName[0].toUpperCase() : 'P',
                                style: GoogleFonts.outfit(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 24),

                    // Patient Info Card (condition, blood group, doctor)
                    StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
                      stream: firebaseService.streamPatientProfile(patientId),
                      builder: (context, profileSnap) {
                        String condition = '';
                        String bloodGroup = '';
                        String doctorDisplay = '';

                        if (profileSnap.hasData && profileSnap.data!.exists) {
                          final d = profileSnap.data!.data()!;
                          condition = d['condition'] ?? '';
                          bloodGroup = d['bloodGroup'] ?? '';
                          doctorDisplay = d['doctor'] ?? '';
                        }

                        final hasInfo = condition.isNotEmpty || bloodGroup.isNotEmpty || doctorDisplay.isNotEmpty;
                        if (!hasInfo) return const SizedBox.shrink();

                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFF0F9FF), Color(0xFFE0F2FE)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFBAE6FD), width: 1.2),
                            boxShadow: AppTheme.premiumShadow,
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.medical_information_rounded, color: AppTheme.primary, size: 24),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (condition.isNotEmpty)
                                      Text(
                                        condition,
                                        style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                    if (doctorDisplay.isNotEmpty) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        doctorDisplay,
                                        style: GoogleFonts.outfit(
                                          fontSize: 12,
                                          color: AppTheme.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              if (bloodGroup.isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppTheme.danger.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: AppTheme.danger.withValues(alpha: 0.25)),
                                  ),
                                  child: Text(
                                    bloodGroup,
                                    style: GoogleFonts.outfit(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.danger,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
                    ),


                    // Adherence progress card
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: AppTheme.premiumShadow,
                        border: Border.all(color: AppTheme.borderLight, width: 1.5),
                      ),
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          Stack(
                            alignment: Alignment.center,
                            children: [
                              SizedBox(
                                height: 90,
                                width: 90,
                                child: CircularProgressIndicator(
                                  value: complianceRate / 100,
                                  strokeWidth: 10,
                                  backgroundColor: AppTheme.borderLight,
                                  color: AppTheme.success,
                                  strokeCap: StrokeCap.round,
                                ),
                              ),
                              Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    "$complianceRate%",
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 20,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                  Text(
                                    "Adherence",
                                    style: GoogleFonts.outfit(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(width: 24),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Daily Overview",
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    _buildModernStatItem("Taken", takenCount, AppTheme.success, Icons.check_circle_rounded),
                                    _buildModernStatItem("Skipped", skippedCount, AppTheme.danger, Icons.cancel_rounded),
                                    _buildModernStatItem("Pending", pendingCount, AppTheme.warning, Icons.pending_rounded),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 28),

                    // Structured Schedule Section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "TODAY'S SCHEDULE",
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textMuted,
                            letterSpacing: 1.5,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryLight,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            "${medicines.length} Medications",
                            style: GoogleFonts.outfit(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    if (medicines.isEmpty)
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: AppTheme.premiumShadow,
                          border: Border.all(color: AppTheme.borderLight, width: 1.5),
                        ),
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          children: [
                            const Icon(Icons.hourglass_empty_rounded, color: AppTheme.textMuted, size: 48),
                            const SizedBox(height: 16),
                            Text(
                              "No medicine scheduled for today",
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppTheme.textPrimary, fontSize: 16),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "Your daily schedule will appear here when prescriptions are added by your doctor.",
                              textAlign: TextAlign.center,
                              style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      )
                    else
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: ['morning', 'afternoon', 'evening', 'night'].map((cat) {
                          final catMeds = medicines.where((m) => m.timings.contains(cat)).toList();
                          if (catMeds.isEmpty) return const SizedBox.shrink();

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(top: 14, bottom: 8),
                                child: Row(
                                  children: [
                                    Icon(
                                      _getCategoryIcon(cat),
                                      color: AppTheme.primary,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      cat.toUpperCase(),
                                      style: GoogleFonts.outfit(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.textSecondary,
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              ...catMeds.map((med) {
                                final loggedDose = todayLogs.firstWhere(
                                  (l) => l.medicineId == med.id && l.timing == cat,
                                  orElse: () => Compliance(
                                    id: '',
                                    patientId: '',
                                    medicineId: '',
                                    date: '',
                                    timing: '',
                                    status: 'pending',
                                    loggedAt: '',
                                  ),
                                );

                                final isLogged = loggedDose.id.isNotEmpty;
                                final isTaken = loggedDose.status == 'taken';
                                final isSkipped = loggedDose.status == 'skipped';

                                Color statusColor = AppTheme.warning;
                                IconData statusIcon = Icons.hourglass_empty_rounded;
                                String statusText = "Pending";

                                if (isLogged) {
                                  if (isTaken) {
                                    statusColor = AppTheme.success;
                                    statusIcon = Icons.check_circle_rounded;
                                    statusText = "Taken";
                                  } else if (isSkipped) {
                                    statusColor = AppTheme.danger;
                                    statusIcon = Icons.cancel_rounded;
                                    statusText = "Skipped";
                                  }
                                }

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(20),
                                    boxShadow: AppTheme.premiumShadow,
                                    border: Border.all(
                                      color: isLogged ? statusColor.withValues(alpha: 0.15) : AppTheme.borderLight,
                                      width: 1.5,
                                    ),
                                  ),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(20),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        border: Border(
                                          left: BorderSide(
                                            color: isLogged ? statusColor : AppTheme.textMuted,
                                            width: 5,
                                          ),
                                        ),
                                      ),
                                      padding: const EdgeInsets.all(16),
                                      child: Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(10),
                                            decoration: BoxDecoration(
                                              color: statusColor.withValues(alpha: 0.08),
                                              shape: BoxShape.circle,
                                            ),
                                            child: Icon(statusIcon, color: statusColor, size: 22),
                                          ),
                                          const SizedBox(width: 14),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  med.medicineName,
                                                  style: GoogleFonts.outfit(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.bold,
                                                    color: AppTheme.textPrimary,
                                                  ),
                                                ),
                                                const SizedBox(height: 6),
                                                Row(
                                                  children: [
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                      decoration: BoxDecoration(
                                                        color: AppTheme.primaryLight,
                                                        borderRadius: BorderRadius.circular(8),
                                                      ),
                                                      child: Row(
                                                        mainAxisSize: MainAxisSize.min,
                                                        children: [
                                                          const Icon(Icons.restaurant_rounded, color: AppTheme.primary, size: 10),
                                                          const SizedBox(width: 4),
                                                          Text(
                                                            "Take ${med.mealInstruction} food",
                                                            style: GoogleFonts.outfit(
                                                              fontSize: 10,
                                                              fontWeight: FontWeight.bold,
                                                              color: AppTheme.primary,
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                          const SizedBox(width: 10),
                                          if (!isLogged)
                                            ElevatedButton(
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: AppTheme.primary,
                                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                              ),
                                              onPressed: () {
                                                Navigator.push(
                                                  context,
                                                  MaterialPageRoute(
                                                    builder: (context) => ReminderOverlay(
                                                      medicine: med,
                                                      timing: cat,
                                                    ),
                                                  ),
                                                );
                                              },
                                              child: Text(
                                                "Log",
                                                style: GoogleFonts.outfit(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold),
                                              ),
                                            )
                                          else
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                              decoration: BoxDecoration(
                                                color: statusColor.withValues(alpha: 0.1),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Text(
                                                statusText,
                                                style: GoogleFonts.outfit(
                                                  color: statusColor,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 11,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              })
                            ],
                          );
                        }).toList(),
                      ),
                    
                    const SizedBox(height: 100), // extra padding for floating navigation bar
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
