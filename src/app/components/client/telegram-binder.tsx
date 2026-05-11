'use client';

import { useState } from 'react';
import { generateTelegramBindingCode, unbindTelegramFromUser } from '@/lib/firebase';
import {
  PaperAirplaneIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  XMarkIcon,
  LinkIcon,
  ClockIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

const TELEGRAM_BOT_USERNAME = 'mlp_cutie_family_bot';

interface TelegramBinderProps {
  uid: string;
  telegramId?: string;
  telegramUsername?: string;
  onBoundSuccess?: (code: string) => void;
  onUnboundSuccess?: () => void;
}

export default function TelegramBinder({
  uid,
  telegramId,
  telegramUsername,
  onBoundSuccess,
  onUnboundSuccess,
}: TelegramBinderProps) {
  const [loading, setLoading] = useState(false);
  const [bindingCode, setBindingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const code = await generateTelegramBindingCode(uid);
      setBindingCode(code);
      onBoundSuccess?.(code);
    } catch {
      setError('Не вдалося згенерувати код. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const openTelegramBot = (code: string) => {
    window.open(`https://t.me/${TELEGRAM_BOT_USERNAME}?start=bind_${code}`, '_blank');
  };

  const handleCopyCode = async () => {
    if (!bindingCode) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(bindingCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for non-secure contexts or missing clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = bindingCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Copy failed', err);
    }
  };


  const handleUnbind = async () => {
    if (!confirm('Ви впевнені, що хочете відʼязати Telegram?')) return;
    setLoading(true);
    setError(null);
    try {
      const success = await unbindTelegramFromUser(uid);
      if (success) {
        setBindingCode(null);
        onUnboundSuccess?.();
      } else {
        setError('Не вдалося відʼязати Telegram. Спробуйте ще раз.');
      }
    } catch {
      setError('Помилка при відʼязуванні.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Bound state ── */
  if (telegramId) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <PaperAirplaneIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Telegram підключено</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {telegramUsername ? `@${telegramUsername}` : `ID: ${telegramId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
              <CheckIcon className="w-3 h-3" /> Активно
            </span>
            <button
              onClick={handleUnbind}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-100 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              {loading ? 'Зачекайте...' : 'Відʼязати'}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    );
  }

  /* ── Code generated state ── */
  if (bindingCode) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <PaperAirplaneIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Код для підключення</p>
            <p className="text-xs text-gray-400 mt-0.5">Введіть його в Telegram-боті</p>
          </div>
        </div>

        {/* Code block */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center">
            <span className="font-mono text-2xl font-semibold tracking-widest text-[#534AB7]">
              {bindingCode}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl border text-xs font-medium transition-colors flex-shrink-0 ${copied
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
          >
            {copied
              ? <CheckIcon className="w-4 h-4" />
              : <ClipboardDocumentIcon className="w-4 h-4" />
            }
            {copied ? 'Скоп.' : 'Копія'}
          </button>
        </div>

        {/* Open bot button */}
        <button
          onClick={() => openTelegramBot(bindingCode)}
          className="w-full flex items-center justify-center gap-2 bg-[#185FA5] hover:bg-[#0C447C] text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          <LinkIcon className="w-4 h-4" /> Відкрити бота в Telegram
        </button>

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
            <InformationCircleIcon className="w-4 h-4" /> Як підключити
          </div>
          <ol className="space-y-1.5 text-xs text-gray-500 list-decimal list-inside">
            <li>Відкрийте <span className="font-medium text-gray-700">@{TELEGRAM_BOT_USERNAME}</span> або натисніть кнопку вище</li>
            <li>Надішліть команду <code className="bg-white border border-gray-200 rounded px-1 py-0.5 font-mono text-[#534AB7]">/bind {bindingCode}</code></li>
            <li>Бот підтвердить підключення</li>
          </ol>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <ClockIcon className="w-3.5 h-3.5" /> Код дійсний 15 хвилин
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    );
  }

  /* ── Default state ── */
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <PaperAirplaneIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Telegram-сповіщення</p>
            <p className="text-xs text-gray-400 mt-0.5">Отримуйте статус замовлень миттєво</p>
          </div>
        </div>

        <button
          onClick={handleGenerateCode}
          disabled={loading}
          className="flex items-center gap-1.5 bg-[#534AB7] hover:bg-[#3C3489] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {loading
            ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Генерую...</>
            : <><LinkIcon className="w-4 h-4" /> Підключити</>
          }
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}