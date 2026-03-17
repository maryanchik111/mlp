'use client';

import { useState, useEffect } from 'react';
import { useAuth, useModal } from '@/app/providers';
import {
  getForumThread,
  getForumComments,
  subscribeToForumThread,
  subscribeToForumComments,
  addForumComment,
  addThreadReaction,
  removeThreadReaction,
  addCommentReaction,
  removeCommentReaction,
  editForumThread,
  editForumComment,
  deleteForumThread,
  deleteForumComment,
  incrementThreadViews,
  toggleThreadPin,
  toggleThreadLock,
  checkAdminAccess,
  isAdmin as checkIsAdmin,
  auth,
  type ForumThread,
  type ForumComment,
} from '@/lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const REACTIONS = {
  like: '👍',
  love: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
};

const CATEGORIES = {
  general: { name: 'Загальне', icon: '💬' },
  help: { name: 'Допомога', icon: '❓' },
  showcase: { name: 'Моя колекція', icon: '🎨' },
  news: { name: 'Новини', icon: '📰' },
};

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;
  const { user, profile } = useAuth();
  const { showWarning, showError, showConfirm, showSuccess } = useModal();

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    setLoading(true);

    // Підписка на тему
    const unsubscribeThread = subscribeToForumThread(threadId, (data) => {
      if (data === null && !loading) {
        showError('Тему не знайдено');
        router.push('/forum');
        return;
      }
      setThread(data);
      setLoading(false);
    });

    // Підписка на коментарі
    const unsubscribeComments = subscribeToForumComments(threadId, (data) => {
      setComments(data);
    });

    // Збільшуємо перегляди один раз при вході
    incrementThreadViews(threadId);

    if (user) {
      setIsAdmin(checkAdminAccess(auth.currentUser));
    }

    return () => {
      unsubscribeThread();
      unsubscribeComments();
    };
  }, [threadId, user]);

  const handleAddComment = async () => {
    if (!user) {
      showWarning('Щоб коментувати, потрібно увійти в акаунт');
      return;
    }

    if (!thread) return;

    if (thread.isLocked && !isAdmin) {
      showWarning('Адміністратор заблокував можливість коментування');
      return;
    }

    if (!newComment.trim()) {
      showWarning('Поле коментаря не може бути порожнім');
      return;
    }

    setSubmitting(true);
    try {
      await addForumComment(
        threadId,
        user.uid,
        user.displayName || 'Анонім',
        user.photoURL,
        newComment,
        checkIsAdmin(user.email),
        profile?.rating || 1,
        replyTo?.id,
        replyTo?.name
      );
      setNewComment('');
      setReplyTo(null);
      showSuccess('Коментар додано');
    } catch (error) {
      console.error('Error adding comment:', error);
      showError('Не вдалося додати коментар');
    } finally {
      setSubmitting(false);
    }
  };

  const handleThreadReaction = async (reaction: string) => {
    if (!user) {
      showWarning('Щоб ставити реакції, потрібно увійти в акаунт');
      return;
    }

    if (!thread) return;

    try {
      const currentReaction = thread.reactions?.[user.uid];

      if (currentReaction === reaction) {
        await removeThreadReaction(threadId, user.uid);
      } else {
        await addThreadReaction(threadId, user.uid, reaction);
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      showError('Не вдалося оновити реакцію');
    }
  };

  const handleCommentReaction = async (commentId: string, reaction: string) => {
    if (!user) {
      showWarning('Щоб ставити реакції, потрібно увійти в акаунт');
      return;
    }

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    try {
      const currentReaction = comment.reactions?.[user.uid];

      if (currentReaction === reaction) {
        await removeCommentReaction(threadId, commentId, user.uid);
      } else {
        await addCommentReaction(threadId, commentId, user.uid, reaction);
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      showError('Не вдалося оновити реакцію');
    }
  };

  const handleEditThread = async () => {
    if (!user || !thread) return;

    try {
      await editForumThread(threadId, user.uid, editTitle, editContent);
      setEditingThreadId(null);
      showSuccess('Тему оновлено');
    } catch (error: any) {
      console.error('Error editing thread:', error);
      showError(error.message || 'Не вдалося оновити тему');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!user) return;

    try {
      await editForumComment(threadId, commentId, user.uid, editContent);
      setEditingCommentId(null);
      showSuccess('Коментар оновлено');
    } catch (error: any) {
      console.error('Error editing comment:', error);
      showError(error.message || 'Не вдалося оновити коментар');
    }
  };

  const handleDeleteThread = async () => {
    if (!user || !thread) return;

    showConfirm(
      'Видалити тему?',
      'Ця дія незворотна. Тема та всі коментарі будуть видалені.',
      async () => {
        try {
          await deleteForumThread(threadId, user.uid);
          showSuccess('Тему видалено');
          router.push('/forum');
        } catch (error: any) {
          console.error('Error deleting thread:', error);
          showError(error.message || 'Не вдалося видалити тему');
        }
      }
    );
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    showConfirm(
      'Видалити коментар?',
      'Ця дія незворотна.',
      async () => {
        try {
          await deleteForumComment(threadId, commentId, user.uid);
          showSuccess('Коментар видалено');
        } catch (error: any) {
          console.error('Error deleting comment:', error);
          showError(error.message || 'Не вдалося видалити коментар');
        }
      }
    );
  };

  const handleTogglePin = async () => {
    try {
      await toggleThreadPin(threadId);
      showSuccess(thread?.isPinned ? 'Тему відкріплено' : 'Тему закріплено');
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleToggleLock = async () => {
    try {
      await toggleThreadLock(threadId);
      showSuccess(thread?.isLocked ? 'Тему розблоковано' : 'Тему заблоковано');
    } catch (error: any) {
      showError(error.message);
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
    return date.toLocaleString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const buildCommentTree = (flatComments: ForumComment[]) => {
    const map = new Map<string, ForumComment & { replies: any[] }>();
    const tree: (ForumComment & { replies: any[] })[] = [];

    flatComments.forEach(c => {
      map.set(c.id, { ...c, replies: [] });
    });

    flatComments.forEach(c => {
      if (c.replyToId && map.has(c.replyToId)) {
        map.get(c.replyToId)!.replies.push(map.get(c.id)!);
      } else {
        tree.push(map.get(c.id)!);
      }
    });

    return tree;
  };

  const commentTree = buildCommentTree(comments);

  const renderComment = (comment: ForumComment & { replies: any[] }, isReply = false) => {
    const commentReactionCounts = getReactionCount(comment.reactions);
    const canEditComment = user && (user.uid === comment.authorId || isAdmin);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-4 md:ml-10 border-l-2 border-purple-100 pl-4 md:pl-6' : ''}`}>
        <div className={`bg-white rounded-2xl p-4 md:p-6 shadow-sm mb-4 ${isReply ? 'border border-gray-100' : ''}`}>
          <div className="flex items-start gap-3 md:gap-4">
            {comment.authorPhoto ? (
              <Image
                src={comment.authorPhoto}
                alt={comment.authorName}
                width={40}
                height={40}
                className="rounded-full w-10 h-10 md:w-12 md:h-12 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg md:text-xl font-bold">
                {comment.authorName[0]?.toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2">
                <span className="font-semibold text-purple-600 text-sm md:text-base">
                  {comment.authorName} {isAdmin && <span className="text-[10px] text-gray-400 font-normal">({comment.authorId})</span>}
                </span>
                {comment.isAdmin && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider border border-pink-200">
                    👑 Адмін
                  </span>
                )}
                {comment.authorRank && !comment.isAdmin && (
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider border border-blue-200">
                    ⭐ Рівень {comment.authorRank}
                  </span>
                )}
                <span className="text-gray-400 text-xs md:text-sm">•</span>
                <span className="text-xs md:text-sm text-gray-500 break-all">{formatDate(comment.createdAt)}</span>
                {comment.isEdited && (
                  <>
                    <span className="text-gray-400 text-xs md:text-sm">•</span>
                    <span className="text-xs md:text-sm text-gray-500 italic">змінено</span>
                  </>
                )}
              </div>

              {editingCommentId === comment.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300"
                    >
                      Відмінити
                    </button>
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:shadow-lg"
                    >
                      Зберегти
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap mb-3 break-words">{comment.content}</p>

                  {/* Reactions */}
                  <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                    {Object.entries(REACTIONS).map(([key, emoji]) => {
                      const count = commentReactionCounts[key] || 0;
                      const isActive = user && comment.reactions?.[user.uid] === key;

                      return (
                        <button
                          key={key}
                          onClick={() => handleCommentReaction(comment.id, key)}
                          className={`text-black flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 md:py-1 text-xs md:text-sm rounded-full transition-all ${isActive
                            ? 'bg-purple-100 border-2 border-purple-500'
                            : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          title={key}
                        >
                          <span className="text-sm md:text-base">{emoji}</span>
                          {count > 0 && <span className="text-xs font-medium">{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-3">
                    {!editingCommentId && user && (
                      <button
                        onClick={() => {
                          setReplyTo({ id: comment.id, name: comment.authorName });
                          document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-xs md:text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
                      >
                        💬 Відповісти
                      </button>
                    )}

                    {canEditComment && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-lg"
                          title="Редагувати"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-lg"
                          title="Видалити"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {comment.replies.length > 0 && (
          <div className="mb-6">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!thread) {
    return null;
  }

  const categoryInfo = CATEGORIES[thread.category as keyof typeof CATEGORIES];
  const threadReactionCounts = getReactionCount(thread.reactions);
  const canEdit = user && (user.uid === thread.authorId || isAdmin);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/forum" className="text-black text-xl md:text-2xl hover:scale-110 transition-transform flex-shrink-0">
              ⬅️ Назад до форуму
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-4xl">
        {/* Thread */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md mb-6">
          {/* Thread header */}
          <div className="flex items-start gap-3 md:gap-4 mb-4">
            {thread.authorPhoto ? (
              <Image
                src={thread.authorPhoto}
                alt={thread.authorName}
                width={48}
                height={48}
                className="rounded-full w-10 h-10 md:w-14 md:h-14 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg md:text-2xl font-bold">
                {thread.authorName[0]?.toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                <span className="font-semibold text-purple-600 text-sm md:text-base">
                  {thread.authorName} {isAdmin && <span className="text-[10px] text-gray-400 font-normal">({thread.authorId})</span>}
                </span>
                {thread.isAdmin && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider border border-pink-200">
                    👑 Адмін
                  </span>
                )}
                {thread.authorRank && !thread.isAdmin && (
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider border border-blue-200">
                    ⭐ Рівень {thread.authorRank}
                  </span>
                )}
                <span className="inline-block px-2.5 md:px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs md:text-sm font-medium">
                  {categoryInfo.icon} {categoryInfo.name}
                </span>
                {thread.isPinned && <span className="text-lg md:text-xl">📌</span>}
                {thread.isLocked && <span className="text-lg md:text-xl">🔒</span>}
              </div>
              <span className="text-xs md:text-sm text-gray-500 break-all">{formatDate(thread.createdAt)}</span>
            </div>
          </div>

          {/* Thread content */}
          {editingThreadId === threadId ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-semibold text-xl"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingThreadId(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleEditThread}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:shadow-lg"
                >
                  Зберегти
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4 break-words">{thread.title}</h1>
              <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap mb-4 md:mb-6 break-words">{thread.content}</p>
            </>
          )}

          {/* Reactions */}
          {!editingThreadId && (
            <div className="pt-3 md:pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                {Object.entries(REACTIONS).map(([key, emoji]) => {
                  const count = threadReactionCounts[key] || 0;
                  const isActive = user && thread.reactions?.[user.uid] === key;

                  return (
                    <button
                      key={key}
                      onClick={() => handleThreadReaction(key)}
                      className={`text-black flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-full transition-all text-sm md:text-base ${isActive
                        ? 'bg-purple-100 border-2 border-purple-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      title={key}
                    >
                      <span className="text-base md:text-lg">{emoji}</span>
                      {count > 0 && <span className="text-xs md:text-sm font-medium">{count}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              {canEdit && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setEditingThreadId(threadId);
                      setEditTitle(thread.title);
                      setEditContent(thread.content);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-lg md:text-xl"
                    title="Редагувати"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={handleDeleteThread}
                    className="p-2 hover:bg-red-100 rounded-full transition-colors text-lg md:text-xl"
                    title="Видалити"
                  >
                    🗑️
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={handleTogglePin}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-lg md:text-xl"
                        title={thread.isPinned ? 'Відкріпити' : 'Закріпити'}
                      >
                        📌
                      </button>
                      <button
                        onClick={handleToggleLock}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-lg md:text-xl"
                        title={thread.isLocked ? 'Розблокувати' : 'Заблокувати'}
                      >
                        🔒
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="space-y-4 mb-20">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            💬 Коментарі ({comments.length})
          </h2>

          {/* New comment form */}
          <div id="comment-form" className="bg-white rounded-2xl p-4 md:p-6 shadow-sm scroll-mt-24">
            {replyTo && (
              <div className="flex items-center justify-between mb-3 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                <span className="text-sm text-purple-700">
                  Відповідь для <span className="font-bold">{replyTo.name}</span>
                </span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-purple-400 hover:text-purple-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                !user
                  ? 'Увійдіть в акаунт, щоб коментувати...'
                  : thread.isLocked && !isAdmin
                    ? 'Коментування заблоковано адміністратором'
                    : 'Напишіть коментар...'
              }
              rows={4}
              disabled={!user || (thread.isLocked && !isAdmin)}
              className="text-black w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none disabled:bg-gray-100"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleAddComment}
                disabled={!user || submitting || !newComment.trim() || (thread.isLocked && !isAdmin)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                {submitting ? 'Надсилаємо...' : 'Надіслати'}
              </button>
            </div>
          </div>

          {/* Comments list */}
          <div className="flex flex-col gap-2">
            {commentTree.map(comment => renderComment(comment))}
          </div>
        </div>
      </div>
    </div >
  );
}
