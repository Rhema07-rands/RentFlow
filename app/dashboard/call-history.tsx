import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

const MOCK_CALLS = [
  {
    id: '1',
    name: 'Gabriel Akhimien',
    type: 'missed', // missed, incoming, outgoing
    time: 'Yesterday, 12:43 PM',
  },
  {
    id: '2',
    name: 'Onose Derek-Ayemere',
    type: 'incoming',
    time: 'Jul 12, 3:29 PM',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100',
  },
  {
    id: '3',
    name: 'Sarah Jenkins',
    type: 'outgoing',
    time: 'Jul 11, 10:15 AM',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100',
  },
];

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export default function CallHistoryScreen() {
  const router = useRouter();

  const handleCall = (id: string, name: string) => {
    router.push({
      pathname: '/dashboard/call/[id]',
      params: { id, name, mode: 'outgoing' },
    });
  };

  const renderItem = ({ item }: any) => {
    let iconName: keyof typeof Ionicons.glyphMap = 'call';
    let iconColor = '#64748B';
    let typeText = 'Incoming';

    if (item.type === 'missed') {
      iconName = 'arrow-down';
      iconColor = '#EF4444'; // red
      typeText = 'Missed';
    } else if (item.type === 'outgoing') {
      iconName = 'arrow-up';
      iconColor = '#10B981'; // green
      typeText = 'Outgoing';
    } else {
      iconName = 'arrow-down';
      iconColor = '#3B82F6'; // blue
    }

    return (
      <View style={styles.callCard}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.initialsAvatar]}>
            <Text style={styles.initialsText}>{getInitials(item.name)}</Text>
          </View>
        )}
        
        <View style={styles.callInfo}>
          <Text style={[styles.name, item.type === 'missed' && styles.nameMissed]}>{item.name}</Text>
          <View style={styles.callDetails}>
            <Ionicons name={iconName} size={14} color={iconColor} style={styles.typeIcon} />
            <Text style={styles.time}>{typeText} • {item.time}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleCall(item.id, item.name)}
        >
          <Ionicons name="call-outline" size={22} color="#38BDF8" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Call History</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={MOCK_CALLS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    paddingVertical: 12,
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
  },
  initialsAvatar: {
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  callInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  nameMissed: {
    color: '#EF4444',
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    marginRight: 6,
  },
  time: {
    fontSize: 14,
    color: '#94A3B8',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
});
