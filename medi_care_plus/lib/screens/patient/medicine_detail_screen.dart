import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/medicine.dart';
import '../../theme/app_theme.dart';

class MedicineDetailScreen extends StatelessWidget {
  final Medicine medicine;

  const MedicineDetailScreen({super.key, required this.medicine});

  @override
  Widget build(BuildContext context) {
    final isLow = medicine.quantity <= 3;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text("Prescription Details"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Medicine Header Card
            Card(
              color: AppTheme.surface,
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    const Icon(
                      Icons.vaccines_outlined,
                      size: 64,
                      color: AppTheme.primary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      medicine.medicineName,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: isLow ? AppTheme.danger.withValues(alpha: 0.1) : AppTheme.primaryLight,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        "${medicine.quantity} Tablets Remaining",
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: isLow ? AppTheme.danger : AppTheme.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Prescription Details Card
            Text(
              "DOSAGE & SCHEDULE",
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
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    _buildDetailRow(
                      Icons.schedule_rounded,
                      "Frequency",
                      medicine.timings.map((t) => t.toUpperCase()).join(', '),
                    ),
                    const Divider(color: AppTheme.borderLight),
                    _buildDetailRow(
                      Icons.restaurant_rounded,
                      "Instructions",
                      "Take ${medicine.mealInstruction} food",
                    ),
                    const Divider(color: AppTheme.borderLight),
                    _buildDetailRow(
                      Icons.date_range_rounded,
                      "Duration",
                      "${medicine.startDate} to ${medicine.endDate}",
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Doctor instructions
            Text(
              "DOCTOR'S NOTE",
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
                padding: const EdgeInsets.all(20.0),
                child: Text(
                  medicine.notes.isNotEmpty
                      ? medicine.notes
                      : "No additional instructions provided by the doctor.",
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontStyle: medicine.notes.isNotEmpty ? FontStyle.italic : FontStyle.normal,
                    color: AppTheme.textSecondary,
                    height: 1.5,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 36),
            
            if (isLow)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.danger.withValues(alpha: 0.05),
                  border: Border.all(color: AppTheme.danger.withValues(alpha: 0.2)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "⚠️ Refill Prompt",
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.danger,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "This medicine is running low. Please message your doctor using the chat tab to request a refill prescription.",
                      style: GoogleFonts.outfit(
                        color: AppTheme.textSecondary,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppTheme.primary, size: 20),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  color: AppTheme.textMuted,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: GoogleFonts.outfit(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
