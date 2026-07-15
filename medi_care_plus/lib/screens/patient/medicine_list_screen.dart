import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../models/medicine.dart';
import '../../services/firebase_service.dart';
import '../../theme/app_theme.dart';
import 'medicine_detail_screen.dart';

class MedicineListScreen extends StatefulWidget {
  final String patientId;

  const MedicineListScreen({super.key, required this.patientId});

  @override
  State<MedicineListScreen> createState() => _MedicineListScreenState();
}

class _MedicineListScreenState extends State<MedicineListScreen> {
  String _searchQuery = "";

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(
          "My Medications",
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 22),
        ),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: StreamBuilder<List<Medicine>>(
        stream: firebaseService.streamMedicines(widget.patientId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text("Error loading prescriptions: ${snapshot.error}"));
          }
          
          final medicines = snapshot.data ?? [];
          final filtered = medicines.where((m) =>
              m.medicineName.toLowerCase().contains(_searchQuery.toLowerCase())).toList();

          return Column(
            children: [
              // Search Box
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Container(
                  decoration: BoxDecoration(
                    boxShadow: AppTheme.premiumShadow,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: "Search prescribed medicines...",
                      prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.textSecondary),
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(vertical: 16),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: AppTheme.borderLight, width: 1.5),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                      ),
                    ),
                    onChanged: (val) => setState(() => _searchQuery = val),
                  ),
                ),
              ),
              
              if (filtered.isEmpty)
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppTheme.surface,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.medication_liquid_outlined, size: 48, color: AppTheme.textMuted),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isEmpty ? "No Prescribed Medicines" : "No match found",
                          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: AppTheme.textPrimary),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _searchQuery.isEmpty 
                              ? "Your doctor will add your prescriptions."
                              : "Try typing a different name.",
                          style: GoogleFonts.outfit(color: AppTheme.textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    physics: const BouncingScrollPhysics(),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final med = filtered[index];
                      final isLow = med.quantity <= 3;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: AppTheme.premiumShadow,
                          border: Border.all(color: AppTheme.borderLight, width: 1.5),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(20),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => MedicineDetailScreen(medicine: med),
                                ),
                              );
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(18.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Refill Alert Banner
                                  if (isLow) ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: AppTheme.danger.withValues(alpha: 0.08),
                                        border: Border.all(color: AppTheme.danger.withValues(alpha: 0.15)),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.warning_amber_rounded, size: 16, color: AppTheme.danger),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              "LOW STOCK ALERT: Only ${med.quantity} tabs left. Request a refill soon.",
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
                                    const SizedBox(height: 12),
                                  ],
                                  
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          med.medicineName,
                                          style: GoogleFonts.outfit(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.textPrimary,
                                          ),
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: isLow ? AppTheme.danger.withValues(alpha: 0.1) : AppTheme.primaryLight,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          "${med.quantity} Tabs Left",
                                          style: GoogleFonts.outfit(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: isLow ? AppTheme.danger : AppTheme.primary,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  
                                  // Timings & meal badge row
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: AppTheme.surface,
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: AppTheme.borderLight),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.schedule_rounded, size: 12, color: AppTheme.textSecondary),
                                            const SizedBox(width: 4),
                                            Text(
                                              med.timings.map((t) => t.toUpperCase()).join(', '),
                                              style: GoogleFonts.outfit(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 10,
                                                color: AppTheme.textSecondary,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: AppTheme.surface,
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: AppTheme.borderLight),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.restaurant_rounded, size: 12, color: AppTheme.textSecondary),
                                            const SizedBox(width: 4),
                                            Text(
                                              "Take ${med.mealInstruction} food",
                                              style: GoogleFonts.outfit(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 10,
                                                color: AppTheme.textSecondary,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  
                                  const SizedBox(height: 16),
                                  const Divider(color: AppTheme.borderLight, height: 1),
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.date_range_rounded, size: 12, color: AppTheme.textMuted),
                                          const SizedBox(width: 4),
                                          Text(
                                            "${med.startDate} to ${med.endDate}",
                                            style: GoogleFonts.outfit(
                                              fontSize: 10,
                                              color: AppTheme.textMuted,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                      Text(
                                        "View Instructions →",
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
                        ),
                      );
                    },
                  ),
                ),
              const SizedBox(height: 90), // Spacing for floating navigation
            ],
          );
        },
      ),
    );
  }
}
