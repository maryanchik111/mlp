import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin-config';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const API_SECRET = process.env.API_SECRET || '';

/**
 * POST /api/support/respond
 * 
 * Відправити відповідь на тікет підтримки користувачу
 * 
 * Body: {
 *   telegramId: "123456789",
 *   adminReply: "Відповідь адміна",
 *   adminName: "Марія", // Ім'я адміністратора
 *   status: "responded" | "closed"
 * }
 */
export async function POST(request: NextRequest) {
  // Auth check — admin use only
  const secret = request.headers.get('x-api-secret');
  if (!API_SECRET || secret !== API_SECRET) {
    return NextResponse.json({ error: 'Forbidden or missing API_SECRET' }, { status: 403 });
  }

  try {
    const { telegramId, adminReply = '', adminName = 'Адміністратор', status = 'responded' } = await request.json();

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Missing telegramId' },
        { status: 400 }
      );
    }

    // Дозволяємо пусту відповідь при закритті тікета
    if (status === 'responded' && !adminReply.trim()) {
      return NextResponse.json(
        { error: 'adminReply required for responded status' },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    const ticketRef = adminDb.ref(`support_tickets/${telegramId}`);
    const snapshot = await ticketRef.get();

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const ticket = snapshot.val();
    const messages = ticket.messages || [];
    
    if (adminReply.trim()) {
      messages.push({ text: adminReply, timestamp: Date.now(), isAdmin: true });
    }

    await ticketRef.update({
      messages,
      status,
      updatedAt: Date.now()
    });

    // Відправляємо відповідь користувачу в Telegram
    try {
      let message: string;

      if (status === 'closed') {
        message = `🔔 Ваш тікет був закритий\n\nДякую за звернення до нас! Якщо у вас ще є питання, ми завжди тут для вас 💜`;
      } else {
        message = `- ${adminReply}\n\nАдміністратор ${adminName}`;
      }

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
    } catch (error) {
      console.error('Error sending Telegram response:', error);
    }

    return NextResponse.json({
      ok: true,
      telegramId,
      status,
    });
  } catch (error) {
    console.error('Error responding to ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
