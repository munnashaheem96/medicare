// src/context/AppContext.jsx — Firebase Firestore real-time integration
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import * as authApi from '../api/auth';
import * as patientsApi from '../api/patients';
import * as medicinesApi from '../api/medicines';
import * as complianceApi from '../api/compliance';
import * as notificationsApi from '../api/notifications';

const defaultContext = {
  user: null, patients: [], medicines: [], compliance: [],
  complianceStats: { total: 0, taken: 0, skipped: 0, missed: 0, rate: 0 },
  dailyTrend: [], patientCompliance: [], notifications: [], unreadCount: 0,
  activeTab: 'dashboard', toasts: [], loading: {}, error: null,
  setActiveTab: () => {}, setPrefillPatientId: () => {},
  login: async () => ({ success: false }), logout: () => {},
  updateProfile: async () => {}, addToast: () => {}, removeToast: () => {},
  markNotificationRead: () => {}, markAllNotificationsRead: () => {},
  addPatient: async () => {}, updatePatient: async () => {}, deletePatient: async () => {},
  addMedicine: async () => {}, updateMedicine: async () => {}, deleteMedicine: async () => {},
  getComplianceStats: () => ({ total: 0, taken: 0, skipped: 0, missed: 0, rate: 0 }),
  getDailyTrend: () => [], getPatientCompliance: () => [], refreshAll: async () => {},
  setNotifications: () => {}, prefillPatientId: null,
};

const AppContext = createContext(defaultContext);

