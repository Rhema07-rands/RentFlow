import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../contexts/AlertContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { showAlert } = useCustomAlert();
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isImagePickerModalVisible, setImagePickerModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    setImagePickerModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Please allow access to your photo library to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      setProfileImageBase64(result.assets[0].base64 || null);
    }
  };

  const takePhoto = async () => {
    setImagePickerModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Please allow access to your camera to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      setProfileImageBase64(result.assets[0].base64 || null);
    }
  };

  const handlePickImage = () => {
    setImagePickerModalVisible(true);
  };

  const handleRemovePhoto = () => {
    setImagePickerModalVisible(false);
    setProfileImage(null);
    setProfileImageBase64(null);
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      showAlert('Missing Fields', 'Name, email, and password are required.');
      return;
    }

    if (password.length < 8) {
      showAlert('Invalid Password', 'Password must be at least 8 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'Your passwords do not match.');
      return;
    }

    setIsLoading(true);

    const success = await register({
      name,
      email,
      password,
      phoneNumber: phone,
      gender: selectedGender,
      address,
      profilePictureBase64: profileImageBase64
    });

    setIsLoading(false);

    if (success) {
      showAlert('Success', 'Registration successful! You can now log in.');
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Account</Text>
      </View>
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView contentContainerStyle={[styles.form, { flexGrow: 1 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Profile Picture Picker */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} activeOpacity={0.7}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#475569" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to add profile photo</Text>
        </View>

        <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748B" placeholder="John Doe" value={name} onChangeText={setName} maxLength={50} />
        </View>
        <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748B" placeholder="name@example.com" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" maxLength={100} />
        </View>
        <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748B" placeholder="+234 800 000 0000" keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={15} />
        </View>
        <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Other'].map(gender => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderOption,
                    selectedGender === gender && styles.genderOptionActive,
                  ]}
                  onPress={() => setSelectedGender(gender)}
                >
                  <Text style={[
                    styles.genderText,
                    selectedGender === gender && styles.genderTextActive,
                  ]}>{gender}</Text>
                </TouchableOpacity>
              ))}
            </View>
        </View>
        <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} placeholderTextColor="#64748B" placeholder="123 Main Street, Lagos" value={address} onChangeText={setAddress} maxLength={150} />
        </View>
        <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={{ position: 'relative', justifyContent: 'center' }}>
              <TextInput 
                style={[styles.input, { paddingRight: 50 }]} 
                placeholderTextColor="#64748B" 
                placeholder="••••••••" 
                secureTextEntry={!showPassword} 
                value={password} 
                onChangeText={setPassword} 
                maxLength={50} 
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 16 }}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>
        </View>
        <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={{ position: 'relative', justifyContent: 'center' }}>
              <TextInput 
                style={[styles.input, { paddingRight: 50 }]} 
                placeholderTextColor="#64748B" 
                placeholder="••••••••" 
                secureTextEntry={!showConfirmPassword} 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                maxLength={50} 
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 16 }}>
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>
        </View>
        
        <TouchableOpacity 
            style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Image Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isImagePickerModalVisible}
        onRequestClose={() => setImagePickerModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setImagePickerModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Picture</Text>
              <Text style={styles.modalSubtitle}>Choose how you want to add your photo</Text>
            </View>
            
            <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={24} color="#F8FAFC" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <View style={styles.modalDivider} />
            
            <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#F8FAFC" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {profileImage && (
              <>
                <View style={styles.modalDivider} />
                <TouchableOpacity style={styles.modalOption} onPress={handleRemovePhoto}>
                  <Ionicons name="trash-outline" size={24} color="#EF4444" />
                  <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>Remove Photo</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setImagePickerModalVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { 
    paddingHorizontal: 24, 
    paddingTop: 40,
    paddingBottom: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 24,
    top: 30, // to center it vertically within the header area considering paddingTop
  },
  title: { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
  form: { padding: 24 },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
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
    borderWidth: 3,
    borderColor: '#38BDF8',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  avatarHint: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
  },

  inputContainer: { marginBottom: 20 },
  label: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1E293B', color: '#F8FAFC', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },

  // Gender selector
  genderRow: { flexDirection: 'row', gap: 12 },
  genderOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  genderOptionActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  genderText: { color: '#64748B', fontSize: 15, fontWeight: '600' },
  genderTextActive: { color: '#38BDF8' },
  loginText: { color: '#F8FAFC', fontSize: 14, fontWeight: '500' },
  loginLink: { color: '#38BDF8', fontSize: 14, fontWeight: '700' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { marginBottom: 20 },
  modalTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  modalSubtitle: { color: '#94A3B8', fontSize: 14 },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 14 },
  modalOptionText: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  modalCancelButton: { marginTop: 16, backgroundColor: '#334155', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  modalCancelButtonText: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },

  primaryButton: { backgroundColor: '#38BDF8', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginTop: 12, marginBottom: 40 },
  primaryButtonText: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
});
