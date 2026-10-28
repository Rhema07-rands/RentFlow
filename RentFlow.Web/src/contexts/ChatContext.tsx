import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_BASE } from '../config/api';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: string; // 'text' | 'image' | 'document' | 'voice'
  timestamp: string;
  isRead: boolean;
}

export interface ConversationInfo {
  contactId: string;
  contactName: string;
  contactAvatar?: string;
  latestMessage: ChatMessage | null;
  unreadCount: number;
}

interface ChatContextType {
  conversations: ConversationInfo[];
  messages: ChatMessage[];
  activeContactId: string | null;
  isConnected: boolean;
  loadConversations: (token: string) => Promise<void>;
  loadHistory: (token: string, contactId: string) => Promise<void>;
  sendMessage: (receiverId: string, content: string, messageType?: string) => Promise<void>;
  uploadAttachment: (file: File | Blob, filename?: string) => Promise<string | null>;
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  messages: [],
  activeContactId: null,
  isConnected: false,
  loadConversations: async () => {},
  loadHistory: async () => {},
  sendMessage: async () => {},
  uploadAttachment: async () => null,
  connect: async () => {},
  disconnect: async () => {},
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const hubRef = useRef<signalR.HubConnection | null>(null);
  const activeContactRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    activeContactRef.current = activeContactId;
  }, [activeContactId]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const loadConversations = useCallback(async (authToken: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  }, []);

  const connect = useCallback(async (authToken: string) => {
    if (!authToken || hubRef.current) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/chathub`, {
        accessTokenFactory: () => authToken,
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveMessage', (message: ChatMessage) => {
      const currentContact = activeContactRef.current;

      setMessages(prev => {
        if (
          currentContact &&
          (message.senderId.toLowerCase() === currentContact.toLowerCase() ||
            message.receiverId.toLowerCase() === currentContact.toLowerCase())
        ) {
          // If this message already exists by real DB ID, do not add duplicate
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }

          // If this is our own message returning from the server, replace any matching optimistic message
          const optimisticIndex = prev.findIndex(
            m =>
              m.id.startsWith('opt_') &&
              m.senderId.toLowerCase() === message.senderId.toLowerCase() &&
              m.receiverId.toLowerCase() === message.receiverId.toLowerCase() &&
              m.content === message.content
          );

          if (optimisticIndex !== -1) {
            const updated = [...prev];
            updated[optimisticIndex] = message;
            return updated;
          }

          return [...prev, message];
        }
        return prev;
      });

      setConversations(prev => {
        const otherId =
          user && message.senderId.toLowerCase() === user.id.toLowerCase()
            ? message.receiverId
            : message.senderId;

        const exists = prev.some(c => c.contactId.toLowerCase() === otherId.toLowerCase());
        if (exists) {
          const updated = prev.map(c =>
            c.contactId.toLowerCase() === otherId.toLowerCase()
              ? {
                  ...c,
                  latestMessage: message,
                  unreadCount:
                    currentContact?.toLowerCase() !== otherId.toLowerCase() &&
                    message.senderId.toLowerCase() === otherId.toLowerCase()
                      ? c.unreadCount + 1
                      : c.unreadCount,
                }
              : c
          );
          return updated.sort((a, b) => {
            const tA = a.latestMessage ? new Date(a.latestMessage.timestamp).getTime() : 0;
            const tB = b.latestMessage ? new Date(b.latestMessage.timestamp).getTime() : 0;
            return tB - tA;
          });
        } else {
          // Immediately insert new conversation card into list so it's not empty
          const newConv: ConversationInfo = {
            contactId: otherId,
            contactName: 'Property Owner',
            latestMessage: message,
            unreadCount: 0,
          };
          if (tokenRef.current) {
            loadConversations(tokenRef.current);
          }
          return [newConv, ...prev];
        }
      });
    });

    connection.onreconnected(() => setIsConnected(true));
    connection.onclose(() => setIsConnected(false));

    try {
      await connection.start();
      hubRef.current = connection;
      setIsConnected(true);
    } catch (e) {
      console.error('SignalR ChatHub Connection Error:', e);
    }
  }, [user, loadConversations]);

  const disconnect = useCallback(async () => {
    if (hubRef.current) {
      await hubRef.current.stop();
      hubRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (token && user) {
      connect(token);
      loadConversations(token);
    } else {
      disconnect();
      setConversations([]);
      setMessages([]);
    }
  }, [token, user, connect, loadConversations, disconnect]);

  const loadHistory = useCallback(async (authToken: string, contactId: string) => {
    setActiveContactId(contactId);
    activeContactRef.current = contactId;
    try {
      const res = await fetch(`${API_BASE}/api/chat/history/${contactId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setConversations(prev =>
          prev.map(c =>
            c.contactId.toLowerCase() === contactId.toLowerCase() ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
  }, []);

  const sendMessage = useCallback(async (receiverId: string, content: string, messageType: string = 'text') => {
    // Optimistically append outgoing message locally so UI updates instantly
    if (user) {
      const optimisticMsg: ChatMessage = {
        id: 'opt_' + Date.now().toString(),
        senderId: user.id,
        receiverId: receiverId,
        content: content,
        messageType: messageType,
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      setMessages(prev => [...prev, optimisticMsg]);

      // Also ensure conversation appears in left list
      setConversations(prev => {
        const exists = prev.some(c => c.contactId.toLowerCase() === receiverId.toLowerCase());
        if (exists) {
          return prev.map(c =>
            c.contactId.toLowerCase() === receiverId.toLowerCase()
              ? { ...c, latestMessage: optimisticMsg }
              : c
          );
        } else {
          return [
            {
              contactId: receiverId,
              contactName: 'Property Owner',
              latestMessage: optimisticMsg,
              unreadCount: 0,
            },
            ...prev,
          ];
        }
      });
    }

    if (hubRef.current && hubRef.current.state === signalR.HubConnectionState.Connected) {
      try {
        await hubRef.current.invoke('SendMessage', receiverId, content, messageType);
      } catch (e) {
        console.error('Failed to send message via SignalR', e);
      }
    } else if (tokenRef.current) {
      await connect(tokenRef.current);
      if (hubRef.current) {
        await (hubRef.current as signalR.HubConnection).invoke('SendMessage', receiverId, content, messageType);
      }
    }
  }, [user, connect]);

  const uploadAttachment = useCallback(async (file: File | Blob, filename?: string): Promise<string | null> => {
    if (!tokenRef.current) return null;
    try {
      const formData = new FormData();
      formData.append('file', file, filename || (file as File).name || 'attachment');

      const res = await fetch(`${API_BASE}/api/chat/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return data.url || data.Url;
      }
      return null;
    } catch (e) {
      console.error('Failed to upload chat attachment:', e);
      return null;
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        messages,
        activeContactId,
        isConnected,
        loadConversations,
        loadHistory,
        sendMessage,
        uploadAttachment,
        connect,
        disconnect,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
