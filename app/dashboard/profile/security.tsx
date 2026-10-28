import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../../contexts/AuthContext';
import { useCustomAlert } from '../../../contexts/AlertContext';

export default function SecurityScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { showAlert } = useCustomAlert();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      if (showAlert) showAlert('error', 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      if (showAlert) showAlert('error', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      if (showAlert) showAlert('error', 'New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://10.231.149.52:5004/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (showAlert) showAlert('success', 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        router.back();
      } else {
        if (showAlert) showAlert('error', data.message || 'Failed to change password');
      }
    } catch (error) {
      if (showAlert) showAlert('error', 'Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (label: string, value: string, setValue: (val: string) => void, showPassword: boolean, setShowPassword: (val: boolean) => void) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.passwordContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          secureTextEntry={!showPassword}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionDescription}>
            Update your password to keep your account secure. We recommend using a strong password that you don't use elsewhere.
          </Text>

          <View style={styles.formContainer}>
            {renderInput(
              'Current Password',
              currentPassword,
              setCurrentPassword,
              showCurrentPassword,
              setShowCurrentPassword
            )}

            {renderInput(
              'New Password',
              newPassword,
              setNewPassword,
              showNewPassword,
              setShowNewPassword
            )}

            {renderInput(
              'Confirm New Password',
              confirmNewPassword,
              setConfirmNewPassword,
              showConfirmPassword,
              setShowConfirmPassword
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!currentPassword || !newPassword || !confirmNewPassword) && styles.submitButtonDisabled
            ]}
            onPress={handleChangePassword}
            disabled={isLoading || !currentPassword || !newPassword || !confirmNewPassword}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.submitButtonText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 24,
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  submitButton: {
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(56, 189, 248, 0.5)',
  },
  submitButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
});
