import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBta-_P0xQTg69z8-WPWhtMIu36BHE64SE",
  authDomain: "medicareplus-83689.firebaseapp.com",
  projectId: "medicareplus-83689",
  storageBucket: "medicareplus-83689.firebasestorage.app",
  messagingSenderId: "153049839603",
  appId: "1:153049839603:web:62274e24b189fd4d75c486"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function registerOrLogin(email, password, role, patientId) {
  try {
    console.log(`Registering ${email}...`);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`Registered successfully! UID: ${cred.user.uid}`);
    
    // Create firestore document
    if (role === 'admin') {
      await setDoc(doc(db, 'admins', cred.user.uid), {
        uid: cred.user.uid,
        email,
        name: 'MediTrack Admin',
        role: 'admin',
        createdAt: serverTimestamp(),
      });
      console.log(`Created admin document in Firestore`);
    } else if (role === 'patient') {
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        patientId: patientId,
        name: 'Aarav Sharma',
        email: email,
        needsPasswordReset: false,
        age: 45,
        gender: 'Male',
        bloodGroup: 'B+',
        condition: 'Hypertension',
        doctor: 'Dr. Mehta (Cardiologist)',
        createdAt: new Date().toISOString(),
      });
      console.log(`Created patient user document in Firestore`);
      
      // Also ensure patients collection has P001 doc
      await setDoc(doc(db, 'patients', patientId), {
        id: patientId,
        authUid: cred.user.uid,
        email: email,
        name: 'Aarav Sharma',
        mobile: '9876543210',
        age: 45,
        gender: 'Male',
        bloodGroup: 'B+',
        condition: 'Hypertension',
        doctor: 'Dr. Mehta (Cardiologist)',
        status: 'Active',
        needsPasswordReset: false,
        createdAt: serverTimestamp(),
      });
      console.log(`Created patient document in patients collection`);
    }
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`${email} already exists in Auth. Trying to sign in...`);
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        console.log(`Signed in successfully! UID: ${cred.user.uid}`);
      } catch (loginErr) {
        console.error(`Sign in failed for ${email}:`, loginErr.message);
      }
    } else {
      console.error(`Failed to register ${email}:`, err.message);
    }
  }
}

async function run() {
  await registerOrLogin("admin@meditrack.com", "abc123456", "admin", null);
  await registerOrLogin("p001@medicare.app", "abc123456", "patient", "P001");
}

run();
