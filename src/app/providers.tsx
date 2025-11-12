"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeAuth, fetchUserProfile, signInWithGoogle, logout, type UserProfile } from '@/lib/firebase';
import type { User } from 'firebase/auth';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth(async (u) => {
      setUser(u);
      if (u) {
        const p = await fetchUserProfile(u.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    const p = await fetchUserProfile(user.uid);
    setProfile(p);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    signIn: async () => { await signInWithGoogle(); },
    signOut: async () => { await logout(); },
    refreshProfile,
  }), [user, profile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
