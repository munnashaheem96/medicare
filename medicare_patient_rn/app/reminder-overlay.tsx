import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform, ScrollView, Animated, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useData } from '../services/data';
import { Bell, CheckCircle, XCircle, Clock, Info } from 'lucide-react-native';

const SKIP_REASONS = [
  "I was outside / travelling",
  "Feeling better / symptoms gone",
  "Felt nauseous / side effects",
  "Forgot / woke up late",
  "Stock finished / need refill",
  "Other (Write below)"
];

export default function ReminderOverlayScreen() {
  const { id, timing } = useLocalSearchParams();
  const { medicines, logMedicineDose } = useData();
  const router = useRouter();

  // Pulse animation state
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showSkipForm, setShowSkipForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState(SKIP_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  // Find medicine
  const medId = Array.isArray(id) ? id[0] : id;
  const doseTiming = (Array.isArray(timing) ? timing[0] : timing) || 'morning';

  const medicine = medicines.find((m) => m.id === medId);

  // Pulse animation loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const medName = medicine?.medicineName || 'Paracetamol 500mg (Demo)';
  const medMeal = medicine?.mealInstruction || 'after';
  const medNotes = medicine?.notes || 'Take 1 tablet with water.';

  const handleMarkAsTaken = async () => {
    setIsSaving(true);
    try {
      if (medId && medId !== 'M_TEST') {
        await logMedicineDose(medId, doseTiming, 'taken');
      }
      Alert.alert('Success', 'Dose recorded as TAKEN! Adherence logged.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to log dose: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSkip = async () => {
    const finalReason = selectedReason === 'Other (Write below)'
      ? customReason.trim()
      : selectedReason;

    if (selectedReason === 'Other (Write below)' && !finalReason) {
      Alert.alert('Error', 'Please enter a custom reason.');
      return;
    }

    setIsSaving(true);
    try {
      if (medId && medId !== 'M_TEST') {
        await logMedicineDose(medId, doseTiming, 'skipped', finalReason);
      }
      Alert.alert('Skipped', 'Dose logged as SKIPPED.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to log dose: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Pulse interpolation
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0.2],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Alarm Circle animation */}
      <View style={styles.alarmSection}>
        <View style={styles.pulseContainer}>
          <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
          <View style={styles.innerAlarmCircle}>
            <Bell color="#0EA5E9" size={48} />
          </View>
        </View>
        <Text style={styles.alarmTitle}>MEDICINE TIME ALARM</Text>
        <Text style={styles.alarmSubtitle}>It's time to take your dose!</Text>
      </View>

      {/* Medicine Info */}
      <View style={styles.medCard}>
        <Text style={styles.medNameText}>{medName}</Text>
        <View style={styles.detailsList}>
          <View style={styles.detailRow}>
            <Clock color="#64748B" size={16} style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>Timing: {doseTiming.toUpperCase()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Info color="#64748B" size={16} style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>Instruction: Take {medMeal} food</Text>
          </View>
        </View>

        {medNotes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Doctor Instructions:</Text>
            <Text style={styles.notesText}>{medNotes}</Text>
          </View>
        ) : null}
      </View>

      {/* Action buttons */}
      {isSaving ? (
        <ActivityIndicator size="large" color="#0EA5E9" style={{ marginVertical: 32 }} />
      ) : !showSkipForm ? (
        <View style={styles.actionsContainer}>
          <Pressable style={styles.takenBtn} onPress={handleMarkAsTaken}>
            <CheckCircle color="#FFFFFF" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.takenBtnText}>I HAVE TAKEN IT</Text>
          </Pressable>

          <Pressable style={styles.skipBtn} onPress={() => setShowSkipForm(true)}>
            <XCircle color="#EF4444" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.skipBtnText}>SKIP THIS DOSE</Text>
          </Pressable>
        </View>
      ) : (
        /* Skip reasons form */
        <View style={styles.skipForm}>
          <Text style={styles.skipFormTitle}>Why are you skipping?</Text>
          {SKIP_REASONS.map((reason) => (
            <Pressable
              key={reason}
              style={styles.radioOption}
              onPress={() => setSelectedReason(reason)}
            >
              <View style={styles.radioOutline}>
                {selectedReason === reason && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>{reason}</Text>
            </Pressable>
          ))}

          {selectedReason === 'Other (Write below)' && (
            <TextInput
              style={styles.customReasonInput}
              placeholder="Enter custom reason..."
              placeholderTextColor="#94A3B8"
              value={customReason}
              onChangeText={setCustomReason}
            />
          )}

          <View style={styles.skipFormActions}>
            <Pressable style={styles.cancelSkipBtn} onPress={() => setShowSkipForm(false)}>
              <Text style={styles.cancelSkipText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmSkipBtn} onPress={handleConfirmSkip}>
              <Text style={styles.confirmSkipText}>Confirm Skip</Text>
            </Pressable>
          </View>
        </View>
      )}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
  },
  alarmSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  pulseContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulseCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0F2FE',
  },
  innerAlarmCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  alarmTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 12,
    color: '#0EA5E9',
    letterSpacing: 2,
  },
  alarmSubtitle: {
    fontFamily: 'OutfitBold',
    fontSize: 22,
    color: '#0F172A',
    marginTop: 8,
  },
  medCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 20,
    marginBottom: 32,
  },
  medNameText: {
    fontFamily: 'OutfitBold',
    fontSize: 22,
    color: '#0F172A',
    marginBottom: 12,
  },
  detailsList: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailText: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 14,
    color: '#475569',
  },
  notesContainer: {
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: 12,
  },
  notesTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 12,
    color: '#94A3B8',
  },
  notesText: {
    fontFamily: 'OutfitMedium',
    fontStyle: 'italic',
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  actionsContainer: {
    width: '100%',
  },
  takenBtn: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  takenBtnText: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  skipBtn: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnText: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#EF4444',
  },
  skipForm: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  skipFormTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radioOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0EA5E9',
  },
  radioLabel: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#0F172A',
  },
  customReasonInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 8,
  },
  skipFormActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelSkipBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelSkipText: {
    fontFamily: 'OutfitBold',
    fontSize: 14,
    color: '#475569',
  },
  confirmSkipBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmSkipText: {
    fontFamily: 'OutfitBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 80,
  },
});
