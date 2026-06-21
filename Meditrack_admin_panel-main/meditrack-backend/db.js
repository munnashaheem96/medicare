const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// ─── Seed Initial Data ────────────────────────────────────────────────────────
const generateCompliance = (patients, medicines) => {
  const records = [];
  const today = new Date();

  patients.forEach(patient => {
    const patMeds = medicines.filter(m => m.patientId === patient.id);
    for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];

      patMeds.forEach(med => {
        med.timings.forEach(timing => {
          const rand = Math.random();
          records.push({
            id: uuidv4(),
            patientId: patient.id,
            medicineId: med.id,
            date: dateStr,
            timing,
            status: rand > 0.25 ? 'taken' : rand > 0.1 ? 'skipped' : 'missed',
            loggedAt: new Date(date).toISOString(),
          });
        });
      });
    }
  });
  return records;
};

const initDb = () => {
  const hasData = db.has('patients').value() && db.get('patients').value().length > 0;
  if (hasData) return;

  console.log('🌱 Seeding initial database...');

  const patients = [
    { id: 'P001', name: 'Aarav Sharma', mobile: '9876543210', age: 45, gender: 'Male', bloodGroup: 'B+', condition: 'Hypertension', doctor: 'Dr. Mehta (Cardiologist)', joinDate: new Date().toISOString().split('T')[0], status: 'Active', notes: '', fcmToken: '' },
    { id: 'P002', name: 'Priya Nair', mobile: '9123456780', age: 33, gender: 'Female', bloodGroup: 'O+', condition: 'Diabetes Type 2', doctor: 'Dr. Rao (Endocrinologist)', joinDate: new Date().toISOString().split('T')[0], status: 'Active', notes: '', fcmToken: '' },
    { id: 'P003', name: 'Rohan Verma', mobile: '9988776655', age: 58, gender: 'Male', bloodGroup: 'A-', condition: 'Cardiac Care', doctor: 'Dr. Mehta (Cardiologist)', joinDate: new Date().toISOString().split('T')[0], status: 'Active', notes: '', fcmToken: '' },
    { id: 'P004', name: 'Sunita Patel', mobile: '9011223344', age: 27, gender: 'Female', bloodGroup: 'AB+', condition: 'Thyroid', doctor: 'Dr. Singh (Endocrinologist)', joinDate: new Date().toISOString().split('T')[0], status: 'Inactive', notes: '', fcmToken: '' },
  ];

  const medicines = [
    { id: 'M001', patientId: 'P001', patientName: 'Aarav Sharma', medicineName: 'Amlodipine 5mg', timings: ['morning', 'night'], mealInstruction: 'after', startDate: '2026-01-10', endDate: '2026-07-10', notes: 'Take with water', status: 'Active', createdAt: new Date().toISOString() },
    { id: 'M002', patientId: 'P001', patientName: 'Aarav Sharma', medicineName: 'Losartan 50mg', timings: ['morning'], mealInstruction: 'before', startDate: '2026-01-10', endDate: '2026-07-10', notes: '', status: 'Active', createdAt: new Date().toISOString() },
    { id: 'M003', patientId: 'P002', patientName: 'Priya Nair', medicineName: 'Metformin 500mg', timings: ['morning', 'evening', 'night'], mealInstruction: 'after', startDate: '2026-02-05', endDate: '2026-08-05', notes: 'Avoid on empty stomach', status: 'Active', createdAt: new Date().toISOString() },
    { id: 'M004', patientId: 'P003', patientName: 'Rohan Verma', medicineName: 'Aspirin 75mg', timings: ['morning'], mealInstruction: 'after', startDate: '2026-01-22', endDate: '2026-07-22', notes: '', status: 'Active', createdAt: new Date().toISOString() },
    { id: 'M005', patientId: 'P004', patientName: 'Sunita Patel', medicineName: 'Levothyroxine 50mcg', timings: ['morning'], mealInstruction: 'before', startDate: '2026-03-14', endDate: '2026-09-14', notes: 'Take 30 min before breakfast', status: 'Active', createdAt: new Date().toISOString() },
  ];

  const compliance = generateCompliance(patients, medicines);
  const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);

  db.defaults({
    patients,
    medicines,
    compliance,
    admins: [
      {
        id: uuidv4(),
        name: 'Dr. Admin',
        email: process.env.ADMIN_EMAIL || 'admin@meditrack.com',
        passwordHash,
        role: 'Administrator',
        hospital: 'General Hospital',
        phone: '',
        specialization: 'General Medicine',
        createdAt: new Date().toISOString(),
      }
    ],
    notifications: [
      { id: uuidv4(), type: 'info', message: 'Welcome to MediTrack Admin Panel!', time: new Date().toISOString(), unread: true, patientId: null },
    ],
  }).write();

  console.log('✅ Database seeded with', patients.length, 'patients,', medicines.length, 'medicines,', compliance.length, 'compliance records.');
};

module.exports = { db, initDb, generateCompliance };
