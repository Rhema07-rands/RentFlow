import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCustomAlert } from '../../../../contexts/AlertContext';
import * as ImagePicker from 'expo-image-picker';

const PROPERTY_TYPES = ['Self Contain', 'Mini Flat', 'Apartment', 'Duplex', 'Bungalow', 'Terrace', 'Penthouse', 'Shop', 'Office Space', 'Land'];
const AMENITY_OPTIONS = ['Pool', 'Gym', 'Parking', 'Security', 'Elevator', 'Balcony', 'Laundry', 'Pet Friendly', 'Storage', 'Concierge', 'Rooftop', 'Generator'];

// Mock data to prefill the form
const MOCK_DATA: Record<string, any> = {
  '1': {
    title: 'Modern Loft in Downtown',
    price: '2500',
    location: 'Downtown, City Center',
    description: 'A beautiful modern loft situated in the heart of downtown with great views.',
    beds: '1',
    baths: '1',
    sqft: '850',
    propertyType: 'Apartment',
    amenities: ['Parking', 'Security', 'Gym'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1de24244ed?q=80&w=400']
  },
  '2': {
    title: 'Cozy Studio near Campus',
    price: '1200',
    location: 'University District',
    description: 'Perfect for students. Quiet and close to all amenities.',
    beds: '1',
    baths: '1',
    sqft: '500',
    propertyType: 'Self Contain',
    amenities: ['Security', 'Laundry'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400']
  }
};

export default function EditListingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showAlert } = useCustomAlert();
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [sqft, setSqft] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Initialize with mock data based on ID
  useEffect(() => {
    const data = MOCK_DATA[id as string] || MOCK_DATA['1'];
    setTitle(data.title);
    setPrice(data.price);
    setLocation(data.location);
    setDescription(data.description);
    setBeds(data.beds);
    setBaths(data.baths);
    setSqft(data.sqft);
    setSelectedType(data.propertyType);
    setSelectedAmenities(data.amenities || []);
    setImages(data.images || []);
  }, [id]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handlePublish = async () => {
    if (!title || !price || !location || !selectedType) {
      showAlert('Missing Info', 'Please fill in the title, price, location, and property type.');
      return;
    }

    setIsPublishing(true);
    
    // Simulate network delay
    setTimeout(() => {
      setIsPublishing(false);
      showAlert('Updated!', 'Your property changes have been saved.', () => router.back());
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Property</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {images.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.previewImage} />
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
            <Ionicons name="camera-outline" size={36} color="#38BDF8" />
            <Text style={styles.photoUploadText}>Tap to add photos</Text>
            <Text style={styles.photoUploadHint}>Add up to 10 photos</Text>
          </TouchableOpacity>
        </View>

        {/* Property Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Type</Text>
          <View style={styles.typeGrid}>
            {PROPERTY_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[styles.typeChipText, selectedType === type && styles.typeChipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Modern 2-bedroom apartment"
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Price (₦ per year)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2400000"
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Lekki Phase 1, Lagos"
            placeholderTextColor="#64748B"
            value={location}
            onChangeText={setLocation}
          />

          <View style={styles.statsInputRow}>
            <View style={styles.statsInputItem}>
              <Text style={styles.label}>Beds</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={beds}
                onChangeText={setBeds}
              />
            </View>
            <View style={styles.statsInputItem}>
              <Text style={styles.label}>Baths</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={baths}
                onChangeText={setBaths}
              />
            </View>
            <View style={styles.statsInputItem}>
              <Text style={styles.label}>Sq ft</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={sqft}
                onChangeText={setSqft}
              />
            </View>
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your property..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {AMENITY_OPTIONS.map(amenity => {
              const isSelected = selectedAmenities.includes(amenity);
              return (
                <TouchableOpacity
                  key={amenity}
                  style={[styles.amenityChip, isSelected && styles.amenityChipActive]}
                  onPress={() => toggleAmenity(amenity)}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={isSelected ? '#10B981' : '#475569'}
                  />
                  <Text style={[styles.amenityChipText, isSelected && styles.amenityChipTextActive]}>
                    {amenity}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Publish */}
        <TouchableOpacity style={styles.publishButton} onPress={handlePublish} disabled={isPublishing}>
          <Ionicons name="save-outline" size={22} color="#0F172A" />
          <Text style={styles.publishButtonText}>{isPublishing ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 24 },

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 14 },

  // Photo upload
  photoUpload: { height: 180, backgroundColor: '#1E293B', borderRadius: 20, borderWidth: 2, borderColor: 'rgba(56, 189, 248, 0.15)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photoUploadText: { color: '#38BDF8', fontSize: 16, fontWeight: '600', marginTop: 10 },
  photoUploadHint: { color: '#64748B', fontSize: 12, marginTop: 4 },
  previewImage: { width: 120, height: 120, borderRadius: 16, marginRight: 12 },

  // Property type
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#1E293B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  typeChipActive: { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38BDF8' },
  typeChipText: { color: '#94A3B8', fontWeight: '600', fontSize: 14 },
  typeChipTextActive: { color: '#38BDF8' },

  // Inputs
  label: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: '#1E293B', color: '#F8FAFC', padding: 16, borderRadius: 14, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  textArea: { height: 120, paddingTop: 16 },
  statsInputRow: { flexDirection: 'row', gap: 12 },
  statsInputItem: { flex: 1 },

  // Amenities
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#1E293B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  amenityChipActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  amenityChipText: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  amenityChipTextActive: { color: '#10B981' },

  // Publish
  publishButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#38BDF8', paddingVertical: 18, borderRadius: 16, gap: 10, shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  publishButtonText: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
});
