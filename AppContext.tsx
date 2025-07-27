
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User } from './types';
import { Toaster, ToastMessage } from './components/UI';
import { auth, db } from './firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, updateDoc, increment, getDocs } from 'firebase/firestore';

import { StoreInfo } from './types';

import { Sale, SaleItem } from './types';

import { Product } from './types';

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
  updateStoreInfo: (newInfo: StoreInfo) => Promise<void>;
  processSale: (saleData: Omit<Sale, 'id' | 'timestamp'>) => Promise<void>;
  inviteUser: (email: string, pass: string, pin: string, role: 'manager' | 'cashier') => Promise<void>;
  getProducts: () => Promise<Product[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultUser = {
    email: "owner@scann.bizz",
    password: "password123",
    pin: "1234"
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isPinVerified, setIsPinVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc.exists()) {
                setUser({ ...firebaseUser, ...userDoc.data() } as User);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    const createDefaultUser = async () => {
        try {
            await signInWithEmailAndPassword(auth, defaultUser.email, defaultUser.password);
        } catch (error) {
            // If user does not exist, create it
            if (error.code === 'auth/user-not-found') {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, defaultUser.email, defaultUser.password);
                    const { uid, email } = userCredential.user;
                    const newUser: User = {
                        uid,
                        email: email!,
                        role: 'owner',
                        pin: defaultUser.pin,
                        storeInfo: { name: 'CyberStore', address: '123 Neon Lane', phone: '555-0101' }
                    };
                    await setDoc(doc(db, "users", uid), newUser);
                } catch (creationError) {
                    console.error("Error creating default user:", creationError);
                }
            }
        }
    };

    createDefaultUser();
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
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

  const getProducts = async (): Promise<Product[]> => {
    if (!user) throw new Error("User not authenticated");
    const productsCollection = collection(db, "users", user.uid, "products");
    const snapshot = await getDocs(productsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  };

  const inviteUser = async (email: string, pass: string, pin: string, role: 'manager' | 'cashier') => {
    if (!user || user.role !== 'owner') {
        throw new Error("You don't have permission to invite users.");
    }
    setLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const { uid } = userCredential.user;

        const newUser: User = {
            uid,
            email: email!,
            role,
            pin,
            storeInfo: user.storeInfo
        };

        await setDoc(doc(db, "users", uid), newUser);
        showToast(`User ${email} invited as ${role}.`, 'success');
    } catch (error) {
        const e = error as Error;
        showToast(e.message, 'error');
        throw e;
    } finally {
        setLoading(false);
    }
  };

  const processSale = async (saleData: Omit<Sale, 'id' | 'timestamp'>) => {
    if (!user) throw new Error("User not authenticated");
    setLoading(true);
    try {
        const salesCollection = collection(db, "users", user.uid, "sales");
        await addDoc(salesCollection, {
            ...saleData,
            timestamp: new Date()
        });

        const productUpdates = saleData.items.map(item => {
            const productRef = doc(db, "users", user.uid, "products", item.productId);
            return updateDoc(productRef, {
                quantity: increment(-item.quantity)
            });
        });

        await Promise.all(productUpdates);

        showToast('Sale processed successfully!', 'success');
    } catch (error) {
        const e = error as Error;
        showToast(e.message, 'error');
        throw e;
    } finally {
        setLoading(false);
    }
  };

  const updateStoreInfo = async (newInfo: StoreInfo) => {
    if (!user) return;
    setLoading(true);
    try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { storeInfo: newInfo }, { merge: true });
        setUser(prevUser => prevUser ? { ...prevUser, storeInfo: newInfo } : null);
        showToast('Store information updated successfully!', 'success');
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const { uid } = userCredential.user;
        const newUser: User = {
            uid,
            email: email!,
            role: 'owner',
            pin,
            storeInfo: { name: 'My New Store', address: '', phone: '' }
        };
        await setDoc(doc(db, "users", uid), newUser);
        // No need to create an empty products collection, it will be created on demand.
        setIsPinVerified(false);
        showToast('Account created successfully!', 'success');
    } catch (error) {
        const e = error as Error;
        showToast(e.message, 'error');
        throw e;
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setIsPinVerified(false);
    showToast('You have been logged out.', 'info');
  };

  const verifyPin = async (pin: string) => {
    setLoading(true);
    try {
        if (user && user.pin === pin) {
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
    <AppContext.Provider value={{ user, isAuthenticated: !!user, isPinVerified, loading, login, signup, logout, verifyPin, showToast, updateStoreInfo, processSale, inviteUser, getProducts }}>
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
