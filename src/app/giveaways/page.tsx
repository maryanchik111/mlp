'use client';

import { useState, useEffect } from 'react';
import { useAuth, useModal } from '@/app/providers';
import { fetchGiveaways, joinGiveaway, checkIfJoined, type Giveaway } from '@/lib/firebase';
import { SparklesIcon, GiftIcon, TrophyIcon, UserGroupIcon, CalendarIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase/config';

export default function GiveawaysPage() {
  const { user, loading: authLoading } = useAuth();
  const { showSuccess, showError, showWarning } = useModal();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedStatus, setJoinedStatus] = useState<Record<string, boolean>>({});
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [realCounts, setRealCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsub = fetchGiveaways(async (loadedGiveaways) => {
      setGiveaways(loadedGiveaways);
      
      // Fetch real counts
      const counts: Record<string, number> = {};
      for (const g of loadedGiveaways) {
        try {
          const snapshot = await get(ref(database, `giveaway_participants/${g.id}`));
          counts[g.id] = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        } catch (e) {
          counts[g.id] = g.participantsCount || 0;
        }
      }
      setRealCounts(counts);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user && giveaways.length > 0) {
      const checkAll = async () => {
        const status: Record<string, boolean> = {};
        for (const g of giveaways) {
          if (g.status === 'active') {
            status[g.id] = await checkIfJoined(g.id, user.uid);
          }
        }
        setJoinedStatus(status);
      };
      checkAll();
    }
  }, [user, giveaways]);

  const handleJoin = async (giveaway: Giveaway) => {
    if (!user) {
      showWarning('Будь ласка, увійдіть в акаунт, щоб взяти участь');
      return;
    }

    setJoiningId(giveaway.id);
    try {
      await joinGiveaway(giveaway.id, user.uid, user.displayName || user.email || 'Користувач', (user as any).phone, user.photoURL || '');
      showSuccess('Ви успішно приєдналися до розіграшу! Бажаємо успіху! 🍀');
      setJoinedStatus(prev => ({ ...prev, [giveaway.id]: true }));
    } catch (error: any) {
      showError(error.message || 'Помилка при спробі приєднатися');
    } finally {
      setJoiningId(null);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const activeGiveaways = giveaways.filter(g => g.status === 'active');
  const pastGiveaways = giveaways.filter(g => g.status === 'completed');

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 pb-32">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-purple-100 rounded-2xl mb-4">
            <SparklesIcon className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Розіграші MLP Family</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Бери участь у наших регулярних розіграшах та вигравай круті призи від MLP Cutie Family! 🦄✨
          </p>
          {!user && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl inline-block">
              <p className="text-yellow-800 font-medium">
                🔒 Тільки зареєстровані користувачі можуть брати участь. <Link href="/account" className="underline font-bold">Увійти</Link>
              </p>
            </div>
          )}
        </div>

        {/* Active Giveaways */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1 bg-purple-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Активні розіграші</h2>
          </div>

          {activeGiveaways.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
              <GiftIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Зараз немає активних розіграшів. Заходь пізніше!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {activeGiveaways.map((giveaway) => (
                <div key={giveaway.id} className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-purple-100/50 border border-purple-50 group hover:-translate-y-1 transition-all duration-300">
                  <div className="relative h-64">
                    {giveaway.image ? (
                      <img src={giveaway.image} alt={giveaway.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <GiftIcon className="w-20 h-20 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full text-xs font-bold text-purple-600 uppercase tracking-wider">
                      🍀 У грі
                    </div>
                  </div>

                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{giveaway.title}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed whitespace-pre-wrap">{giveaway.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-purple-50 rounded-2xl p-4">
                        <p className="text-xs text-purple-600 font-bold uppercase mb-1 text-left">Приз</p>
                        <p className="text-lg font-bold text-gray-900 truncate text-left">{giveaway.prize}</p>
                      </div>
                      <div className="bg-blue-50 rounded-2xl p-4">
                        <p className="text-xs text-blue-600 font-bold uppercase mb-1 text-left">Учасників</p>
                        <p className="text-lg font-bold text-gray-900 text-left">{realCounts[giveaway.id] ?? giveaway.participantsCount ?? 0}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-4 mb-8 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-5 h-5 text-purple-400" />
                        <span>Кінець: {new Date(giveaway.endDate).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrophyIcon className="w-5 h-5 text-yellow-500" />
                        <span>{giveaway.winnersCount} переможців</span>
                      </div>
                    </div>

                    <button
                      disabled={joiningId === giveaway.id || joinedStatus[giveaway.id]}
                      onClick={() => handleJoin(giveaway)}
                      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${joinedStatus[giveaway.id]
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-purple-200 active:scale-95'
                        }`}
                    >
                      {joiningId === giveaway.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Приєднання...
                        </div>
                      ) : joinedStatus[giveaway.id] ? (
                        '✓ Ви вже берете участь'
                      ) : (
                        'Взяти участь'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Giveaways */}
        {pastGiveaways.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-1 bg-gray-400 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">Завершені розіграші</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pastGiveaways.map((giveaway) => (
                <div key={giveaway.id} className="bg-white rounded-2xl p-6 border border-gray-100 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-900 truncate pr-2">{giveaway.title}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Завершено</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 text-left">Переможці</p>
                    <div className="space-y-1">
                      {giveaway.winners?.map((winner, idx) => (
                        <p key={idx} className="text-xs font-bold text-gray-700 flex items-center gap-1">
                          🏆 {winner.userName}
                        </p>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center">Завершився {new Date(giveaway.endDate).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
