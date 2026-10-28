import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

// We'll use mock data that matches the my-listings.tsx mock data
const MOCK_DATA: Record<string, any> = {
  '1': {
    id: '1',
    title: 'Modern Loft in Downtown',
    price: '$2,500/mo',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1de24244ed?q=80&w=400',
    views: 342,
    inquiries: 12,
  },
  '2': {
    id: '2',
    title: 'Cozy Studio near Campus',
    price: '$1,200/mo',
    status: 'Pending',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400',
    views: 89,
    inquiries: 3,
  }
};

export default function ManageListingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const listing = MOCK_DATA[id as string] || MOCK_DATA['1'];
  const [currentStatus, setCurrentStatus] = useState(listing.status);

  const handlePreview = () => {
    // Navigate to the public property view with mock data
    router.push({
      pathname: '/dashboard/property/[id]',
      params: { 
        id: listing.id,
        data: JSON.stringify({
          id: listing.id,
          title: listing.title,
          price: listing.price.replace('/mo', '').replace('$', '').replace(',', ''),
          images: [listing.image],
          location: 'Downtown, City Center',
          propertyType: 'Apartment',
          bedrooms: 1,
          bathrooms: 1,
          owner: { name: 'You' }
        })
      }
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Listing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Listing Header */}
        <View style={styles.listingHeader}>
          <Image source={{ uri: listing.image }} style={styles.heroImage} />
          <View style={styles.overlay}>
            <View style={[
              styles.statusBadge, 
              currentStatus === 'Active' ? styles.statusActive : styles.statusPending
            ]}>
              <Text style={[
                styles.statusText,
                currentStatus === 'Active' ? styles.statusTextActive : styles.statusTextPending
              ]}>
                {currentStatus}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{listing.price}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handlePreview}>
            <Ionicons name="eye-outline" size={20} color="#F8FAFC" />
            <Text style={styles.actionText}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/dashboard/profile/edit-listing/${id}`)}
          >
            <Ionicons name="create-outline" size={20} color="#F8FAFC" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          {currentStatus === 'Active' ? (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
              onPress={() => setCurrentStatus('Pending')}
            >
              <Ionicons name="pause-outline" size={20} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Pause</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: 'rgba(52, 211, 153, 0.1)' }]}
              onPress={() => setCurrentStatus('Active')}
            >
              <Ionicons name="play-outline" size={20} color="#34D399" />
              <Text style={[styles.actionText, { color: '#34D399' }]}>Play</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Performance Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="bar-chart-outline" size={24} color="#38BDF8" style={styles.statIcon} />
              <Text style={styles.statValue}>{listing.views}</Text>
              <Text style={styles.statLabel}>Total Views</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="chatbubbles-outline" size={24} color="#38BDF8" style={styles.statIcon} />
              <Text style={styles.statValue}>{listing.inquiries}</Text>
              <Text style={styles.statLabel}>Inquiries</Text>
            </View>
          </View>
        </View>

        {/* Recent Inquiries List */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Inquiries</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.inquiryCard} onPress={() => router.push(`/dashboard/conversation/123` as any)}>
            <View style={styles.inquiryAvatar}>
              <Text style={styles.inquiryAvatarText}>SA</Text>
            </View>
            <View style={styles.inquiryInfo}>
              <Text style={styles.inquiryName}>Sarah Anderson</Text>
              <Text style={styles.inquiryMsg} numberOfLines={1}>Is this property still available for next month?</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.inquiryCard} onPress={() => router.push(`/dashboard/conversation/456` as any)}>
            <View style={styles.inquiryAvatar}>
              <Text style={styles.inquiryAvatarText}>MJ</Text>
            </View>
            <View style={styles.inquiryInfo}>
              <Text style={styles.inquiryName}>Michael Johnson</Text>
              <Text style={styles.inquiryMsg} numberOfLines={1}>I would like to schedule a viewing.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

      </ScrollView>
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
  content: { paddingBottom: 40 },
  
  listingHeader: { position: 'relative' },
  heroImage: { width: '100%', height: 220, backgroundColor: '#1E293B' },
  overlay: { position: 'absolute', top: 16, right: 16 },
  
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusActive: { backgroundColor: 'rgba(52, 211, 153, 0.9)' },
  statusPending: { backgroundColor: 'rgba(251, 146, 60, 0.9)' },
  statusText: { fontSize: 13, fontWeight: '700' },
  statusTextActive: { color: '#0F172A' },
  statusTextPending: { color: '#0F172A' },

  titleSection: { padding: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  price: { fontSize: 18, color: '#94A3B8' },

  actionRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 32 },
  actionButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#1E293B', 
    paddingVertical: 14, 
    borderRadius: 12,
    gap: 8
  },
  actionText: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },

  section: { paddingHorizontal: 24, marginBottom: 32 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 16 },
  seeAllText: { color: '#38BDF8', fontSize: 14, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', gap: 16 },
  statCard: { 
    flex: 1, 
    backgroundColor: '#1E293B', 
    padding: 20, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  statIcon: { marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#94A3B8' },

  inquiryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12
  },
  inquiryAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(56, 189, 248, 0.15)', alignItems: 'center', justifyContent: 'center' },
  inquiryAvatarText: { color: '#38BDF8', fontSize: 16, fontWeight: '700' },
  inquiryInfo: { flex: 1, marginLeft: 16, marginRight: 16 },
  inquiryName: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  inquiryMsg: { fontSize: 14, color: '#94A3B8' }
});
