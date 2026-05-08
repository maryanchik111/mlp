import { ref, get, set, update, onValue } from 'firebase/database';
import { database } from './config';

export interface SupportMessage {
  text: string;
  timestamp: number;
  isAdmin: boolean;
}

export interface SupportTicket {
  id: string;
  telegramId: string;
  telegramUsername?: string;
  userId?: string;
  messages: SupportMessage[];
  status: 'open' | 'responded' | 'closed';
  createdAt: number;
  updatedAt: number;
}

export async function createSupportTicket(
  telegramId: string,
  message: string,
  telegramUsername?: string,
  userId?: string
): Promise<string | null> {
  try {
    const ticketRef = ref(database, `support_tickets/${telegramId}`);
    const snapshot = await get(ticketRef);
    const now = Date.now();
    const newMessage: SupportMessage = { text: message, timestamp: now, isAdmin: false };

    if (snapshot.exists()) {
      const existingTicket = snapshot.val() as SupportTicket;
      const messages = existingTicket.messages || [];
      messages.push(newMessage);
      await update(ticketRef, { messages, status: 'open', updatedAt: now });
    } else {
      await set(ticketRef, {
        telegramId,
        telegramUsername: telegramUsername || null,
        userId: userId || null,
        messages: [newMessage],
        status: 'open',
        createdAt: now,
        updatedAt: now,
      });
    }
    return telegramId;
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return null;
  }
}

export async function getAllSupportTickets(): Promise<SupportTicket[]> {
  try {
    const snapshot = await get(ref(database, 'support_tickets'));
    if (!snapshot.exists()) return [];
    const tickets: SupportTicket[] = Object.entries(snapshot.val() as Record<string, Omit<SupportTicket, 'id'>>).map(([id, val]) => ({ id, ...val }));
    return tickets.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return [];
  }
}

export function listenToSupportTickets(callback: (tickets: SupportTicket[]) => void): () => void {
  const ticketsRef = ref(database, 'support_tickets');
  return onValue(ticketsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const tickets: SupportTicket[] = Object.entries(snapshot.val() as Record<string, Omit<SupportTicket, 'id'>>).map(([id, val]) => ({ id, ...val }));
    tickets.sort((a, b) => b.updatedAt - a.updatedAt);
    callback(tickets);
  });
}

export async function respondToTicket(
  telegramId: string,
  adminReply: string,
  status: 'responded' | 'closed' = 'responded'
): Promise<boolean> {
  try {
    const ticketRef = ref(database, `support_tickets/${telegramId}`);
    const snapshot = await get(ticketRef);
    if (!snapshot.exists()) return false;

    const ticket = snapshot.val() as SupportTicket;
    const messages = ticket.messages || [];
    if (adminReply.trim()) {
      messages.push({ text: adminReply, timestamp: Date.now(), isAdmin: true });
    }
    await update(ticketRef, { messages, status, updatedAt: Date.now() });
    return true;
  } catch (error) {
    console.error('Error responding to ticket:', error);
    return false;
  }
}

export async function closeTicket(telegramId: string): Promise<boolean> {
  try {
    await update(ref(database, `support_tickets/${telegramId}`), { status: 'closed', updatedAt: Date.now() });
    return true;
  } catch (error) {
    console.error('Error closing ticket:', error);
    return false;
  }
}
export async function getSupportTicket(telegramId: string): Promise<SupportTicket | null> {
  try {
    const ticketRef = ref(database, `support_tickets/${telegramId}`);
    const snapshot = await get(ticketRef);
    if (!snapshot.exists()) return null;
    return { id: telegramId, ...snapshot.val() };
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return null;
  }
}
