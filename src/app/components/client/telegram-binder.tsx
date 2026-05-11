'use client';

import { useState } from 'react';
import { generateTelegramBindingCode, unbindTelegramFromUser } from '@/lib/firebase';

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
      if (onBoundSuccess) {
        onBoundSuccess(code);
      }
    } catch (err) {
      setError('Не вдалося згенерувати код. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const openTelegramBot = (code: string) => {
    const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=bind_${code}`;
    window.open(deepLink, '_blank');
  };

  const handleCopyCode = () => {
    if (bindingCode) {
      navigator.clipboard.writeText(bindingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUnbind = async () => {
    if (!confirm('Ви впевнені, що хочете розв\'язати Telegram?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await unbindTelegramFromUser(uid);
      if (success) {
        setBindingCode(null);
        if (onUnboundSuccess) {
          onUnboundSuccess();
        }
      } else {
        setError('Не вдалося розв\'язати Telegram. Спробуйте ще раз.');
      }
    } catch (err) {
      setError('Помилка при розв\'язуванні.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
      Telegram
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {telegramId ? (
        <div className="space-y-3">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-lg font-bold text-green-600">Прив'язано</p>
            <p className="text-xs text-gray-600 mt-2">ID: {telegramId}</p>
            {telegramUsername && (
              <p className="text-xs text-gray-600 mt-1">NickName: @{telegramUsername}</p>
            )}
          </div>

          <button
            onClick={handleUnbind}
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'icons Завантаження...' : 'Розв\'язати Telegram'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bindingCode ? (
            <div className="space-y-3">
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                <p className="text-sm text-gray-600 mb-2">icons Код згенерований:</p>
                <div className="flex items-center gap-2">
                  <code className="text-2xl font-bold text-green-600 bg-white px-3 py-2 rounded border-2 border-green-300 flex-1 text-center">
                    {bindingCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className={`px-3 py-2 rounded font-semibold text-sm transition-all ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {copied ? '✓' : 'icons'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => openTelegramBot(bindingCode)}
                className="w-full py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                icons Відкрити бота
              </button>

              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-sm text-gray-700">
                <p className="font-semibold mb-2">icons️ Як це працює:</p>
                <ol className="list-decimal list-inside space-y-2 text-xs">
                  <li>Натисніть "Відкрити бота" або перейдіть на @{TELEGRAM_BOT_USERNAME}</li>
                  <li>Напишіть команду: <code className="bg-white px-1 rounded">/bind {bindingCode}</code></li>
                  <li>Або скопіюйте код (кнопка icons) і вставте після /bind</li>
                  <li>Бот відправить підтвердження icons</li>
                </ol>
              </div>

              <p className="text-xs text-gray-600 text-center">
                icons️ Код дійсний 15 хвилин
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-700 text-sm">
                Прив'яжіть свій Telegram до акаунту, щоб отримувати сповіщення про замовлення та
                спеціальні пропозиції.
              </p>

              <button
                onClick={handleGenerateCode}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {loading ? 'icons Генерування...' : 'icons Генерувати код'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
