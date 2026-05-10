import { User } from 'firebase/auth';

// Читаємо ID адмінів з env
const rawAdminIds = process.env.ADMIN_TELEGRAM_IDS || "";
export const ADMIN_TELEGRAM_IDS = rawAdminIds ? rawAdminIds.split(',').map(id => id.trim()) : [];

export const ADMIN_EMAILS = [
  'maryanlikesyou@gmail.com',
  'musevi4ka@gmail.com',
];

export const isAdmin = (email: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

export const checkAdminAccess = (user: User | null): boolean => {
  return user ? isAdmin(user.email) : false;
};
