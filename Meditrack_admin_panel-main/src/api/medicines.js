// src/api/medicines.js — Firestore CRUD for 'medicines' collection
import {
  collection, doc,
  addDoc, getDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const COL = 'medicines';

/** Subscribe to real-time medicine/schedule updates. Returns unsubscribe fn. */
export const subscribeMedicines = (callback) => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

export const getMedicines = async () => {
  const { getDocs } = await import('firebase/firestore');
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getMedicine = async (id) => {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createMedicine = async (data) => {
  const payload = {
    ...data,
    status: data.status || 'Active',
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL), payload);
  return { id: ref.id, ...payload };
};

export const updateMedicine = async (id, data) => {
  const ref = doc(db, COL, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
};

export const deleteMedicine = async (id) => {
  await deleteDoc(doc(db, COL, id));
};
