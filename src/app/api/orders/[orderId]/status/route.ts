import { NextRequest, NextResponse } from 'next/server';
import { database, sendOrderNotificationToTelegram } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';

/**
 * PATCH /api/orders/[orderId]/status
 * 
 * Оновити статус замовлення і відправити сповіщення в Telegram
 * 
 * Body: {
 *   status: "processing" | "shipped" | "ready_for_pickup" | "completed" | "cancelled",
 *   trackingNumber?: "ТТН" (для статусу "shipped")
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { status, trackingNumber } = await request.json();

    // Перевіряємо статус
    if (!['processing', 'shipped', 'ready_for_pickup', 'completed', 'cancelled'].includes(status)) {
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

    // Підготовлюємо оновлення
    const updateData: any = {
      status: status,
      updatedAt: Date.now(),
    };

    // Додаємо ТТН якщо він передано
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    // Оновлюємо статус
    await update(orderRef, updateData);

    // Відправляємо сповіщення в Telegram якщо користувач авторизований
    if (order.userId) {
      const notificationSent = await sendOrderNotificationToTelegram(
        order.userId,
        {
          ...order,
          id: orderId,
          trackingNumber: trackingNumber || order.trackingNumber,
        },
        status as 'processing' | 'shipped' | 'ready_for_pickup' | 'completed' | 'cancelled'
      );

      return NextResponse.json({
        ok: true,
        orderId,
        status,
        trackingNumber: trackingNumber || null,
        telegramNotificationSent: notificationSent,
      });
    }

    return NextResponse.json({
      ok: true,
      orderId,
      status,
      trackingNumber: trackingNumber || null,
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
