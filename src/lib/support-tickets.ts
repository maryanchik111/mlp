import { database } from './firebase';
import { ref, set, get, update, query, orderByChild, limitToLast } from 'firebase/database';

export interface SupportTicket {
  id: string;
  telegramId: string;
  telegramUsername?: string;
  userId?: string; // якщо авторизований
  message: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: number;
  updatedAt: number;
  adminReply?: string;
  adminReplyAt?: number;
}

/**
 * Створити новий тікет підтримки
 */
export async function createSupportTicket(
  telegramId: string,
  message: string,
  telegramUsername?: string,
  userId?: string
): Promise<string | null> {
  try {
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ticketRef = ref(database, `support_tickets/${ticketId}`);

    const ticket: SupportTicket = {
      id: ticketId,
      telegramId,
      telegramUsername,
      userId,
      message,
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await set(ticketRef, ticket);
    return ticketId;
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return null;
  }
}

/**
 * Отримати всі тікети (для адміна)
 */
export async function getAllSupportTickets(): Promise<SupportTicket[]> {
  try {
    const ticketsRef = ref(database, 'support_tickets');
    const snapshot = await get(ticketsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const tickets = Object.values(snapshot.val()) as SupportTicket[];
    return tickets.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting support tickets:', error);
    return [];
  }
}

/**
 * Отримати тікети за статусом
 */
export async function getSupportTicketsByStatus(status: 'open' | 'in_progress' | 'closed'): Promise<SupportTicket[]> {
  try {
    const allTickets = await getAllSupportTickets();
    return allTickets.filter(t => t.status === status);
  } catch (error) {
    console.error('Error getting support tickets by status:', error);
    return [];
  }
}

/**
 * Отримати один тікет по ID
 */
export async function getSupportTicket(ticketId: string): Promise<SupportTicket | null> {
  try {
    const ticketRef = ref(database, `support_tickets/${ticketId}`);
    const snapshot = await get(ticketRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val() as SupportTicket;
  } catch (error) {
    console.error('Error getting support ticket:', error);
    return null;
  }
}

/**
 * Оновити статус тікета
 */
export async function updateTicketStatus(ticketId: string, status: 'open' | 'in_progress' | 'closed'): Promise<boolean> {
  try {
    const ticketRef = ref(database, `support_tickets/${ticketId}`);
    await update(ticketRef, {
      status,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return false;
  }
}

/**
 * Додати відповідь адміна на тікет
 */
export async function addAdminReply(ticketId: string, reply: string): Promise<boolean> {
  try {
    const ticketRef = ref(database, `support_tickets/${ticketId}`);
    await update(ticketRef, {
      adminReply: reply,
      adminReplyAt: Date.now(),
      status: 'in_progress',
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Error adding admin reply:', error);
    return false;
  }
}

/**
 * Закрити тікет
 */
export async function closeTicket(ticketId: string): Promise<boolean> {
  try {
    const ticketRef = ref(database, `support_tickets/${ticketId}`);
    await update(ticketRef, {
      status: 'closed',
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Error closing ticket:', error);
    return false;
  }
}
