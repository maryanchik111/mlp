import { adminDb } from './admin-config';
import { SupportMessage, SupportTicket } from './support';

export async function createSupportTicketAdmin(
  telegramId: string,
  message: string,
  telegramUsername?: string,
  userId?: string
): Promise<string | null> {
  try {
    const ticketRef = adminDb.ref(`support_tickets/${telegramId}`);
    const snapshot = await ticketRef.get();
    const now = Date.now();
    const newMessage: SupportMessage = { text: message, timestamp: now, isAdmin: false };

    if (snapshot.exists()) {
      const existingTicket = snapshot.val() as SupportTicket;
      const messages = existingTicket.messages || [];
      messages.push(newMessage);
      await ticketRef.update({ messages, status: 'open', updatedAt: now });
    } else {
      await ticketRef.set({
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
    console.error('Error creating support ticket (admin):', error);
    return null;
  }
}
