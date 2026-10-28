import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PROPERTY_TYPES = ['All', 'Self Contain', 'Mini Flat', 'Apartment', 'Duplex', 'Bungalow', 'Terrace', 'Penthouse', 'Shop', 'Office Space', 'Land'];
const API_BASE_URL = 'http://10.231.149.52:5004/api/properties';

export default function SearchScreen() {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters state
  const [selectedType, setSelectedType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');
  const [minBeds, setMinBeds] = useState(0);
  const [minBaths, setMinBaths] = useState(0);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchResults();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedType]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}?`;
      
      if (searchQuery) url += `query=${encodeURIComponent(searchQuery)}&`;
      if (selectedType !== 'All') url += `propertyType=${encodeURIComponent(selectedType)}&`;
      if (maxPrice) url += `maxPrice=${maxPrice}&`;
      if (minBeds > 0) url += `beds=${minBeds}&`;
      if (minBaths > 0) url += `baths=${minBaths}&`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Failed to fetch search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchResults();
  };

  const clearFilters = () => {
    setMaxPrice('');
    setMinBeds(0);
    setMinBaths(0);
    setSelectedType('All');
  };

  const renderItem = ({ item }: any) => {
    const mainImage = item.images && item.images.length > 0 
      ? { uri: item.images[0] }
      : { uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000' };

    return (
      <TouchableOpacity 
        style={styles.resultCard}
        activeOpacity={0.8}
        onPress={() => router.push({
          pathname: `/dashboard/property/[id]`,
          params: { id: item.id, data: JSON.stringify(item) }
        })}
      >
        <Image source={mainImage} style={styles.resultImage} />
        <View style={styles.resultInfo}>
          <Text style={styles.resultPrice}>₦{item.price.toLocaleString()}/yr</Text>
          <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.resultLocation} numberOfLines={1}>{item.location}</Text>
          
          <View style={styles.specsRow}>
            {item.beds > 0 && (
              <View style={styles.specBadge}>
                <Ionicons name="bed-outline" size={12} color="#94A3B8" />
                <Text style={styles.specText}>{item.beds}</Text>
              </View>
            )}
            {item.baths > 0 && (
              <View style={styles.specBadge}>
                <Ionicons name="water-outline" size={12} color="#94A3B8" />
                <Text style={styles.specText}>{item.baths}</Text>
              </View>
            )}
            {item.propertyType && item.propertyType !== "All" && (
              <View style={styles.specBadge}>
                <Text style={styles.specText}>{item.propertyType}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Search Area */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              placeholder="Search properties, areas..."
              placeholderTextColor="#64748B"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#475569" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={24} color="#F8FAFC" />
            {(maxPrice || minBeds > 0 || minBaths > 0) && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Type Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContainer}
        >
          {PROPERTY_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, selectedType === type && styles.chipActive]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Area */}
      <View style={styles.content}>
        {loading && results.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#38BDF8" />
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#1E293B" />
            <Text style={styles.emptyTitle}>No properties found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filters or search area</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Advanced Filters Modal */}
      <Modal visible={showFilters} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={28} color="#F8FAFC" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Max Price (₦/yr)</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Any price"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Bedrooms</Text>
                <View style={styles.pillRow}>
                  {[0, 1, 2, 3, 4, 5].map(num => (
                    <TouchableOpacity
                      key={`bed-${num}`}
                      style={[styles.filterPill, minBeds === num && styles.filterPillActive]}
                      onPress={() => setMinBeds(num)}
                    >
                      <Text style={[styles.filterPillText, minBeds === num && styles.filterPillTextActive]}>
                        {num === 0 ? 'Any' : `${num}+`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Bathrooms</Text>
                <View style={styles.pillRow}>
                  {[0, 1, 2, 3, 4].map(num => (
                    <TouchableOpacity
                      key={`bath-${num}`}
                      style={[styles.filterPill, minBaths === num && styles.filterPillActive]}
                      onPress={() => setMinBaths(num)}
                    >
                      <Text style={[styles.filterPillText, minBaths === num && styles.filterPillTextActive]}>
                        {num === 0 ? 'Any' : `${num}+`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Show Results</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, paddingTop: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 16, fontWeight: '500' },
  filterBtn: { width: 56, height: 56, backgroundColor: '#1E293B', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  filterBadge: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: '#38BDF8' },
  
  chipsScroll: { maxHeight: 44 },
  chipsContainer: { paddingRight: 20, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E293B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chipActive: { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38BDF8' },
  chipText: { color: '#94A3B8', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#38BDF8' },

  content: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC', marginTop: 24, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
  
  listContainer: { padding: 20, paddingTop: 0 },
  resultCard: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  resultImage: { width: 110, height: '100%', minHeight: 110 },
  resultInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  resultPrice: { color: '#38BDF8', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  resultTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  resultLocation: { color: '#94A3B8', fontSize: 13, marginBottom: 8 },
  specsRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  specBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  specText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0F172A', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  
  filterSection: { marginBottom: 28 },
  filterLabel: { color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  filterInput: { backgroundColor: '#1E293B', color: '#F8FAFC', padding: 16, borderRadius: 16, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, backgroundColor: '#1E293B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  filterPillActive: { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38BDF8' },
  filterPillText: { color: '#94A3B8', fontWeight: '600', fontSize: 14 },
  filterPillTextActive: { color: '#38BDF8' },

  modalFooter: { flexDirection: 'row', gap: 16, marginTop: 'auto', paddingTop: 16 },
  clearBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#1E293B' },
  clearBtnText: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  applyBtn: { flex: 2, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#38BDF8' },
  applyBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
});
