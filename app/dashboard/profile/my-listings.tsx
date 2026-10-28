import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MOCK_LISTINGS = [
  {
    id: '1',
    title: 'Modern Loft in Downtown',
    price: '$2,500/mo',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1de24244ed?q=80&w=400',
  },
  {
    id: '2',
    title: 'Cozy Studio near Campus',
    price: '$1,200/mo',
    status: 'Pending',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400',
  },
];

export default function MyListingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Listings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {MOCK_LISTINGS.map(listing => (
          <TouchableOpacity 
            key={listing.id} 
            style={styles.listingCard}
            onPress={() => router.push(`/dashboard/profile/manage-listing/${listing.id}`)}
          >
            <Image source={{ uri: listing.image }} style={styles.listingImage} />
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
              <Text style={styles.listingPrice}>{listing.price}</Text>
              
              <View style={[
                styles.statusBadge, 
                listing.status === 'Active' ? styles.statusActive : styles.statusPending
              ]}>
                <Text style={[
                  styles.statusText,
                  listing.status === 'Active' ? styles.statusTextActive : styles.statusTextPending
                ]}>
                  {listing.status}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#475569" style={styles.chevron} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/dashboard/add')}
      >
        <Ionicons name="add" size={28} color="#0F172A" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
  content: { padding: 24 },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center'
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#334155'
  },
  listingInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center'
  },
  listingTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  listingPrice: { fontSize: 14, color: '#94A3B8', marginBottom: 8 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  statusPending: { backgroundColor: 'rgba(251, 146, 60, 0.15)' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextActive: { color: '#34D399' },
  statusTextPending: { color: '#FB923C' },
  chevron: { marginLeft: 16 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});
