import { ref, get, set, update, onValue } from 'firebase/database';
import { database, auth } from './config';
import { checkAdminAccess } from './admin';

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  isAdmin?: boolean;
  authorRank?: number;
  category: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  isLocked: boolean;
  commentsCount: number;
  viewsCount: number;
  reactions: { [userId: string]: string };
}

export interface ForumComment {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  isAdmin?: boolean;
  authorRank?: number;
  createdAt: number;
  updatedAt: number;
  reactions: { [userId: string]: string };
  isEdited: boolean;
  replyToId?: string;
  replyToName?: string;
}

export async function createForumThread(
  userId: string,
  userName: string,
  userPhoto: string | null,
  title: string,
  content: string,
  category: string,
  isAdmin?: boolean,
  authorRank?: number
): Promise<string> {
  const threadId = Date.now().toString();
  const threadRef = ref(database, `forum/threads/${threadId}`);

  const thread: ForumThread = {
    id: threadId,
    title,
    content,
    authorId: userId,
    authorName: userName,
    authorPhoto: userPhoto,
    category,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPinned: false,
    isLocked: false,
    commentsCount: 0,
    viewsCount: 0,
    reactions: {},
  };

  if (isAdmin !== undefined) thread.isAdmin = isAdmin;
  if (authorRank !== undefined) thread.authorRank = authorRank;

  await set(threadRef, thread);
  return threadId;
}

export function subscribeToForumThreads(callback: (threads: ForumThread[]) => void): () => void {
  const threadsRef = ref(database, 'forum/threads');
  return onValue(threadsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const threads: ForumThread[] = Object.values(snapshot.val());
    threads.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
    callback(threads);
  });
}

export async function getForumThread(threadId: string): Promise<ForumThread | null> {
  const snapshot = await get(ref(database, `forum/threads/${threadId}`));
  return snapshot.exists() ? (snapshot.val() as ForumThread) : null;
}

export function subscribeToForumThread(threadId: string, callback: (thread: ForumThread | null) => void): () => void {
  const threadRef = ref(database, `forum/threads/${threadId}`);
  return onValue(threadRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as ForumThread) : null);
  });
}

export async function addForumComment(
  threadId: string,
  userId: string,
  userName: string,
  userPhoto: string | null,
  content: string,
  isAdmin?: boolean,
  authorRank?: number,
  replyToId?: string,
  replyToName?: string
): Promise<string> {
  const commentId = Date.now().toString();
  const commentRef = ref(database, `forum/comments/${threadId}/${commentId}`);

  const comment: ForumComment = {
    id: commentId,
    threadId,
    content,
    authorId: userId,
    authorName: userName,
    authorPhoto: userPhoto,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reactions: {},
    isEdited: false,
  };

  if (isAdmin !== undefined) comment.isAdmin = isAdmin;
  if (authorRank !== undefined) comment.authorRank = authorRank;
  if (replyToId !== undefined) comment.replyToId = replyToId;
  if (replyToName !== undefined) comment.replyToName = replyToName;

  await set(commentRef, comment);

  const thread = await getForumThread(threadId);
  if (thread) {
    await update(ref(database, `forum/threads/${threadId}`), {
      commentsCount: (thread.commentsCount || 0) + 1,
      updatedAt: Date.now(),
    });
  }

  return commentId;
}

export function subscribeToForumComments(threadId: string, callback: (comments: ForumComment[]) => void): () => void {
  const commentsRef = ref(database, `forum/comments/${threadId}`);
  return onValue(commentsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const comments: ForumComment[] = Object.values(snapshot.val());
    comments.sort((a, b) => a.createdAt - b.createdAt);
    callback(comments);
  });
}

export async function toggleThreadPin(threadId: string): Promise<void> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) throw new Error('Admin access required');

  const thread = await getForumThread(threadId);
  if (!thread) return;

  await update(ref(database, `forum/threads/${threadId}`), {
    isPinned: !thread.isPinned,
  });
}

export async function toggleThreadLock(threadId: string): Promise<void> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) throw new Error('Admin access required');

  const thread = await getForumThread(threadId);
  if (!thread) return;

  await update(ref(database, `forum/threads/${threadId}`), {
    isLocked: !thread.isLocked,
  });
}

export async function deleteForumThread(threadId: string, userId: string): Promise<void> {
  const thread = await getForumThread(threadId);
  if (!thread) return;

  const user = auth.currentUser;
  if (thread.authorId !== userId && !checkAdminAccess(user)) {
    throw new Error('Access denied');
  }

  await set(ref(database, `forum/threads/${threadId}`), null);
  await set(ref(database, `forum/comments/${threadId}`), null);
}

export async function deleteForumComment(threadId: string, commentId: string, userId: string): Promise<void> {
  const commentRef = ref(database, `forum/comments/${threadId}/${commentId}`);
  const snapshot = await get(commentRef);
  if (!snapshot.exists()) return;

  const comment = snapshot.val() as ForumComment;
  const user = auth.currentUser;

  if (comment.authorId !== userId && !checkAdminAccess(user)) {
    throw new Error('Access denied');
  }

  await set(commentRef, null);

  const thread = await getForumThread(threadId);
  if (thread) {
    await update(ref(database, `forum/threads/${threadId}`), {
      commentsCount: Math.max(0, (thread.commentsCount || 0) - 1),
    });
  }
}
export async function getForumThreads(): Promise<ForumThread[]> {
  try {
    const snapshot = await get(ref(database, 'forum/threads'));
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val()) as ForumThread[];
  } catch (error) {
    console.error('Error fetching forum threads:', error);
    return [];
  }
}
export async function getForumComments(threadId: string): Promise<ForumComment[]> {
  try {
    const snapshot = await get(ref(database, `forum/comments/${threadId}`));
    if (!snapshot.exists()) return [];
    const comments: ForumComment[] = Object.values(snapshot.val());
    return comments.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.error('Error fetching forum comments:', error);
    return [];
  }
}

export async function addThreadReaction(threadId: string, userId: string, reaction: string): Promise<void> {
  const reactionRef = ref(database, `forum/threads/${threadId}/reactions/${userId}`);
  await set(reactionRef, reaction);
}

export async function removeThreadReaction(threadId: string, userId: string): Promise<void> {
  const reactionRef = ref(database, `forum/threads/${threadId}/reactions/${userId}`);
  await set(reactionRef, null);
}

export async function addCommentReaction(threadId: string, commentId: string, userId: string, reaction: string): Promise<void> {
  const reactionRef = ref(database, `forum/comments/${threadId}/${commentId}/reactions/${userId}`);
  await set(reactionRef, reaction);
}

export async function removeCommentReaction(threadId: string, commentId: string, userId: string): Promise<void> {
  const reactionRef = ref(database, `forum/comments/${threadId}/${commentId}/reactions/${userId}`);
  await set(reactionRef, null);
}

export async function editForumThread(threadId: string, title: string, content: string): Promise<void> {
  await update(ref(database, `forum/threads/${threadId}`), {
    title,
    content,
    updatedAt: Date.now(),
  });
}

export async function editForumComment(threadId: string, commentId: string, content: string): Promise<void> {
  await update(ref(database, `forum/comments/${threadId}/${commentId}`), {
    content,
    updatedAt: Date.now(),
    isEdited: true,
  });
}

export async function incrementThreadViews(threadId: string): Promise<void> {
  const thread = await getForumThread(threadId);
  if (thread) {
    await update(ref(database, `forum/threads/${threadId}`), {
      viewsCount: (thread.viewsCount || 0) + 1,
    });
  }
}
