// seed_patients_auth.mjs — Seeds patients after signing in as admin
// Run with: node seed_patients_auth.mjs
import { initializeApp, getApp } from 'firebase/app';
import {
  getFirestore, doc, setDoc, collection, addDoc, serverTimestamp, getDocs, query
} from 'firebase/firestore';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBta-_P0xQTg69z8-WPWhtMIu36BHE64SE",
  authDomain: "medicareplus-83689.firebaseapp.com",
  projectId: "medicareplus-83689",
  storageBucket: "medicareplus-83689.firebasestorage.app",
  messagingSenderId: "153049839603",
  appId: "1:153049839603:web:62274e24b189fd4d75c486"
};

const app = initializeApp(firebaseConfig, 'SeedMain');
const db = getFirestore(app);
const auth = getAuth(app);

// ─── Patient Seed Data ────────────────────────────────────────────────────────
const PATIENTS = [
  { name: 'Ravi Kumar',      mobile: '9876543210', age: 58, gender: 'Male',   bloodGroup: 'A+',  condition: 'Hypertension',    doctor: 'Dr. Mehta (Cardiologist)',       notes: 'Monitor BP daily. Avoid salt-rich food.' },
  { name: 'Sunita Sharma',   mobile: '9845120012', age: 45, gender: 'Female', bloodGroup: 'B+',  condition: 'Diabetes Type 2', doctor: 'Dr. Rao (Endocrinologist)',      notes: 'Low sugar diet. Test fasting glucose weekly.' },
  { name: 'Mohammed Aslam',  mobile: '9731004422', age: 63, gender: 'Male',   bloodGroup: 'O+',  condition: 'Cardiac Care',    doctor: 'Dr. Mehta (Cardiologist)',       notes: 'Post-bypass. No heavy physical activity.' },
  { name: 'Priya Nair',      mobile: '9988776655', age: 34, gender: 'Female', bloodGroup: 'AB+', condition: 'Thyroid',         doctor: 'Dr. Singh (Endocrinologist)',    notes: 'Take thyroid medicine 30 mins before breakfast.' },
  { name: 'Arjun Pillai',    mobile: '9654321098', age: 28, gender: 'Male',   bloodGroup: 'A-',  condition: 'Asthma',          doctor: 'Dr. Khanna (Pulmonologist)',     notes: 'Carry inhaler. Avoid dust and smoke.' },
  { name: 'Lakshmi Devi',    mobile: '9123456789', age: 67, gender: 'Female', bloodGroup: 'B-',  condition: 'Arthritis',       doctor: 'Dr. Malhotra (Rheumatologist)', notes: 'Low-impact exercise. Take medicine with food.' },
  { name: 'Sanjay Patel',    mobile: '9871234560', age: 52, gender: 'Male',   bloodGroup: 'O-',  condition: 'Hypertension',    doctor: 'Dr. Kapoor (Internal Medicine)', notes: 'Avoid stress. Walk 30 minutes daily.' },
  { name: 'Fatima Banu',     mobile: '9456789012', age: 41, gender: 'Female', bloodGroup: 'AB-', condition: 'Diabetes Type 2', doctor: 'Dr. Sharma (Diabetologist)',     notes: 'Insulin injection at night. Sugar-free diet.' },
];

// ─── Medicines per condition ──────────────────────────────────────────────────
const MEDS_BY_CONDITION = {
  'Hypertension':    [
    { medicineName: 'Amlodipine 5mg',           timings: ['morning'],           mealInstruction: 'after',  notes: 'For BP control', quantity: 30 },
    { medicineName: 'Telmisartan 40mg',          timings: ['evening'],           mealInstruction: 'before', notes: 'Blood pressure med', quantity: 30 },
  ],
  'Diabetes Type 2': [
    { medicineName: 'Metformin 500mg',           timings: ['morning', 'evening'], mealInstruction: 'after', notes: 'With meals only', quantity: 60 },
    { medicineName: 'Glipizide 5mg',             timings: ['morning'],           mealInstruction: 'before', notes: '30 mins before breakfast', quantity: 30 },
  ],
  'Cardiac Care':    [
    { medicineName: 'Aspirin 75mg',              timings: ['morning'],           mealInstruction: 'after',  notes: 'After food strictly', quantity: 30 },
    { medicineName: 'Atorvastatin 20mg',         timings: ['night'],             mealInstruction: 'after',  notes: 'Cholesterol control', quantity: 30 },
    { medicineName: 'Clopidogrel 75mg',          timings: ['morning'],           mealInstruction: 'after',  notes: 'Blood thinner', quantity: 30 },
  ],
  'Thyroid':         [
    { medicineName: 'Levothyroxine 50mcg',       timings: ['morning'],           mealInstruction: 'before', notes: '30 mins before breakfast', quantity: 30 },
  ],
  'Asthma':          [
    { medicineName: 'Salbutamol Inhaler',        timings: ['morning', 'night'],  mealInstruction: 'after',  notes: '2 puffs twice daily', quantity: 1 },
    { medicineName: 'Montelukast 10mg',          timings: ['night'],             mealInstruction: 'after',  notes: 'Allergy prevention', quantity: 30 },
  ],
  'Arthritis':       [
    { medicineName: 'Diclofenac 50mg',           timings: ['morning', 'afternoon', 'evening'], mealInstruction: 'after', notes: 'With food only', quantity: 90 },
    { medicineName: 'Calcium + Vit D3',          timings: ['night'],             mealInstruction: 'after',  notes: 'Bone strength supplement', quantity: 30 },
  ],
};

