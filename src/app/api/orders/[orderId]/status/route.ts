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
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderSnapshot.val();

    // Оновлюємо статус
    await update(orderRef, {
      status: status,
      updatedAt: Date.now(),
    });

    // Відправляємо сповіщення в Telegram якщо користувач авторизований
    if (order.userId) {
      const notificationSent = await sendOrderNotificationToTelegram(
        order.userId,
        {
          ...order,
          id: orderId,
        },
        status as 'processing' | 'completed' | 'cancelled'
      );

      return NextResponse.json({
        ok: true,
        orderId,
        status,
        telegramNotificationSent: notificationSent,
      });
    }

    return NextResponse.json({
      ok: true,
      orderId,
      status,
      telegramNotificationSent: false,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
