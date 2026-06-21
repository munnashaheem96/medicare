// src/api/compliance.js — Firestore CRUD + real-time for 'compliance' collection
import {
  collection, doc,
  addDoc, getDoc, updateDoc, deleteDoc,
  query, orderBy, where, onSnapshot, serverTimestamp, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

const COL = 'compliance';

/** Subscribe to all compliance records in real-time. */
export const subscribeCompliance = (callback) => {
  const q = query(collection(db, COL), orderBy('date', 'desc'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

/** Get all compliance records once. */
export const getCompliance = async (params = {}) => {
  let q = query(collection(db, COL), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Compute compliance stats from the live records array (pure function).
 * Called inside AppContext after onSnapshot updates.
 */
export const computeComplianceStats = (records, range = 'weekly') => {
  const today = new Date();
  const days = range === 'daily' ? 1 : range === 'weekly' ? 7 : 30;
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - days + 1);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const filtered = records.filter((r) => r.date >= cutoffStr);
  const total = filtered.length;
  const taken = filtered.filter((r) => r.status === 'taken').length;
  const skipped = filtered.filter((r) => r.status === 'skipped').length;
  const missed = filtered.filter((r) => r.status === 'missed').length;
  const rate = total ? Math.round((taken / total) * 100) : 0;
  return { total, taken, skipped, missed, rate };
};

/**
 * Compute 7-day trend from the live records array.
 */
export const computeDailyTrend = (records) => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const recs = records.filter((r) => r.date === dateStr);
    const total = recs.length;
    const taken = recs.filter((r) => r.status === 'taken').length;
    const skipped = recs.filter((r) => r.status === 'skipped').length;
    const rate = total ? Math.round((taken / total) * 100) : 0;
    return { day, taken, skipped, rate };
  });
};

/**
 * Compute per-patient 30-day compliance from the live records array.
 */
export const computePatientCompliance = (records, patients) => {
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - 29);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return patients.map((p) => {
    const recs = records.filter((r) => r.patientId === p.id && r.date >= cutoffStr);
    const total = recs.length;
    const taken = recs.filter((r) => r.status === 'taken').length;
    const rate = total ? Math.round((taken / total) * 100) : 0;
    return { id: p.id, name: p.name, condition: p.condition || '', rate };
  }).sort((a, b) => b.rate - a.rate);
};

/** Log a single dose compliance record to Firestore. */
export const logDose = async (data) => {
  const payload = {
    ...data,
    date: data.date || new Date().toISOString().split('T')[0],
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL), payload);
  return { id: ref.id, ...payload };
};

// These keep compatibility with the old API shape used in AppContext
export const getComplianceStats = async () => ({});
export const getComplianceTrend = async () => [];
export const getPatientComplianceStats = async () => [];
