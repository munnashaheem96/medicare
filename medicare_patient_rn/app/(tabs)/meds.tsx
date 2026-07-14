import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Platform } from 'react-native';
import { useData, Medicine } from '../../services/data';
import { useRouter } from 'expo-router';
import { Pill, Search, AlertCircle, ChevronRight, Info, AlertTriangle } from 'lucide-react-native';

export default function MedsScreen() {
  const { medicines, loadingMeds } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filtered = medicines.filter((m) =>
    m.medicineName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Medications</Text>
      </View>

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <Search color="#94A3B8" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search prescribed medicines..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Pill color="#94A3B8" size={48} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No match found' : 'No Prescribed Medicines'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try typing a different name.' : 'Your doctor will add your prescriptions here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isLow = item.quantity <= 3;

            return (
              <Pressable
                style={[styles.card, isLow && styles.lowStockCard]}
                onPress={() => router.push({
                  pathname: '/medicine-detail',
                  params: { id: item.id }
                })}
              >
                {/* Low Stock Alert */}
                {isLow && (
                  <View style={styles.alertBanner}>
                    <AlertTriangle color="#EF4444" size={14} style={{ marginRight: 6 }} />
                    <Text style={styles.alertText}>
                      Refill alert: Only {item.quantity} doses remaining!
                    </Text>
                  </View>
                )}

                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.pillIconBg, { backgroundColor: isLow ? '#FEE2E2' : '#E0F2FE' }]}>
                      <Pill color={isLow ? '#EF4444' : '#0EA5E9'} size={24} />
                    </View>
                    <View style={styles.medDetails}>
                      <Text style={styles.medName}>{item.medicineName}</Text>
                      <Text style={styles.medSummary}>
                        {item.timings.length}x daily • {item.mealInstruction} food
                      </Text>
                    </View>
                  </View>
                  <ChevronRight color="#94A3B8" size={20} />
                </View>
              </Pressable>
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
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 24,
    color: '#0F172A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Outfit',
    fontSize: 15,
    color: '#0F172A',
  },
  listContent: {
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 1,
  },
  lowStockCard: {
    borderColor: '#FEE2E2',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  alertText: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 12,
    color: '#EF4444',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pillIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medDetails: {
    marginLeft: 16,
    flex: 1,
  },
  medName: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#0F172A',
  },
  medSummary: {
    fontFamily: 'OutfitMedium',
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 18,
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
  },
  bottomSpacing: {
    height: 96,
  },
});
