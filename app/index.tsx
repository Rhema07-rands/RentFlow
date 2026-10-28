import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.logoPlaceholder, { justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="home" size={36} color="#0F172A" />
          </View>
          <Text style={styles.title}>Rent Flow</Text>
          <Text style={styles.subtitle}>Discover & Manage Properties</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/register' as any)}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/login' as any)}
          >
            <Text style={styles.secondaryButtonText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{marginTop: 20, alignItems: 'center'}}
            onPress={() => router.push('/dashboard/explore' as any)}
          >
             <Text style={{color: '#94A3B8', textDecorationLine: 'underline'}}>Skip for now (Demo)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { flex: 1, padding: 24, justifyContent: 'space-between' },
  header: { marginTop: 100, alignItems: 'center' },
  logoPlaceholder: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#38BDF8', marginBottom: 24, shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  title: { fontSize: 42, fontWeight: '800', color: '#F8FAFC', marginBottom: 8, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  buttonContainer: { marginBottom: 40, gap: 16 },
  primaryButton: { backgroundColor: '#38BDF8', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryButtonText: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
  secondaryButton: { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#38BDF8', fontSize: 18, fontWeight: '700' },
});
