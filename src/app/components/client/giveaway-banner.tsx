'use client';

import { useState, useEffect } from 'react';
import { fetchGiveaways, type Giveaway } from '@/lib/firebase';
import { SparklesIcon, GiftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase/config';

export default function GiveawayBanner() {
  const [activeGiveaway, setActiveGiveaway] = useState<Giveaway | null>(null);
  const [realCount, setRealCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = fetchGiveaways(async (giveaways) => {
      const active = giveaways.find(g => g.status === 'active');
      if (active) {
        setActiveGiveaway(active);
        // Fetch real count
        try {
          const participantsRef = ref(database, `giveaway_participants/${active.id}`);
          const snapshot = await get(participantsRef);
          if (snapshot.exists()) {
            setRealCount(Object.keys(snapshot.val()).length);
          } else {
            setRealCount(0);
          }
        } catch (e) {
          setRealCount(active.participantsCount || 0);
        }
      } else {
        setActiveGiveaway(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading || !activeGiveaway) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 max-w-6xl mb-8"
    >
      <Link href="/giveaways">
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 p-1 rounded-3xl group cursor-pointer shadow-lg hover:shadow-purple-200 transition-all duration-500">
          {/* Animated background patterns */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] animate-pulse"></div>
          </div>

          <div className="relative bg-white rounded-[1.4rem] p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
              <div className="bg-purple-100 p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <SparklesIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 justify-center md:justify-start">
                  У нас проходить розіграш! <GiftIcon className="w-5 h-5 text-pink-500" />
                </h3>
                <p className="text-gray-600 font-medium">
                  Вигравай: <span className="text-purple-600 font-bold">{activeGiveaway.prize}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
               <div className="hidden lg:flex flex-col items-end">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Учасників</p>
                <p className="text-xl font-black text-purple-600">{realCount}</p>
              </div>
              
              <div className="px-6 py-3 bg-purple-600 text-white font-bold rounded-2xl group-hover:bg-purple-700 transition-all flex items-center gap-2 shadow-md group-hover:shadow-purple-200">
                Взяти участь <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