async function getNextPatientId() {
  const snap = await getDocs(query(collection(db, 'patients')));
  let maxNum = 30;
  snap.docs.forEach(d => {
    const id = d.id;
    if (id.startsWith('P')) {
      const num = parseInt(id.substring(1), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  return maxNum + 1;
}

async function createPatientAuthUser(email, password, patientId, data) {
  let secondaryApp;
  try { secondaryApp = getApp('SecondaryApp'); }
  catch { secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp'); }
  const secondaryAuth = getAuth(secondaryApp);
  const secondaryDb = getFirestore(secondaryApp);

  let uid, finalEmail = email;
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    uid = cred.user.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      finalEmail = `${patientId.toLowerCase()}-${Date.now()}@medicare.app`;
      const cred = await createUserWithEmailAndPassword(secondaryAuth, finalEmail, password);
      uid = cred.user.uid;
    } else throw err;
  }

  try {
    await setDoc(doc(secondaryDb, 'users', uid), {
      uid, patientId, name: data.name, email: finalEmail,
      needsPasswordReset: true, age: data.age, gender: data.gender,
      bloodGroup: data.bloodGroup, condition: data.condition,
      doctor: data.doctor, notes: data.notes,
      createdAt: new Date().toISOString(),
    });
  } catch (e) { console.warn('  users doc skipped:', e.message); }

  try { await signOut(secondaryAuth); } catch {}
  return { uid, email: finalEmail };
}

async function seed() {
  // 1. Sign in as admin
  console.log('🔐 Signing in as admin...');
  await signInWithEmailAndPassword(auth, 'admin@meditrack.com', 'abc123456');
  console.log('✅ Signed in!\n');

  const today = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let nextNum = await getNextPatientId();

  for (const p of PATIENTS) {
    const patientId = `P${String(nextNum).padStart(3, '0')}`;
    nextNum++;
    const baseEmail = `${patientId.toLowerCase()}@medicare.app`;
    console.log(`📋 ${patientId} — ${p.name} (${baseEmail})`);

    let authResult = null;
    try {
      authResult = await createPatientAuthUser(baseEmail, 'abc123456', patientId, p);
    } catch (e) {
      console.warn(`  Auth creation failed: ${e.message}`);
    }

    // Write patient doc
    await setDoc(doc(db, 'patients', patientId), {
      id: patientId,
      name: p.name, mobile: p.mobile, age: p.age,
      gender: p.gender, bloodGroup: p.bloodGroup,
      condition: p.condition, doctor: p.doctor, notes: p.notes,
      email: authResult ? authResult.email : baseEmail,
      status: 'Active', needsPasswordReset: true,
      joinDate: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }),
      createdAt: new Date().toISOString(),
      ...(authResult ? { authUid: authResult.uid } : {}),
    });
    console.log(`  ✅ Patient saved`);

    // Write medicines
    const meds = MEDS_BY_CONDITION[p.condition] || [];
    for (const med of meds) {
      await addDoc(collection(db, 'medicines'), {
        ...med, patientId, patientName: p.name,
        status: 'Active', startDate: today, endDate: future,
        createdAt: serverTimestamp(),
      });
      console.log(`  💊 ${med.medicineName}`);
    }
    console.log('');
  }

  console.log('🎉 Done! Seeded', PATIENTS.length, 'patients with medicines.');
  console.log('Password for all: abc123456');
  await signOut(auth);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
