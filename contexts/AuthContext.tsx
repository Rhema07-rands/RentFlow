import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useCustomAlert } from './AlertContext';

const API_BASE = 'http://10.231.149.52:5004';

interface User {
  id: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showAlert } = useCustomAlert();
  const router = useRouter();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUserId = await SecureStore.getItemAsync('userId');
      const storedUserName = await SecureStore.getItemAsync('userName');
      
      if (storedToken && storedUserId && storedUserName) {
        setToken(storedToken);
        setUser({
          id: storedUserId,
          name: storedUserName,
          email: '',
        });
      }
    } catch (e) {
      console.error('Failed to load auth', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        
        await SecureStore.setItemAsync('token', data.token);
        await SecureStore.setItemAsync('userId', data.user.id);
        await SecureStore.setItemAsync('userName', data.user.name);
        
        return true;
      } else {
        const errText = await res.text();
        showAlert('Login Failed', errText || 'Invalid credentials');
        return false;
      }
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Could not connect to server');
      return false;
    }
  };

  const register = async (data: any): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        return true;
      } else {
        const errText = await res.text();
        showAlert('Registration Failed', errText || 'Could not register user');
        return false;
      }
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Could not connect to server');
      return false;
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('userId');
      await SecureStore.deleteItemAsync('userName');
    } catch (e) {
      console.error('Error clearing secure store', e);
    }
    router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
