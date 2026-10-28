import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    
    if (success) {
      router.push('/dashboard/explore' as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.title}>Welcome Back</Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={styles.input} 
              placeholderTextColor="#64748B" 
              placeholder="name@example.com" 
              keyboardType="email-address" 
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
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
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 16 }}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>
        </View>
        
        <TouchableOpacity 
            style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.primaryButtonText}>Log In</Text>
            )}
        </TouchableOpacity>
      </View>
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
  inputContainer: { marginBottom: 20 },
  label: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1E293B', color: '#F8FAFC', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  primaryButton: { backgroundColor: '#38BDF8', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginTop: 12 },
  primaryButtonText: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
});
