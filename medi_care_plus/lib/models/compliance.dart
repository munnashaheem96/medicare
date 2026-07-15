class Compliance {
  final String id;
  final String patientId;
  final String medicineId;
  final String date; // YYYY-MM-DD
  final String timing; // 'morning', 'afternoon', 'evening', 'night'
  final String status; // 'taken', 'skipped', 'missed'
  final String loggedAt; // ISO String
  final String? reason; // Optional skip reason

  Compliance({
    required this.id,
    required this.patientId,
    required this.medicineId,
    required this.date,
    required this.timing,
    required this.status,
    required this.loggedAt,
    this.reason,
  });

  factory Compliance.fromMap(Map<String, dynamic> map, String id) {
    return Compliance(
      id: id,
      patientId: map['patientId'] ?? '',
      medicineId: map['medicineId'] ?? '',
      date: map['date'] ?? '',
      timing: map['timing'] ?? '',
      status: map['status'] ?? 'missed',
      loggedAt: map['loggedAt'] ?? '',
      reason: map['reason'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'patientId': patientId,
      'medicineId': medicineId,
      'date': date,
      'timing': timing,
      'status': status,
      'loggedAt': loggedAt,
      if (reason != null) 'reason': reason,
    };
  }
}
