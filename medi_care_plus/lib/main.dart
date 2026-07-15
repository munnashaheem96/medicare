import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'services/firebase_service.dart';
import 'services/notification_service.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/patient/patient_dashboard.dart';
import 'screens/doctor/doctor_dashboard.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Conditionally configure Firebase based on platform
  try {
    await Firebase.initializeApp(
      options: (kIsWeb || defaultTargetPlatform == TargetPlatform.windows)
          ? const FirebaseOptions(
              apiKey: "AIzaSyBta-_P0xQTg69z8-WPWhtMIu36BHE64SE",
              authDomain: "medicareplus-83689.firebaseapp.com",
              projectId: "medicareplus-83689",
              storageBucket: "medicareplus-83689.firebasestorage.app",
              messagingSenderId: "153049839603",
              appId: "1:153049839603:web:62274e24b189fd4d75c486",
            )
          : const FirebaseOptions(
              apiKey: "AIzaSyCpXExhN5sVj4nonh0W1E_5yQ68uaPdHFY",
              appId: "1:153049839603:android:e891164054711d2175c486",
              messagingSenderId: "153049839603",
              projectId: "medicareplus-83689",
              storageBucket: "medicareplus-83689.firebasestorage.app",
            ),
    );
  } catch (e) {
    debugPrint("Firebase initialization error: $e");
  }

  runApp(
    MultiProvider(
      providers: [
        Provider<FirebaseService>(create: (_) => FirebaseService()),
        Provider<NotificationService>(create: (_) => NotificationService()),
      ],
      child: const MedicareApp(),
    ),
  );
}

class MedicareApp extends StatelessWidget {
  const MedicareApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MediCare+',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  // Cache the profile future so it is NOT recreated on every rebuild.
  // Key = user UID so that logging in as a different user triggers a fresh fetch.
  String? _cachedUid;
  late Future<dynamic> _profileFuture;

  void _fetchProfileIfNeeded(String uid, String email, FirebaseService svc) {
    if (_cachedUid != uid) {
      _cachedUid = uid;
      _profileFuture = svc.fetchUserProfile(uid, email);
    }
  }

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context, listen: false);

    return StreamBuilder(
      stream: firebaseService.authStateChanges,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final user = snapshot.data;
        if (user == null) {
          _cachedUid = null; // reset cache on sign-out
          return const LoginScreen();
        }

        // Only call Firestore once per UID
        _fetchProfileIfNeeded(user.uid, user.email ?? '', firebaseService);

        return FutureBuilder(
          future: _profileFuture,
          builder: (context, profileSnapshot) {
            if (profileSnapshot.connectionState == ConnectionState.waiting) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }
            if (profileSnapshot.hasError || profileSnapshot.data == null) {
              // Sign out and return to login if profile loading fails
              return FutureBuilder(
                future: firebaseService.signOut(),
                builder: (context, _) => const LoginScreen(),
              );
            }

            final profile = profileSnapshot.data!;
            if (profile.role == 'doctor') {
              return const DoctorDashboard();
            } else {
              return const PatientDashboard();
            }
          },
        );
      },
    );
  }
}

