"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeAuth, fetchUserProfile, signInWithGoogle, logout, type UserProfile, database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { User } from 'firebase/auth';
import { Modal, type ModalState } from './components/client/modal';
import { ToastContainer, type Toast } from './components/client/toast';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface ModalContextValue {
  modal: ModalState;
  showModal: (type: any, title: string, message: string, options?: any) => void;
  closeModal: () => void;
  setModal: (modal: ModalState | ((prev: ModalState) => ModalState)) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  showConfirm: (title: string, message?: string, onConfirm?: () => void, onCancel?: () => void) => Promise<boolean>;
  showPrompt: (title: string, message: string, onConfirm: (value: string) => void, onCancel?: () => void, placeholder?: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = subscribeAuth(async (u) => {
      setUser(u);

      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (u) {
        const profileRef = ref(database, `users/${u.uid}`);
        unsubProfile = onValue(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.val() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const refreshProfile = async () => {
    // b/c we have real-time subscription, we don't strictly need this,
    // but we can keep it for backward compatibility if other components use it
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

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const showModal = (
    type: ModalState['type'],
    title: string,
    message: string,
    options?: {
      onConfirm?: (value?: string) => void;
      onCancel?: () => void;
      confirmText?: string;
      cancelText?: string;
      showCancel?: boolean;
      inputPlaceholder?: string;
    }
  ) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      inputValue: '',
      onConfirm: options?.onConfirm,
      onCancel: options?.onCancel,
      confirmText: options?.confirmText || 'OK',
      cancelText: options?.cancelText || 'Скасувати',
      showCancel: options?.showCancel ?? (type === 'confirm' || type === 'prompt'),
      inputPlaceholder: options?.inputPlaceholder,
    });
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, duration: number = 3000) => {
    const id = Date.now();
    const toast: Toast = { id, type, message, duration };

    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const modalValue: ModalContextValue = useMemo(() => ({
    modal,
    showModal,
    closeModal,
    setModal,
    showSuccess: (message: string) => showToast('success', message),
    showError: (message: string) => showToast('error', message),
    showWarning: (message: string) => showToast('warning', message),
    showInfo: (message: string) => showToast('info', message),
    showConfirm: (
      title: string,
      message?: string,
      onConfirm?: () => void,
      onCancel?: () => void
    ) =>
      new Promise<boolean>((resolve) => {
        showModal('confirm', title, message || '', {
          onConfirm: () => {
            if (onConfirm) onConfirm();
            resolve(true);
          },
          onCancel: () => {
            if (onCancel) onCancel();
            resolve(false);
          },
          showCancel: true,
          confirmText: 'Так',
          cancelText: 'Ні',
        });
      }),
    showPrompt: (
      title: string,
      message: string,
      onConfirm: (value: string) => void,
      onCancel?: () => void,
      placeholder?: string
    ) =>
      showModal('prompt', title, message, {
        onConfirm: (value) => onConfirm(value || ''),
        onCancel,
        showCancel: true,
        inputPlaceholder: placeholder,
        confirmText: 'ОК',
        cancelText: 'Скасувати',
      }),
  }), [modal]);

  return (
    <AuthContext.Provider value={value}>
      <ModalContext.Provider value={modalValue}>
        {children}
        <ToastContainer toasts={toasts} />
        <Modal modal={modal} closeModal={closeModal} setModal={setModal} />
      </ModalContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within AuthProvider');
  return ctx;
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
