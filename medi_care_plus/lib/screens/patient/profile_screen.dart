import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../services/firebase_service.dart';
import '../../theme/app_theme.dart';
import '../login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _contactNameController = TextEditingController();
  final _contactPhoneController = TextEditingController();
  bool _isEditing = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final profile = Provider.of<FirebaseService>(context, listen: false).currentUserProfile;
    if (profile != null) {
      // In a real database we fetch emergency contact details.
      // We will default mock them or load from Firestore.
      _contactNameController.text = "Jane Doe (Spouse)";
      _contactPhoneController.text = "9876543211";
    }
  }

  @override
  void dispose() {
    _contactNameController.dispose();
    _contactPhoneController.dispose();
    super.dispose();
  }

  void _saveEmergencyContact(FirebaseService firebaseService) async {
    setState(() => _isSaving = true);
    try {
      if (firebaseService.currentUserProfile?.patientId != null) {
        await firebaseService.updateEmergencyContact(
          firebaseService.currentUserProfile!.patientId!,
          _contactNameController.text.trim(),
          _contactPhoneController.text.trim(),
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Emergency contact updated!"), backgroundColor: AppTheme.success),
        );
        setState(() => _isEditing = false);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e")),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context);
    final profile = firebaseService.currentUserProfile;

    if (profile == null) {
      return const Scaffold(body: Center(child: Text("No Profile Data Available.")));
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text("My Profile"),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppTheme.danger),
            onPressed: () async {
              await firebaseService.signOut();
              if (context.mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Avatar card
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: AppTheme.primaryLight,
                    child: Text(
                      profile.name.isNotEmpty ? profile.name[0].toUpperCase() : 'P',
                      style: GoogleFonts.outfit(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    profile.name,
                    style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  Text(
                    "Patient ID: ${profile.patientId ?? 'N/A'}",
                    style: GoogleFonts.outfit(fontSize: 14, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Read-Only Patient Metadata Card
            Text(
              "MEDICAL PROFILE INFORMATION",
              style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textMuted, letterSpacing: 1.5),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    _buildInfoRow("Assigned Doctor", profile.doctor ?? "Unassigned"),
                    const Divider(color: AppTheme.borderLight),
                    _buildInfoRow("Medical Condition", profile.condition ?? "None"),
                    const Divider(color: AppTheme.borderLight),
                    _buildInfoRow("Blood Group", profile.bloodGroup ?? "B+"),
                    const Divider(color: AppTheme.borderLight),
                    _buildInfoRow("Age / Gender", "${profile.age ?? 35}y / ${profile.gender ?? 'Male'}"),
                    const Divider(color: AppTheme.borderLight),
                    _buildInfoRow("Login Email", profile.email),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Emergency Caregiver contact card
            Text(
              "EMERGENCY CONTACT CAREGIVER",
              style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textMuted, letterSpacing: 1.5),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (!_isEditing) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _contactNameController.text,
                                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                "Mobile: +91 ${_contactPhoneController.text}",
                                style: GoogleFonts.outfit(fontSize: 14, color: AppTheme.textSecondary),
                              ),
                            ],
                          ),
                          IconButton(
                            icon: const Icon(Icons.edit_outlined, color: AppTheme.primary),
                            onPressed: () => setState(() => _isEditing = true),
                          )
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        "💡 Caregivers will be notified in real-time if you repeatedly skip medication schedules.",
                        style: GoogleFonts.outfit(fontSize: 11, color: AppTheme.textMuted),
                      )
                    ] else ...[
                      TextField(
                        controller: _contactNameController,
                        decoration: const InputDecoration(labelText: "Caregiver Name"),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _contactPhoneController,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(labelText: "Caregiver Phone Number"),
                      ),
                      const SizedBox(height: 16),
                      if (_isSaving)
                        const Center(child: CircularProgressIndicator())
                      else
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => setState(() => _isEditing = false),
                                child: const Text("Cancel"),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () => _saveEmergencyContact(firebaseService),
                                child: const Text("Save"),
                              ),
                            ),
                          ],
                        )
                    ]
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(fontSize: 14, color: AppTheme.textSecondary)),
          Text(value, style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
        ],
      ),
    );
  }
}
