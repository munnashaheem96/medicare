// src/data/mockData.js

export const initialPatients = [
  {
    id: 'P001',
    name: 'Aarav Sharma',
    mobile: '9876543210',
    age: 45,
    gender: 'Male',
    bloodGroup: 'B+',
    condition: 'Hypertension',
    doctor: 'Dr. Mehta',
    joinDate: '2026-01-10',
    status: 'Active',
  },
  {
    id: 'P002',
    name: 'Priya Nair',
    mobile: '9123456780',
    age: 33,
    gender: 'Female',
    bloodGroup: 'O+',
    condition: 'Diabetes Type 2',
    doctor: 'Dr. Rao',
    joinDate: '2026-02-05',
    status: 'Active',
  },
  {
    id: 'P003',
    name: 'Rohan Verma',
    mobile: '9988776655',
    age: 58,
    gender: 'Male',
    bloodGroup: 'A-',
    condition: 'Cardiac Care',
    doctor: 'Dr. Mehta',
    joinDate: '2026-01-22',
    status: 'Active',
  },
  {
    id: 'P004',
    name: 'Sunita Patel',
    mobile: '9011223344',
    age: 27,
    gender: 'Female',
    bloodGroup: 'AB+',
    condition: 'Thyroid',
    doctor: 'Dr. Singh',
    joinDate: '2026-03-14',
    status: 'Inactive',
  },
];

export const initialMedicines = [
  {
    id: 'M001',
    patientId: 'P001',
    patientName: 'Aarav Sharma',
    medicineName: 'Amlodipine 5mg',
    timings: ['morning', 'night'],
    mealInstruction: 'after',
    startDate: '2026-01-10',
    endDate: '2026-04-10',
    notes: 'Take with water',
    status: 'Active',
  },
  {
    id: 'M002',
    patientId: 'P001',
    patientName: 'Aarav Sharma',
    medicineName: 'Losartan 50mg',
    timings: ['morning'],
    mealInstruction: 'before',
    startDate: '2026-01-10',
    endDate: '2026-07-10',
    notes: '',
    status: 'Active',
  },
  {
    id: 'M003',
    patientId: 'P002',
    patientName: 'Priya Nair',
    medicineName: 'Metformin 500mg',
    timings: ['morning', 'evening', 'night'],
    mealInstruction: 'after',
    startDate: '2026-02-05',
    endDate: '2026-08-05',
    notes: 'Avoid on empty stomach',
    status: 'Active',
  },
  {
    id: 'M004',
    patientId: 'P003',
    patientName: 'Rohan Verma',
    medicineName: 'Aspirin 75mg',
    timings: ['morning'],
    mealInstruction: 'after',
    startDate: '2026-01-22',
    endDate: '2026-07-22',
    notes: '',
    status: 'Active',
  },
  {
    id: 'M005',
    patientId: 'P004',
    patientName: 'Sunita Patel',
    medicineName: 'Levothyroxine 50mcg',
    timings: ['morning'],
    mealInstruction: 'before',
    startDate: '2026-03-14',
    endDate: '2026-09-14',
    notes: 'Take 30 min before breakfast',
    status: 'Active',
  },
];

// Generate compliance records for last 30 days
const generateCompliance = () => {
  const records = [];
  const patients = ['P001', 'P002', 'P003', 'P004'];
  const medicines = ['M001', 'M002', 'M003', 'M004', 'M005'];
  const timings = ['morning', 'evening', 'night'];

  for (let d = 0; d < 30; d++) {
    const date = new Date('2026-04-13');
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];

    patients.forEach(pid => {
      const patientMeds = medicines.filter(m => {
        if (pid === 'P001') return ['M001', 'M002'].includes(m);
        if (pid === 'P002') return ['M003'].includes(m);
        if (pid === 'P003') return ['M004'].includes(m);
        if (pid === 'P004') return ['M005'].includes(m);
        return false;
      });

      patientMeds.forEach(mid => {
        const medTimings = mid === 'M001' ? ['morning', 'night']
          : mid === 'M003' ? ['morning', 'evening', 'night']
          : ['morning'];

        medTimings.forEach(t => {
          const rand = Math.random();
          records.push({
            id: `R${d}${pid}${mid}${t}`,
            patientId: pid,
            medicineId: mid,
            date: dateStr,
            timing: t,
            status: rand > 0.25 ? 'taken' : (rand > 0.1 ? 'skipped' : 'missed'),
          });
        });
      });
    });
  }
  return records;
};

export const initialCompliance = generateCompliance();
