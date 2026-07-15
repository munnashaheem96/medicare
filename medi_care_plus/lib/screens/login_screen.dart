import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../services/firebase_service.dart';
import '../../theme/app_theme.dart';
import 'patient/patient_dashboard.dart';
import 'doctor/doctor_dashboard.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _isPasswordVisible = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _showErrorSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: GoogleFonts.outfit(color: Colors.white)),
        backgroundColor: AppTheme.danger,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Future<void> _handlePasswordReset(FirebaseService firebaseService) async {
    final passwordResetController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          left: 24,
          right: 24,
          top: 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              "Set New Password",
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "Since this is your first login, please set a new secure password.",
              style: GoogleFonts.outfit(
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: passwordResetController,
              obscureText: true,
              decoration: const InputDecoration(
                hintText: "Enter new password (min. 6 characters)",
                prefixIcon: Icon(Icons.lock_outline, color: AppTheme.textSecondary),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () async {
                if (passwordResetController.text.trim().length < 6) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Password must be at least 6 characters.")),
                    );
                  }
                  return;
                }
                Navigator.pop(context);
                if (mounted) setState(() => _isLoading = true);
                try {
                  await firebaseService.updatePasswordAndResetFlag(passwordResetController.text.trim());
                  if (mounted) {
                    _routeBasedOnRole(firebaseService.currentUserProfile!);
                  }
                } catch (e) {
                  _showErrorSnackBar("Failed to update password: $e");
                } finally {
                  if (mounted) {
                    setState(() => _isLoading = false);
                  }
                }
              },
              child: const Text("Save Password"),
            ),
          ],
        ),
      ),
    );
  }

  void _routeBasedOnRole(dynamic profile) {
    if (profile.role == 'doctor') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const DoctorDashboard()),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const PatientDashboard()),
      );
    }
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final firebaseService = Provider.of<FirebaseService>(context, listen: false);
    try {
      final profile = await firebaseService.signIn(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );

      if (!mounted) return;

      if (profile.role == 'patient' && profile.needsPasswordReset) {
        setState(() => _isLoading = false);
        await _handlePasswordReset(firebaseService);
      } else {
        _routeBasedOnRole(profile);
      }
    } catch (e) {
      _showErrorSnackBar("Authentication failed. Please check your credentials.");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Stack(
        children: [
          // Decorative background circles
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryLight.withValues(alpha: 0.6),
              ),
            ),
          ),
          Positioned(
            bottom: -150,
            left: -150,
            child: Container(
              width: 350,
              height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryLight.withValues(alpha: 0.3),
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Brand Logo
                    Center(
                      child: Hero(
                        tag: 'app_logo',
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.primaryLight.withValues(alpha: 0.6),
                          ),
                          child: const Icon(
                            Icons.health_and_safety_rounded,
                            size: 64,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      "MediCare+",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Medicine Tracker & Support System",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 40),

                    // Login Form Container
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: AppTheme.premiumShadow,
                        border: Border.all(color: AppTheme.borderLight, width: 1),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(28.0),
                        child: _buildPasswordForm(),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Credentials hint card
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryLight.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.primaryLight, width: 1),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.info_outline_rounded, size: 14, color: AppTheme.primary),
                              const SizedBox(width: 6),
                              Text(
                                "Login credentials",
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            "Patient: p001@medicare.app · abc123456",
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                          Text(
                            "Admin: admin@meditrack.com · abc123456",
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            "Sign In",
            style: GoogleFonts.outfit(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            "Access your dashboard and treatment plans",
            style: GoogleFonts.outfit(fontSize: 13, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 24),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              hintText: "Email address",
              prefixIcon: Icon(Icons.alternate_email_rounded, color: AppTheme.textSecondary),
            ),
            validator: (val) => val == null || !val.contains('@') ? "Enter a valid email" : null,
          ),
          const SizedBox(height: 18),
          TextFormField(
            controller: _passwordController,
            obscureText: !_isPasswordVisible,
            decoration: InputDecoration(
              hintText: "Password",
              prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppTheme.textSecondary),
              suffixIcon: IconButton(
                icon: Icon(
                  _isPasswordVisible ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                  color: AppTheme.textSecondary,
                ),
                onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
              ),
            ),
            validator: (val) => val == null || val.length < 4 ? "Password too short" : null,
          ),
          const SizedBox(height: 28),
          Container(
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: BorderRadius.circular(14),
              boxShadow: AppTheme.glowShadow,
            ),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: _isLoading ? null : _login,
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Text(
                      "Sign In",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
