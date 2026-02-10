'use client';

import { useState, useEffect } from 'react';
import { useAuth, useModal } from '@/app/providers';
import { getForumThreads, createForumThread, type ForumThread } from '@/lib/firebase';
import Link from 'next/link';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  PaintBrushIcon,
  NewspaperIcon,
  PlusIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  EyeIcon,
  PaperAirplaneIcon,
  LockClosedIcon,
  BookmarkIcon
} from '@heroicons/react/24/solid';
import Image from 'next/image';

const CATEGORIES = [
  { id: 'all', name: 'Всі теми', icon: <ClipboardDocumentListIcon className="w-5 h-5 inline text-purple-400" /> },
  { id: 'general', name: 'Загальне', icon: <ChatBubbleLeftRightIcon className="w-5 h-5 inline text-purple-400" /> },
  { id: 'help', name: 'Допомога', icon: <QuestionMarkCircleIcon className="w-5 h-5 inline text-pink-400" /> },
  { id: 'showcase', name: 'Моя колекція', icon: <PaintBrushIcon className="w-5 h-5 inline text-blue-400" /> },
  { id: 'news', name: 'Новини', icon: <NewspaperIcon className="w-5 h-5 inline text-green-400" /> },
];

const REACTIONS = {
  like: '👍',
  love: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
};

export default function ForumPage() {
  const { user } = useAuth();
  const { showWarning, showError } = useModal();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newThread, setNewThread] = useState({
    title: '',
    content: '',
    category: 'general',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    filterThreads();
  }, [threads, selectedCategory, searchQuery]);

  const loadThreads = async () => {
    try {
      const data = await getForumThreads();
      setThreads(data);
    } catch (error) {
      console.error('Error loading threads:', error);
      showError('Не вдалося завантажити теми форуму');
    } finally {
      setLoading(false);
    }
  };

  const filterThreads = () => {
    let filtered = threads;

    // Фільтр за категорією
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Пошук
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query) ||
        t.authorName.toLowerCase().includes(query)
      );
    }

    setFilteredThreads(filtered);
  };

  const handleCreateThread = async () => {
    if (!user) {
      showWarning('Щоб створювати теми, потрібно увійти в акаунт');
      return;
    }

    if (!newThread.title.trim() || !newThread.content.trim()) {
      showWarning('Введіть назву та опис теми');
      return;
    }

    setCreating(true);
    try {
      await createForumThread(
        user.uid,
        user.displayName || 'Анонім',
        user.photoURL,
        newThread.title,
        newThread.content,
        newThread.category
      );
      setShowCreateModal(false);
      setNewThread({ title: '', content: '', category: 'general' });
      loadThreads();
    } catch (error) {
      console.error('Error creating thread:', error);
      showError('Не вдалося створити тему');
    } finally {
      setCreating(false);
    }
  };

  const getReactionCount = (reactions: { [key: string]: string }) => {
    if (!reactions) return {};
    const counts: { [key: string]: number } = {};
    Object.values(reactions).forEach(reaction => {
      counts[reaction] = (counts[reaction] || 0) + 1;
    });
    return counts;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} хв тому`;
    if (hours < 24) return `${hours} год тому`;
    if (days < 7) return `${days} дн тому`;
    return date.toLocaleDateString('uk-UA');
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[1];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <Link href="/" className="text-xl md:text-2xl flex-shrink-0"><HomeIcon className="w-7 h-7 text-purple-500" /></Link>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                Форум mlpcutiefamily
              </h1>
            </div>
            <button
              onClick={() => {
                if (!user) {
                  showWarning('Щоб створювати теми, потрібно увійти в акаунт');
                  return;
                }
                setShowCreateModal(true);
              }}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm md:text-base font-semibold hover:shadow-lg transition-shadow whitespace-nowrap flex-shrink-0"
            >
              <span className="hidden sm:inline"><PlusIcon className="w-5 h-5 inline mr-1" /></span>Створити
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 mb-20">
        {/* Filters */}
        <div className="mb-4 md:mb-6 flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-sm md:text-base font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Пошук тем..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-full text-sm md:text-base border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Threads list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <PaperAirplaneIcon className="w-16 h-16 mb-4 mx-auto text-purple-300" />
            <p className="text-xl text-gray-600">Тем не знайдено</p>
            <p className="text-gray-500 mt-2">Створіть першу тему!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredThreads.map(thread => {
              const categoryInfo = getCategoryInfo(thread.category);
              const reactionCounts = getReactionCount(thread.reactions);
              
              return (
                <Link
                  key={thread.id}
                  href={`/forum/${thread.id}`}
                  className="block bg-white rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-3 md:gap-4">
                    {/* Author avatar */}
                    <div className="flex-shrink-0">
                      {thread.authorPhoto ? (
                        <Image
                          src={thread.authorPhoto}
                          alt={thread.authorName}
                          width={40}
                          height={40}
                          className="rounded-full w-10 h-10 md:w-12 md:h-12"
                        />
                      ) : (
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg md:text-xl font-bold">
                          {thread.authorName[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {thread.isPinned && <BookmarkIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
                          {thread.isLocked && <LockClosedIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                          <h3 className="text-base md:text-xl font-semibold text-gray-900 break-words">
                            {thread.title}
                          </h3>
                        </div>
                        <span className="px-2.5 md:px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs md:text-sm font-medium whitespace-nowrap self-start">
                          {categoryInfo.icon} {categoryInfo.name}
                        </span>
                      </div>

                      <p className="text-sm md:text-base text-gray-600 line-clamp-2 mb-2 md:mb-3 break-words">
                        {thread.content}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500">
                        <span className="font-medium text-purple-600">{thread.authorName}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{formatDate(thread.createdAt)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1"><ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4 inline" /> {thread.commentsCount}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1"><EyeIcon className="w-4 h-4 inline" /> {thread.viewsCount}</span>
                        
                        {Object.keys(reactionCounts).length > 0 && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <div className="flex gap-1.5 md:gap-2 flex-wrap">
                              {Object.entries(reactionCounts).map(([reaction, count]) => (
                                <span key={reaction} className="flex items-center gap-0.5 md:gap-1 text-xs md:text-sm">
                                  {REACTIONS[reaction as keyof typeof REACTIONS]} {count}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Create thread modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Створити нову тему
            </h2>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Категорія
                </label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.slice(1).map(category => (
                    <button
                      key={category.id}
                      onClick={() => setNewThread({ ...newThread, category: category.id })}
                      className={`px-4 py-2 rounded-full font-medium transition-all ${
                        newThread.category === category.id
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.icon} {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Назва теми
                </label>
                <input
                  type="text"
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  placeholder="Коротка і зрозуміла назва..."
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  maxLength={100}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Опис
                </label>
                <textarea
                  value={newThread.content}
                  onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                  placeholder="Розкажіть більше про тему..."
                  rows={6}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                  maxLength={5000}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewThread({ title: '', content: '', category: 'general' });
                  }}
                  disabled={creating}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleCreateThread}
                  disabled={creating || !newThread.title.trim() || !newThread.content.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Створюємо...' : 'Створити'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
