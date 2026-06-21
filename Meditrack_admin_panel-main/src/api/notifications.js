// src/api/notifications.js — Firestore CRUD for 'notifications' collection
import {
  collection, doc,
  addDoc, getDoc, updateDoc, deleteDoc,
  query, orderBy, where, onSnapshot, serverTimestamp, getDocs, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

const COL = 'notifications';

/** Subscribe to real-time notifications. Returns unsubscribe fn. */
export const subscribeNotifications = (callback) => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

export const getNotifications = async () => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getUnreadCount = async () => {
  const q = query(collection(db, COL), where('unread', '==', true));
  const snap = await getDocs(q);
  return { count: snap.size };
};

export const markAsRead = async (id) => {
  await updateDoc(doc(db, COL, id), { unread: false });
};

export const markAllRead = async () => {
  const q = query(collection(db, COL), where('unread', '==', true));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { unread: false }));
  await batch.commit();
};

export const deleteNotification = async (id) => {
  await deleteDoc(doc(db, COL, id));
};

/** Helper — create a notification document (used internally). */
export const createNotification = async (message, type = 'info') => {
  return addDoc(collection(db, COL), {
    message,
    type,
    unread: true,
    createdAt: serverTimestamp(),
  });
};
