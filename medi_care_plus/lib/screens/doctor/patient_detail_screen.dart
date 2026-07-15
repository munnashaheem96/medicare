// ignore_for_file: deprecated_member_use
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../models/user_profile.dart';
import '../../models/medicine.dart';
import '../../models/compliance.dart';
import '../../services/firebase_service.dart';
import '../../theme/app_theme.dart';

class PatientDetailScreen extends StatefulWidget {
  final UserProfile patient;

  const PatientDetailScreen({super.key, required this.patient});

  @override
  State<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _PatientDetailScreenState extends State<PatientDetailScreen> {
  String _reportRange = 'weekly'; // 'daily', 'weekly', 'monthly'
  final _medNameController = TextEditingController();
  final _medNotesController = TextEditingController();
  final _medQtyController = TextEditingController(text: '30');
  
  List<String> _selectedTimings = ['morning'];
  String _selectedMealInstruction = 'after';
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 30));

  @override
  void dispose() {
    _medNameController.dispose();
    _medNotesController.dispose();
    _medQtyController.dispose();
    super.dispose();
  }

  // Calculate compliance statistics dynamically
  Map<String, dynamic> _calculateStats(List<Compliance> logs) {
    final rangeDays = _reportRange == 'daily' ? 1 : _reportRange == 'weekly' ? 7 : 30;
    final cutoff = DateTime.now().subtract(Duration(days: rangeDays - 1));
    final cutoffStr = cutoff.toIso8601String().split('T')[0];

    final filtered = logs.where((l) => l.date.compareTo(cutoffStr) >= 0).toList();
    final taken = filtered.where((l) => l.status == 'taken').length;
    final skipped = filtered.where((l) => l.status == 'skipped').length;
    final missed = filtered.where((l) => l.status == 'missed').length;
    final total = filtered.length;

    final rate = total > 0 ? ((taken / total) * 100).round() : 100;

    return {
      'total': total,
      'taken': taken,
      'skipped': skipped,
      'missed': missed,
      'rate': rate,
    };
  }

  // Construct chart data points for the trend
  List<FlSpot> _getChartData(List<Compliance> logs) {
    if (logs.isEmpty) return const [FlSpot(0, 100), FlSpot(6, 100)];
    
    // Sort logs chronologically
    logs.sort((a, b) => a.date.compareTo(b.date));

    final rangeDays = _reportRange == 'daily' ? 7 : _reportRange == 'weekly' ? 7 : 30;
    final today = DateTime.now();

    List<FlSpot> spots = [];
    for (int i = 0; i < rangeDays; i++) {
      final targetDate = today.subtract(Duration(days: rangeDays - 1 - i));
      final dateStr = targetDate.toIso8601String().split('T')[0];

      final dayLogs = logs.where((l) => l.date == dateStr).toList();
      final taken = dayLogs.where((l) => l.status == 'taken').length;
      final total = dayLogs.length;

      final rate = total > 0 ? (taken / total) * 100 : 100.0;
      spots.add(FlSpot(i.toDouble(), rate));
    }
    return spots;
  }

  void _showPrescribeDialog(FirebaseService firebaseService, {Medicine? existingMed}) {
    if (existingMed != null) {
      _medNameController.text = existingMed.medicineName;
      _medNotesController.text = existingMed.notes;
      _medQtyController.text = existingMed.quantity.toString();
      _selectedTimings = List<String>.from(existingMed.timings);
      _selectedMealInstruction = existingMed.mealInstruction;
      _startDate = DateTime.tryParse(existingMed.startDate) ?? DateTime.now();
      _endDate = DateTime.tryParse(existingMed.endDate) ?? DateTime.now().add(const Duration(days: 30));
    } else {
      _medNameController.clear();
      _medNotesController.clear();
      _medQtyController.text = '30';
      _selectedTimings = ['morning'];
      _selectedMealInstruction = 'after';
      _startDate = DateTime.now();
      _endDate = DateTime.now().add(const Duration(days: 30));
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          backgroundColor: Colors.white,
          title: Text(
            existingMed != null ? "Edit Prescription" : "Add Prescription",
            style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _medNameController,
                  decoration: const InputDecoration(labelText: "Medicine Name *"),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _medQtyController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: "Prescribed Tablet Quantity *"),
                ),
                const SizedBox(height: 16),
                
                Text("Select Timings *", style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: ['morning', 'afternoon', 'evening', 'night'].map((t) {
                    final isSelected = _selectedTimings.contains(t);
                    return ChoiceChip(
                      label: Text(t.toUpperCase(), style: GoogleFonts.outfit(fontSize: 11)),
                      selected: isSelected,
                      selectedColor: AppTheme.primaryLight,
                      onSelected: (val) {
                        setDialogState(() {
                          if (val) {
                            _selectedTimings.add(t);
                          } else {
                            if (_selectedTimings.length > 1) {
                              _selectedTimings.remove(t);
                            }
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                
                Text("Food Instructions *", style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold)),
                Row(
                  children: [
                    Expanded(
                      child: RadioListTile<String>(
                        title: Text("After Food", style: GoogleFonts.outfit(fontSize: 12)),
                        value: 'after',
                        groupValue: _selectedMealInstruction,
                        activeColor: AppTheme.primary,
                        onChanged: (val) => setDialogState(() => _selectedMealInstruction = val!),
                      ),
                    ),
                    Expanded(
                      child: RadioListTile<String>(
                        title: Text("Before Food", style: GoogleFonts.outfit(fontSize: 12)),
                        value: 'before',
                        groupValue: _selectedMealInstruction,
                        activeColor: AppTheme.primary,
                        onChanged: (val) => setDialogState(() => _selectedMealInstruction = val!),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                
                // Start/End Dates selection
                Row(
                  children: [
                    Expanded(
                      child: TextButton.icon(
                        icon: const Icon(Icons.date_range, size: 16),
                        label: Text("Start: ${DateFormat('yyyy-MM-dd').format(_startDate)}", style: const TextStyle(fontSize: 11)),
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _startDate,
                            firstDate: DateTime(2026),
                            lastDate: DateTime(2030),
                          );
                          if (date != null) {
                            setDialogState(() => _startDate = date);
                          }
                        },
                      ),
                    ),
                    Expanded(
                      child: TextButton.icon(
                        icon: const Icon(Icons.date_range, size: 16),
                        label: Text("End: ${DateFormat('yyyy-MM-dd').format(_endDate)}", style: const TextStyle(fontSize: 11)),
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _endDate,
                            firstDate: DateTime(2026),
                            lastDate: DateTime(2030),
                          );
                          if (date != null) {
                            setDialogState(() => _endDate = date);
                          }
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _medNotesController,
                  decoration: const InputDecoration(labelText: "Instructions (optional notes)"),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () async {
                final name = _medNameController.text.trim();
                final qty = int.tryParse(_medQtyController.text.trim()) ?? 30;
                
                if (name.isEmpty) return;
                
                final med = Medicine(
                  id: existingMed?.id ?? '',
                  patientId: widget.patient.patientId!,
                  patientName: widget.patient.name,
                  medicineName: name,
                  timings: _selectedTimings,
                  mealInstruction: _selectedMealInstruction,
                  startDate: DateFormat('yyyy-MM-dd').format(_startDate),
                  endDate: DateFormat('yyyy-MM-dd').format(_endDate),
                  notes: _medNotesController.text.trim(),
                  quantity: qty,
                );

                try {
                  if (existingMed != null) {
                    await firebaseService.updateMedicine(existingMed.id, med.toMap());
                  } else {
                    await firebaseService.prescribeMedicine(med);
                  }
                  if (context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(existingMed != null ? "Prescription updated!" : "Medicine Prescribed Successfully!"), backgroundColor: AppTheme.success),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
                  }
                }
              },
              child: const Text("Prescribe"),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context);
    final patientId = widget.patient.patientId ?? 'P001';

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(widget.patient.name),
      ),
      body: StreamBuilder<List<Compliance>>(
        stream: firebaseService.streamCompliance(patientId),
        builder: (context, complianceSnapshot) {
          final pLogs = complianceSnapshot.data ?? [];
          final stats = _calculateStats(pLogs);
          final spots = _getChartData(pLogs);

          return StreamBuilder<List<Medicine>>(
            stream: firebaseService.streamMedicinesForPatient(patientId),
            builder: (context, medSnapshot) {
              final medicines = medSnapshot.data ?? [];

              return SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Patient Header Summary Card
                    Card(
                      color: AppTheme.surface,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 28,
                              backgroundColor: AppTheme.primaryLight,
                              child: Text(
                                widget.patient.name.isNotEmpty ? widget.patient.name[0] : 'P',
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 22, color: AppTheme.primary),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.patient.name,
                                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    "Condition: ${widget.patient.condition ?? 'N/A'}",
                                    style: GoogleFonts.outfit(fontSize: 13, color: AppTheme.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Report Selector
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "COMPLIANCE REPORT",
                          style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textMuted, letterSpacing: 1.5),
                        ),
                        SegmentedButton<String>(
                          style: SegmentedButton.styleFrom(
                            backgroundColor: AppTheme.surface,
                            selectedBackgroundColor: AppTheme.primaryLight,
                            selectedForegroundColor: AppTheme.primary,
                          ),
                          segments: const [
                            ButtonSegment(value: 'daily', label: Text("Day")),
                            ButtonSegment(value: 'weekly', label: Text("Week")),
                            ButtonSegment(value: 'monthly', label: Text("Month")),
                          ],
                          selected: {_reportRange},
                          onSelectionChanged: (val) => setState(() => _reportRange = val.first),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Numbers summary
                    Row(
                      children: [
                        _buildStatBox("Adherence Rate", "${stats['rate']}%", AppTheme.primary),
                        const SizedBox(width: 12),
                        _buildStatBox("Taken Doses", "${stats['taken']}", AppTheme.success),
                        const SizedBox(width: 12),
                        _buildStatBox("Skipped Doses", "${stats['skipped']}", AppTheme.danger),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Compliance line chart trend
                    Text(
                      "ADHERENCE TREND RATE",
                      style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textMuted, letterSpacing: 1.5),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 160,
                      child: LineChart(
                        LineChartData(
                          gridData: const FlGridData(show: false),
                          titlesData: const FlTitlesData(show: false),
                          borderData: FlBorderData(show: false),
                          minX: 0,
                          maxX: spots.length.toDouble() - 1,
                          minY: 0,
                          maxY: 100,
                          lineBarsData: [
                            LineChartBarData(
                              spots: spots,
                              isCurved: true,
                              color: AppTheme.primary,
                              barWidth: 4,
                              isStrokeCapRound: true,
                              dotData: const FlDotData(show: true),
                              belowBarData: BarAreaData(
                                show: true,
                                color: AppTheme.primary.withValues(alpha: 0.08),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Prescriptions CRUD list
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "CURRENT PRESCRIPTIONS",
                          style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textMuted, letterSpacing: 1.5),
                        ),
                        IconButton.filledTonal(
                          style: IconButton.styleFrom(backgroundColor: AppTheme.primaryLight),
                          icon: const Icon(Icons.add, color: AppTheme.primary, size: 20),
                          onPressed: () => _showPrescribeDialog(firebaseService),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    if (medicines.isEmpty)
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Center(
                            child: Text(
                              "No active prescriptions. Click add above to prescribe.",
                              style: GoogleFonts.outfit(color: AppTheme.textSecondary, fontSize: 13),
                            ),
                          ),
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: medicines.length,
                        itemBuilder: (context, index) {
                          final med = medicines[index];
                          final isLow = med.quantity <= 3;

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          med.medicineName,
                                          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          "Schedule: ${med.timings.map((t) => t.toUpperCase()).join(', ')}",
                                          style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textSecondary),
                                        ),
                                        Text(
                                          "Remaining: ${med.quantity} Tablets ${isLow ? '(LOW STOCK!)' : ''}",
                                          style: GoogleFonts.outfit(fontSize: 11, color: isLow ? AppTheme.danger : AppTheme.textMuted, fontWeight: isLow ? FontWeight.bold : FontWeight.normal),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Edit / Delete buttons
                                  IconButton(
                                    icon: const Icon(Icons.edit_outlined, color: AppTheme.primary, size: 20),
                                    onPressed: () => _showPrescribeDialog(firebaseService, existingMed: med),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: AppTheme.danger, size: 20),
                                    onPressed: () async {
                                      final confirm = await showDialog<bool>(
                                        context: context,
                                        builder: (context) => AlertDialog(
                                          title: const Text("Delete Prescription?"),
                                          content: const Text("Are you sure you want to stop this medicine prescription?"),
                                          actions: [
                                            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
                                            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text("Delete", style: TextStyle(color: AppTheme.danger))),
                                          ],
                                        ),
                                      );
                                      if (confirm == true) {
                                        await firebaseService.deleteMedicine(med.id);
                                        if (context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text("Prescription deleted.")),
                                          );
                                        }
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
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

  Widget _buildStatBox(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 10,
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
