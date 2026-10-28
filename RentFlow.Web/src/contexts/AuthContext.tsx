import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { useCustomAlert } from './AlertContext';

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  isPremium?: boolean;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  updateUserState: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  updateUserState: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showAlert } = useCustomAlert();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('rf_token');
        const storedUser = localStorage.getItem('rf_user');
        if (storedToken) {
          setToken(storedToken);
          if (storedUser) setUser(JSON.parse(storedUser));

          // Fetch fresh profile including current premium subscription status
          try {
            const res = await fetch(`${API_BASE}/api/auth/profile`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (res.ok) {
              const fresh = await res.json();
              setUser((prev) => {
                const updated: User = {
                  id: fresh.id || prev?.id || '',
                  name: fresh.name || prev?.name || '',
                  email: fresh.email || prev?.email || '',
                  phoneNumber: fresh.phoneNumber || prev?.phoneNumber,
                  profilePictureUrl: fresh.profilePictureUrl || prev?.profilePictureUrl,
                  isPremium: Boolean(fresh.isPremium),
                  subscriptionPlan: fresh.subscriptionPlan,
                  subscriptionExpiresAt: fresh.subscriptionExpiresAt,
                };
                localStorage.setItem('rf_user', JSON.stringify(updated));
                return updated;
              });
            }
          } catch {
            // Keep storedUser if offline
          }
        }
      } catch (e) {
        console.error('Failed to restore auth session', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const loggedUser: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          profilePictureUrl: data.user.profilePictureUrl,
          isPremium: Boolean(data.user.isPremium),
          subscriptionPlan: data.user.subscriptionPlan,
          subscriptionExpiresAt: data.user.subscriptionExpiresAt,
        };
        setToken(data.token);
        setUser(loggedUser);
        localStorage.setItem('rf_token', data.token);
        localStorage.setItem('rf_user', JSON.stringify(loggedUser));
        showAlert('Welcome Back!', `Logged in as ${loggedUser.name}`);
        return true;
      } else {
        const errText = await res.text();
        showAlert('Login Failed', errText || 'Invalid email or password');
        return false;
      }
    } catch (e) {
      console.error(e);
      showAlert('Connection Error', 'Could not connect to the RentFlow API server. Make sure the backend is running on port 5004.');
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
        showAlert('Registration Failed', errText || 'Could not register account');
        return false;
      }
    } catch (e) {
      console.error(e);
      showAlert('Connection Error', 'Could not connect to the RentFlow API server.');
      return false;
    }
  };

  const updateUserState = (updated: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      localStorage.setItem('rf_user', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('rf_token');
    localStorage.removeItem('rf_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUserState }}>
      {children}
    </AuthContext.Provider>
  );
};
