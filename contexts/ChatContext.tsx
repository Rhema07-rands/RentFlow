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
}

export interface ConversationInfo {
  contactId: string;
  contactName: string;
  latestMessage: ChatMessage | null;
  unreadCount: number;
}

interface ChatContextType {
  conversations: ConversationInfo[];
  messages: ChatMessage[];
  loadConversations: (token: string) => Promise<void>;
  loadHistory: (token: string, contactId: string) => Promise<void>;
  sendMessage: (receiverId: string, content: string, messageType?: string) => Promise<void>;
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  messages: [],
  loadConversations: async () => {},
  loadHistory: async () => {},
  sendMessage: async () => {},
  connect: async () => {},
  disconnect: async () => {},
});

export const useChat = () => useContext(ChatContext);

const API_BASE = 'http://10.231.149.52:5004';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);

  const connect = async (token: string) => {
    if (hubConnection) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/chathub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveMessage', (message: ChatMessage) => {
      // If we are actively chatting with this person, append to messages
      setMessages(prev => {
        // Only append if it belongs to the active conversation
        if (activeContactId === message.senderId || activeContactId === message.receiverId) {
          // Prevent duplicates (SignalR might send it to sender group too, plus our local optimistic update)
          if (!prev.some(m => m.id === message.id)) {
            return [...prev, message];
          }
        }
        return prev;
      });

      // We also need to update the conversations list latest message
      setConversations(prev => {
        const contactId = message.senderId; // Assuming we received it. If we sent it, it's slightly more complex but handled by loadConversations usually
        const exists = prev.some(c => c.contactId === contactId);
        if (exists) {
          return prev.map(c => 
            c.contactId === contactId 
              ? { ...c, latestMessage: message, unreadCount: activeContactId !== contactId ? c.unreadCount + 1 : c.unreadCount } 
              : c
          );
        } else {
          // Fetch full conversations again to get the name
          return prev;
        }
      });
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

  const sendMessage = async (receiverId: string, content: string, messageType: string = 'text') => {
    if (hubConnection) {
      try {
        await hubConnection.invoke('SendMessage', receiverId, content, messageType);
      } catch (e) {
        console.error('Failed to send message via SignalR', e);
      }
    }
  };

  return (
    <ChatContext.Provider value={{ conversations, messages, loadConversations, loadHistory, sendMessage, connect, disconnect }}>
      {children}
    </ChatContext.Provider>
  );
};
