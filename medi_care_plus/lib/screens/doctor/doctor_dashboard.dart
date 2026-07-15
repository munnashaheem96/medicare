import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../models/user_profile.dart';
import '../../models/compliance.dart';
import '../../services/firebase_service.dart';
import '../../theme/app_theme.dart';
import '../login_screen.dart';
import 'patient_detail_screen.dart';
import 'doctor_chat_list.dart';

class DoctorDashboard extends StatefulWidget {
  const DoctorDashboard({super.key});

  @override
  State<DoctorDashboard> createState() => _DoctorDashboardState();
}

class _DoctorDashboardState extends State<DoctorDashboard> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context);
    final doctor = firebaseService.currentUserProfile;

    if (doctor == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final String doctorName = doctor.name;

    final List<Widget> pages = [
      _DoctorHomeView(doctorName: doctorName),
      DoctorChatList(doctorName: doctorName),
      _DoctorProfileView(doctor: doctor),
    ];

    return Scaffold(
      body: pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: AppTheme.textMuted,
        backgroundColor: Colors.white,
        selectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12),
        unselectedLabelStyle: GoogleFonts.outfit(fontSize: 12),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: "Patients",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline),
            activeIcon: Icon(Icons.chat_bubble),
            label: "Chats",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: "Profile",
          ),
        ],
      ),
    );
  }
}

// Internal Doctor Home View listing patients
class _DoctorHomeView extends StatelessWidget {
  final String doctorName;

  const _DoctorHomeView({required this.doctorName});

