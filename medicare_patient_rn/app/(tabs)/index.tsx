import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../../services/auth';
import { useData, Medicine, Compliance } from '../../services/data';
import { useRouter } from 'expo-router';
import { Settings, CheckCircle, XCircle, Clock, Rocket, Calendar, Sunset, Sun, Moon, Info } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

export default function HomeScreen() {
  const { profile, logout } = useAuth();
  const { medicines, compliance, loadingMeds, loadingComp } = useData();
  const router = useRouter();

  if (!profile) return null;

  const patientName = profile.name;
  const patientId = profile.patientId || 'P001';

  // Greeting
  const hour = new Date().getHours();
  let greeting = 'Good Morning';
  if (hour >= 12 && hour < 17) {
    greeting = 'Good Afternoon';
  } else if (hour >= 17) {
    greeting = 'Good Evening';
  }

  // Date Formatting
  const getFormattedDate = () => {
    const now = new Date();
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // getDay() is 0-indexed starting on Sunday
    const weekdayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
    return `${weekdays[weekdayIdx]}, ${months[now.getMonth()]} ${now.getDate()}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Adherence Calculations
  const todayLogs = compliance.filter((log) => log.date === todayStr);
  
  let totalDosesCount = 0;
  medicines.forEach((med) => {
    totalDosesCount += med.timings.length;
  });

  const takenCount = todayLogs.filter((log) => log.status === 'taken').length;
  const skippedCount = todayLogs.filter((log) => log.status === 'skipped').length;
  const pendingCount = Math.max(0, totalDosesCount - todayLogs.length);

  const complianceRate = totalDosesCount > 0 
    ? Math.round((takenCount / totalDosesCount) * 100)
    : 100;

  // Circular Progress Ring Params
  const radius = 35;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (complianceRate / 100) * circumference;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'morning':
        return <Sun color="#0EA5E9" size={16} />;
      case 'afternoon':
        return <Sun color="#F59E0B" size={16} />;
      case 'evening':
        return <Sunset color="#E11D48" size={16} />;
      case 'night':
        return <Moon color="#1E293B" size={16} />;
      default:
        return <Clock color="#64748B" size={16} />;
    }
  };

  const runTestDemo = () => {
    if (medicines.length > 0) {
      const firstMed = medicines[0];
      router.push({
        pathname: '/reminder-overlay',
        params: { id: firstMed.id, timing: firstMed.timings[0] || 'morning' }
      });
    } else {
      router.push({
        pathname: '/reminder-overlay',
        params: { id: 'M_TEST', timing: 'morning' }
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{getFormattedDate()}</Text>
          <Text style={styles.greetingText}>{greeting}, {patientName}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {patientName ? patientName[0].toUpperCase() : 'P'}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Demo Tools Card */}
        <View style={styles.demoCard}>
          <View style={styles.demoIconContainer}>
            <Rocket color="#0EA5E9" size={20} />
          </View>
          <View style={styles.demoInfo}>
            <Text style={styles.demoTitle}>Demo Tools</Text>
            <Text style={styles.demoSubtitle}>Test custom overlay alarm screen</Text>
          </View>
          <Pressable style={styles.demoBtn} onPress={runTestDemo}>
            <Text style={styles.demoBtnText}>Run Test</Text>
          </Pressable>
        </View>

        {/* Overview Stats Card */}
        <View style={styles.statsCard}>
          {/* Progress Ring */}
          <View style={styles.progressRingContainer}>
            <Svg height="90" width="90" viewBox="0 0 90 90">
              <Circle
                cx="45"
                cy="45"
                r={radius}
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <Circle
                cx="45"
                cy="45"
                r={radius}
                stroke="#10B981"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 45 45)"
              />
            </Svg>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressPercentage}>{complianceRate}%</Text>
              <Text style={styles.progressLabel}>Adherence</Text>
            </View>
          </View>

          {/* Stat Details */}
          <View style={styles.statDetails}>
            <Text style={styles.statDetailsTitle}>Daily Overview</Text>
            <View style={styles.statRow}>
              {/* Taken */}
              <View style={styles.statItem}>
                <View style={[styles.statIconBadge, { backgroundColor: '#E6FBF2' }]}>
                  <CheckCircle color="#10B981" size={14} />
                </View>
                <Text style={styles.statItemCount}>{takenCount}</Text>
                <Text style={styles.statItemLabel}>Taken</Text>
              </View>
              {/* Skipped */}
              <View style={styles.statItem}>
                <View style={[styles.statIconBadge, { backgroundColor: '#FEE2E2' }]}>
                  <XCircle color="#EF4444" size={14} />
                </View>
                <Text style={styles.statItemCount}>{skippedCount}</Text>
                <Text style={styles.statItemLabel}>Skipped</Text>
              </View>
              {/* Pending */}
              <View style={styles.statItem}>
                <View style={[styles.statIconBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Clock color="#F59E0B" size={14} />
                </View>
                <Text style={styles.statItemCount}>{pendingCount}</Text>
                <Text style={styles.statItemLabel}>Pending</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Schedule Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY'S SCHEDULE</Text>
          <View style={styles.medsCountBadge}>
            <Text style={styles.medsCountText}>{medicines.length} Medications</Text>
          </View>
        </View>

        {/* Doses List */}
        {loadingMeds || loadingComp ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#0EA5E9" />
          </View>
        ) : medicines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar color="#94A3B8" size={40} />
            <Text style={styles.emptyTitle}>No medicine scheduled for today</Text>
            <Text style={styles.emptySubtitle}>
              Your daily schedule will appear here when prescriptions are added by your doctor.
            </Text>
          </View>
        ) : (
          <View style={styles.scheduleList}>
            {['morning', 'afternoon', 'evening', 'night'].map((cat) => {
              const catMeds = medicines.filter((m) => m.timings.includes(cat));
              if (catMeds.length === 0) return null;

              return (
                <View key={cat} style={styles.categorySection}>
                  {/* Category Header */}
                  <View style={styles.categoryHeader}>
                    {getCategoryIcon(cat)}
                    <Text style={styles.categoryTitle}>{cat.toUpperCase()}</Text>
                  </View>

                  {/* Medicines in Category */}
                  {catMeds.map((med) => {
                    const loggedDose = todayLogs.find(
                      (log) => log.medicineId === med.id && log.timing === cat
                    );

                    const isLogged = !!loggedDose;
                    const isTaken = loggedDose?.status === 'taken';
                    const isSkipped = loggedDose?.status === 'skipped';

                    let statusColor = '#F59E0B'; // pending
                    let statusBg = '#FEF3C7';
                    let statusText = 'Pending';

                    if (isLogged) {
                      if (isTaken) {
                        statusColor = '#10B981';
                        statusBg = '#E6FBF2';
                        statusText = 'Taken';
                      } else if (isSkipped) {
                        statusColor = '#EF4444';
                        statusBg = '#FEE2E2';
                        statusText = 'Skipped';
                      }
                    }

                    return (
                      <View key={`${med.id}-${cat}`} style={[styles.medCard, isLogged && { borderColor: statusColor + '26' }]}>
                        {/* Vertical Left Border strip */}
                        <View style={[styles.leftBorderStrip, { backgroundColor: isLogged ? statusColor : '#94A3B8' }]} />
                        
                        <View style={styles.medCardContent}>
                          {/* Left Icon */}
                          <View style={[styles.medCardIconContainer, { backgroundColor: isLogged ? statusColor + '14' : '#F1F5F9' }]}>
                            {isLogged ? (
                              isTaken ? <CheckCircle color="#10B981" size={20} /> : <XCircle color="#EF4444" size={20} />
                            ) : (
                              <Clock color="#F59E0B" size={20} />
                            )}
                          </View>

                          {/* Info */}
                          <View style={styles.medCardInfo}>
                            <Text style={styles.medName} numberOfLines={1}>{med.medicineName}</Text>
                            <View style={styles.foodBadge}>
                              <Info color="#0EA5E9" size={10} style={{ marginRight: 4 }} />
                              <Text style={styles.foodText}>Take {med.mealInstruction} food</Text>
                            </View>
                          </View>

                          {/* Action Button / Status Badge */}
                          {!isLogged ? (
                            <Pressable 
                              style={styles.logBtn}
                              onPress={() => router.push({
                                pathname: '/reminder-overlay',
                                params: { id: med.id, timing: cat }
                              })}
                            >
                              <Text style={styles.logBtnText}>Log</Text>
                            </Pressable>
                          ) : (
                            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontFamily: 'OutfitBold',
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontFamily: 'OutfitBold',
    fontSize: 22,
    color: '#0F172A',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarText: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#BAE6FD',
    padding: 16,
    marginBottom: 24,
  },
  demoIconContainer: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  demoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  demoTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 14,
    color: '#0F172A',
  },
  demoSubtitle: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  demoBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  demoBtnText: {
    fontFamily: 'OutfitBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 20,
    marginBottom: 28,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  progressRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressPercentage: {
    fontFamily: 'OutfitBold',
    fontSize: 18,
    color: '#0F172A',
  },
  progressLabel: {
    fontFamily: 'OutfitBold',
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  statDetails: {
    flex: 1,
    marginLeft: 24,
  },
  statDetailsTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statIconBadge: {
    padding: 6,
    borderRadius: 12,
    marginBottom: 6,
  },
  statItemCount: {
    fontFamily: 'OutfitBold',
    fontSize: 14,
    color: '#0F172A',
  },
  statItemLabel: {
    fontFamily: 'OutfitMedium',
    fontSize: 10,
    color: '#64748B',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  medsCountBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  medsCountText: {
    fontFamily: 'OutfitBold',
    fontSize: 10,
    color: '#0EA5E9',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 32,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  emptyTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  scheduleList: {
    width: '100%',
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  categoryTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 12,
    color: '#475569',
    marginLeft: 8,
    letterSpacing: 1.0,
  },
  medCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  leftBorderStrip: {
    width: 6,
    height: '100%',
  },
  medCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  medCardIconContainer: {
    padding: 10,
    borderRadius: 99,
  },
  medCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  medName: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#0F172A',
  },
  foodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  foodText: {
    fontFamily: 'OutfitBold',
    fontSize: 10,
    color: '#0EA5E9',
  },
  logBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logBtnText: {
    fontFamily: 'OutfitBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: 'OutfitBold',
    fontSize: 11,
  },
  bottomSpacing: {
    height: 100,
  },
});
