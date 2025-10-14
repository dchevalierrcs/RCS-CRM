'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
// --- CORRECTION : Utilisation du routeur de 'next/navigation' pour l'App Router ---
import { useRouter } from 'next/navigation';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  updateUser: (newUserData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkUserSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Session non valide ou expirée", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  const login = useCallback(async (credentials: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      const data = await response.json();
      if (data && data.success) {
        setUser(data.user);
        router.push('/');
      } else {
        throw new Error(data.message || 'Échec de la connexion');
      }
    } catch(error) {
      console.error("Erreur de connexion:", error);
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion", error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router]);
  
  const updateUser = useCallback((newUserData: Partial<User>) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      return { ...currentUser, ...newUserData };
    });
  }, []);

  const isAuthenticated = !isLoading && !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

