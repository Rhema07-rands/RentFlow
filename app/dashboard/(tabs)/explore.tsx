import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE_URL = 'http://10.231.149.52:5004/api/properties';

const MOCK_PROPERTIES = [
  {
    id: '1',
    title: 'Luxury 3-Bedroom Apartment',
    description: 'Spacious apartment with modern finishes, fitted kitchen, and 24/7 power supply. Gated estate with security.',
    price: 3500000,
    location: 'Lekki Phase 1, Lagos',
    beds: 3,
    baths: 2,
    propertyType: 'Apartment',
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000'],
    owner: { id: '1', name: 'Adeola Properties' },
  },
  {
    id: '2',
    title: 'Cozy Self Contain in Yaba',
    description: 'Well-ventilated self-contained room with tiled floors, POP ceiling, private bathroom, and prepaid meter.',
    price: 650000,
    location: 'Yaba, Lagos',
    beds: 1,
    baths: 1,
    propertyType: 'Self Contain',
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000'],
    owner: { id: '2', name: 'ChiChi Homes' },
  },
  {
    id: '3',
    title: 'Executive 4-Bed Duplex',
    description: 'Fully detached duplex in a serene neighborhood. Comes with BQ, CCTV, swimming pool, and treated water.',
    price: 8000000,
    location: 'Ikeja GRA, Lagos',
    beds: 4,
    baths: 4,
    propertyType: 'Duplex',
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000'],
    owner: { id: '3', name: 'Lagos Luxury Living' },
  },
  {
    id: '4',
    title: 'Mini Flat in Surulere',
    description: 'Clean mini flat with separate bedroom and living room. Water and security included. Close to the bus stop.',
    price: 900000,
    location: 'Surulere, Lagos',
    beds: 1,
    baths: 1,
    propertyType: 'Mini Flat',
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000'],
    owner: { id: '4', name: 'Emeka Realtors' },
  },
  {
    id: '5',
    title: 'Modern 2-Bed Terrace',
    description: 'Brand new terrace house in a well-planned estate. Smart home features, fitted kitchen, and private parking.',
    price: 4200000,
    location: 'Ajah, Lagos',
    beds: 2,
    baths: 2,
    propertyType: 'Terrace',
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000'],
    owner: { id: '5', name: 'Prime Estate NG' },
  },
  {
    id: '6',
    title: 'Penthouse with Ocean View',
    description: 'Stunning penthouse on Victoria Island with panoramic ocean views, rooftop terrace, and concierge service.',
    price: 15000000,
    location: 'Victoria Island, Lagos',
    beds: 3,
    baths: 3,
    propertyType: 'Penthouse',
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1000'],
    owner: { id: '6', name: 'VI Premium Homes' },
  },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [20, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const fetchProperties = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      
      const response = await fetch(API_BASE_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setProperties(data);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }
    } catch (error) {
      console.log('API unavailable, using mock data');
    }
    // Fallback to mock data if API fails or returns empty
    setProperties(MOCK_PROPERTIES);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProperties().finally(() => {
      setRefreshing(false);
    });
  }, []);

  const renderItem = ({ item }: any) => {
    // Determine the main image to show
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

        {/* Property type badge */}
        {item.propertyType ? (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{item.propertyType}</Text>
          </View>
        ) : null}

        <View style={styles.cardContent}>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₦{item.price.toLocaleString()}/yr</Text>
            <View style={styles.applyButton}>
              <Text style={styles.applyButtonText}>View</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardLocation}>
            <Ionicons name="location-outline" size={14} color="#94A3B8" /> {item.location}
          </Text>
          
          <View style={styles.featuresRow}>
            {item.beds > 0 && (
              <View style={styles.featureItem}>
                <Ionicons name="bed-outline" size={16} color="#94A3B8" />
                <Text style={styles.featureText}>{item.beds} {item.beds === 1 ? 'Bed' : 'Beds'}</Text>
              </View>
            )}
            {item.baths > 0 && (
              <View style={styles.featureItem}>
                <Ionicons name="water-outline" size={16} color="#94A3B8" />
                <Text style={styles.featureText}>{item.baths} {item.baths === 1 ? 'Bath' : 'Baths'}</Text>
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
      
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]} pointerEvents="none">
        <Text style={styles.stickyHeaderTitle}>Discover Properties</Text>
      </Animated.View>

      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/dashboard/saved')}
      >
        <Ionicons name="heart" size={24} color="#F8FAFC" />
      </TouchableOpacity>
      
      <Animated.FlatList
        data={loading ? [] : properties}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />
        }
        ListHeaderComponent={
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerGreeting}>Welcome back, {user?.name?.split(' ')[0] || 'there'}</Text>
            <Text style={styles.headerTitle}>Discover Properties</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#38BDF8" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No properties found.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  headerTextContainer: { paddingTop: 16, paddingBottom: 24, paddingRight: 60 },
  headerGreeting: { fontSize: 16, color: '#94A3B8', marginBottom: 4, fontWeight: '500' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#F8FAFC', letterSpacing: -1 },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: 104, paddingTop: 40, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', zIndex: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  stickyHeaderTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  floatingButton: { position: 'absolute', top: 40, right: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  listContainer: { paddingHorizontal: 24, paddingBottom: 24 },
  card: { backgroundColor: '#1E293B', borderRadius: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 4, overflow: 'hidden' },
  cardImage: { width: '100%', height: 220, backgroundColor: '#334155' },
  typeBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(15, 23, 42, 0.75)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  typeBadgeText: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
  cardContent: { padding: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceText: { fontSize: 24, fontWeight: '800', color: '#38BDF8' },
  applyButton: { backgroundColor: '#38BDF8', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  applyButtonText: { color: '#0F172A', fontWeight: '700', fontSize: 14 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC', marginBottom: 6 },
  cardLocation: { fontSize: 15, color: '#94A3B8', marginBottom: 16 },
  featuresRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  featureDot: { marginHorizontal: 8, color: '#475569' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 16 }
});
