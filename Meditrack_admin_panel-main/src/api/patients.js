import {
  collection, doc, setDoc, getDocs,
  getDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp,
  getFirestore,
} from 'firebase/firestore';
import { db } from '../firebase';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const COL = 'patients';

const firebaseConfig = {
  apiKey: "AIzaSyBta-_P0xQTg69z8-WPWhtMIu36BHE64SE",
  authDomain: "medicareplus-83689.firebaseapp.com",
  projectId: "medicareplus-83689",
  storageBucket: "medicareplus-83689.firebasestorage.app",
  messagingSenderId: "153049839603",
  appId: "1:153049839603:web:62274e24b189fd4d75c486"
};

// Helper function to create the secondary Auth user and their user profile in Firestore
const createSecondaryAuthUserAndProfile = async (email, password, patientId, data) => {
  let secondaryApp;
  try {
    secondaryApp = getApp('SecondaryApp');
  } catch (e) {
    secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
  }
  const secondaryAuth = getAuth(secondaryApp);
  
  let targetEmail = email;
  let cred;
  try {
    cred = await createUserWithEmailAndPassword(secondaryAuth, targetEmail, password);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      targetEmail = `${patientId.toLowerCase()}-${Date.now()}@medicare.app`;
      cred = await createUserWithEmailAndPassword(secondaryAuth, targetEmail, password);
    } else {
      throw err;
    }
  }
  
  const uid = cred.user.uid;

  // Write initial profile using secondary db
  const secondaryDb = getFirestore(secondaryApp);
  const userPayload = {
    uid: uid,
    patientId: patientId,
    name: data.name,
    email: targetEmail,
    needsPasswordReset: true,
    age: data.age ? Number(data.age) : '',
    gender: data.gender || 'Male',
    bloodGroup: data.bloodGroup || 'B+',
    condition: data.condition || '',
    doctor: data.doctor || '',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(secondaryDb, 'users', uid), userPayload);
  } catch (e) {
    console.error("Failed to create user profile, but proceeding with patient record", e);
  }

  try {
    await signOut(secondaryAuth);
  } catch (e) {
    console.error("Error signing out secondary auth", e);
  }
  
  return { uid, email: targetEmail };
};

/** Subscribe to real-time patient updates. Returns an unsubscribe function. */
export const subscribePatients = (callback) => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

/** Fetch patients once (no real-time). */
export const getPatients = async () => {
  const { getDocs } = await import('firebase/firestore');
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getPatient = async (id) => {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createPatient = async (data) => {
  // 1. Fetch current patients to find the highest Pxxx ID
  const q = query(collection(db, COL));
  const snap = await getDocs(q);
  
  let maxNum = 30; // default start matching the seeded P030
  snap.docs.forEach((doc) => {
    const id = doc.id;
    if (id.startsWith('P')) {
      const num = parseInt(id.substring(1), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  
  const nextNum = maxNum + 1;
  const patientId = `P${String(nextNum).padStart(3, '0')}`;
  const baseEmail = `${patientId.toLowerCase()}@medicare.app`;
  const defaultPassword = 'abc123456';

  // 2. Create the patient Auth user and write to 'users' collection using secondary app
  const { uid: authUid, email: finalEmail } = await createSecondaryAuthUserAndProfile(baseEmail, defaultPassword, patientId, data);

  // 3. Save the patient details in 'patients' collection using 'Pxxx' as doc ID
  const patientPayload = {
    ...data,
    id: patientId, // keep redundant id field inside document
    authUid,       // Link the Auth UID so patients can access their records
    email: finalEmail,
    status: data.status || 'Active',
    joinDate: new Date().toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: '2-digit',
    }),
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, COL, patientId), patientPayload);

  return { id: patientId, ...patientPayload, defaultPassword };
};

export const updatePatient = async (id, data) => {
  const ref = doc(db, COL, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
};

export const deletePatient = async (id) => {
  await deleteDoc(doc(db, COL, id));
};
