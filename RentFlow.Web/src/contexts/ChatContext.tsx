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
  isDelivered: boolean;
  senderName?: string;
  senderAvatar?: string;
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
  setActiveContactId: (contactId: string | null) => void;
  isConnected: boolean;
  onlineContacts: Set<string>;
  isContactOnline: (contactId: string) => boolean;
  loadConversations: (token: string) => Promise<void>;
  loadHistory: (token: string, contactId: string) => Promise<void>;
  sendMessage: (receiverId: string, content: string, messageType?: string, contactName?: string) => Promise<void>;
  uploadAttachment: (file: File | Blob, filename?: string) => Promise<string | null>;
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  markAsRead: (contactId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  messages: [],
  activeContactId: null,
  setActiveContactId: () => {},
  isConnected: false,
  onlineContacts: new Set(),
  isContactOnline: () => false,
  loadConversations: async () => {},
  loadHistory: async () => {},
  sendMessage: async () => {},
  uploadAttachment: async () => null,
  connect: async () => {},
  disconnect: async () => {},
  markAsRead: async () => {},
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeContactId, setActiveContactIdState] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineContacts, setOnlineContacts] = useState<Set<string>>(new Set());

  const hubRef = useRef<signalR.HubConnection | null>(null);
  const activeContactRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const userRef = useRef<typeof user>(null);

  const setActiveContactId = useCallback((contactId: string | null) => {
    setActiveContactIdState(contactId);
    activeContactRef.current = contactId;
    if (!contactId) {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    activeContactRef.current = activeContactId;
  }, [activeContactId]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const isContactOnline = useCallback(
    (contactId: string): boolean => {
      if (!contactId) return false;
      return onlineContacts.has(contactId.toLowerCase());
    },
    [onlineContacts]
  );

  const queryOnlineUsers = useCallback(async (connection: signalR.HubConnection, ids: string[]) => {
    if (!ids || ids.length === 0) return;
    try {
      const onlineIds: string[] = await connection.invoke('GetOnlineUsers', ids);
      if (onlineIds && Array.isArray(onlineIds)) {
        setOnlineContacts((prev) => {
          const next = new Set(prev);
          onlineIds.forEach((id) => next.add(id.toLowerCase()));
          return next;
        });
      }
    } catch {
      // Ignore if hub is not ready
    }
  }, []);

  const loadConversations = useCallback(
    async (authToken: string) => {
      if (!authToken) return;
      try {
        const res = await fetch(`${API_BASE}/api/chat/conversations`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data: ConversationInfo[] = await res.json();
          setConversations(data);

          if (hubRef.current && hubRef.current.state === signalR.HubConnectionState.Connected) {
            const ids = data.map((c) => c.contactId);
            queryOnlineUsers(hubRef.current, ids);
          }
        }
      } catch (e) {
        console.error('Failed to load conversations', e);
      }
    },
    [queryOnlineUsers]
  );

  const markAsRead = useCallback(async (contactId: string) => {
    if (!contactId) return;
    if (hubRef.current && hubRef.current.state === signalR.HubConnectionState.Connected) {
      try {
        await hubRef.current.invoke('MarkMessagesAsRead', contactId);
      } catch (e) {
        console.error('Failed to mark messages as read', e);
      }
    }
  }, []);

  const connect = useCallback(
    async (authToken: string) => {
      if (!authToken || hubRef.current) return;

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE}/chathub`, {
          accessTokenFactory: () => authToken,
        })
        .withAutomaticReconnect()
        .build();

      // --- ReceiveMessage handler ---
      connection.on(
        'ReceiveMessage',
        (message: ChatMessage, senderName?: string, senderAvatar?: string) => {
          const currentContact = activeContactRef.current;
          const currentUser = userRef.current;

          // Only auto-mark as read if:
          // 1. User actually has THIS specific conversation open in the viewport
          // 2. The browser tab is active, visible, and focused (not in background or minimized)
          const isActivelyViewing =
            Boolean(currentContact) &&
            message.senderId.toLowerCase() === currentContact!.toLowerCase() &&
            !document.hidden &&
            document.hasFocus();

          if (isActivelyViewing) {
            message.isRead = true;
            message.isDelivered = true;
            connection.invoke('MarkMessagesAsRead', currentContact).catch(() => {});
          }

          setMessages((prev) => {
            if (
              currentContact &&
              (message.senderId.toLowerCase() === currentContact.toLowerCase() ||
                message.receiverId.toLowerCase() === currentContact.toLowerCase())
            ) {
              if (prev.some((m) => m.id.toLowerCase() === message.id.toLowerCase())) {
                return prev;
              }

              const optimisticIndex = prev.findIndex(
                (m) =>
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

          setConversations((prev) => {
            const isMyMessage = Boolean(
              currentUser && message.senderId.toLowerCase() === currentUser.id.toLowerCase()
            );
            const otherId = isMyMessage ? message.receiverId : message.senderId;
            const exists = prev.some((c) => c.contactId.toLowerCase() === otherId.toLowerCase());
            const resolvedSenderName = senderName || message.senderName;
            const resolvedSenderAvatar = senderAvatar || message.senderAvatar;

            if (exists) {
              const updated = prev.map((c) =>
                c.contactId.toLowerCase() === otherId.toLowerCase()
                  ? {
                      ...c,
                      contactName: !isMyMessage && resolvedSenderName ? resolvedSenderName : c.contactName,
                      contactAvatar: !isMyMessage && resolvedSenderAvatar ? resolvedSenderAvatar : c.contactAvatar,
                      latestMessage: message,
                      unreadCount:
                        currentContact?.toLowerCase() !== otherId.toLowerCase() && !isMyMessage
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
              const newConv: ConversationInfo = {
                contactId: otherId,
                contactName: !isMyMessage && resolvedSenderName ? resolvedSenderName : 'RentFlow Contact',
                contactAvatar: !isMyMessage ? resolvedSenderAvatar : undefined,
                latestMessage: message,
                unreadCount: currentContact?.toLowerCase() !== otherId.toLowerCase() && !isMyMessage ? 1 : 0,
              };
              if (tokenRef.current) {
                loadConversations(tokenRef.current);
              }
              return [newConv, ...prev];
            }
          });
        }
      );

      // --- UserOnline handler ---
      connection.on('UserOnline', (userId: string) => {
        setOnlineContacts((prev) => {
          const next = new Set(prev);
          next.add(userId.toLowerCase());
          return next;
        });
      });

      // --- UserOffline handler ---
      connection.on('UserOffline', (userId: string) => {
        setOnlineContacts((prev) => {
          const next = new Set(prev);
          next.delete(userId.toLowerCase());
          return next;
        });
      });

      // --- MessageDelivered handler ---
      connection.on('MessageDelivered', (messageIds: string[]) => {
        if (!messageIds || messageIds.length === 0) return;
        const idSet = new Set(messageIds.map((id) => id.toLowerCase()));

        setMessages((prev) =>
          prev.map((m) => (idSet.has(m.id.toLowerCase()) ? { ...m, isDelivered: true } : m))
        );

        setConversations((prev) =>
          prev.map((c) =>
            c.latestMessage && idSet.has(c.latestMessage.id.toLowerCase())
              ? { ...c, latestMessage: { ...c.latestMessage, isDelivered: true } }
              : c
          )
        );
      });

      // --- MessagesRead handler ---
      connection.on('MessagesRead', (messageIds: string[]) => {
        if (!messageIds || messageIds.length === 0) return;
        const idSet = new Set(messageIds.map((id) => id.toLowerCase()));

        setMessages((prev) =>
          prev.map((m) =>
            idSet.has(m.id.toLowerCase()) ? { ...m, isRead: true, isDelivered: true } : m
          )
        );

        setConversations((prev) =>
          prev.map((c) =>
            c.latestMessage && idSet.has(c.latestMessage.id.toLowerCase())
              ? { ...c, latestMessage: { ...c.latestMessage, isRead: true, isDelivered: true } }
              : c
          )
        );
      });

      connection.onreconnected(async () => {
        setIsConnected(true);
        if (tokenRef.current) {
          loadConversations(tokenRef.current);
        }
      });

      connection.onclose(() => setIsConnected(false));

      try {
        await connection.start();
        hubRef.current = connection;
        setIsConnected(true);

        // Fetch contacts & check online status
        if (tokenRef.current) {
          loadConversations(tokenRef.current);
        }
      } catch (e) {
        console.error('SignalR ChatHub Connection Error:', e);
      }
    },
    [loadConversations]
  );

  const disconnect = useCallback(async () => {
    if (hubRef.current) {
      await hubRef.current.stop();
      hubRef.current = null;
      setIsConnected(false);
      setOnlineContacts(new Set());
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

  const loadHistory = useCallback(
    async (authToken: string, contactId: string) => {
      setActiveContactId(contactId);

      // Check online status of active contact
      if (hubRef.current && hubRef.current.state === signalR.HubConnectionState.Connected) {
        queryOnlineUsers(hubRef.current, [contactId]);
      }

      try {
        const res = await fetch(`${API_BASE}/api/chat/history/${contactId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          setConversations((prev) =>
            prev.map((c) =>
              c.contactId.toLowerCase() === contactId.toLowerCase() ? { ...c, unreadCount: 0 } : c
            )
          );
        }
      } catch (e) {
        console.error('Failed to load chat history', e);
      }
    },
    [queryOnlineUsers, setActiveContactId]
  );

  const sendMessage = useCallback(
    async (receiverId: string, content: string, messageType: string = 'text', contactName?: string) => {
      const currentUser = userRef.current;
      if (currentUser) {
        const optimisticMsg: ChatMessage = {
          id: 'opt_' + Date.now().toString(),
          senderId: currentUser.id,
          receiverId: receiverId,
          content: content,
          messageType: messageType,
          timestamp: new Date().toISOString(),
          isRead: false,
          isDelivered: false,
        };

        setMessages((prev) => [...prev, optimisticMsg]);

        setConversations((prev) => {
          const exists = prev.some((c) => c.contactId.toLowerCase() === receiverId.toLowerCase());
          if (exists) {
            return prev.map((c) =>
              c.contactId.toLowerCase() === receiverId.toLowerCase()
                ? {
                    ...c,
                    contactName: contactName || c.contactName,
                    latestMessage: optimisticMsg,
                  }
                : c
            );
          } else {
            return [
              {
                contactId: receiverId,
                contactName: contactName || 'RentFlow Contact',
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
          await hubRef.current.invoke('SendMessage', receiverId, content, messageType, contactName);
        } catch (e) {
          console.error('Failed to send message via SignalR', e);
        }
      } else if (tokenRef.current) {
        await connect(tokenRef.current);
        if (hubRef.current) {
          await (hubRef.current as signalR.HubConnection).invoke(
            'SendMessage',
            receiverId,
            content,
            messageType,
            contactName
          );
        }
      }
    },
    [connect]
  );

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
        setActiveContactId,
        isConnected,
        onlineContacts,
        isContactOnline,
        loadConversations,
        loadHistory,
        sendMessage,
        uploadAttachment,
        connect,
        disconnect,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
