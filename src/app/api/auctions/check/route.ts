import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get, update, set } from 'firebase/database';

/**
 * Этот маршрут проверяет и закрывает аукционы, у которых истек таймаут
 * Может быть вызван периодически через cron-job или при каждом обновлении страницы
 */
export async function GET(request: NextRequest) {
  try {
    // Завантажити всі аукціони
    const auctionsRef = ref(database, 'auctions');
    const snapshot = await get(auctionsRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ closed: 0, updated: 0 });
    }

    const auctions = snapshot.val();
    let closedCount = 0;
    let updatedCount = 0;
    const now = Date.now();

    for (const [auctionId, auction] of Object.entries(auctions)) {
      const auctionData = auction as any;

      // Перевірити запланові аукціони
      if (
        auctionData.status === 'scheduled' &&
        now >= auctionData.openTime
      ) {
        const auctionRef = ref(database, `auctions/${auctionId}`);
        await update(auctionRef, {
          status: 'active',
          openedAt: now,
        });
        updatedCount++;
      }

      // Перевірити активні аукціони на час неперебивання
      if (
        auctionData.status === 'active' &&
        auctionData.lastBidTime &&
        auctionData.timeoutMinutes
      ) {
        const timeoutMs = auctionData.timeoutMinutes * 60 * 1000;
        const closeTime = auctionData.lastBidTime + timeoutMs;

        if (now > closeTime) {
          // Закрити аукціон
          const auctionRef = ref(database, `auctions/${auctionId}`);
          const lastBid = auctionData.bids?.[auctionData.bids.length - 1];

          await update(auctionRef, {
            status: 'ended',
            closedAt: now,
            winnerUserId: lastBid?.userId || null,
            winnerUserName: lastBid?.userName || null,
          });
          closedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      closed: closedCount,
      updated: updatedCount,
      timestamp: now,
    });
  } catch (error) {
    console.error('Помилка при оновленні аукціонів:', error);
    return NextResponse.json(
      { error: 'Failed to process auctions' },
      { status: 500 }
    );
  }
}
