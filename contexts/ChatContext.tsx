import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: string;
  timestamp: string;
  isRead: boolean;
  isDelivered?: boolean;
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
  onlineContacts: Set<string>;
  isContactOnline: (contactId: string) => boolean;
  loadConversations: (token: string) => Promise<void>;
  loadHistory: (token: string, contactId: string) => Promise<void>;
  sendMessage: (receiverId: string, content: string, messageType?: string, contactName?: string) => Promise<void>;
  markAsRead: (contactId: string) => Promise<void>;
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  messages: [],
  onlineContacts: new Set(),
  isContactOnline: () => false,
  loadConversations: async () => {},
  loadHistory: async () => {},
  sendMessage: async () => {},
  markAsRead: async () => {},
  connect: async () => {},
  disconnect: async () => {},
});

export const useChat = () => useContext(ChatContext);

const API_BASE = 'http://10.231.149.52:5004';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [onlineContacts, setOnlineContacts] = useState<Set<string>>(new Set());
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);

  const isContactOnline = useCallback(
    (contactId: string) => {
      if (!contactId) return false;
      return onlineContacts.has(contactId.toLowerCase());
    },
    [onlineContacts]
  );

  const connect = async (token: string) => {
    if (hubConnection) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/chathub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveMessage', (message: ChatMessage, senderName?: string, senderAvatar?: string) => {
      setMessages(prev => {
        if (activeContactId === message.senderId || activeContactId === message.receiverId) {
          if (!prev.some(m => m.id.toLowerCase() === message.id.toLowerCase())) {
            return [...prev, message];
          }
        }
        return prev;
      });

      setConversations(prev => {
        const contactId = message.senderId;
        const exists = prev.some(c => c.contactId.toLowerCase() === contactId.toLowerCase());
        if (exists) {
          return prev.map(c => 
            c.contactId.toLowerCase() === contactId.toLowerCase() 
              ? { 
                  ...c, 
                  contactName: senderName || c.contactName,
                  contactAvatar: senderAvatar || c.contactAvatar,
                  latestMessage: message, 
                  unreadCount: activeContactId !== contactId ? c.unreadCount + 1 : c.unreadCount 
                } 
              : c
          );
        } else {
          return [
            {
              contactId: contactId,
              contactName: senderName || 'RentFlow Contact',
              contactAvatar: senderAvatar,
              latestMessage: message,
              unreadCount: activeContactId !== contactId ? 1 : 0
            },
            ...prev
          ];
        }
      });
    });

    connection.on('UserOnline', (userId: string) => {
      setOnlineContacts(prev => new Set(prev).add(userId.toLowerCase()));
    });

    connection.on('UserOffline', (userId: string) => {
      setOnlineContacts(prev => {
        const next = new Set(prev);
        next.delete(userId.toLowerCase());
        return next;
      });
    });

    connection.on('MessageDelivered', (messageIds: string[]) => {
      if (!messageIds || messageIds.length === 0) return;
      const idSet = new Set(messageIds.map(id => id.toLowerCase()));
      setMessages(prev =>
        prev.map(m => (idSet.has(m.id.toLowerCase()) ? { ...m, isDelivered: true } : m))
      );
    });

    connection.on('MessagesRead', (messageIds: string[]) => {
      if (!messageIds || messageIds.length === 0) return;
      const idSet = new Set(messageIds.map(id => id.toLowerCase()));
      setMessages(prev =>
        prev.map(m => (idSet.has(m.id.toLowerCase()) ? { ...m, isRead: true, isDelivered: true } : m))
      );
    });

    try {
      await connection.start();
      setHubConnection(connection);
    } catch (e) {
      console.error('SignalR Connection Error: ', e);
    }
  };

  const disconnect = async () => {
    if (hubConnection) {
      await hubConnection.stop();
      setHubConnection(null);
      setOnlineContacts(new Set());
    }
  };

  const loadConversations = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  };

  const markAsRead = async (contactId: string) => {
    if (hubConnection && hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await hubConnection.invoke('MarkMessagesAsRead', contactId);
      } catch (e) {
        console.error('Failed to mark messages as read', e);
      }
    }
  };

  const loadHistory = async (token: string, contactId: string) => {
    setActiveContactId(contactId);
    try {
      const res = await fetch(`${API_BASE}/api/chat/history/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  };

  const sendMessage = async (receiverId: string, content: string, messageType: string = 'text', contactName?: string) => {
    if (hubConnection) {
      try {
        await hubConnection.invoke('SendMessage', receiverId, content, messageType, contactName);
      } catch (e) {
        console.error('Failed to send message via SignalR', e);
      }
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        messages,
        onlineContacts,
        isContactOnline,
        loadConversations,
        loadHistory,
        sendMessage,
        markAsRead,
        connect,
        disconnect
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
