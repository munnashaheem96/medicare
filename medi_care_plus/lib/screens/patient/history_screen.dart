import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/compliance.dart';
import '../../services/firebase_service.dart';
import '../../theme/app_theme.dart';

class HistoryScreen extends StatelessWidget {
  final String patientId;

  const HistoryScreen({super.key, required this.patientId});

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text("Adherence History"),
      ),
      body: StreamBuilder<List<Compliance>>(
        stream: firebaseService.streamCompliance(patientId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text("Error loading logs: ${snapshot.error}"));
          }

          final logs = snapshot.data ?? [];
          // Sort logs by date and loggedAt descending
          logs.sort((a, b) => b.loggedAt.compareTo(a.loggedAt));

          if (logs.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.history_toggle_off_outlined, size: 64, color: AppTheme.textMuted),
                  const SizedBox(height: 12),
                  Text(
                    "No Adherence History Yet",
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Text(
                    "Your logs will show up here once you take/skip doses.",
                    style: GoogleFonts.outfit(color: AppTheme.textSecondary),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: logs.length,
            itemBuilder: (context, index) {
              final log = logs[index];
              final isTaken = log.status == 'taken';
              
              DateTime logTime = DateTime.tryParse(log.loggedAt) ?? DateTime.now();
              String formattedTime = DateFormat('hh:mm a').format(logTime);
              String formattedDate = DateFormat('dd MMM yyyy').format(logTime);

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      // Colored status icon
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isTaken ? AppTheme.success.withValues(alpha: 0.1) : AppTheme.danger.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isTaken ? Icons.check_circle : Icons.cancel,
                          color: isTaken ? AppTheme.success : AppTheme.danger,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      
                      // Log Info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            FutureBuilder<dynamic>(
                              // Resolve medicine name for display (optional fallback to ID)
                              future: Future.value(log.medicineId),
                              builder: (context, snapshot) {
                                // Since we log medicineId, we can also look it up.
                                // But for simplicity, we'll write a label.
                                return Text(
                                  "Dose ID: ${log.medicineId.substring(0, log.medicineId.length > 5 ? 5 : log.medicineId.length).toUpperCase()}",
                                  style: GoogleFonts.outfit(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.textPrimary,
                                  ),
                                );
                              },
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "Scheduled for: ${log.timing.toUpperCase()}",
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            if (!isTaken && log.reason != null && log.reason!.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppTheme.surface,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  "Reason: ${log.reason}",
                                  style: GoogleFonts.outfit(
                                    fontSize: 12,
                                    fontStyle: FontStyle.italic,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      
                      // Timestamp
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            formattedDate,
                            style: GoogleFonts.outfit(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          Text(
                            formattedTime,
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              color: AppTheme.textMuted,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: isTaken ? AppTheme.success.withValues(alpha: 0.12) : AppTheme.danger.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              isTaken ? "TAKEN" : "SKIPPED",
                              style: GoogleFonts.outfit(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: isTaken ? AppTheme.success : AppTheme.danger,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
