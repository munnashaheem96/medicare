import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../models/user_profile.dart';
import '../../services/firebase_service.dart';
import '../../theme/app_theme.dart';
import 'doctor_chat_screen.dart';

class DoctorChatList extends StatelessWidget {
  final String doctorName;

  const DoctorChatList({super.key, required this.doctorName});

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text("Patient Inbox"),
      ),
      body: StreamBuilder<List<UserProfile>>(
        stream: firebaseService.streamPatientsForDoctor(doctorName),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text("Error: ${snapshot.error}"));
          }

          final patients = snapshot.data ?? [];

          if (patients.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.forum_outlined, size: 64, color: AppTheme.textMuted),
                  const SizedBox(height: 12),
                  Text(
                    "No Patient Chats",
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Text(
                    "Assigned patients will show up here.",
                    style: GoogleFonts.outfit(color: AppTheme.textSecondary),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: patients.length,
            itemBuilder: (context, index) {
              final patient = patients[index];

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  leading: CircleAvatar(
                    backgroundColor: AppTheme.primaryLight,
                    child: Text(
                      patient.name.isNotEmpty ? patient.name[0] : 'P',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppTheme.primary),
                    ),
                  ),
                  title: Text(
                    patient.name,
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  subtitle: Text(
                    "Medical condition: ${patient.condition ?? 'General Care'}",
                    style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textSecondary),
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppTheme.primary),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => DoctorChatScreen(
                          patientId: patient.patientId!,
                          patientName: patient.name,
                          doctorName: doctorName,
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