export function AppProvider({ children }) {
  // ─── Auth state (Firebase Auth listener) ────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Data state ─────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [complianceStats, setComplianceStats] = useState({ total: 0, taken: 0, skipped: 0, missed: 0, rate: 0 });
  const [dailyTrend, setDailyTrend] = useState([]);
  const [patientCompliance, setPatientCompliance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ─── UI state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prefillPatientId, setPrefillPatientId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState({ patients: true, medicines: true, compliance: true });
  const [error, setError] = useState(null);

  // Store unsubscribe fns for real-time listeners
  const unsubscribeRef = useRef([]);

  // ─── Toast helpers ───────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Attach Firebase Auth state observer ────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Load admin profile from Firestore
        try {
          const profile = await authApi.getMe();
          const userObj = profile
            ? { ...profile, uid: firebaseUser.uid, email: firebaseUser.email }
            : { uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.email };
          setUser(userObj);
          localStorage.setItem('medi_user', JSON.stringify(userObj));
        } catch {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.email });
        }
      } else {
        setUser(null);
        localStorage.removeItem('medi_user');
        localStorage.removeItem('medi_token');
        // Clear all data
        setPatients([]);
        setMedicines([]);
        setCompliance([]);
        setNotifications([]);
        setUnreadCount(0);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // ─── Real-time Firestore listeners (attach when user logs in) ────────────────
  useEffect(() => {
    // Tear down any existing listeners
    unsubscribeRef.current.forEach(fn => fn());
    unsubscribeRef.current = [];

    if (!user) return;

    // --- Patients listener ---
    setLoading(prev => ({ ...prev, patients: true }));
    const unsubPatients = patientsApi.subscribePatients((data) => {
      setPatients(data);
      setLoading(prev => ({ ...prev, patients: false }));
    });
    unsubscribeRef.current.push(unsubPatients);

    // --- Medicines listener ---
    setLoading(prev => ({ ...prev, medicines: true }));
    const unsubMedicines = medicinesApi.subscribeMedicines((data) => {
      setMedicines(data);
      setLoading(prev => ({ ...prev, medicines: false }));
    });
    unsubscribeRef.current.push(unsubMedicines);

    // --- Compliance listener ---
    const unsubCompliance = complianceApi.subscribeCompliance((data) => {
      setCompliance(data);
      // Re-compute derived stats every time compliance changes
      setComplianceStats(complianceApi.computeComplianceStats(data, 'weekly'));
      setDailyTrend(complianceApi.computeDailyTrend(data));
      // patientCompliance depends on patients too — recompute via functional update
      setPatients(currentPatients => {
        setPatientCompliance(complianceApi.computePatientCompliance(data, currentPatients));
        return currentPatients;
      });
      setLoading(prev => ({ ...prev, compliance: false }));
    });
    unsubscribeRef.current.push(unsubCompliance);

    // --- Notifications listener ---
    const unsubNotifications = notificationsApi.subscribeNotifications((data) => {
      setNotifications(data);
      setUnreadCount(data.filter(n => n.unread).length);
    });
    unsubscribeRef.current.push(unsubNotifications);

    return () => {
      unsubscribeRef.current.forEach(fn => fn());
      unsubscribeRef.current = [];
    };
  }, [user?.uid]); // Only re-attach when the user UID changes

  // ─── Re-compute patientCompliance whenever patients list updates ─────────────
  useEffect(() => {
    if (compliance.length > 0 && patients.length > 0) {
      setPatientCompliance(complianceApi.computePatientCompliance(compliance, patients));
    }
  }, [patients]); // compliance changes are handled in the compliance listener above

  // ─── Auth ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    try {
      const { token, admin } = await authApi.login(credentials.email, credentials.password);
      localStorage.setItem('medi_token', token);
      localStorage.setItem('medi_user', JSON.stringify(admin));
      setUser(admin);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Login failed. Check your credentials.';
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    unsubscribeRef.current.forEach(fn => fn());
    unsubscribeRef.current = [];
    await authApi.logout();
    localStorage.removeItem('medi_token');
    localStorage.removeItem('medi_user');
    setUser(null);
    setPatients([]);
    setMedicines([]);
    setCompliance([]);
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      const updated = await authApi.updateProfile(data);
      const newUser = { ...user, ...updated };
      setUser(newUser);
      localStorage.setItem('medi_user', JSON.stringify(newUser));
      addToast('Profile updated successfully', 'success');
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Update failed';
      addToast(msg, 'error');
      return { success: false, error: msg };
    }
  }, [addToast, user]);

  // ─── Patient CRUD ────────────────────────────────────────────────────────────
  const addPatient = useCallback(async (patientData) => {
    try {
      const newPatient = await patientsApi.createPatient(patientData);
      // onSnapshot will update state automatically; we just fire a notification
      await notificationsApi.createNotification(
        `New patient ${newPatient.name} added`,
        'info'
      );
      addToast(`Patient ${newPatient.name} added`, 'success');
      return newPatient;
    } catch (err) {
      const msg = err.message || 'Failed to add patient';
      addToast(msg, 'error');
      throw err;
    }
  }, [addToast]);

  const updatePatient = useCallback(async (id, data) => {
    try {
      const updated = await patientsApi.updatePatient(id, data);
      addToast('Patient updated', 'success');
      return updated;
    } catch (err) {
      const msg = err.message || 'Failed to update patient';
      addToast(msg, 'error');
      throw err;
    }
  }, [addToast]);

  const deletePatient = useCallback(async (id) => {
    try {
      await patientsApi.deletePatient(id);
      addToast('Patient deleted', 'info');
    } catch (err) {
      const msg = err.message || 'Failed to delete patient';
      addToast(msg, 'error');
      throw err;
    }
  }, [addToast]);

  // ─── Medicine CRUD ───────────────────────────────────────────────────────────
  const addMedicine = useCallback(async (medData) => {
    try {
      // Always persist patientName so Medicines.jsx can display it without a patient lookup
      const patient = patients.find(p => p.id === medData.patientId);
      const enriched = { ...medData, patientName: patient?.name || medData.patientName || 'Unknown' };
      const newMed = await medicinesApi.createMedicine(enriched);
      await notificationsApi.createNotification(
        `Medicine schedule added for ${newMed.medicineName}`,
        'info'
      );
      addToast(`Schedule added for ${newMed.medicineName}`, 'success');
      return newMed;
    } catch (err) {
      const msg = err.message || 'Failed to add medicine';
      addToast(msg, 'error');
      throw err;
    }
  }, [addToast, patients]);

  const updateMedicine = useCallback(async (id, data) => {
    try {
      // Keep patientName in sync if patientId changed
      const patient = patients.find(p => p.id === data.patientId);
      const enriched = patient ? { ...data, patientName: patient.name } : data;
      const updated = await medicinesApi.updateMedicine(id, enriched);
      addToast('Medicine schedule updated', 'success');
      return updated;
    } catch (err) {
      const msg = err.message || 'Failed to update medicine';
      addToast(msg, 'error');
      throw err;
    }
  }, [addToast, patients]);

  const deleteMedicine = useCallback(async (id) => {
    try {
      await medicinesApi.deleteMedicine(id);
      addToast('Medicine schedule removed', 'info');
    } catch (err) {
      const msg = err.message || 'Failed to delete medicine';
      addToast(msg, 'error');
      throw err;
    }
  }, [addToast]);

  // ─── Notification actions ─────────────────────────────────────────────────
  const markNotificationRead = useCallback(async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      // onSnapshot will update state automatically
    } catch (err) {
      console.error('Failed to mark notification read:', err.message);
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
    } catch (err) {
      console.error('Failed to mark all read:', err.message);
    }
  }, []);

  // ─── Compliance helpers (computed from live data) ─────────────────────────
  const getComplianceStats = useCallback((range = 'weekly') => {
    return complianceApi.computeComplianceStats(compliance, range);
  }, [compliance]);

  const getDailyTrend = useCallback(() => dailyTrend, [dailyTrend]);
  const getPatientCompliance = useCallback(() => patientCompliance, [patientCompliance]);

  // Manual refresh (Firestore listeners are always live; this re-computes stats)
  const refreshAll = useCallback(() => {
    setComplianceStats(complianceApi.computeComplianceStats(compliance, 'weekly'));
    setDailyTrend(complianceApi.computeDailyTrend(compliance));
    setPatientCompliance(complianceApi.computePatientCompliance(compliance, patients));
    addToast('Data refreshed', 'info');
  }, [compliance, patients, addToast]);

  // Show a loading spinner while Firebase Auth resolves
  if (authLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-base, #0f172a)',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, border: '3px solid rgba(59,130,246,0.2)',
          borderTopColor: '#3b82f6', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          Connecting to MediTrack…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      // Data
      patients, medicines, compliance,

      // Auth
      user, login, logout, updateProfile,

      // Navigation
      activeTab, setActiveTab,
      prefillPatientId, setPrefillPatientId,

      // Toasts
      toasts, addToast, removeToast,

      // Notifications
      notifications, unreadCount,
      markNotificationRead, markAllNotificationsRead,
      setNotifications,

      // Patient CRUD
      addPatient, updatePatient, deletePatient,

      // Medicine CRUD
      addMedicine, updateMedicine, deleteMedicine,

      // Compliance data / stats
      complianceStats, dailyTrend, patientCompliance,
      getComplianceStats, getDailyTrend, getPatientCompliance,

      // Loading/error
      loading, error,

      // Manual refresh
      refreshAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  return ctx || defaultContext;
};
