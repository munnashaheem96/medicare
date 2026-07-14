import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, setDoc, runTransaction, serverTimestamp, FieldValue } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './auth';

export interface Medicine {
  id: string;
  patientId: string;
  patientName: string;
  medicineName: string;
  timings: string[];
  mealInstruction: string;
  startDate: string;
  endDate: string;
  notes?: string;
  status: string; // 'Active' or 'Inactive'
  quantity: number; // remaining doses quantity
}

export interface Compliance {
  id: string;
  patientId: string;
  medicineId: string;
  date: string; // 'YYYY-MM-DD'
  timing: string; // 'morning', 'night', etc.
  status: 'taken' | 'skipped' | 'missed';
  loggedAt: string;
  reason?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
}

interface DataContextType {
  medicines: Medicine[];
  compliance: Compliance[];
  loadingMeds: boolean;
  loadingComp: boolean;
  logMedicineDose: (medicineId: string, timing: string, status: 'taken' | 'skipped', reason?: string) => Promise<void>;
  updateEmergencyContact: (contactName: string, contactPhone: string) => Promise<void>;
  sendMessage: (doctorName: string, text: string) => Promise<void>;
  useChatMessages: (doctorName: string) => ChatMessage[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user, refreshProfile } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [compliance, setCompliance] = useState<Compliance[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [loadingComp, setLoadingComp] = useState(true);

  const patientId = profile?.patientId || 'P001';

  // Stream active medicines for patient
  useEffect(() => {
    if (!profile || profile.role !== 'patient') {
      setMedicines([]);
      setLoadingMeds(false);
      return;
    }

    setLoadingMeds(true);
    const q = query(
      collection(db, 'medicines'),
      where('patientId', '==', patientId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meds: Medicine[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'Active') {
          meds.push({
            id: doc.id,
            patientId: data.patientId,
            patientName: data.patientName || '',
            medicineName: data.medicineName || '',
            timings: data.timings || [],
            mealInstruction: data.mealInstruction || '',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            notes: data.notes,
            status: data.status,
            quantity: typeof data.quantity === 'number' ? data.quantity : 30,
          });
        }
      });
      setMedicines(meds);
      setLoadingMeds(false);
    }, (error) => {
      console.error("Error streaming medicines:", error);
      setLoadingMeds(false);
    });

    return unsubscribe;
  }, [profile, patientId]);

  // Stream compliance logs for patient
  useEffect(() => {
    if (!profile || profile.role !== 'patient') {
      setCompliance([]);
      setLoadingComp(false);
      return;
    }

    setLoadingComp(true);
    const q = query(
      collection(db, 'compliance'),
      where('patientId', '==', patientId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: Compliance[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          patientId: data.patientId,
          medicineId: data.medicineId,
          date: data.date,
          timing: data.timing,
          status: data.status,
          loggedAt: data.loggedAt,
          reason: data.reason,
        });
      });
      setCompliance(logs);
      setLoadingComp(false);
    }, (error) => {
      console.error("Error streaming compliance logs:", error);
      setLoadingComp(false);
    });

    return unsubscribe;
  }, [profile, patientId]);

  // Log dose compliance and update inventory
  const logMedicineDose = async (medicineId: string, timing: string, status: 'taken' | 'skipped', reason?: string) => {
    if (!profile) return;
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Add compliance log document
    const compRef = doc(collection(db, 'compliance'));
    const logData = {
      id: compRef.id,
      patientId,
      medicineId,
      date: todayStr,
      timing,
      status,
      loggedAt: new Date().toISOString(),
      reason: reason || "",
      createdAt: serverTimestamp()
    };

    await setDoc(compRef, logData);

    // 2. If status is 'taken', decrement remaining quantity in transaction
    if (status === 'taken') {
      const medRef = doc(db, 'medicines', medicineId);
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(medRef);
        if (!sfDoc.exists()) return;
        const currentQty = sfDoc.data().quantity ?? 30;
        if (currentQty > 0) {
          transaction.update(medRef, { quantity: currentQty - 1 });
        }
      });
    }
  };

  // Edit user profile details (emergency contacts)
  const updateEmergencyContact = async (contactName: string, contactPhone: string) => {
    if (!profile || !user) return;

    if (profile.patientId) {
      try {
        await updateDoc(doc(db, 'patients', profile.patientId), {
          emergencyContactName: contactName,
          emergencyContactPhone: contactPhone,
        });
      } catch (e) {
        console.log("Failed to update emergency contact in patients collection:", e);
      }
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        emergencyContactName: contactName,
        emergencyContactPhone: contactPhone,
      });
    } catch (e) {
      console.log("Failed to update emergency contact in users collection:", e);
    }

    await refreshProfile();
  };

  // Helper to generate Chat Channel ID
  const getChannelId = (doctorName: string) => {
    const cleanDocName = doctorName.replace(/[^a-zA-Z0-9]/g, '');
    return `${patientId}_${cleanDocName}`;
  };

  // Send a chat message to the doctor
  const sendMessage = async (doctorName: string, text: string) => {
    if (!profile || !user) return;
    const channelId = getChannelId(doctorName);
    const messagesRef = collection(db, 'chats', channelId, 'messages');
    
    await addDoc(messagesRef, {
      senderId: user.uid,
      senderName: profile.name,
      text,
      timestamp: serverTimestamp(),
    });
  };

  // Hook/Function to use chat messages in a component
  const useChatMessages = (doctorName: string) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const channelId = getChannelId(doctorName);

    useEffect(() => {
      const q = query(
        collection(db, 'chats', channelId, 'messages'),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          msgs.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.text,
            timestamp: data.timestamp,
          });
        });
        setMessages(msgs);
      });

      return unsubscribe;
    }, [channelId]);

    return messages;
  };

  return (
    <DataContext.Provider value={{
      medicines,
      compliance,
      loadingMeds,
      loadingComp,
      logMedicineDose,
      updateEmergencyContact,
      sendMessage,
      useChatMessages
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
