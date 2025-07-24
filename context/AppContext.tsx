
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, StoreInfo } from '../types';
import { Toaster, ToastMessage } from '../components/UI';

// Mock API functions
const mockApi = {
    login: (email: string) => new Promise<{ user: User }>((resolve, reject) => {
        if (email === "owner@scann.bizz") {
            setTimeout(() => resolve({ user: { uid: '123', email, role: 'owner', storeInfo: { name: 'CyberStore', address: '123 Neon Lane', phone: '555-0101' } } }), 500);
        } else {
            setTimeout(() => reject(new Error("Invalid credentials")), 500);
        }
    }),
    signup: (email: string) => new Promise<{ user: User }>((resolve) => {
        setTimeout(() => resolve({ user: { uid: '123', email, role: 'owner', storeInfo: { name: 'New Store', address: '', phone: '' } } }), 500);
    }),
    verifyPin: (pin: string) => new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(pin === "1234"), 300);
    })
};


interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isPinVerified: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, pin: string) => Promise<void>;
  logout: () => void;
  verifyPin: (pin: string) => Promise<boolean>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isPinVerified, setIsPinVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('scannbizz_user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
        const { user } = await mockApi.login(email);
        setUser(user);
        localStorage.setItem('scannbizz_user', JSON.stringify(user));
        setIsPinVerified(false);
        showToast('Login successful!', 'success');
    } catch (error) {
        const e = error as Error;
        showToast(e.message, 'error');
        throw e;
    } finally {
        setLoading(false);
    }
  };
  
  const signup = async (email: string, pass: string, pin: string) => {
    setLoading(true);
    try {
        const { user } = await mockApi.signup(email);
        setUser(user);
        localStorage.setItem('scannbizz_user', JSON.stringify(user));
        setIsPinVerified(false); // They still need to enter PIN after signup
        showToast('Account created successfully!', 'success');
    } catch (error) {
        const e = error as Error;
        showToast(e.message, 'error');
        throw e;
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsPinVerified(false);
    localStorage.removeItem('scannbizz_user');
    showToast('You have been logged out.', 'info');
  };

  const verifyPin = async (pin: string) => {
    setLoading(true);
    try {
        const isValid = await mockApi.verifyPin(pin);
        if (isValid) {
            setIsPinVerified(true);
            showToast('PIN verified. Access granted.', 'success');
            return true;
        } else {
            showToast('Invalid PIN.', 'error');
            return false;
        }
    } catch(e) {
        showToast('Error verifying PIN.', 'error');
        return false;
    } finally {
        setLoading(false);
    }
  };

  const showToast = useCallback((message: string, type: ToastMessage['type']) => {
    const newToast: ToastMessage = { id: Date.now().toString(), message, type };
    setToasts(currentToasts => [newToast, ...currentToasts]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(currentToasts => currentToasts.filter(t => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{ user, isAuthenticated: !!user, isPinVerified, loading, login, signup, logout, verifyPin, showToast }}>
      <Toaster toasts={toasts} onDismiss={removeToast} />
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};