import { ref, get, set, update, onValue } from 'firebase/database';
import { database, auth } from './config';
import { Giveaway, GiveawayParticipant, Order } from './types';
import { checkAdminAccess } from './admin';

export async function createGiveaway(data: Omit<Giveaway, 'id' | 'createdAt' | 'updatedAt' | 'participantsCount' | 'status'>): Promise<string> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) throw new Error('Admin access required');

  const giveawayId = Date.now().toString();
  const giveawayRef = ref(database, `giveaways/${giveawayId}`);

  const giveaway: Giveaway = {
    ...data,
    id: giveawayId,
    status: 'active',
    participantsCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await set(giveawayRef, giveaway);
  return giveawayId;
}

export function fetchGiveaways(callback: (giveaways: Giveaway[]) => void): () => void {
  const giveawaysRef = ref(database, 'giveaways');
  return onValue(giveawaysRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const giveaways = Object.values(data).sort((a: any, b: any) => b.createdAt - a.createdAt);
      callback(giveaways as Giveaway[]);
    } else {
      callback([]);
    }
  });
}

export async function fetchGiveaway(giveawayId: string): Promise<Giveaway | null> {
  const snapshot = await get(ref(database, `giveaways/${giveawayId}`));
  return snapshot.exists() ? (snapshot.val() as Giveaway) : null;
}

export async function joinGiveaway(giveawayId: string, userId: string, userName: string, userPhone?: string, userPhotoURL?: string): Promise<void> {
  const participantRef = ref(database, `giveaway_participants/${giveawayId}/${userId}`);
  const snapshot = await get(participantRef);
  if (snapshot.exists()) throw new Error('Ви вже берете участь у цьому розіграші');

  // Check if user has completed orders via profile
  const userRef = ref(database, `users/${userId}`);
  const userSnapshot = await get(userRef);
  const hasCompletedOrder = userSnapshot.exists() && (userSnapshot.val().totalOrders || 0) > 0;

  const participant: GiveawayParticipant = {
    id: `${giveawayId}_${userId}`,
    giveawayId,
    userId,
    userName,
    userPhone: userPhone || '',
    userPhotoURL: userPhotoURL || '',
    hasCompletedOrder,
    joinedAt: Date.now(),
  };

  await set(participantRef, participant);

  // Increment participants count
  const giveawayRef = ref(database, `giveaways/${giveawayId}`);
  const giveawaySnapshot = await get(giveawayRef);
  if (giveawaySnapshot.exists()) {
    const currentCount = giveawaySnapshot.val().participantsCount || 0;
    await update(giveawayRef, { participantsCount: currentCount + 1 });
  }
}

export async function checkIfJoined(giveawayId: string, userId: string): Promise<boolean> {
  const participantRef = ref(database, `giveaway_participants/${giveawayId}/${userId}`);
  const snapshot = await get(participantRef);
  return snapshot.exists();
}

export async function pickWinners(giveawayId: string): Promise<void> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) throw new Error('Admin access required');

  const giveawayRef = ref(database, `giveaways/${giveawayId}`);
  const giveawaySnapshot = await get(giveawayRef);
  if (!giveawaySnapshot.exists()) throw new Error('Giveaway not found');
  const giveaway = giveawaySnapshot.val() as Giveaway;

  const participantsSnapshot = await get(ref(database, `giveaway_participants/${giveawayId}`));
  if (!participantsSnapshot.exists()) throw new Error('Немає учасників для вибору переможця');

  const participants = Object.values(participantsSnapshot.val()) as GiveawayParticipant[];
  const winnersCount = Math.min(giveaway.winnersCount, participants.length);

  // Weighted random logic for +10% chance
  const winners: { userId: string; userName: string; userPhone?: string }[] = [];
  const available = participants.map(p => ({
    ...p,
    weight: p.hasCompletedOrder ? 1.1 : 1.0
  }));

  while (winners.length < Math.min(winnersCount, participants.length) && available.length > 0) {
    const totalWeight = available.reduce((sum, p) => sum + p.weight, 0);
    let r = Math.random() * totalWeight;
    
    for (let i = 0; i < available.length; i++) {
      r -= available[i].weight;
      if (r <= 0) {
        const winner = available.splice(i, 1)[0];
        winners.push({
          userId: winner.userId,
          userName: winner.userName,
          userPhone: winner.userPhone
        });
        break;
      }
    }
  }

  await update(giveawayRef, {
    status: 'completed',
    winners,
    updatedAt: Date.now()
  });
}

export async function deleteGiveaway(giveawayId: string): Promise<void> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) throw new Error('Admin access required');

  await set(ref(database, `giveaways/${giveawayId}`), null);
  await set(ref(database, `giveaway_participants/${giveawayId}`), null);
}

export async function fetchGiveawayParticipants(giveawayId: string): Promise<GiveawayParticipant[]> {
  const snapshot = await get(ref(database, `giveaway_participants/${giveawayId}`));
  if (!snapshot.exists()) return [];
  return Object.values(snapshot.val()) as GiveawayParticipant[];
}
