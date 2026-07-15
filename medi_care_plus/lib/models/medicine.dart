class Medicine {
  final String id;
  final String patientId;
  final String patientName;
  final String medicineName;
  final List<String> timings; // ['morning', 'afternoon', 'evening', 'night']
  final String mealInstruction; // 'before' / 'after'
  final String startDate; // YYYY-MM-DD
  final String endDate; // YYYY-MM-DD
  final String notes;
  final String status; // 'Active' / 'Inactive'
  final int quantity; // Remaining tablets/doses

  Medicine({
    required this.id,
    required this.patientId,
    required this.patientName,
    required this.medicineName,
    required this.timings,
    required this.mealInstruction,
    required this.startDate,
    required this.endDate,
    this.notes = '',
    this.status = 'Active',
    this.quantity = 30, // Default 30 doses
  });

  factory Medicine.fromMap(Map<String, dynamic> map, String id) {
    return Medicine(
      id: id,
      patientId: map['patientId'] ?? '',
      patientName: map['patientName'] ?? '',
      medicineName: map['medicineName'] ?? '',
      timings: List<String>.from(map['timings'] ?? []),
      mealInstruction: map['mealInstruction'] ?? 'after',
      startDate: map['startDate'] ?? '',
      endDate: map['endDate'] ?? '',
      notes: map['notes'] ?? '',
      status: map['status'] ?? 'Active',
      quantity: map['quantity'] is num ? (map['quantity'] as num).toInt() : 30,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'patientId': patientId,
      'patientName': patientName,
      'medicineName': medicineName,
      'timings': timings,
      'mealInstruction': mealInstruction,
      'startDate': startDate,
      'endDate': endDate,
      'notes': notes,
      'status': status,
      'quantity': quantity,
    };
  }
}
