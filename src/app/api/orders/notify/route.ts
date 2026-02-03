import { NextRequest, NextResponse } from 'next/server';
import { sendOrderNotificationToTelegram } from '@/lib/firebase';

/**
 * POST /api/orders/notify
 * 
 * Відправити сповіщення про замовлення в Telegram
 * 
 * Body: {
 *   userId: "uid",
 *   order: { id, finalPrice, ... },
 *   status: "created" | "processing" | "completed" | "cancelled"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, order, status } = await request.json();

    if (!userId || !order || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`[API] Отримано запит на відправку сповіщення:`, {
      userId,
      orderId: order.id,
      status,
    });

    const sent = await sendOrderNotificationToTelegram(userId, order, status);

    return NextResponse.json({
      ok: true,
      sent,
      message: sent ? 'Notification sent' : 'User has no Telegram binding',
    });
  } catch (error) {
    console.error('[API] Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
