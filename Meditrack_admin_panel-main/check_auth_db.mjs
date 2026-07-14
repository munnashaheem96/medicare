import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, query } from "firebase/firestore";

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
    console.log("Attempting sign in as admin...");
    const userCred = await signInWithEmailAndPassword(auth, "admin@meditrack.com", "abc123456");
    console.log("Sign in successful! Admin UID:", userCred.user.uid);

    console.log("Fetching patients...");
    const q = query(collection(db, "patients"));
    const snap = await getDocs(q);
    console.log(`Total patients found: ${snap.docs.length}`);
    snap.docs.forEach(doc => {
      const data = doc.data();
      console.log(`Doc ID: ${doc.id} | Name: ${data.name} | Email: ${data.email} | authUid: ${data.authUid}`);
    });
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

run();
