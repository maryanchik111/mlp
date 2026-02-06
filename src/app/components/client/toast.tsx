'use client';

import { useState, useEffect, useCallback } from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    default:
      return 'ℹ';
  }
};

const getColors = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    case 'warning':
      return 'bg-orange-500';
    default:
      return 'bg-blue-500';
  }
};

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (type: ToastType, message: string, duration: number = 3000) => {
      const id = Date.now();
      const toast: Toast = { id, type, message, duration };
      
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  return {
    toasts,
    showToast,
    showSuccess: (message: string, duration?: number) =>
      showToast('success', message, duration),
    showError: (message: string, duration?: number) =>
      showToast('error', message, duration),
    showWarning: (message: string, duration?: number) =>
      showToast('warning', message, duration),
    showInfo: (message: string, duration?: number) =>
      showToast('info', message, duration),
  };
};

interface ToastContainerProps {
  toasts: Toast[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
}

function ToastItem({ toast }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Показати toast
    setTimeout(() => setIsVisible(true), 10);

    // Почати анімацію виходу перед зникненням
    const leaveTimeout = setTimeout(() => {
      setIsLeaving(true);
    }, (toast.duration || 3000) - 300);

    return () => clearTimeout(leaveTimeout);
  }, [toast.duration]);

  const bgColor = getColors(toast.type);
  const icon = getIcon(toast.type);

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out pointer-events-auto
        ${isVisible && !isLeaving ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'}
      `}
    >
      <div
        className={`
          ${bgColor} text-white px-4 py-3 rounded-2xl shadow-lg
          flex items-center gap-3 min-h-[60px]
          backdrop-blur-xl bg-opacity-95
        `}
      >
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white bg-opacity-20 rounded-full text-xl font-bold">
          {icon}
        </div>
        <p className="flex-1 text-sm font-medium leading-snug">
          {toast.message}
        </p>
      </div>
    </div>
  );
}
