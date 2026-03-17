import { NextRequest, NextResponse } from 'next/server';
import { respondToTicket, getSupportTicket } from '@/lib/firebase';

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
  if (API_SECRET) {
    const secret = request.headers.get('x-api-secret');
    if (secret !== API_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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

    // Оновлюємо тікет
    const updated = await respondToTicket(telegramId, adminReply, status);

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      );
    }

    // Отримуємо оновлений тікет
    const ticket = await getSupportTicket(telegramId);

    if (ticket) {
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
