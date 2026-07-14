import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc, query } from "firebase/firestore";

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

async function run() {
  try {
    console.log("Signing in as admin...");
    await signInWithEmailAndPassword(auth, "admin@meditrack.com", "abc123456");
    console.log("Sign in successful!");

    console.log("Fetching users collection...");
    const usersSnap = await getDocs(collection(db, "users"));
    console.log(`Found ${usersSnap.docs.length} users.`);

    for (const userDoc of usersSnap.docs) {
      const uData = userDoc.data();
      const patientId = uData.patientId;
      const uid = uData.uid || userDoc.id;
      
      if (patientId) {
        console.log(`Syncing Patient ${patientId} with Auth UID ${uid}...`);
        const patientRef = doc(db, "patients", patientId);
        await updateDoc(patientRef, {
          authUid: uid
        });
        console.log(`Successfully updated patients/${patientId} with authUid.`);
      } else {
        console.log(`User ${userDoc.id} has no patientId field.`);
      }
    }

    console.log("Verification of patients collection:");
    const patientsSnap = await getDocs(collection(db, "patients"));
    patientsSnap.docs.forEach(d => {
      console.log(`Doc: ${d.id} | Name: ${d.data().name} | Email: ${d.data().email} | authUid: ${d.data().authUid}`);
    });

  } catch (error) {
    console.error("Error occurred:", error);
  }
}

run();
