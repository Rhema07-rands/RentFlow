import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Using some mocked saved properties
const SAVED_PROPERTIES = [
  {
    id: '1',
    title: 'Luxury 3-Bedroom Apartment',
    price: 3500000,
    location: 'Lekki Phase 1, Lagos',
    beds: 3,
    baths: 2,
    propertyType: 'Apartment',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000'],
    owner: { id: '1', name: 'Adeola Properties' },
  },
  {
    id: '5',
    title: 'Modern 2-Bed Terrace',
    price: 4200000,
    location: 'Ajah, Lagos',
    beds: 2,
    baths: 2,
    propertyType: 'Terrace',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000'],
    owner: { id: '5', name: 'Prime Estate NG' },
  }
];

export default function SavedScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState(SAVED_PROPERTIES);

  const renderItem = ({ item }: any) => {
    const mainImage = item.images && item.images.length > 0 
      ? { uri: item.images[0] }
      : { uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000' };

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.85}
        onPress={() => router.push({
          pathname: `/dashboard/property/[id]`,
          params: { id: item.id, data: JSON.stringify(item) }
        })}
      >
        <Image source={mainImage} style={styles.cardImage} />

        {item.propertyType ? (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{item.propertyType}</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          style={styles.heartButton}
          onPress={() => {
            // Remove from saved (mock)
            setProperties(properties.filter(p => p.id !== item.id));
          }}
        >
          <Ionicons name="heart" size={20} color="#EF4444" />
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₦{item.price.toLocaleString()}/yr</Text>
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardLocation}>
            <Ionicons name="location-outline" size={14} color="#94A3B8" /> {item.location}
          </Text>
          
          <View style={styles.featuresRow}>
            {item.beds > 0 && (
              <View style={styles.featureItem}>
                <Ionicons name="bed-outline" size={16} color="#94A3B8" />
                <Text style={styles.featureText}>{item.beds} Beds</Text>
              </View>
            )}
            {item.baths > 0 && (
              <View style={styles.featureItem}>
                <Ionicons name="water-outline" size={16} color="#94A3B8" />
                <Text style={styles.featureText}>{item.baths} Baths</Text>
              </View>
            )}
            <View style={styles.featureItem}>
              <Ionicons name="person-outline" size={16} color="#94A3B8" />
              <Text style={styles.featureText}>{item.owner?.name}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Properties</Text>
        <View style={{ width: 44 }} />
      </View>
      
      <FlatList
        data={properties}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={48} color="#334155" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>You haven't saved any properties yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
  listContainer: { paddingHorizontal: 24, paddingBottom: 24 },
  card: { backgroundColor: '#1E293B', borderRadius: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 4, overflow: 'hidden' },
  cardImage: { width: '100%', height: 220, backgroundColor: '#334155' },
  typeBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(15, 23, 42, 0.75)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  typeBadgeText: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
  heartButton: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(15, 23, 42, 0.75)', alignItems: 'center', justifyContent: 'center' },
  cardContent: { padding: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceText: { fontSize: 24, fontWeight: '800', color: '#38BDF8' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC', marginBottom: 6 },
  cardLocation: { fontSize: 15, color: '#94A3B8', marginBottom: 16 },
  featuresRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: 100 },
  emptyText: { color: '#94A3B8', fontSize: 16, textAlign: 'center' }
});
