import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useChat } from '../../../contexts/ChatContext';
import { useAuth } from '../../../contexts/AuthContext';

const getInitials = (name: string) => {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';
};

export default function ChatsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { conversations, loadConversations, connect } = useChat();
  const { token } = useAuth();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const initChat = async () => {
        if (token && isActive) {
          await connect(token);
          await loadConversations(token);
        }
      };
      initChat();
      return () => { isActive = false; };
    }, [connect, loadConversations, token])
  );

  const filteredChats = conversations.filter(chat => 
    chat.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    chat.latestMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: any) => {
    // Format timestamp nicely
    const time = item.latestMessage?.timestamp 
      ? new Date(item.latestMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
      
    return (
      <TouchableOpacity 
        style={styles.chatCard}
        onPress={() => router.push({ pathname: '/dashboard/conversation/[id]', params: { id: item.contactId, name: item.contactName } } as any)}
      >
        <View style={[styles.avatar, styles.initialsAvatar]}>
          <Text style={styles.initialsText}>{getInitials(item.contactName)}</Text>
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.name}>{item.contactName}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <Text style={[styles.message, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
            {item.latestMessage?.messageType === 'image' ? '📷 Photo' : 
             item.latestMessage?.messageType === 'document' ? '📄 Document' : 
             item.latestMessage?.content || 'Started a conversation'}
          </Text>
        </View>

        {item.unreadCount > 0 && (
          <View style={styles.unreadDot} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/dashboard/call-history')}>
          <Ionicons name="call-outline" size={20} color="#F8FAFC" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#F8FAFC' },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingVertical: 12 },
  chatCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1E293B' },
  initialsAvatar: { backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  initialsText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  chatInfo: { flex: 1, marginLeft: 16 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  time: { fontSize: 12, color: '#64748B' },
  message: { fontSize: 14, color: '#94A3B8' },
  unreadMessage: { color: '#F8FAFC', fontWeight: '600' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#38BDF8', marginLeft: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', marginHorizontal: 24, marginTop: 16, marginBottom: 8, paddingHorizontal: 16, borderRadius: 24, height: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 15, height: '100%' }
});
