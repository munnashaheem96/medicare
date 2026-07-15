import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../models/user_profile.dart';
import '../models/medicine.dart';
import '../models/compliance.dart';
import '../models/chat_message.dart';

class FirebaseService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  UserProfile? _currentUserProfile;
  UserProfile? get currentUserProfile => _currentUserProfile;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Sign In
  Future<UserProfile> signIn(String email, String password) async {
    final cred = await _auth.signInWithEmailAndPassword(email: email, password: password);
    final user = cred.user;
    if (user == null) throw Exception("User is null");
    
    // Fetch profile
    final profile = await fetchUserProfile(user.uid, email);
    _currentUserProfile = profile;
    return profile;
  }

  // Sign Out
  Future<void> signOut() async {
    await _auth.signOut();
    _currentUserProfile = null;
  }

  // Fetch User Profile
  Future<UserProfile> fetchUserProfile(String uid, String email) async {
    final emailLower = email.toLowerCase();

    // 1. PRIMARY: Look up patient by Firebase Auth UID stored as 'authUid' field.
    //    The admin panel writes authUid into patients/{Pxxx} when creating patients.
    //    This works even for timestamped emails like p032-1784053439900@medicare.app.
    try {
      final authUidQuery = await _db
          .collection('patients')
          .where('authUid', isEqualTo: uid)
          .limit(1)
          .get();

      if (authUidQuery.docs.isNotEmpty) {
        final pDoc = authUidQuery.docs.first;
        final pData = pDoc.data();
        final pId = pDoc.id;
        return UserProfile(
          uid: uid,
          email: email,
          name: pData['name'] ?? 'Patient',
          role: 'patient',
          patientId: pId,
          mobile: pData['mobile'],
          age: pData['age'] is num ? (pData['age'] as num).toInt() : null,
          gender: pData['gender'],
          bloodGroup: pData['bloodGroup'],
          condition: pData['condition'],
          doctor: pData['doctor'],
          notes: pData['notes'],
          needsPasswordReset: pData['needsPasswordReset'] ?? true,
          createdAt: DateTime.now().toIso8601String(),
        );
      }
    } catch (e) {
      debugPrint("authUid lookup failed, trying fallbacks: $e");
    }

    // 2. SECONDARY: Check admins collection — doctor/admin accounts store their profile here.
    try {
      final adminDoc = await _db.collection('admins').doc(uid).get();
      if (adminDoc.exists && adminDoc.data() != null) {
        final aData = adminDoc.data()!;
        return UserProfile(
          uid: uid,
          email: email,
          name: aData['name'] ?? 'Admin',
          role: 'doctor',
          specialization: aData['specialization'],
          createdAt: DateTime.now().toIso8601String(),
        );
      }
    } catch (e) {
      debugPrint("Admins collection lookup failed: $e");
    }

    // 3. TERTIARY: Look up patient by document ID derived from email prefix.
    //    e.g. "p001@medicare.app" → docId "P001"
    //    Also handles timestamped emails: "p032-1784053439900@medicare.app" → "P032"
    final prefix = emailLower.split('@')[0];
    final patientIdCandidate = prefix.split('-')[0].toUpperCase();
    if (patientIdCandidate.startsWith('P')) {
      try {
        final doc = await _db.collection('patients').doc(patientIdCandidate).get();
        if (doc.exists && doc.data() != null) {
          final pData = doc.data()!;
          return UserProfile(
            uid: uid,
            email: email,
            name: pData['name'] ?? 'Patient',
            role: 'patient',
            patientId: patientIdCandidate,
            mobile: pData['mobile'],
            age: pData['age'] is num ? (pData['age'] as num).toInt() : null,
            gender: pData['gender'],
            bloodGroup: pData['bloodGroup'],
            condition: pData['condition'],
            doctor: pData['doctor'],
            notes: pData['notes'],
            needsPasswordReset: pData['needsPasswordReset'] ?? true,
            createdAt: DateTime.now().toIso8601String(),
          );
        }
      } catch (e) {
        debugPrint("Error reading patients collection by docId: $e");
      }
    }

    // 4. QUATERNARY: Query patients by email field (handles edge cases).
    try {
      final patientQuery = await _db
          .collection('patients')
          .where('email', isEqualTo: emailLower)
          .limit(1)
          .get();

      if (patientQuery.docs.isNotEmpty) {
        final pData = patientQuery.docs.first.data();
        final pId = patientQuery.docs.first.id;
        return UserProfile(
          uid: uid,
          email: email,
          name: pData['name'] ?? 'Patient',
          role: 'patient',
          patientId: pId,
          mobile: pData['mobile'],
          age: pData['age'] is num ? (pData['age'] as num).toInt() : null,
          gender: pData['gender'],
          bloodGroup: pData['bloodGroup'],
          condition: pData['condition'],
          doctor: pData['doctor'],
          notes: pData['notes'],
          needsPasswordReset: pData['needsPasswordReset'] ?? true,
          createdAt: DateTime.now().toIso8601String(),
        );
      }
    } catch (e) {
      debugPrint("Error querying patients collection by email: $e");
    }

    // 5. FALLBACK: If email ends with @meditrack.com but has no Firestore profile yet,
    //    treat as a doctor (e.g. newly registered admin without a Firestore record).
    if (emailLower.endsWith('@meditrack.com')) {
      return UserProfile(
        uid: uid,
        email: email,
        name: email.split('@')[0],
        role: 'doctor',
        createdAt: DateTime.now().toIso8601String(),
      );
    }

    // 6. LAST RESORT: Default to patient
    return UserProfile(
      uid: uid,
      email: email,
      name: 'Patient User',
      role: 'patient',
      createdAt: DateTime.now().toIso8601String(),
    );
  }

  // Reset Password (if required on first login)
  Future<void> updatePasswordAndResetFlag(String newPassword) async {
    final user = _auth.currentUser;
    if (user != null) {
      await user.updatePassword(newPassword);
      if (_currentUserProfile != null) {
        if (_currentUserProfile!.role == 'patient' && _currentUserProfile!.patientId != null) {
          // Update in patients collection
          await _db.collection('patients').doc(_currentUserProfile!.patientId!).update({
            'needsPasswordReset': false,
          });
        } else {
          // Update in admins collection
          await _db.collection('admins').doc(user.uid).update({
            'needsPasswordReset': false,
          });
        }
        _currentUserProfile = UserProfile(
          uid: _currentUserProfile!.uid,
          email: _currentUserProfile!.email,
          name: _currentUserProfile!.name,
          role: _currentUserProfile!.role,
          patientId: _currentUserProfile!.patientId,
          mobile: _currentUserProfile!.mobile,
          age: _currentUserProfile!.age,
          gender: _currentUserProfile!.gender,
          bloodGroup: _currentUserProfile!.bloodGroup,
          condition: _currentUserProfile!.condition,
          doctor: _currentUserProfile!.doctor,
          notes: _currentUserProfile!.notes,
          needsPasswordReset: false,
          specialization: _currentUserProfile!.specialization,
          createdAt: _currentUserProfile!.createdAt,
        );
      }
    }
  }

  // --- Patient Firestore Queries ---

  // Stream of medicines for a patient
  // Note: We filter only by patientId to avoid requiring a composite Firestore index.
  // Status filtering is done client-side so that any admin-created medicine is visible.
  Stream<List<Medicine>> streamMedicines(String patientId) {
    return _db.collection('medicines')
        .where('patientId', isEqualTo: patientId)
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => Medicine.fromMap(d.data(), d.id))
            .where((m) => m.status == 'Active')
            .toList());
  }

  // Stream of compliance logs for a patient
  Stream<List<Compliance>> streamCompliance(String patientId) {
    return _db.collection('compliance')
        .where('patientId', isEqualTo: patientId)
        .snapshots()
        .map((snap) => snap.docs.map((d) => Compliance.fromMap(d.data(), d.id)).toList());
  }

  // Log dose compliance
  Future<void> logMedicineDose({
    required String patientId,
    required String medicineId,
    required String timing,
    required String status, // 'taken', 'skipped'
    String? reason,
  }) async {
    final todayStr = DateTime.now().toIso8601String().split('T')[0];
    
    // 1. Log in compliance collection
    final complianceRef = _db.collection('compliance').doc();
    final log = Compliance(
      id: complianceRef.id,
      patientId: patientId,
      medicineId: medicineId,
      date: todayStr,
      timing: timing,
      status: status,
      loggedAt: DateTime.now().toIso8601String(),
      reason: reason,
    );
    await complianceRef.set(log.toMap()..addAll({
      'createdAt': FieldValue.serverTimestamp(),
    }));

    // 2. If status is 'taken', decrement the medicine remaining quantity
    if (status == 'taken') {
      final medRef = _db.collection('medicines').doc(medicineId);
      await _db.runTransaction((transaction) async {
        final snapshot = await transaction.get(medRef);
        if (snapshot.exists) {
          final data = snapshot.data();
          if (data != null) {
            int currentQty = data['quantity'] is num ? (data['quantity'] as num).toInt() : 30;
            if (currentQty > 0) {
              transaction.update(medRef, {'quantity': currentQty - 1});
            }
          }
        }
      });
    }
  }

  // --- Doctor Firestore Queries ---

  // Get patients assigned to a doctor
  Stream<List<UserProfile>> streamPatientsForDoctor(String doctorName) {
    // Note: the React app stores the assigned doctor field as: "Dr. Mehta (Cardiologist)"
    // We match the prefix or substring. But to be clean, we'll fetch all patients and filter locally
    // or query directly if exact match is used.
    return _db.collection('patients')
        .snapshots()
        .map((snap) {
          return snap.docs
              .map((d) => UserProfile.fromMap(d.data()..addAll({'patientId': d.id}), d.id))
              .where((p) => p.doctor != null && p.doctor!.toLowerCase().contains(doctorName.toLowerCase()))
              .toList();
        });
  }

  // Stream all compliance logs to compute doctor reports
  Stream<List<Compliance>> streamComplianceForAll() {
    return _db.collection('compliance')
        .snapshots()
        .map((snap) => snap.docs.map((d) => Compliance.fromMap(d.data(), d.id)).toList());
  }

  // Stream medicines for a patient (used by Doctor to see/modify patient prescriptions)
  Stream<List<Medicine>> streamMedicinesForPatient(String patientId) {
    return _db.collection('medicines')
        .where('patientId', isEqualTo: patientId)
        .snapshots()
        .map((snap) => snap.docs.map((d) => Medicine.fromMap(d.data(), d.id)).toList());
  }

  // Prescribe a new medicine
  Future<void> prescribeMedicine(Medicine medicine) async {
    final docRef = _db.collection('medicines').doc();
    await docRef.set(medicine.toMap()..addAll({
      'createdAt': FieldValue.serverTimestamp(),
    }));
  }

  // Update a prescription
  Future<void> updateMedicine(String medicineId, Map<String, dynamic> data) async {
    await _db.collection('medicines').doc(medicineId).update(data..addAll({
      'updatedAt': FieldValue.serverTimestamp(),
    }));
  }

  // Delete a prescription
  Future<void> deleteMedicine(String medicineId) async {
    await _db.collection('medicines').doc(medicineId).delete();
  }

  // --- Chat Functions ---

  // Get chat channel ID
  String _getChannelId(String patientId, String doctorName) {
    // Standardize channel names (replace spaces and brackets to make it a safe firestore path)
    final cleanDocName = doctorName.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
    return '${patientId}_$cleanDocName';
  }

  // Stream chat messages
  Stream<List<ChatMessage>> streamChatMessages(String patientId, String doctorName) {
    final channelId = _getChannelId(patientId, doctorName);
    return _db.collection('chats')
        .doc(channelId)
        .collection('messages')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map((d) => ChatMessage.fromMap(d.data(), d.id)).toList());
  }

  // Send a message
  Future<void> sendMessage(String patientId, String doctorName, String senderId, String senderName, String text) async {
    final channelId = _getChannelId(patientId, doctorName);
    final msg = ChatMessage(
      id: '',
      senderId: senderId,
      senderName: senderName,
      text: text,
      timestamp: DateTime.now(),
    );
    await _db.collection('chats')
        .doc(channelId)
        .collection('messages')
        .add(msg.toMap());
  }

  // Edit user profile details (such as Emergency Contact / phone number)
  Future<void> updateEmergencyContact(String patientId, String contactName, String contactPhone) async {
    // Update in patients collection
    await _db.collection('patients').doc(patientId).update({
      'emergencyContactName': contactName,
      'emergencyContactPhone': contactPhone,
    });
  }

  // Stream of a patient's document from the database
  Stream<DocumentSnapshot<Map<String, dynamic>>> streamPatientProfile(String patientId) {
    return _db.collection('patients').doc(patientId).snapshots();
  }

  // Fetch a single medicine by its Firestore document ID
  // Used to hydrate the overlay when the app is launched via a notification tap payload
  Future<Medicine?> getMedicine(String medicineId) async {
    try {
      final doc = await _db.collection('medicines').doc(medicineId).get();
      if (doc.exists && doc.data() != null) {
        return Medicine.fromMap(doc.data()!, doc.id);
      }
    } catch (e) {
      // Silently return null — caller can show a generic fallback overlay
    }
    return null;
  }
}