  bool _hasConsecutiveSkips(List<Compliance> logs) {
    if (logs.isEmpty) return false;
    
    // Sort logs by date descending
    logs.sort((a, b) => b.date.compareTo(a.date));
    
    // Find consecutive days with skipped or missed status
    // Map dates to status
    Map<String, List<String>> dailyStatuses = {};
    for (var log in logs) {
      dailyStatuses.putIfAbsent(log.date, () => []).add(log.status);
    }
    
    List<String> sortedDates = dailyStatuses.keys.toList()..sort((a, b) => b.compareTo(a));
    if (sortedDates.length < 2) return false;

    int consecutiveCount = 0;
    for (var date in sortedDates) {
      final statuses = dailyStatuses[date]!;
      // If all scheduled for that day are skipped or missed, increment consecutive count
      bool isAllSkippedOrMissed = statuses.every((s) => s == 'skipped' || s == 'missed');
      if (isAllSkippedOrMissed) {
        consecutiveCount++;
        if (consecutiveCount >= 2) return true;
      } else {
        consecutiveCount = 0;
      }
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.local_hospital_outlined, color: AppTheme.primary, size: 28),
            const SizedBox(width: 8),
            Text("Doctor Portal", style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
      body: StreamBuilder<List<UserProfile>>(
        stream: firebaseService.streamPatientsForDoctor(doctorName),
        builder: (context, patientSnapshot) {
          if (patientSnapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (patientSnapshot.hasError) {
            return Center(child: Text("Error loading patients: ${patientSnapshot.error}"));
          }

          final patients = patientSnapshot.data ?? [];

          return StreamBuilder<List<Compliance>>(
            stream: firebaseService.streamComplianceForAll(),
            builder: (context, complianceSnapshot) {
              final allLogs = complianceSnapshot.data ?? [];

              return Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Welcome, $doctorName",
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Manage prescriptions and monitor patient compliance rates in real-time.",
                      style: GoogleFonts.outfit(color: AppTheme.textSecondary, fontSize: 13),
                    ),
                    const SizedBox(height: 24),

                    Text(
                      "MY ASSIGNED PATIENTS (${patients.length})",
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textMuted,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 12),

                    if (patients.isEmpty)
                      Expanded(
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.people_alt_outlined, size: 64, color: AppTheme.textMuted),
                              const SizedBox(height: 12),
                              Text(
                                "No Patients Assigned",
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              Text(
                                "Patients will show up when assigned to you.",
                                style: GoogleFonts.outfit(color: AppTheme.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      )
                    else
                      Expanded(
                        child: ListView.builder(
                          itemCount: patients.length,
                          itemBuilder: (context, index) {
                            final patient = patients[index];
                            
                            // Filter logs for this patient
                            final pLogs = allLogs.where((l) => l.patientId == patient.patientId).toList();
                            
                            // Compute compliance rate
                            final takenLogs = pLogs.where((l) => l.status == 'taken').length;
                            final rate = pLogs.isNotEmpty 
                                ? ((takenLogs / pLogs.length) * 100).round() 
                                : 100;

                            final alertActive = _hasConsecutiveSkips(pLogs);

                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(16),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => PatientDetailScreen(patient: patient),
                                    ),
                                  );
                                },
                                child: Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Consecutive Skips Alert Tag
                                      if (alertActive) ...[
                                        Container(
                                          margin: const EdgeInsets.only(bottom: 12),
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: AppTheme.danger.withValues(alpha: 0.08),
                                            border: Border.all(color: AppTheme.danger.withValues(alpha: 0.2)),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.alarm_off, color: AppTheme.danger, size: 14),
                                              const SizedBox(width: 6),
                                              Expanded(
                                                child: Text(
                                                  "ALERT: Patient skipped doses for 2+ consecutive days!",
                                                  style: GoogleFonts.outfit(
                                                    color: AppTheme.danger,
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],

                                      Row(
                                        children: [
                                          CircleAvatar(
                                            backgroundColor: AppTheme.primaryLight,
                                            child: Text(
                                              patient.name.isNotEmpty ? patient.name[0].toUpperCase() : 'P',
                                              style: GoogleFonts.outfit(
                                                fontWeight: FontWeight.bold,
                                                color: AppTheme.primary,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 14),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  patient.name,
                                                  style: GoogleFonts.outfit(
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 16,
                                                    color: AppTheme.textPrimary,
                                                  ),
                                                ),
                                                Text(
                                                  "Condition: ${patient.condition ?? 'N/A'}",
                                                  style: GoogleFonts.outfit(
                                                    fontSize: 12,
                                                    color: AppTheme.textSecondary,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.end,
                                            children: [
                                              Text(
                                                "$rate%",
                                                style: GoogleFonts.outfit(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 18,
                                                  color: rate >= 80 ? AppTheme.success : AppTheme.danger,
                                                ),
                                              ),
                                              Text(
                                                "Adherence",
                                                style: GoogleFonts.outfit(
                                                  fontSize: 10,
                                                  color: AppTheme.textMuted,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      const Divider(color: AppTheme.borderLight),
                                      const SizedBox(height: 4),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            "Mobile: +91 ${patient.mobile ?? 'N/A'}",
                                            style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textSecondary),
                                          ),
                                          Text(
                                            "View Adherence Reports →",
                                            style: GoogleFonts.outfit(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: AppTheme.primary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
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

// Doctor Profile View
class _DoctorProfileView extends StatelessWidget {
  final UserProfile doctor;

  const _DoctorProfileView({required this.doctor});

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context, listen: false);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text("My Doctor Profile"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 48,
                    backgroundColor: AppTheme.primaryLight,
                    child: const Icon(Icons.health_and_safety_sharp, color: AppTheme.primary, size: 48),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    doctor.name,
                    style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    doctor.specialization ?? "Cardiology Specialist",
                    style: GoogleFonts.outfit(fontSize: 14, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    _buildProfileRow("Portal Email", doctor.email),
                    const Divider(color: AppTheme.borderLight),
                    _buildProfileRow("Role Permissions", "Doctor/Administrator"),
                    const Divider(color: AppTheme.borderLight),
                    _buildProfileRow("Joined Portal", "2026"),
                  ],
                ),
              ),
            ),
            const Spacer(),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
              onPressed: () async {
                await firebaseService.signOut();
                if (context.mounted) {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (context) => const LoginScreen()),
                  );
                }
              },
              child: const Text("Sign Out"),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileRow(String label, String val) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(color: AppTheme.textSecondary, fontSize: 14)),
          Text(val, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppTheme.textPrimary, fontSize: 14)),
        ],
      ),
    );
  }
}
