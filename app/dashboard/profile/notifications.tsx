import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const router = useRouter();
  
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [messagesEnabled, setMessagesEnabled] = useState(true);
  const [updatesEnabled, setUpdatesEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const renderToggle = (title: string, desc: string, value: boolean, onValueChange: (val: boolean) => void) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#334155', true: '#38BDF8' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global Alerts</Text>
          {renderToggle('Push Notifications', 'Receive push alerts on this device', pushEnabled, setPushEnabled)}
          {renderToggle('Email Notifications', 'Receive daily email summaries', emailEnabled, setEmailEnabled)}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specific Alerts</Text>
          {renderToggle('New Messages', 'Get notified when someone messages you', messagesEnabled, setMessagesEnabled)}
          {renderToggle('Property Updates', 'Status changes on your listings', updatesEnabled, setUpdatesEnabled)}
          {renderToggle('Marketing & Offers', 'Promotions and new features', marketingEnabled, setMarketingEnabled)}
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
  content: { padding: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#475569', letterSpacing: 1.2, marginBottom: 24, textTransform: 'uppercase' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  toggleInfo: { flex: 1, paddingRight: 16 },
  toggleTitle: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', marginBottom: 4 },
  toggleDesc: { fontSize: 13, color: '#94A3B8' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 32 }
});
