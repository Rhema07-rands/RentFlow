import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../contexts/AuthContext';
import { useCustomAlert } from '../../../contexts/AlertContext';

// We fetch the API base URL. Using the same structure as other files.
const API_BASE_URL = 'http://10.231.149.52:5004/api/auth';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showAlert } = useCustomAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  // Original State to track changes
  const [originalFirstName, setOriginalFirstName] = useState('');
  const [originalLastName, setOriginalLastName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  
  // Local state for newly picked image before upload
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Split name into first and last
        const nameParts = (data.name || '').split(' ');
        const fetchedFirstName = nameParts[0] || '';
        const fetchedLastName = nameParts.slice(1).join(' ') || '';
        const fetchedEmail = data.email || '';
        const fetchedPhone = data.phoneNumber || '';

        setFirstName(fetchedFirstName);
        setLastName(fetchedLastName);
        setEmail(fetchedEmail);
        setPhone(fetchedPhone);
        setProfilePictureUrl(data.profilePictureUrl || null);

        // Save original values for comparison
        setOriginalFirstName(fetchedFirstName);
        setOriginalLastName(fetchedLastName);
        setOriginalEmail(fetchedEmail);
        setOriginalPhone(fetchedPhone);
      } else {
        showAlert('Error', 'Failed to load profile.');
      }
    } catch (e) {
      showAlert('Error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !email.trim()) {
      showAlert('Validation', 'First Name and Email are required.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      formData.append('Name', fullName);
      formData.append('Email', email.trim());
      formData.append('PhoneNumber', phone.trim());

      if (localImageUri) {
        const filename = localImageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('ProfilePicture', {
          uri: localImageUri,
          name: filename,
          type,
        } as any);
      }

      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData, fetch does it automatically with boundary
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfilePictureUrl(data.profilePictureUrl);
        setLocalImageUri(null); // Clear local preview since it's now uploaded
        
        // Update original states so the button deactivates again
        setOriginalFirstName(firstName);
        setOriginalLastName(lastName);
        setOriginalEmail(email);
        setOriginalPhone(phone);

        showAlert('Success', 'Profile updated successfully!', 'success');
      } else {
        const errorText = await res.text();
        showAlert('Error', errorText || 'Failed to update profile.');
      }
    } catch (error) {
      showAlert('Error', 'Could not connect to server.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  // Derive initials for fallback avatar
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const displayImage = localImageUri || profilePictureUrl;

  const hasChanges = 
    firstName !== originalFirstName || 
    lastName !== originalLastName || 
    email !== originalEmail || 
    phone !== originalPhone || 
    localImageUri !== null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {displayImage ? (
                <Image source={{ uri: displayImage }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials || '?'}</Text>
                </View>
              )}
              
              <TouchableOpacity style={styles.cameraBadge} onPress={handlePickImage}>
                <Ionicons name="camera" size={16} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="john.doe@example.com"
              placeholderTextColor="#475569"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor="#475569"
              keyboardType="phone-pad"
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={[styles.saveButton, (saving || !hasChanges) && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <ActivityIndicator color="#0F172A" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  headerRight: {
    width: 32, // to balance the back button
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#38BDF8',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#38BDF8',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F8FAFC',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#0F172A',
  },
  saveButton: {
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
});
