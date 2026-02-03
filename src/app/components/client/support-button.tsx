'use client';

import { useAuth } from '@/app/providers';

const SUPPORT_BOT_USERNAME = 'mlp_cutie_family_bot';

export default function SupportButton() {
  const { user } = useAuth();

  const openSupportChat = () => {
    // Відкриває чат з ботом підтримки
    const url = `https://t.me/${SUPPORT_BOT_USERNAME}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={openSupportChat}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:shadow-purple-400 transition-all transform hover:scale-110 active:scale-95"
      title="Написати в підтримку"
    >
      <span className="text-xl">💬</span>
      <span className="hidden sm:inline">Підтримка</span>
    </button>
  );
}
