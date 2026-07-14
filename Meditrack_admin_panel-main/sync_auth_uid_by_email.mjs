import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

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
    console.log(`Found ${usersSnap.docs.length} user documents.`);

    // Build map of email -> uid
    const emailToUid = new Map();
    usersSnap.docs.forEach(uDoc => {
      const uData = uDoc.data();
      const email = uData.email ? uData.email.toLowerCase().trim() : "";
      const uid = uData.uid || uDoc.id;
      if (email) {
        emailToUid.set(email, uid);
      }
    });

    console.log("Fetching patients collection...");
    const patientsSnap = await getDocs(collection(db, "patients"));
    console.log(`Found ${patientsSnap.docs.length} patient documents.`);

    for (const pDoc of patientsSnap.docs) {
      const pData = pDoc.data();
      const pEmail = pData.email ? pData.email.toLowerCase().trim() : "";
      const patientId = pDoc.id;

      if (pEmail) {
        const matchingUid = emailToUid.get(pEmail);
        if (matchingUid) {
          console.log(`Matching email found: ${pEmail} -> UID: ${matchingUid}. Updating patients/${patientId}...`);
          await updateDoc(doc(db, "patients", patientId), {
            authUid: matchingUid
          });
          console.log(`Updated patients/${patientId} successfully.`);
        } else {
          console.warn(`No user document found for email: ${pEmail}`);
        }
      } else {
        console.warn(`Patient doc ${patientId} has no email.`);
      }
    }

    console.log("Final verification of patients collection:");
    const finalSnap = await getDocs(collection(db, "patients"));
    finalSnap.docs.forEach(d => {
      console.log(`Doc: ${d.id} | Name: ${d.data().name} | Email: ${d.data().email} | authUid: ${d.data().authUid}`);
    });

  } catch (error) {
    console.error("Error occurred:", error);
  }
}

run();
