'use client';

import { useState, ReactNode, useCallback } from 'react';

export type ModalType = 'info' | 'success' | 'error' | 'warning' | 'confirm' | 'prompt';

export interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  inputValue?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  inputPlaceholder?: string;
}

const getIcon = (type: ModalType) => {
  switch (type) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'confirm':
      return '❓';
    case 'prompt':
      return '❓';
    default:
      return 'ℹ️';
  }
};

export const useModal = () => {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showModal = useCallback(
    (
      type: ModalType,
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
        showCancel: (options?.showCancel ?? (type === 'confirm' || type === 'prompt')),
        inputPlaceholder: options?.inputPlaceholder,
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    modal,
    showModal,
    closeModal,
    setModal,
    showSuccess: (title: string, message: string, onConfirm?: () => void) =>
      showModal('success', title, message, { onConfirm }),
    showError: (title: string, message: string, onConfirm?: () => void) =>
      showModal('error', title, message, { onConfirm }),
    showWarning: (title: string, message: string, onConfirm?: () => void) =>
      showModal('warning', title, message, { onConfirm }),
    showInfo: (title: string, message: string, onConfirm?: () => void) =>
      showModal('info', title, message, { onConfirm }),
    showConfirm: (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void
    ) =>
      showModal('confirm', title, message, {
        onConfirm,
        onCancel,
        showCancel: true,
        confirmText: 'Так',
        cancelText: 'Ні',
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
  };
};

interface ModalProps {
  modal: ModalState;
  closeModal: () => void;
  setModal: (modal: ModalState | ((prev: ModalState) => ModalState)) => void;
}

export function Modal({ modal, closeModal, setModal }: ModalProps) {
  const icon = getIcon(modal.type);

  const handleConfirm = () => {
    if (modal.onConfirm) {
      modal.onConfirm(modal.inputValue);
    }
    closeModal();
  };

  const handleCancel = () => {
    if (modal.onCancel) {
      modal.onCancel();
    }
    closeModal();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModal((prev) => ({
      ...prev,
      inputValue: e.target.value,
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div 
          className={`bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center gap-4`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
            modal.type === 'success' ? 'bg-green-100' :
            modal.type === 'error' ? 'bg-red-100' :
            modal.type === 'warning' ? 'bg-yellow-100' :
            modal.type === 'confirm' || modal.type === 'prompt' ? 'bg-blue-100' :
            'bg-gray-100'
          }`}>
            {icon}
          </div>
          <h2 className="text-xl font-bold text-white">{modal.title}</h2>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap mb-6">{modal.message}</p>

          {modal.type === 'prompt' && (
            <input
              type="text"
              placeholder={modal.inputPlaceholder || 'Введіть текст...'}
              value={modal.inputValue || ''}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              autoFocus
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex justify-end gap-3">
          {modal.showCancel && (
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {modal.cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              modal.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' :
              modal.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700' :
              modal.type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700' :
              modal.type === 'confirm' || modal.type === 'prompt' ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' :
              'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
            }`}
            autoFocus={modal.type !== 'prompt'}
          >
            {modal.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
