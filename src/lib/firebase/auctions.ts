import { ref, onValue, get, set, update } from 'firebase/database';
import { database, auth } from './config';
import { Auction } from './types';
import { checkAdminAccess } from './admin';

// Створити новий аукціон (тільки адмін)
export async function createAuction(
  name: string,
  description: string,
  startPrice: number,
  minBidStep: number,
  timeoutMinutes: number,
  openTime: number,
  image: string = ''
): Promise<string> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) {
    throw new Error('Admin access required');
  }

  const auctionId = Date.now().toString();
  const auctionRef = ref(database, `auctions/${auctionId}`);

  const auction: Auction = {
    id: auctionId,
    name,
    description,
    image,
    startPrice,
    currentPrice: startPrice,
    minBidStep,
    timeoutMinutes,
    openTime,
    status: 'scheduled',
    createdAt: Date.now(),
  };

  await set(auctionRef, auction);
  return auctionId;
}

// Отримати все аукціони
export async function fetchAllAuctions(callback: (auctions: Auction[]) => void): Promise<void> {
  const auctionsRef = ref(database, 'auctions');
  onValue(auctionsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const auctions = Object.values(data).sort(
        (a: any, b: any) => b.createdAt - a.createdAt
      );
      callback(auctions as Auction[]);
    } else {
      callback([]);
    }
  });
}

// Отримати один аукціон
export async function fetchAuction(auctionId: string): Promise<Auction | null> {
  try {
    const snapshot = await get(ref(database, `auctions/${auctionId}`));
    return snapshot.exists() ? (snapshot.val() as Auction) : null;
  } catch (e) {
    console.error('Помилка отримання аукціону:', e);
    return null;
  }
}

// Зробити ставку
export async function placeBid(
  auctionId: string,
  userId: string,
  userName: string,
  bidAmount: number
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be authenticated');

  const auction = await fetchAuction(auctionId);
  if (!auction) throw new Error('Auction not found');
  if (auction.status !== 'active') throw new Error('Auction is not active');

  const minBidAmount = auction.currentPrice + auction.minBidStep;
  if (bidAmount < minBidAmount) {
    throw new Error(`Bid must be at least ${minBidAmount}`);
  }

  const bid = {
    userId,
    userName,
    amount: bidAmount,
    timestamp: Date.now(),
  };

  const auctionRef = ref(database, `auctions/${auctionId}`);
  await update(auctionRef, {
    currentPrice: bidAmount,
    bids: [...(auction.bids || []), bid],
    lastBidTime: Date.now(),
  });
}

// Закрити аукціон
export async function closeAuction(auctionId: string): Promise<void> {
  const auction = await fetchAuction(auctionId);
  if (!auction) throw new Error('Auction not found');

  const auctionRef = ref(database, `auctions/${auctionId}`);
  const lastBid = auction.bids?.[auction.bids.length - 1];

  await update(auctionRef, {
    status: 'ended',
    endTime: Date.now(),
    winnerUserId: lastBid?.userId || null,
    winnerUserName: lastBid?.userName || null,
  });
}

// Оновити аукціон (адмін)
export async function updateAuction(
  auctionId: string,
  updates: Partial<Auction>
): Promise<void> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) throw new Error('Admin access required');

  const auctionRef = ref(database, `auctions/${auctionId}`);
  await update(auctionRef, updates);
}

// Видалити аукціон (адмін)
export async function deleteAuction(auctionId: string): Promise<void> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) throw new Error('Admin access required');

  const auctionRef = ref(database, `auctions/${auctionId}`);
  await set(auctionRef, null);
}
