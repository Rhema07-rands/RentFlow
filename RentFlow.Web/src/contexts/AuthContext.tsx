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

// 30 minutes of inactivity will automatically log the user out
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const LAST_ACTIVE_KEY = 'rf_last_active';

/**
 * Checks if a JWT token has expired by inspecting its 'exp' claim.
 */
const isJwtExpired = (jwtToken: string): boolean => {
  try {
    const parts = jwtToken.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: (reason?: string) => void;
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

  const logout = (reason?: string) => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('rf_token');
      localStorage.removeItem('rf_user');
      localStorage.removeItem(LAST_ACTIVE_KEY);
    } catch {}
    if (reason) {
      showAlert('Session Expired', reason);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('rf_token');
        const storedUser = localStorage.getItem('rf_user');
        const storedLastActive = localStorage.getItem(LAST_ACTIVE_KEY);

        if (storedToken) {
          // 1. Verify JWT has not expired
          if (isJwtExpired(storedToken)) {
            logout('Your login token has expired. Please sign in again.');
            setIsLoading(false);
            return;
          }

          // 2. Verify inactivity timeout while away from the site
          if (storedLastActive) {
            const elapsed = Date.now() - Number(storedLastActive);
            if (elapsed > INACTIVITY_TIMEOUT_MS) {
              logout('You were logged out after being away from the site. Please sign in again.');
              setIsLoading(false);
              return;
            }
          }

          // Still valid — refresh activity timestamp
          try {
            localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
          } catch {}

          setToken(storedToken);
          if (storedUser) setUser(JSON.parse(storedUser));

          // Fetch fresh profile including current premium subscription status
          try {
            const res = await fetch(`${API_BASE}/api/auth/profile`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (res.status === 401) {
              logout('Your session has expired on the server. Please sign in again.');
              setIsLoading(false);
              return;
            }
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

  // Inactivity & Token Lifetime Monitor while user is logged in
  useEffect(() => {
    if (!token) return;

    let lastRecorded = Date.now();

    const recordActivity = () => {
      const now = Date.now();
      // Throttle localStorage updates to at most once every 10 seconds
      if (now - lastRecorded > 10000) {
        lastRecorded = now;
        try {
          localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
        } catch {}
      }
    };

    const checkTimeout = () => {
      // 1. Check if token expired
      if (isJwtExpired(token)) {
        logout('Your login token has expired. Please sign in again.');
        return;
      }

      // 2. Check inactivity timer
      const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
      if (lastActiveStr) {
        const elapsed = Date.now() - Number(lastActiveStr);
        if (elapsed > INACTIVITY_TIMEOUT_MS) {
          logout('You were inactive for 30 minutes and have been logged out. Please sign in again.');
        }
      }
    };

    // User activity events
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(evt => window.addEventListener(evt, recordActivity, { passive: true }));

    // Periodic check every 20 seconds
    const intervalId = setInterval(checkTimeout, 20000);

    // Tab visibility & focus change (e.g. user switches tabs, locks screen, or resumes browser)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTimeout();
        recordActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkTimeout);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, recordActivity));
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkTimeout);
    };
  }, [token]);

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
        try {
          localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
        } catch {}
        showAlert('Welcome Back!', `Logged in as ${loggedUser.name}`);
        return true;
      } else {
        const errText = await res.text();
        showAlert('Login Failed', errText || 'Invalid email or password');
        return false;
      }
    } catch (e) {
      console.error(e);
      showAlert('Connection Error', `Could not reach the RentFlow API server (${API_BASE}). If on Render, ensure the rentflow-api service is Live.`);
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
      showAlert('Connection Error', `Could not reach the RentFlow API server (${API_BASE}). If on Render, ensure the rentflow-api service is Live.`);
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

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUserState }}>
      {children}
    </AuthContext.Provider>
  );
};
