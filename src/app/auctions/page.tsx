'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Basket from '../components/client/busket';
import AccountButton from '../components/client/account-button';
import { fetchAllAuctions, fetchAuction, placeBid, updateAuction, type Auction } from '@/lib/firebase';
import { useAuth } from '@/app/providers';
import { useModal } from '@/app/providers';

export default function AuctionsPage() {
  const { user, profile } = useAuth();
  const { showSuccess, showError, showWarning } = useModal();
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [bidAmount, setBidAmount] = useState<Record<string, string>>({});
  const [placingBid, setPlacingBid] = useState<Record<string, boolean>>({});
  const [timers, setTimers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Завантаження аукціонів
  useEffect(() => {
    setLoading(true);
    fetchAllAuctions((auctions) => {
      // Оновити статус запланованих аукціонів
      const updated = auctions.map(auction => {
        const now = Date.now();
        if (auction.status === 'scheduled' && now >= auction.openTime) {
          return { ...auction, status: 'active' as const };
        }
        return auction;
      });
      setAllAuctions(updated);
      setLoading(false);

      // Запустити таймери
      updated.forEach(auction => {
        if (auction.status === 'active' && auction.lastBidTime && auction.timeoutMinutes) {
          const lastBidTime = auction.lastBidTime;
          const timeoutMs = auction.timeoutMinutes * 60 * 1000;
          const closeTime = lastBidTime + timeoutMs;
          updateCloseTimer(auction.id, closeTime);
        }
        if (auction.status === 'scheduled') {
          updateOpenTimer(auction.id, auction.openTime);
        }
      });
    });
  }, []);

  const updateCloseTimer = (auctionId: string, closeTime: number) => {
    const now = Date.now();
    const remaining = closeTime - now;

    if (remaining <= 0) {
      setTimers(prev => ({ ...prev, [auctionId]: 'Завершено' }));
    } else {
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimers(prev => ({
        ...prev,
        [auctionId]: `${minutes}:${seconds.toString().padStart(2, '0')}`
      }));
    }
  };

  const updateOpenTimer = (auctionId: string, openTime: number) => {
    const now = Date.now();
    const remaining = openTime - now;

    if (remaining <= 0) {
      setTimers(prev => ({ ...prev, [auctionId]: 'Відкривається...' }));
    } else {
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      if (hours > 0) {
        setTimers(prev => ({
          ...prev,
          [auctionId]: `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }));
      } else {
        setTimers(prev => ({
          ...prev,
          [auctionId]: `${minutes}:${seconds.toString().padStart(2, '0')}`
        }));
      }
    }
  };

  // Таймер для оновлення часу закриття та відкриття аукціонів
  useEffect(() => {
    const interval = setInterval(() => {
      setAllAuctions(prev => {
        let needsUpdate = false;
        const updated = prev.map(auction => {
          // Перевірити активні аукціони на час неперебивання
          if (auction.status === 'active' && auction.lastBidTime && auction.timeoutMinutes) {
            const timeoutMs = auction.timeoutMinutes * 60 * 1000;
            const closeTime = auction.lastBidTime + timeoutMs;
            const now = Date.now();

            updateCloseTimer(auction.id, closeTime);

            if (now > closeTime) {
              needsUpdate = true;
              // Оновити статус в базі на "ended"
              try {
                // mark ended and set winner using server helper
                // prefer calling closeAuction so winner fields are set
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                (async () => { const { closeAuction } = await import('@/lib/firebase'); try { await closeAuction(auction.id); } catch (e) { console.error(e); } })();
              } catch (error) {
                console.error('Помилка оновлення статусу аукціону:', error);
              }
              return { ...auction, status: 'ended' as const, closedAt: now };
            }
          }

          // Перевірити запланові аукціони на час відкриття
          if (auction.status === 'scheduled') {
            const now = Date.now();
            updateOpenTimer(auction.id, auction.openTime);

            if (now >= auction.openTime) {
              needsUpdate = true;
              // Оновити статус в Firebase
              try {
                updateAuction(auction.id, { status: 'active' });
              } catch (error) {
                console.error('Помилка оновлення статусу аукціону:', error);
              }
              return { ...auction, status: 'active' as const };
            }
          }

          return auction;
        });

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Розділені аукціони за статусами
  const activeAuctions = useMemo(
    () => allAuctions.filter(a => a.status === 'active'),
    [allAuctions]
  );

  const scheduledAuctions = useMemo(
    () => allAuctions.filter(a => a.status === 'scheduled'),
    [allAuctions]
  );

  // Accept legacy 'closed' status as finished as well
  const endedAuctions = useMemo(
    () => allAuctions.filter(a => (['ended', 'closed'] as string[]).includes(a.status as string)),
    [allAuctions]
  );

  // Обробка ставки
  const handlePlaceBid = async (auction: Auction) => {
    if (!user) {
      showWarning('Для участі в аукціоні потрібно авторизуватись');
      return;
    }

    if (profile?.isBlocked) {
      showWarning('Ваш акаунт заблоковано. Ви не можете робити ставки.');
      return;
    }

    const bid = parseInt(bidAmount[auction.id] || '0');
    const minBid = auction.currentPrice + auction.minBidStep;

    if (bid < minBid) {
      showError(`Мінімальна ставка: ${minBid}₴`);
      return;
    }

    setPlacingBid(prev => ({ ...prev, [auction.id]: true }));
    try {
      await placeBid(
        auction.id,
        user.uid,
        profile?.displayName || user.displayName || 'Анонім',
        bid
      );
      showSuccess('Ставка прийнята!');
      setBidAmount(prev => ({ ...prev, [auction.id]: '' }));
      fetchAllAuctions(setAllAuctions);
    } catch (error: any) {
      showError(error.message || 'Помилка при розміщенні ставки');
    } finally {
      setPlacingBid(prev => ({ ...prev, [auction.id]: false }));
    }
  };

  const AuctionCard = ({ auction }: { auction: Auction }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Зображення */}
      {auction.image && (
        <div className="w-full h-48 bg-gray-200 overflow-hidden">
          <img
            src={auction.image}
            alt={auction.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-2">{auction.name}</h3>
        {auction.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{auction.description}</p>
        )}

        {/* Ставки */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-center">
          <div className="bg-purple-50 p-3 rounded">
            <p className="text-xs text-gray-600">Поточна ставка</p>
            <p className="text-xl font-bold text-purple-600">{auction.currentPrice}₴</p>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-xs text-gray-600">Мін. ставка</p>
            <p className="text-lg font-bold text-blue-600">+{auction.minBidStep}₴</p>
          </div>
        </div>

        {/* Таймер для активних */}
        {auction.status === 'active' && (
          <div className="mb-3 p-3 bg-red-50 rounded border border-red-200 text-center">
            <p className="text-xs text-red-600">Закінчиться за</p>
            <p className="text-xl font-bold text-red-600">{timers[auction.id] || '—'}</p>
          </div>
        )}

        {/* Дата відкриття для запланованих */}
        {auction.status === 'scheduled' && (
          <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200 text-center">
            <p className="text-xs text-blue-600">Заплановано на</p>
            <p className="text-sm font-bold text-blue-600">
              {new Date(auction.openTime).toLocaleString('uk-UA', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}

        {/* Переможець для завершених */}
        {(() => {
          const lastBid = auction.bids && auction.bids.length ? auction.bids[auction.bids.length - 1] : null;
          const isFinished = (['ended', 'closed'] as string[]).includes(auction.status as string);
          const winnerName = auction.winnerUserName || lastBid?.userName || null;
          const winnerPrice = auction.currentPrice || lastBid?.amount || null;
          if (isFinished && winnerName) {
            return (
              <div className="mb-3 p-3 bg-green-50 rounded border border-green-200">
                <p className="text-xs text-green-600">🏆 Переможець</p>
                <p className="font-bold text-green-700">{winnerName}</p>
                {winnerPrice !== null && <p className="text-sm text-green-600">Ціна: {winnerPrice}₴</p>}
              </div>
            );
          }
          return null;
        })()}

        {/* Форма для ставки (тільки активні) */}
        {auction.status === 'active' && (
          <div className="space-y-3">
            {/* Поточна ставка */}
            <div className="bg-purple-100 p-3 rounded-lg text-center">
              <p className="text-xs text-purple-600 mb-1">Мінімальна ставка</p>
              <p className="text-2xl font-bold text-purple-700">{auction.currentPrice + auction.minBidStep}₴</p>
            </div>

            {/* Кнопки для швидких ставок */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const minBid = auction.currentPrice + auction.minBidStep;
                  setBidAmount(prev => ({ ...prev, [auction.id]: minBid.toString() }));
                }}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-all text-sm"
              >
                +50₴
              </button>
              <button
                onClick={() => {
                  const amount = auction.currentPrice + (auction.minBidStep * 2);
                  setBidAmount(prev => ({ ...prev, [auction.id]: amount.toString() }));
                }}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-all text-sm"
              >
                +{auction.minBidStep * 2}₴
              </button>
              <button
                onClick={() => {
                  const amount = auction.currentPrice + (auction.minBidStep * 5);
                  setBidAmount(prev => ({ ...prev, [auction.id]: amount.toString() }));
                }}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-all text-sm"
              >
                +{auction.minBidStep * 5}₴
              </button>
              <button
                onClick={() => {
                  const amount = auction.currentPrice + (auction.minBidStep * 10);
                  setBidAmount(prev => ({ ...prev, [auction.id]: amount.toString() }));
                }}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-all text-sm"
              >
                +{auction.minBidStep * 10}₴
              </button>
            </div>

            {/* Input для кастомної ставки */}
            <div>
              <label className="text-xs text-gray-600 block mb-1">Своя ставка</label>
              <input
                type="number"
                value={bidAmount[auction.id] || ''}
                onChange={(e) => setBidAmount(prev => ({ ...prev, [auction.id]: e.target.value }))}
                placeholder={`мін. ${auction.currentPrice + auction.minBidStep}₴`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-900"
                min={auction.currentPrice + auction.minBidStep}
              />
            </div>

            {/* Кнопка результату */}
            <button
              onClick={() => handlePlaceBid(auction)}
              disabled={placingBid[auction.id] || !user || !bidAmount[auction.id]}
              className={`w-full font-bold py-3 rounded-lg transition-all text-lg ${placingBid[auction.id] || !user
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : bidAmount[auction.id]
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
            >
              {placingBid[auction.id] ? '⏳ Обробка...' : !user ? '🔒 Авторизуйтись' : bidAmount[auction.id] ? `🔨 Ставка ${bidAmount[auction.id]}₴` : 'Вкажіть суму'}
            </button>
          </div>
        )}

        {/* Ставки завершеного */}
        {auction.status === 'ended' && (
          <button
            disabled
            className="w-full font-bold py-2 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed"
          >
            ⏹️ Аукціон завершений
          </button>
        )}

        {/* Запланований */}
        {auction.status === 'scheduled' && (
          <button
            disabled
            className="w-full font-bold py-2 rounded-lg bg-blue-200 text-blue-600 cursor-not-allowed"
          >
            ⏱️ Відкриється за {timers[auction.id] || '—'}
          </button>
        )}

        {/* Історія ставок (приховано в архіві) */}
        {auction.status !== 'ended' && auction.bids && auction.bids.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Ставки ({auction.bids.length}):</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {[...auction.bids].reverse().slice(0, 5).map((bid, idx) => (
                <div key={idx} className="flex justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <span>{bid.userName}</span>
                  <span className="font-bold text-purple-600">{bid.amount}₴</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-50 to-white py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-xl text-gray-600">⏳ Завантаження...</p>
        </div>
      </main>
    );
  }

  if (profile?.isBlocked) {
    return (
      <main className="min-h-screen bg-white py-12 text-black">
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="bg-red-50 p-10 rounded-3xl border-2 border-red-200 shadow-xl">
            <div className="text-6xl mb-6">🔨🚫</div>
            <h1 className="text-2xl font-black text-red-600 mb-4 uppercase tracking-tight">Доступ обмежено</h1>
            <p className="text-gray-700 font-bold mb-6">Ви не можете брати участь в аукціонах, оскільки ваш акаунт було заблоковано модератором.</p>
            <Link
              href="https://t.me/mlp_cutie_family_bot"
              className="block w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-all shadow-lg mb-4"
            >
              📣 Звернутися в підтримку
            </Link>
            <Link href="/" className="text-gray-500 hover:text-gray-700 font-bold">← Повернутися на головну</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-50 to-white">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🔨 Аукціони</h1>
        <p className="text-xl text-gray-600 mb-12">
          Беріться в ставках і отримайте рідкісні товари за найкращою ціною
        </p>

        {/* Активні аукціони */}
        {activeAuctions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🟢 Активні аукціони</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAuctions.map(auction => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          </section>
        )}

        {/* Запланові аукціони */}
        {scheduledAuctions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔵 Запланові аукціони</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledAuctions.map(auction => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          </section>
        )}

        {/* Архів - завершені аукціони */}
        {endedAuctions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📚 Архів</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {endedAuctions.map(auction => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          </section>
        )}

        {allAuctions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">😴 Аукціонів поки немає</p>
          </div>
        )}
      </div>
    </main>
  );
}
