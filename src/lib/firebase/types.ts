export interface CartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  image: string;
  category: string;
  maxQuantity?: number;
  discount?: number;
  deliveryPrice?: string;
  deliveryDays?: string;
}

export interface Order {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  deliveryMethod: 'nova';
  paymentMethod: 'card';
  comments: string;
  items: CartItem[];
  totalPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  discountedSubtotal?: number;
  deliveryPrice: number;
  redeemedPoints?: number;
  redeemedAmount?: number;
  finalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'ready_for_pickup' | 'completed' | 'cancelled';
  trackingNumber?: string;
  createdAt: number;
  updatedAt: number;
  userId?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  costPrice?: string;
  image: string;
  description: string;
  inStock: boolean;
  quantity: number;
  images?: string[];
  discount?: number;
  deliveryPrice?: string;
  deliveryDays?: string;
  isAbroad?: boolean;
  boxItemId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  uid?: string;
  email?: string;
  phone?: string;
  displayName?: string;
  photoURL?: string;
  totalOrders: number;
  totalSpent: number;
  rating: number;
  points: number;
  discountPercent: number;
  registeredAt: number;
  lastLoginAt: number;
  telegramId?: string;
  telegramUsername?: string;
  isBlocked?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface Auction {
  id: string;
  name: string;
  description: string;
  startPrice: number;
  currentPrice: number;
  minBidStep: number;
  timeoutMinutes: number;
  image: string;
  status: 'scheduled' | 'active' | 'ended' | 'closed';
  openTime: number;
  endTime?: number;
  winnerUserId?: string;
  winnerUserName?: string;
  winnerPhone?: string;
  lastBidTime?: number;
  bids?: {
    userId: string;
    userName: string;
    amount: number;
    timestamp: number;
  }[];
  createdAt: number;
}

export interface BoxType {
  id: string;
  name: string;
  description: string;
  capacity: number;
  basePrice: number;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface BoxItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  images: string[];
  isActive: boolean;
  catalogProductId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  prize: string;
  image?: string;
  startDate: number;
  endDate: number;
  winnersCount: number;
  status: 'active' | 'completed' | 'cancelled';
  winners?: {
    userId: string;
    userName: string;
    userPhone?: string;
  }[];
  participantsCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface GiveawayParticipant {
  id: string; // giveawayId_userId
  giveawayId: string;
  userId: string;
  userName: string;
  userPhone?: string;
  hasCompletedOrder: boolean;
  joinedAt: number;
}
