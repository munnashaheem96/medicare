import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useData } from '../services/data';
import { Shield, Clock, Calendar, MessageSquare, AlertTriangle, Pill } from 'lucide-react-native';

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams();
  const { medicines } = useData();

  const medicine = medicines.find((m) => m.id === id);

  if (!medicine) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle color="#EF4444" size={48} />
        <Text style={styles.errorText}>Prescription not found.</Text>
      </View>
    );
  }

  const isLow = medicine.quantity <= 3;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Info */}
      <View style={styles.card}>
        <View style={styles.headerIconContainer}>
          <Pill color="#0EA5E9" size={48} />
        </View>
        <Text style={styles.medName}>{medicine.medicineName}</Text>
        <View style={[styles.stockBadge, { backgroundColor: isLow ? '#FEE2E2' : '#E0F2FE' }]}>
          <Text style={[styles.stockText, { color: isLow ? '#EF4444' : '#0EA5E9' }]}>
            {medicine.quantity} Tablets Remaining
          </Text>
        </View>
      </View>

      {/* Details list */}
      <Text style={styles.sectionTitle}>DOSAGE & SCHEDULE</Text>
      <View style={styles.card}>
        {/* Frequency */}
        <View style={styles.detailRow}>
          <Clock color="#0EA5E9" size={20} style={styles.detailIcon} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Frequency</Text>
            <Text style={styles.detailValue}>
              {medicine.timings.map((t) => t.toUpperCase()).join(', ')}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Instructions */}
        <View style={styles.detailRow}>
          <Shield color="#0EA5E9" size={20} style={styles.detailIcon} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Instructions</Text>
            <Text style={styles.detailValue}>Take {medicine.mealInstruction} food</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Duration */}
        <View style={styles.detailRow}>
          <Calendar color="#0EA5E9" size={20} style={styles.detailIcon} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{medicine.startDate} to {medicine.endDate}</Text>
          </View>
        </View>
      </View>

      {/* Doctor Notes */}
      <Text style={styles.sectionTitle}>DOCTOR'S NOTE</Text>
      <View style={styles.card}>
        <Text style={[styles.notesText, !medicine.notes && styles.noNotesText]}>
          {medicine.notes || 'No additional instructions provided by the doctor.'}
        </Text>
      </View>

      {/* Low stock alert box */}
      {isLow && (
        <View style={styles.refillAlert}>
          <Text style={styles.refillAlertTitle}>⚠️ Refill Prompt</Text>
          <Text style={styles.refillAlertDesc}>
            This medicine is running low. Please message your doctor using the Chat tab to request a refill prescription.
          </Text>
        </View>
      )}
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#0F172A',
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 1,
  },
  headerIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  medName: {
    fontFamily: 'OutfitBold',
    fontSize: 22,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  stockBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  stockText: {
    fontFamily: 'OutfitBold',
    fontSize: 12,
  },
  sectionTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    paddingVertical: 8,
  },
  detailIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#94A3B8',
  },
  detailValue: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 15,
    color: '#0F172A',
    marginTop: 2,
  },
  divider: {
    height: 1.5,
    backgroundColor: '#F1F5F9',
    width: '100%',
    marginVertical: 12,
  },
  notesText: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    alignSelf: 'stretch',
  },
  noNotesText: {
    fontFamily: 'Outfit',
    color: '#94A3B8',
  },
  refillAlert: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  refillAlertTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 15,
    color: '#EF4444',
    marginBottom: 4,
  },
  refillAlertDesc: {
    fontFamily: 'OutfitMedium',
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});
