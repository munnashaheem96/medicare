import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import { useAuth } from '../../services/auth';
import { useData } from '../../services/data';
import { LogOut, Edit2, ShieldAlert, Award, HeartHandshake, User } from 'lucide-react-native';

export default function ProfileScreen() {
  const { profile, logout } = useAuth();
  const { updateEmergencyContact } = useData();

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setContactName(profile.emergencyContactName || 'Jane Doe (Spouse)');
      setContactPhone(profile.emergencyContactPhone || '9876543211');
    }
  }, [profile]);

  if (!profile) return null;

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (e) {
              console.error('Logout failed:', e);
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Error', 'Please fill in both caregiver fields.');
      return;
    }
    setIsSaving(true);
    try {
      await updateEmergencyContact(contactName.trim(), contactPhone.trim());
      setIsEditing(false);
      Alert.alert('Success', 'Emergency contact saved!');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save emergency contact.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header with Logout */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut color="#EF4444" size={20} />
        </Pressable>
      </View>

      {/* Profile Details Card */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {profile.name ? profile.name[0].toUpperCase() : 'P'}
          </Text>
        </View>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileId}>Patient ID: {profile.patientId || 'N/A'}</Text>
      </View>

      {/* Medical Info Card */}
      <Text style={styles.sectionTitle}>MEDICAL PROFILE INFORMATION</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Doctor</Text>
          <Text style={styles.infoValue}>{profile.doctor || 'Dr. Mehta (Cardiologist)'}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Medical Condition</Text>
          <Text style={styles.infoValue}>{profile.condition || 'None'}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Blood Group</Text>
          <Text style={styles.infoValue}>{profile.bloodGroup || 'B+'}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Age / Gender</Text>
          <Text style={styles.infoValue}>
            {profile.age || 45}y / {profile.gender || 'Male'}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Login Email</Text>
          <Text style={styles.infoValue}>{profile.email}</Text>
        </View>
      </View>

      {/* Emergency Caregiver Card */}
      <Text style={styles.sectionTitle}>EMERGENCY CONTACT CAREGIVER</Text>
      <View style={styles.card}>
        {!isEditing ? (
          <View>
            <View style={styles.caregiverHeader}>
              <View style={styles.caregiverDetails}>
                <Text style={styles.caregiverName}>{contactName}</Text>
                <Text style={styles.caregiverPhone}>Mobile: +91 {contactPhone}</Text>
              </View>
              <Pressable style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Edit2 color="#0EA5E9" size={18} />
              </Pressable>
            </View>
            <View style={styles.tipContainer}>
              <Text style={styles.tipText}>
                💡 Caregivers will be notified in real-time if you repeatedly skip medication schedules.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.editForm}>
            <Text style={styles.inputLabel}>Caregiver Name</Text>
            <TextInput
              style={styles.textInput}
              value={contactName}
              onChangeText={setContactName}
              placeholder="e.g. Jane Doe (Spouse)"
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Caregiver Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="e.g. 9876543211"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />

            {isSaving ? (
              <ActivityIndicator size="small" color="#0EA5E9" style={{ marginTop: 16 }} />
            ) : (
              <View style={styles.formActions}>
                <Pressable style={styles.cancelFormBtn} onPress={() => setIsEditing(false)}>
                  <Text style={styles.cancelFormText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveFormBtn} onPress={handleSave}>
                  <Text style={styles.saveFormText}>Save</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 22,
    color: '#0F172A',
  },
  logoutBtn: {
    padding: 8,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: 'OutfitBold',
    fontSize: 36,
    color: '#0EA5E9',
  },
  profileName: {
    fontFamily: 'OutfitBold',
    fontSize: 22,
    color: '#0F172A',
    marginBottom: 4,
  },
  profileId: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#64748B',
  },
  sectionTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 18,
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 14,
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  caregiverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caregiverDetails: {
    flex: 1,
  },
  caregiverName: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#0F172A',
  },
  caregiverPhone: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  editBtn: {
    padding: 8,
  },
  tipContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  tipText: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  editForm: {
    width: '100%',
  },
  inputLabel: {
    fontFamily: 'OutfitMedium',
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
    marginLeft: 2,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 48,
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#0F172A',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelFormBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelFormText: {
    fontFamily: 'OutfitBold',
    fontSize: 14,
    color: '#475569',
  },
  saveFormBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveFormText: {
    fontFamily: 'OutfitBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 96,
  },
});
