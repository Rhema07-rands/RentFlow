import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const renderSettingItem = (icon: any, title: string, subtitle: string, route: string) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={() => router.push(route as any)}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color="#38BDF8" />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#475569" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          {renderSettingItem('person-outline', 'Personal Information', 'Name, email, phone number', '/dashboard/profile/personal-info')}
          {renderSettingItem('shield-checkmark-outline', 'Security', 'Password, biometric login', '/dashboard/profile/security')}
          {renderSettingItem('notifications-outline', 'Notifications', 'Push and email alerts', '/dashboard/profile/notifications')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROPERTY</Text>
          {renderSettingItem('home-outline', 'My Listings', 'Manage your rented properties', '/dashboard/profile/my-listings')}
          {renderSettingItem('star-outline', 'My Reviews', 'See what tenants are saying', '/dashboard/profile/my-reviews')}
        </View>

        {user ? (
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: '#38BDF8' }]} 
            onPress={() => router.push('/login' as any)}
          >
            <Text style={[styles.logoutText, { color: '#0F172A' }]}>Sign In / Register</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { 
    paddingHorizontal: 24, 
    paddingTop: 32,
    paddingBottom: 24, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)' 
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#F8FAFC' },
  scrollContent: { paddingBottom: 40, paddingTop: 32 },
  section: { paddingHorizontal: 24, marginBottom: 32 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#475569', letterSpacing: 1.2, marginBottom: 16 },
  settingItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1E293B', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12 
  },
  settingIconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: 'rgba(56, 189, 248, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16 
  },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  settingSubtitle: { fontSize: 13, color: '#94A3B8' },
  logoutButton: { 
    marginTop: 16, 
    marginHorizontal: 24, 
    paddingVertical: 18, 
    borderRadius: 16, 
    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
    alignItems: 'center' 
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '700' }
});
