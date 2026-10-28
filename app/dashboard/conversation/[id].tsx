import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useChat, ChatMessage } from '../../../contexts/ChatContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';

const getInitials = (name: string) => {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

type ListItem = 
  | { type: 'message'; data: ChatMessage }
  | { type: 'date'; date: string; key: string };

export default function ChatScreen() {
  const { id: otherUserId, name: contactName } = useLocalSearchParams<{ id: string; name: string }>();
  const { messages, sendMessage, loadHistory, connect } = useChat();
  const { token, user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  const displayName = contactName || 'Chat';

  useEffect(() => {
    let isActive = true;
    const initChat = async () => {
      if (otherUserId && typeof otherUserId === 'string') {
        if (token && user && isActive) {
          setCurrentUserId(user.id);
          await connect(token);
          await loadHistory(token, otherUserId);
        }
      }
    };
    initChat();
    return () => { isActive = false; };
  }, [otherUserId, token, user]);

  const handleSend = () => {
    if (inputText.trim() && typeof otherUserId === 'string' && currentUserId) {
      sendMessage(otherUserId, inputText.trim());
      setInputText('');
    }
  };

  const handleAudioCall = () => {
    if (otherUserId) {
      router.push({
        pathname: '/dashboard/call/[id]',
        params: { id: otherUserId, name: displayName, mode: 'outgoing' },
      });
    }
  };

  // Build list items with date separators, sorted oldest-first then reversed for inverted FlatList
  const buildListItems = (): ListItem[] => {
    if (messages.length === 0) return [];

    const sorted = [...messages].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const items: ListItem[] = [];
    let lastDateStr = '';

    for (const msg of sorted) {
      const dateStr = new Date(msg.timestamp).toDateString();
      if (dateStr !== lastDateStr) {
        items.push({ type: 'date', date: msg.timestamp, key: `date-${dateStr}` });
        lastDateStr = dateStr;
      }
      items.push({ type: 'message', data: msg });
    }

    // Reverse for inverted FlatList (newest first)
    return items.reverse();
  };

  const listItems = buildListItems();

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>{formatDate(item.date)}</Text>
        </View>
      );
    }

    const msg = item.data;
    const isMe = msg.senderId === currentUserId;

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.theirMessageRow]}>
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          {msg.messageType === 'image' ? (
            <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
              [Image: {msg.content}]
            </Text>
          ) : msg.messageType === 'document' ? (
            <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
              [Document: {msg.content}]
            </Text>
          ) : (
            <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
              {msg.content}
            </Text>
          )}
        </View>
        <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
          {formatTime(msg.timestamp)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </TouchableOpacity>
          
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{getInitials(displayName)}</Text>
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Offline</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={handleAudioCall} style={styles.headerCallButton}>
            <Ionicons name="call" size={20} color="#38BDF8" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      <FlatList
        data={listItems}
        keyExtractor={(item, index) => {
          if (item.type === 'date') return item.key;
          return item.data.id ? item.data.id.toString() : `msg-${index}`;
        }}
        renderItem={renderItem}
        inverted={true}
        contentContainerStyle={styles.listContent}
      />

      {/* Input Area */}
      <SafeAreaView edges={Platform.OS === 'ios' ? ['bottom'] : []} style={styles.inputSafeArea}>
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={() => setShowShareModal(true)}
          >
            <Ionicons name="add" size={24} color="#F8FAFC" />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#64748B"
              multiline
            />
            <TouchableOpacity style={styles.micButton}>
              <Ionicons name="mic" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Share Files Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowShareModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Share Files</Text>
            
            <View style={styles.modalOptions}>
              <TouchableOpacity style={styles.modalOption}>
                <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
                  <Ionicons name="document-text-outline" size={28} color="#FB923C" />
                </View>
                <Text style={styles.modalOptionText}>Document</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalOption}>
                <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                  <Ionicons name="image-outline" size={28} color="#34D399" />
                </View>
                <Text style={styles.modalOptionText}>Image</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowShareModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  // Header
  headerSafeArea: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748B',
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: '#64748B',
  },
  headerCallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  // Messages
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dateSeparator: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  messageRow: {
    marginVertical: 2,
  },
  myMessageRow: {
    alignItems: 'flex-end',
  },
  theirMessageRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#F8FAFC',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 3,
    marginBottom: 4,
  },
  myMessageTime: {
    color: '#64748B',
  },
  theirMessageTime: {
    color: '#64748B',
  },
  // Input
  inputSafeArea: {
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingRight: 8,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
  },
  micButton: {
    width: 36,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 24,
  },
  modalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  modalOption: {
    alignItems: 'center',
  },
  modalOptionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  modalCancelButton: {
    backgroundColor: '#334155',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
