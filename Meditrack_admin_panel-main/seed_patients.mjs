// seed_patients.mjs — Run with: node seed_patients.mjs
// Seeds 10 realistic patients + their medicines into Firestore
// Usage: node seed_patients.mjs
import { initializeApp, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBta-_P0xQTg69z8-WPWhtMIu36BHE64SE",
  authDomain: "medicareplus-83689.firebaseapp.com",
  projectId: "medicareplus-83689",
  storageBucket: "medicareplus-83689.firebasestorage.app",
  messagingSenderId: "153049839603",
  appId: "1:153049839603:web:62274e24b189fd4d75c486"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ─── Patient Seed Data ────────────────────────────────────────────────────────
const PATIENTS = [
  {
    id: 'P033', name: 'Ravi Kumar', mobile: '9876543210',
    age: 58, gender: 'Male', bloodGroup: 'A+',
    condition: 'Hypertension', doctor: 'Dr. Mehta (Cardiologist)',
    notes: 'Monitor BP daily. Avoid salt-rich food.',
    email: 'p033@medicare.app',
  },
  {
    id: 'P034', name: 'Sunita Sharma', mobile: '9845120012',
    age: 45, gender: 'Female', bloodGroup: 'B+',
    condition: 'Diabetes Type 2', doctor: 'Dr. Rao (Endocrinologist)',
    notes: 'Low sugar diet. Test fasting glucose weekly.',
    email: 'p034@medicare.app',
  },
  {
    id: 'P035', name: 'Mohammed Aslam', mobile: '9731004422',
    age: 63, gender: 'Male', bloodGroup: 'O+',
    condition: 'Cardiac Care', doctor: 'Dr. Mehta (Cardiologist)',
    notes: 'Post-bypass. Strictly no heavy physical activity.',
    email: 'p035@medicare.app',
  },
  {
    id: 'P036', name: 'Priya Nair', mobile: '9988776655',
    age: 34, gender: 'Female', bloodGroup: 'AB+',
    condition: 'Thyroid', doctor: 'Dr. Singh (Endocrinologist)',
    notes: 'Take thyroid medicine 30 mins before breakfast.',
    email: 'p036@medicare.app',
  },
  {
    id: 'P037', name: 'Arjun Pillai', mobile: '9654321098',
    age: 28, gender: 'Male', bloodGroup: 'A-',
    condition: 'Asthma', doctor: 'Dr. Khanna (Pulmonologist)',
    notes: 'Carry inhaler at all times. Avoid dust and smoke.',
    email: 'p037@medicare.app',
  },
  {
    id: 'P038', name: 'Lakshmi Devi', mobile: '9123456789',
    age: 67, gender: 'Female', bloodGroup: 'B-',
    condition: 'Arthritis', doctor: 'Dr. Malhotra (Rheumatologist)',
    notes: 'Low-impact exercise. Take medicine with food.',
    email: 'p038@medicare.app',
  },
  {
    id: 'P039', name: 'Sanjay Patel', mobile: '9871234560',
    age: 52, gender: 'Male', bloodGroup: 'O-',
    condition: 'Hypertension', doctor: 'Dr. Kapoor (Internal Medicine)',
    notes: 'Avoid stress. Walk 30 minutes daily.',
    email: 'p039@medicare.app',
  },
  {
    id: 'P040', name: 'Fatima Banu', mobile: '9456789012',
    age: 41, gender: 'Female', bloodGroup: 'AB-',
    condition: 'Diabetes Type 2', doctor: 'Dr. Sharma (Diabetologist)',
    notes: 'Insulin injection at night. Sugar-free diet.',
    email: 'p040@medicare.app',
  },
  {
    id: 'P041', name: 'Deepak Verma', mobile: '9012345678',
    age: 55, gender: 'Male', bloodGroup: 'B+',
    condition: 'Cardiac Care', doctor: 'Dr. Verma (Cardiac Surgeon)',
    notes: 'Post-stent. No aspirin without consultation.',
    email: 'p041@medicare.app',
  },
  {
    id: 'P042', name: 'Ananya Krishnan', mobile: '9321654870',
    age: 39, gender: 'Female', bloodGroup: 'A+',
    condition: 'Thyroid', doctor: 'Dr. Nair (Thyroidologist)',
    notes: 'Levothyroxine daily. Annual TSH test required.',
    email: 'p042@medicare.app',
  },
];

// ─── Medicine Seed Data per Patient ──────────────────────────────────────────
const MEDICINES_MAP = {
  'P033': [
    { medicineName: 'Amlodipine 5mg', timings: ['morning'], mealInstruction: 'after', notes: 'For BP control', quantity: 30 },
    { medicineName: 'Telmisartan 40mg', timings: ['evening'], mealInstruction: 'before', notes: 'Blood pressure med', quantity: 30 },
  ],
  'P034': [
    { medicineName: 'Metformin 500mg', timings: ['morning', 'evening'], mealInstruction: 'after', notes: 'With meals only', quantity: 60 },
    { medicineName: 'Glipizide 5mg', timings: ['morning'], mealInstruction: 'before', notes: '30 mins before breakfast', quantity: 30 },
  ],
  'P035': [
    { medicineName: 'Aspirin 75mg', timings: ['morning'], mealInstruction: 'after', notes: 'After food strictly', quantity: 30 },
    { medicineName: 'Atorvastatin 20mg', timings: ['night'], mealInstruction: 'after', notes: 'Cholesterol control', quantity: 30 },
    { medicineName: 'Clopidogrel 75mg', timings: ['morning'], mealInstruction: 'after', notes: 'Blood thinner', quantity: 30 },
  ],
  'P036': [
    { medicineName: 'Levothyroxine 50mcg', timings: ['morning'], mealInstruction: 'before', notes: '30 mins before breakfast', quantity: 30 },
  ],
  'P037': [
    { medicineName: 'Salbutamol Inhaler', timings: ['morning', 'night'], mealInstruction: 'after', notes: '2 puffs twice daily', quantity: 1 },
    { medicineName: 'Montelukast 10mg', timings: ['night'], mealInstruction: 'after', notes: 'Allergy prevention', quantity: 30 },
  ],
  'P038': [
    { medicineName: 'Diclofenac 50mg', timings: ['morning', 'afternoon', 'evening'], mealInstruction: 'after', notes: 'With food only. Do not take on empty stomach.', quantity: 90 },
    { medicineName: 'Calcium + Vit D3', timings: ['night'], mealInstruction: 'after', notes: 'Bone strength supplement', quantity: 30 },
  ],
  'P039': [
    { medicineName: 'Losartan 50mg', timings: ['morning'], mealInstruction: 'after', notes: 'For blood pressure', quantity: 30 },
    { medicineName: 'Hydrochlorothiazide 12.5mg', timings: ['morning'], mealInstruction: 'after', notes: 'Diuretic for BP', quantity: 30 },
  ],
  'P040': [
    { medicineName: 'Metformin 1000mg', timings: ['morning', 'night'], mealInstruction: 'after', notes: 'After meals', quantity: 60 },
    { medicineName: 'Insulin Glargine 10U', timings: ['night'], mealInstruction: 'after', notes: 'Inject subcutaneously at bedtime', quantity: 1 },
  ],
  'P041': [
    { medicineName: 'Ramipril 5mg', timings: ['morning'], mealInstruction: 'after', notes: 'Heart failure management', quantity: 30 },
    { medicineName: 'Carvedilol 6.25mg', timings: ['morning', 'evening'], mealInstruction: 'after', notes: 'With food to reduce dizziness', quantity: 60 },
    { medicineName: 'Furosemide 40mg', timings: ['morning'], mealInstruction: 'after', notes: 'Take in morning only', quantity: 30 },
  ],
  'P042': [
    { medicineName: 'Levothyroxine 75mcg', timings: ['morning'], mealInstruction: 'before', notes: '30-60 minutes before breakfast', quantity: 30 },
  ],
};

// ─── Helper: Create Auth User ─────────────────────────────────────────────────
async function createAuthUser(email, password, patientId, data) {
  let secondaryApp;
  try {
    secondaryApp = getApp('SeedApp');
  } catch {
    secondaryApp = initializeApp(firebaseConfig, 'SeedApp');
  }
  const secondaryAuth = getAuth(secondaryApp);
  const secondaryDb = getFirestore(secondaryApp);

  let uid;
  let finalEmail = email;
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    uid = cred.user.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`  ⚠️  ${email} already exists in Auth, skipping auth creation`);
      // Try to sign in to get UID — we can't easily do this without the password
      // So we'll just skip and use a placeholder — the patient doc will still be created
      try { await signOut(secondaryAuth); } catch {}
      return null; // caller handles null
    }
    throw err;
  }

  // Write to users collection
  try {
    await setDoc(doc(secondaryDb, 'users', uid), {
      uid, patientId,
      name: data.name, email: finalEmail,
      needsPasswordReset: true,
      age: data.age, gender: data.gender,
      bloodGroup: data.bloodGroup,
      condition: data.condition, doctor: data.doctor,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('  Could not write users doc:', e.message);
  }

  try { await signOut(secondaryAuth); } catch {}
  return { uid, email: finalEmail };
}

// ─── Main Seed Function ───────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting patient seeding...\n');
  const today = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  for (const patient of PATIENTS) {
    console.log(`📋 Seeding ${patient.id} — ${patient.name}...`);

    // 1. Create Firebase Auth user
    const authResult = await createAuthUser(patient.email, 'abc123456', patient.id, patient);

    // 2. Write patient document
    const patientPayload = {
      id: patient.id,
      name: patient.name,
      mobile: patient.mobile,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      condition: patient.condition,
      doctor: patient.doctor,
      notes: patient.notes,
      email: patient.email,
      status: 'Active',
      needsPasswordReset: true,
      joinDate: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }),
      createdAt: new Date().toISOString(),
      ...(authResult ? { authUid: authResult.uid } : {}),
    };

    await setDoc(doc(db, 'patients', patient.id), patientPayload);
    console.log(`  ✅ Patient doc written`);

    // 3. Write medicine prescriptions
    const meds = MEDICINES_MAP[patient.id] || [];
    for (const med of meds) {
      await addDoc(collection(db, 'medicines'), {
        ...med,
        patientId: patient.id,
        patientName: patient.name,
        status: 'Active',
        startDate: today,
        endDate: future,
        createdAt: serverTimestamp(),
      });
      console.log(`  💊 Medicine added: ${med.medicineName}`);
    }

    console.log('');
  }

  console.log('✅ Seeding complete! 10 patients added with medicines.\n');
  console.log('Default password for all: abc123456');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
