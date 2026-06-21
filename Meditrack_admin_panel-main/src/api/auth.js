// src/api/auth.js — Firebase Auth integration
import {
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Login with email + password using Firebase Auth.
 * Returns a { token, admin } shape compatible with the existing AppContext.
 */
export const login = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const token = await cred.user.getIdToken();

  // Load or create admin profile in Firestore under 'admins/{uid}'
  const ref = doc(db, 'admins', cred.user.uid);
  let snap = await getDoc(ref);
  if (!snap.exists()) {
    // First login — seed the admin doc
    const admin = {
      uid: cred.user.uid,
      email: cred.user.email,
      name: cred.user.displayName || email.split('@')[0],
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, admin);
    return { token, admin };
  }

  return { token, admin: { ...snap.data(), uid: cred.user.uid } };
};

/**
 * Sign out from Firebase Auth.
 */
export const logout = () => signOut(auth);

/**
 * Get current admin profile from Firestore.
 */
export const getMe = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const snap = await getDoc(doc(db, 'admins', user.uid));
  return snap.exists() ? snap.data() : null;
};

/**
 * Update admin profile in Firestore (and email in Auth if changed).
 */
export const updateProfile = async (data) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const ref = doc(db, 'admins', user.uid);
  await updateDoc(ref, { ...data, updatedAt: new Date().toISOString() });

  if (data.email && data.email !== user.email) {
    await updateEmail(user, data.email);
  }

  const snap = await getDoc(ref);
  return snap.data();
};

/**
 * Change password — requires re-authentication with current password.
 */
export const changePassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
};
