import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../contexts/AuthContext';
import { useCustomAlert } from '../../../contexts/AlertContext';

const PROPERTY_TYPES = ['Self Contain', 'Mini Flat', 'Apartment', 'Duplex', 'Bungalow', 'Terrace', 'Penthouse', 'Shop', 'Office Space', 'Land'];
const AMENITY_OPTIONS = ['Pool', 'Gym', 'Parking', 'Security', 'Elevator', 'Balcony', 'Laundry', 'Pet Friendly', 'Storage', 'Concierge', 'Rooftop', 'Generator'];

const API_BASE_URL = 'http://10.231.149.52:5004/api/properties';

export default function AddPropertyScreen() {
  const router = useRouter();
  const { token } = useAuth();
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

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const replaceImage = async (indexToReplace: number) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages(prev => {
        const newImages = [...prev];
        newImages[indexToReplace] = result.assets[0].uri;
        return newImages;
      });
    }
  };

  const handlePublish = async () => {
    if (!token) {
      showAlert('Not Logged In', 'Please log in before listing a property.');
      return;
    }

    if (!title || !price || !location || !selectedType) {
      showAlert('Missing Info', 'Please fill in the title, price, location, and property type.');
      return;
    }

    setIsPublishing(true);

    try {
      // 1. Create Property
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price) || 0,
          location,
          beds: parseInt(beds) || 0,
          baths: parseInt(baths) || 0,
          sqft: parseInt(sqft) || 0,
          propertyType: selectedType,
          amenities: selectedAmenities
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to create property');
      }
      
      const property = await response.json();
      
      // 2. Upload Images
      for (let uri of images) {
        const formData = new FormData();
        formData.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
        
        await fetch(`${API_BASE_URL}/${property.id}/images`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`
            // REMOVED 'Content-Type': 'multipart/form-data' so fetch sets it automatically with the correct boundary
          },
        });
      }

      showAlert('Listed!', 'Your property and photos have been published to RentFlow.', () => router.back());
    } catch (error: any) {
      console.error(error);
      showAlert('Error', error.message || 'Failed to publish listing.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>List a Property</Text>
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
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                  <Ionicons name="close" size={16} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.replaceImageBtn} onPress={() => replaceImage(index)}>
                  <Ionicons name="refresh" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
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
        <TouchableOpacity 
          style={[styles.publishButton, isPublishing && { opacity: 0.7 }]} 
          onPress={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <ActivityIndicator color="#0F172A" />
          ) : (
            <Ionicons name="rocket-outline" size={22} color="#0F172A" />
          )}
          <Text style={styles.publishButtonText}>
            {isPublishing ? 'Publishing...' : 'Publish Listing'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 24, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 24 },

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 14 },

  // Photo upload
  photoUpload: { height: 180, backgroundColor: '#1E293B', borderRadius: 20, borderWidth: 2, borderColor: 'rgba(56, 189, 248, 0.15)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photoUploadText: { color: '#38BDF8', fontSize: 16, fontWeight: '600', marginTop: 10 },
  photoUploadHint: { color: '#64748B', fontSize: 12, marginTop: 4 },
  imageWrapper: { position: 'relative', marginRight: 12 },
  previewImage: { width: 120, height: 120, borderRadius: 16 },
  removeImageBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0F172A' },
  replaceImageBtn: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#38BDF8', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0F172A' },

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
