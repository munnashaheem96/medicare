import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";

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

async function checkPatients() {
  try {
    console.log("Fetching patients from Firestore...");
    const q = query(collection(db, "patients"));
    const snap = await getDocs(q);
    console.log(`Total patients found: ${snap.docs.length}`);
    snap.docs.forEach(doc => {
      const data = doc.data();
      console.log(`Doc ID: ${doc.id} | Patient ID: ${data.id} | Name: ${data.name} | Email: ${data.email}`);
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
  }
}

checkPatients();
