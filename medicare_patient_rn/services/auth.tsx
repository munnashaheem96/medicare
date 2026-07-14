import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword as fbUpdatePassword, User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor';
  patientId?: string;
  mobile?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  condition?: string;
  doctor?: string;
  notes?: string;
  needsPasswordReset?: boolean;
  specialization?: string;
  createdAt: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string, email: string): Promise<UserProfile> => {
    const emailLower = email.toLowerCase().trim();

    // 1. Check if Doctor/Admin email prefix or domain matches meditrack
    if (emailLower === 'admin@meditrack.com' || emailLower.endsWith('@meditrack.com')) {
      return {
        uid,
        email,
        name: 'Dr. Admin (Cardiologist)',
        role: 'doctor',
        specialization: 'Cardiology',
        createdAt: new Date().toISOString(),
      };
    }

    // 2. Fetch from 'users' collection first (since this has direct user permissions)
    try {
      const uDoc = await getDoc(doc(db, 'users', uid));
      if (uDoc.exists()) {
        const uData = uDoc.data();
        return {
          uid,
          email,
          name: uData.name || 'Patient',
          role: 'patient',
          patientId: uData.patientId,
          mobile: uData.mobile,
          age: uData.age ? Number(uData.age) : undefined,
          gender: uData.gender,
          bloodGroup: uData.bloodGroup,
          condition: uData.condition,
          doctor: uData.doctor,
          notes: uData.notes,
          needsPasswordReset: uData.needsPasswordReset ?? true,
          createdAt: uData.createdAt || new Date().toISOString(),
          emergencyContactName: uData.emergencyContactName,
          emergencyContactPhone: uData.emergencyContactPhone,
        };
      }
    } catch (e) {
      console.log('Error reading users collection:', e);
    }

    // 3. Fallback: Parse patientId from email and look up in 'patients' collection
    const prefix = emailLower.split('@')[0];
    const patientIdCandidate = prefix.split('-')[0].toUpperCase();
    if (patientIdCandidate.startsWith('P')) {
      try {
        const pDoc = await getDoc(doc(db, 'patients', patientIdCandidate));
        if (pDoc.exists()) {
          const pData = pDoc.data();
          return {
            uid,
            email,
            name: pData.name || 'Patient',
            role: 'patient',
            patientId: patientIdCandidate,
            mobile: pData.mobile,
            age: pData.age ? Number(pData.age) : undefined,
            gender: pData.gender,
            bloodGroup: pData.bloodGroup,
            condition: pData.condition,
            doctor: pData.doctor,
            notes: pData.notes,
            needsPasswordReset: pData.needsPasswordReset ?? true,
            createdAt: pData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            emergencyContactName: pData.emergencyContactName,
            emergencyContactPhone: pData.emergencyContactPhone,
          };
        }
      } catch (e) {
        console.log('Error reading patients collection:', e);
      }
    }

    // 4. Default fallback profile
    return {
      uid,
      email,
      name: 'Patient User',
      role: 'patient',
      createdAt: new Date().toISOString(),
    };
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.uid, user.email || '');
      setProfile(p);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const p = await fetchProfile(firebaseUser.uid, firebaseUser.email || '');
          setProfile(p);
        } catch (e) {
          console.error('Failed to fetch profile on auth change:', e);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const p = await fetchProfile(cred.user.uid, cred.user.email || '');
    setProfile(p);
    return p;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateUserPassword = async (password: string) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    await fbUpdatePassword(auth.currentUser, password);
    
    // Update needsPasswordReset in Firestore
    if (profile) {
      if (profile.patientId) {
        try {
          await updateDoc(doc(db, 'patients', profile.patientId), {
            needsPasswordReset: false,
          });
        } catch (e) {
          console.log('Failed to update patients collection password reset flag:', e);
        }
      }
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          needsPasswordReset: false,
        });
      } catch (e) {
        console.log('Failed to update users collection password reset flag:', e);
      }
      setProfile(prev => prev ? { ...prev, needsPasswordReset: false } : null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateUserPassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
