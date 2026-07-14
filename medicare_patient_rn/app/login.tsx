import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal, Alert } from 'react-native';
import { useAuth } from '../services/auth';
import { ShieldCheck, Mail, Lock, Phone, Key, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const { login, updateUserPassword } = useAuth();
  const [isOtpMode, setIsOtpMode] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  // Password reset modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const profile = await login(email.trim(), password);
      if (profile.role === 'patient' && profile.needsPasswordReset) {
        setShowResetModal(true);
      }
    } catch (e: any) {
      Alert.alert('Authentication Failed', 'Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (phone.trim().length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsLoading(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setOtpSent(true);
    Alert.alert('Demo OTP Sent', 'Use code: 123456');
  };

  const handleVerifyOtp = async () => {
    if (otp !== '123456') {
      Alert.alert('Error', 'Incorrect OTP. Try 123456.');
      return;
    }
    setIsLoading(true);
    try {
      // Replicate Flutter: sign in with default patient Aaron
      const profile = await login('p001@medicare.app', 'abc123456');
      if (profile.needsPasswordReset) {
        setShowResetModal(true);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Error connecting to default account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword.trim().length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setResetLoading(true);
    try {
      await updateUserPassword(newPassword.trim());
      setShowResetModal(false);
      Alert.alert('Success', 'Password updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update password.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Visual Backdrops */}
      <View style={[styles.circle, styles.circleTop]} />
      <View style={[styles.circle, styles.circleBottom]} />

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.card}>
          {/* Logo / Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <ShieldCheck color="#FFFFFF" size={32} />
            </View>
            <Text style={styles.title}>MediCare+</Text>
            <Text style={styles.subtitle}>Smart Pill Adherence & Tracking</Text>
          </View>

          {/* Form */}
          {!isOtpMode ? (
            // Email/Password Login
            <View style={styles.form}>
              <Text style={styles.label}>Patient Email</Text>
              <View style={styles.inputContainer}>
                <Mail color="#94A3B8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter email (e.g. p001@medicare.app)"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Lock color="#94A3B8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff color="#94A3B8" size={20} /> : <Eye color="#94A3B8" size={20} />}
                </Pressable>
              </View>

              <Pressable
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </Pressable>
            </View>
          ) : (
            // Mobile & OTP Login
            <View style={styles.form}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputContainer}>
                <Phone color="#94A3B8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!otpSent}
                />
              </View>

              {otpSent && (
                <>
                  <Text style={styles.label}>OTP Verification Code</Text>
                  <View style={styles.inputContainer}>
                    <Key color="#94A3B8" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit OTP (123456)"
                      placeholderTextColor="#94A3B8"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </>
              )}

              <Pressable
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>{otpSent ? 'Verify & Login' : 'Send OTP'}</Text>
                )}
              </Pressable>

              {otpSent && (
                <Pressable onPress={() => { setOtpSent(false); setOtp(''); }} style={styles.resendBtn}>
                  <Text style={styles.resendText}>Edit Mobile Number</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Toggle Login Mode */}
          <Pressable
            style={styles.toggleModeBtn}
            onPress={() => {
              setIsOtpMode(!isOtpMode);
              setOtpSent(false);
              setEmail('');
              setPassword('');
              setPhone('');
              setOtp('');
            }}
          >
            <Text style={styles.toggleModeText}>
              {isOtpMode ? 'Login using Email & Password' : 'Login using Mobile & OTP'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* First-time Password Reset Modal */}
      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Default Password</Text>
            <Text style={styles.modalDesc}>
              Since this is your first login, please set a new secure password.
            </Text>

            <View style={[styles.inputContainer, styles.modalInput]}>
              <Lock color="#94A3B8" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter new password (min 6 chars)"
                placeholderTextColor="#94A3B8"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <Pressable
              style={[styles.button, styles.modalBtn, resetLoading && styles.buttonDisabled]}
              onPress={handlePasswordReset}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Save Password</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
  },
  circleTop: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
    opacity: 0.6,
  },
  circleBottom: {
    width: 350,
    height: 350,
    bottom: -150,
    left: -150,
    opacity: 0.3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontFamily: 'OutfitBold',
    fontSize: 28,
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#64748B',
  },
  form: {
    width: '100%',
  },
  label: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Outfit',
    fontSize: 15,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 4,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#0EA5E9',
  },
  toggleModeBtn: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  toggleModeText: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 14,
    color: '#0EA5E9',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 20,
    color: '#0F172A',
    marginBottom: 8,
  },
  modalDesc: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#475569',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalInput: {
    borderColor: '#E2E8F0',
  },
  modalBtn: {
    marginTop: 12,
  },
});
