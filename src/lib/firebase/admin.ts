import { User } from 'firebase/auth';

export const ADMIN_TELEGRAM_ID = "7365171162";

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
