import { NextRequest, NextResponse } from 'next/server';
import { respondToTicket, getSupportTicket } from '@/lib/firebase';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

/**
 * POST /api/support/respond
 * 
 * Відправити відповідь на тікет підтримки користувачу
 * 
 * Body: {
 *   ticketId: "ticket_...",
 *   adminReply: "Відповідь адміна",
 *   status: "responded" | "closed"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { ticketId, adminReply, status = 'responded' } = await request.json();

    if (!ticketId || !adminReply) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Оновлюємо тікет
    const updated = await respondToTicket(ticketId, adminReply, status);

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      );
    }

    // Отримуємо оновлений тікет
    const ticket = await getSupportTicket(ticketId);

    if (ticket && ticket.telegramId) {
      // Відправляємо відповідь користувачу в Telegram
      try {
        const message = `📬 <b>Відповідь на ваше повідомлення:</b>\n\n${adminReply}\n\n<i>Статус: ${status === 'closed' ? '✅ Закрито' : '⏳ Розглядається'}</i>`;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: ticket.telegramId,
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
      ticketId,
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
