import React from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { useData } from '../../services/data';
import { CheckCircle2, XCircle, CalendarClock, History } from 'lucide-react-native';

export default function HistoryScreen() {
  const { compliance, medicines, loadingComp } = useData();

  // Sort logs by loggedAt descending
  const sortedLogs = [...compliance].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));

  const getMedicineName = (medId: string) => {
    const med = medicines.find((m) => m.id === medId);
    if (med) return med.medicineName;
    // Fallback parsing from mock IDs
    if (medId.startsWith('M_TEST')) return 'Paracetamol 500mg (Demo)';
    return `Medicine ID: ${medId.substring(0, 5).toUpperCase()}`;
  };

  const formatDate = (loggedAtStr: string) => {
    try {
      const date = new Date(loggedAtStr);
      return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const formatTime = (loggedAtStr: string) => {
    try {
      const date = new Date(loggedAtStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Adherence History</Text>
      </View>

      {/* Logs List */}
      {sortedLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <History color="#94A3B8" size={48} />
          <Text style={styles.emptyTitle}>No Adherence History Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your logs will show up here once you take/skip scheduled doses.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedLogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isTaken = item.status === 'taken';

            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  {/* Status Circle Icon */}
                  <View style={[styles.iconContainer, { backgroundColor: isTaken ? '#E6FBF2' : '#FEE2E2' }]}>
                    {isTaken ? <CheckCircle2 color="#10B981" size={22} /> : <XCircle color="#EF4444" size={22} />}
                  </View>

                  {/* Log Details */}
                  <View style={styles.logInfo}>
                    <Text style={styles.medName} numberOfLines={1}>
                      {getMedicineName(item.medicineId)}
                    </Text>
                    <Text style={styles.logSchedule}>
                      Scheduled for: {item.timing.toUpperCase()}
                    </Text>
                    {!isTaken && item.reason && (
                      <View style={styles.reasonContainer}>
                        <Text style={styles.reasonText}>Reason: {item.reason}</Text>
                      </View>
                    )}
                  </View>

                  {/* Timestamp Box */}
                  <View style={styles.timeInfo}>
                    <Text style={styles.dateText}>{formatDate(item.loggedAt)}</Text>
                    <Text style={styles.timeText}>{formatTime(item.loggedAt)}</Text>
                    <View style={[styles.badge, { backgroundColor: isTaken ? '#E6FBF2' : '#FEE2E2' }]}>
                      <Text style={[styles.badgeText, { color: isTaken ? '#10B981' : '#EF4444' }]}>
                        {isTaken ? 'TAKEN' : 'SKIPPED'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
      <View style={styles.bottomSpacing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  headerTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 22,
    color: '#0F172A',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  medName: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#0F172A',
  },
  logSchedule: {
    fontFamily: 'OutfitMedium',
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  reasonContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  reasonText: {
    fontFamily: 'Outfit',
    fontSize: 11,
    fontStyle: 'italic',
    color: '#475569',
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontFamily: 'OutfitBold',
    fontSize: 12,
    color: '#0F172A',
  },
  timeText: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText: {
    fontFamily: 'OutfitBold',
    fontSize: 9,
  },
  bottomSpacing: {
    height: 96,
  },
});
