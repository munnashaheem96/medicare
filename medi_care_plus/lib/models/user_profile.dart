class UserProfile {
  final String uid;
  final String email;
  final String name;
  final String role; // 'patient' or 'doctor'
  final String? patientId; // if patient
  final String? mobile;
  final int? age;
  final String? gender;
  final String? bloodGroup;
  final String? condition;
  final String? doctor; // assigned doctor name
  final String? notes;
  final bool needsPasswordReset;
  final String? specialization; // if doctor
  final String createdAt;

  UserProfile({
    required this.uid,
    required this.email,
    required this.name,
    required this.role,
    this.patientId,
    this.mobile,
    this.age,
    this.gender,
    this.bloodGroup,
    this.condition,
    this.doctor,
    this.notes,
    this.needsPasswordReset = false,
    this.specialization,
    required this.createdAt,
  });

  factory UserProfile.fromMap(Map<String, dynamic> map, String uid) {
    // Resolve role: if 'role' field is 'doctor', it's a doctor. If 'patientId' is populated, it's a patient.
    // Default to patient if not specified.
    final role = map['role'] ?? (map['patientId'] != null ? 'patient' : 'patient');
    return UserProfile(
      uid: uid,
      email: map['email'] ?? '',
      name: map['name'] ?? '',
      role: role,
      patientId: map['patientId'],
      mobile: map['mobile'],
      age: map['age'] is num ? (map['age'] as num).toInt() : null,
      gender: map['gender'],
      bloodGroup: map['bloodGroup'],
      condition: map['condition'],
      doctor: map['doctor'],
      notes: map['notes'],
      needsPasswordReset: map['needsPasswordReset'] ?? false,
      specialization: map['specialization'],
      createdAt: map['createdAt'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'email': email,
      'name': name,
      'role': role,
      if (patientId != null) 'patientId': patientId,
      if (mobile != null) 'mobile': mobile,
      if (age != null) 'age': age,
      if (gender != null) 'gender': gender,
      if (bloodGroup != null) 'bloodGroup': bloodGroup,
      if (condition != null) 'condition': condition,
      if (doctor != null) 'doctor': doctor,
      if (notes != null) 'notes': notes,
      'needsPasswordReset': needsPasswordReset,
      if (specialization != null) 'specialization': specialization,
      'createdAt': createdAt,
    };
  }
}
