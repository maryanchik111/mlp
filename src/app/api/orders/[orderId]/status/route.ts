import { NextRequest, NextResponse } from 'next/server';
import { database, sendOrderNotificationToTelegram } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';

/**
 * PATCH /api/orders/[orderId]/status
 * 
 * Оновити статус замовлення і відправити сповіщення в Telegram
 * 
 * Body: {
 *   status: "processing" | "completed" | "cancelled"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { status } = await request.json();

    console.log(`[Status API] Оновлення статусу замовлення ${orderId} на "${status}"`);

    // Перевіряємо статус
    if (!['processing', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Отримуємо замовлення
    const orderRef = ref(database, `orders/${orderId}`);
    const orderSnapshot = await get(orderRef);

    if (!orderSnapshot.exists()) {
      console.log(`[Status API] Замовлення ${orderId} не знайдено`);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderSnapshot.val();
    console.log(`[Status API] Замовлення знайдено:`, {
      orderId,
      userId: order.userId,
      currentStatus: order.status,
      newStatus: status,
    });

    // Оновлюємо статус
    await update(orderRef, {
      status: status,
      updatedAt: Date.now(),
    });

    console.log(`[Status API] Статус оновлено в базі даних`);

    // Відправляємо сповіщення в Telegram якщо користувач авторизований
    if (order.userId) {
      console.log(`[Status API] Намагаємось відправити Telegram сповіщення для ${order.userId}`);
      const notificationSent = await sendOrderNotificationToTelegram(
        order.userId,
        {
          ...order,
          id: orderId,
        },
        status as 'processing' | 'completed' | 'cancelled'
      );

      console.log(`[Status API] Результат Telegram сповіщення:`, { sent: notificationSent });

      return NextResponse.json({
        ok: true,
        orderId,
        status,
        telegramNotificationSent: notificationSent,
      });
    }

    console.log(`[Status API] У замовленні немає userId, сповіщення не відправляється`);

    return NextResponse.json({
      ok: true,
      orderId,
      status,
      telegramNotificationSent: false,
    });
  } catch (error) {
    console.error('[Status API] Помилка при оновленні статусу:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
