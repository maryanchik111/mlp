'use client';

import { useAuth } from '@/app/providers';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';


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
      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm sm:text-base hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2 justify-center"
      title="Написати в підтримку"
    >
      <ChatBubbleLeftRightIcon className="w-5 h-5" />
      <span>Підтримка</span>
    </button>
  );
}
