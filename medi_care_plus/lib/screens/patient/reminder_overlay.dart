// ignore_for_file: deprecated_member_use
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../models/medicine.dart';
import '../../services/firebase_service.dart';
import '../../services/notification_service.dart';
import '../../theme/app_theme.dart';

class ReminderOverlay extends StatefulWidget {
  final Medicine medicine;
  final String timing;

  const ReminderOverlay({
    super.key,
    required this.medicine,
    required this.timing,
  });

  @override
  State<ReminderOverlay> createState() => _ReminderOverlayState();
}

class _ReminderOverlayState extends State<ReminderOverlay> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  final _reasonController = TextEditingController();
  bool _isSaving = false;

  final List<String> _skipReasons = [
    "I was outside / travelling",
    "Feeling better / symptoms gone",
    "Felt nauseous / side effects",
    "Forgot / woke up late",
    "Stock finished / need refill",
    "Other (Write below)"
  ];
  String _selectedReason = "I was outside / travelling";

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _animController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _markAsTaken(FirebaseService firebaseService, NotificationService notificationService) async {
    setState(() => _isSaving = true);
    try {
      await notificationService.stopAlarm();
      await firebaseService.logMedicineDose(
        patientId: widget.medicine.patientId,
        medicineId: widget.medicine.id,
        timing: widget.timing,
        status: 'taken',
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Dose recorded as TAKEN! Adherence logged."),
            backgroundColor: AppTheme.success,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e"), backgroundColor: AppTheme.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _showSkipDialog(FirebaseService firebaseService, NotificationService notificationService) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          backgroundColor: Colors.white,
          title: Text(
            "Skip Medicine Dose",
            style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  "Why are you skipping ${widget.medicine.medicineName}?",
                  style: GoogleFonts.outfit(color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 16),
                ..._skipReasons.map((reason) {
                  return RadioListTile<String>(
                    title: Text(reason, style: GoogleFonts.outfit(fontSize: 14)),
                    value: reason,
                    activeColor: AppTheme.primary,
                    groupValue: _selectedReason,
                    onChanged: (val) {
                      if (val != null) {
                        setDialogState(() => _selectedReason = val);
                      }
                    },
                  );
                }),
                if (_selectedReason.startsWith("Other")) ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: _reasonController,
                    decoration: const InputDecoration(
                      hintText: "Enter custom reason...",
                    ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text("Cancel", style: GoogleFonts.outfit(color: AppTheme.textSecondary)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
              onPressed: _isSaving ? null : () async {
                Navigator.pop(dialogContext); // close dialog
                setState(() => _isSaving = true);
                
                final finalReason = _selectedReason.startsWith("Other")
                    ? _reasonController.text.trim()
                    : _selectedReason;

                try {
                  await notificationService.stopAlarm();
                  await firebaseService.logMedicineDose(
                    patientId: widget.medicine.patientId,
                    medicineId: widget.medicine.id,
                    timing: widget.timing,
                    status: 'skipped',
                    reason: finalReason.isNotEmpty ? finalReason : "Skipped",
                  );
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text("Dose logged as SKIPPED."),
                        backgroundColor: AppTheme.danger,
                      ),
                    );
                    Navigator.pop(context);
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text("Error: $e")),
                    );
                  }
                } finally {
                  if (mounted) setState(() => _isSaving = false);
                }
              },
              child: const Text("Confirm Skip"),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context);
    final notificationService = Provider.of<NotificationService>(context);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Pulse Alarm Circle
              Center(
                child: AnimatedBuilder(
                  animation: _animController,
                  builder: (context, child) {
                    return Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.primary.withValues(alpha: 0.1 + (0.1 * _animController.value)),
                        border: Border.all(
                          color: AppTheme.primary.withValues(alpha: 0.2 + (0.3 * _animController.value)),
                          width: 4 * _animController.value,
                        ),
                      ),
                      child: const Icon(
                        Icons.alarm_on_rounded,
                        size: 80,
                        color: AppTheme.primary,
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),
              Text(
                "MEDICINE TIME ALARM",
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                  letterSpacing: 2.0,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                "It's time to take your dose!",
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const Spacer(),

              // Medicine details card
              Card(
                elevation: 0,
                color: AppTheme.surface,
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.medicine.medicineName,
                        style: GoogleFonts.outfit(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const Icon(Icons.schedule, size: 16, color: AppTheme.textSecondary),
                          const SizedBox(width: 6),
                          Text(
                            "Timing: ${widget.timing.toUpperCase()}",
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.restaurant, size: 16, color: AppTheme.textSecondary),
                          const SizedBox(width: 6),
                          Text(
                            "Instruction: Take ${widget.medicine.mealInstruction} food",
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      if (widget.medicine.notes.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Divider(color: AppTheme.border),
                        const SizedBox(height: 8),
                        Text(
                          "Doctor Instructions:",
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: AppTheme.textMuted,
                          ),
                        ),
                        Text(
                          widget.medicine.notes,
                          style: GoogleFonts.outfit(
                            fontStyle: FontStyle.italic,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const Spacer(),

              // Quick Alarm Controls
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton.filledTonal(
                    style: IconButton.styleFrom(backgroundColor: AppTheme.primaryLight),
                    icon: const Icon(Icons.volume_off_rounded, color: AppTheme.primary),
                    onPressed: () => notificationService.stopAlarm(),
                    tooltip: "Stop Alarm Sound",
                  ),
                  const SizedBox(width: 12),
                  Text(
                    "Ringing & Reading details...",
                    style: GoogleFonts.outfit(fontSize: 13, color: AppTheme.textSecondary),
                  )
                ],
              ),
              const SizedBox(height: 32),

              // Action Buttons
              if (_isSaving)
                const Center(child: CircularProgressIndicator())
              else ...[
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.success,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  onPressed: () => _markAsTaken(firebaseService, notificationService),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.check_circle_outline, color: Colors.white),
                      const SizedBox(width: 8),
                      Text(
                        "I HAVE TAKEN IT",
                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: AppTheme.danger, width: 1.5),
                    foregroundColor: AppTheme.danger,
                  ),
                  onPressed: () => _showSkipDialog(firebaseService, notificationService),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.cancel_outlined, color: AppTheme.danger),
                      const SizedBox(width: 8),
                      Text(
                        "SKIP THIS DOSE",
                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
