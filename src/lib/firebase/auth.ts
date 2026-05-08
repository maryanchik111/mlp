import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  User,
  updateProfile
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, googleProvider, database } from './config';
import { UserProfile } from './types';

// Google Auth
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await ensureUserProfile(user);
    return user;
  } catch (error) {
    console.error('Помилка авторизації через Google:', error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Phone Auth
export const setupRecaptcha = (containerId: string) => {
  if (typeof window === 'undefined') return null;
  return new RecaptchaVerifier(auth, containerId, {
    'size': 'invisible',
  });
};

export const signInWithPhone = async (phoneNumber: string, appVerifier: any) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('Помилка відправки SMS:', error);
    throw error;
  }
};

export const subscribeAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      await ensureUserProfile(user);
    }
    callback(user);
  });
};

// User Profile logic
const computeRatingAndDiscount = (totalOrders: number): { rating: number; discountPercent: number } => {
  if (totalOrders >= 50) return { rating: 5, discountPercent: 10 };
  if (totalOrders >= 20) return { rating: 4, discountPercent: 7 };
  if (totalOrders >= 10) return { rating: 3, discountPercent: 5 };
  if (totalOrders >= 5) return { rating: 2, discountPercent: 2 };
  if (totalOrders >= 1) return { rating: 1, discountPercent: 0 };
  return { rating: 0, discountPercent: 0 };
};

export const ensureUserProfile = async (user: User) => {
  if (!user) return;
  const userRef = ref(database, `users/${user.uid}`);
  const snapshot = await get(userRef);
  const now = Date.now();
  const displayName = user.displayName || user.phoneNumber || 'Користувач';

  if (!user.displayName) {
    try {
      await updateProfile(user, { displayName });
    } catch (e) {}
  }

  if (!snapshot.exists()) {
    const initialProfile: UserProfile = {
      id: user.uid,
      email: user.email || undefined,
      phone: user.phoneNumber || undefined,
      displayName,
      photoURL: user.photoURL || undefined,
      totalOrders: 0,
      totalSpent: 0,
      rating: 0,
      points: 0,
      discountPercent: 0,
      registeredAt: now,
      lastLoginAt: now,
    };
    await set(userRef, initialProfile);
  } else {
    await update(userRef, { lastLoginAt: now });
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? (snapshot.val() as UserProfile) : null;
  } catch (error) {
    console.error('Помилка отримання профілю:', error);
    return null;
  }
};
