import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  changePassword as changeUserPassword
} from '../services/userService';
import { getUserVehicles } from '../services/vehicleService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserData: () => Promise<void>;
  updateUserBalance: (amount: number) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const buildUser = async (authUser: { id: string; email: string; name: string; phone: string; balance: number; is_admin: boolean; created_at: string }): Promise<User> => {
  let vehicles: User['vehicles'] = [];
  try {
    vehicles = await getUserVehicles(authUser.id);
  } catch {
    // Non-critical
  }

  return {
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    phone: authUser.phone,
    password: '',
    balance: authUser.balance,
    vehicles,
    isAdmin: authUser.is_admin,
    createdAt: authUser.created_at
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const fullUser = await buildUser(currentUser);
        setUser(fullUser);
      }
    } catch (err) {
      console.error('[AuthContext] fetchAndSetUser error:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (mounted && currentUser) {
          const fullUser = await buildUser(currentUser);
          setUser(fullUser);
        }
      } catch (err) {
        console.error('[AuthContext] init error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session) {
          try {
            const currentUser = await getCurrentUser();
            if (mounted && currentUser) {
              const fullUser = await buildUser(currentUser);
              setUser(fullUser);
            }
          } catch (err) {
            console.error('[AuthContext] onAuthStateChange error:', err);
          }
          if (mounted) setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          if (mounted) setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn(email, password);
      if (result.success && result.user) {
        const fullUser = await buildUser(result.user);
        setUser(fullUser);
      }
      return result;
    } catch (err) {
      console.error('[AuthContext] login error:', err);
      return { success: false, error: 'Terjadi kesalahan saat login' };
    }
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    try {
      const result = await signUp(name, email, phone, password);
      if (result.success && result.user) {
        const fullUser = await buildUser(result.user);
        setUser(fullUser);
      }
      return result;
    } catch (err) {
      console.error('[AuthContext] register error:', err);
      return { success: false, error: 'Terjadi kesalahan saat mendaftar' };
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch {
      // Ignore
    }
    setUser(null);
  };

  const updateUserData = async () => {
    await fetchAndSetUser();
  };

  const updateUserBalance = (amount: number) => {
    if (user) {
      setUser({ ...user, balance: user.balance + amount });
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    return await changeUserPassword(oldPassword, newPassword);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUserData, updateUserBalance, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
