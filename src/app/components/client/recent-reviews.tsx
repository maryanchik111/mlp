"use client";
import { useEffect, useState } from 'react';
import { fetchRecentReviews, fetchAllScreenshotReviews, Review, ScreenshotReview } from '@/lib/firebase';
import { HeartIcon } from '@heroicons/react/24/outline';

export default function RecentReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [screenshotReviews, setScreenshotReviews] = useState<ScreenshotReview[]>([]);
  const [activeTab, setActiveTab] = useState<'text' | 'screenshots'>('text');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState<ScreenshotReview | null>(null);
  const reviewsPerPage = 5;
  const screenshotsPerPage = 9;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchRecentReviews(25); // Завантажуємо більше для пагінації
      setReviews(data);
      const screens = await fetchAllScreenshotReviews();
      setScreenshotReviews(screens);

      // Якщо текстових відгуків немає, але є скріншоти, одразу відкриваємо вкладку скріншотів
      if (data.length === 0 && screens.length > 0) {
        setActiveTab('screenshots');
      }

      setLoading(false);
    };
    load();
  }, []);

  // Обчислити середній рейтинг
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // Пагінація тексту
  const totalTextPages = Math.ceil(reviews.length / reviewsPerPage);
  const textStartIndex = (currentPage - 1) * reviewsPerPage;
  const currentReviews = reviews.slice(textStartIndex, textStartIndex + reviewsPerPage);

  // Пагінація скріншотів
  const totalScreenshotPages = Math.ceil(screenshotReviews.length / screenshotsPerPage);
  const screenshotStartIndex = (currentPage - 1) * screenshotsPerPage;
  const currentScreenshots = screenshotReviews.slice(screenshotStartIndex, screenshotStartIndex + screenshotsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTabChange = (tab: 'text' | 'screenshots') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="bg-white/85 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-200">
        <p className="text-sm text-gray-700 text-center">Завантаження відгуків...</p>
      </div>
    );
  }

  if (!reviews.length && !screenshotReviews.length) {
    return (
      <div className="bg-white/85 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-200">
        <h2 className="text-2xl font-bold mb-3 text-purple-700 text-center">💬 Відгуки покупців</h2>
        <p className="text-gray-700 text-sm text-center">Поки що немає відгуків. Будьте першим!</p>
      </div>
    );
  }

  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-200">
      {/* Заголовок з середнім рейтингом */}
      <div className="mb-6 text-center">          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-purple-600 flex items-center justify-center gap-2"><HeartIcon className="w-7 h-7 text-pink-400" /> Відгуки клієнтів</h2>
        {reviews.length > 0 && (
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={`text-2xl ${i <= Math.round(parseFloat(averageRating)) ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
              ))}
            </div>
            <span className="text-2xl font-bold text-purple-700">{averageRating}</span>
          </div>
        )}

        {/* Вкладки */}
        {screenshotReviews.length > 0 && (
          <div className="flex bg-purple-50 p-1 rounded-xl max-w-sm mx-auto mb-6">
            <button
              onClick={() => handleTabChange('text')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'text'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-purple-600 hover:bg-purple-100'
                }`}
            >
              На сайті ({reviews.length})
            </button>
            <button
              onClick={() => handleTabChange('screenshots')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'screenshots'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-purple-600 hover:bg-purple-100'
                }`}
            >
              З Telegram ({screenshotReviews.length})
            </button>
          </div>
        )}
      </div>

      {activeTab === 'text' && (
        <>
          {/* Список відгуків в колонку */}
          <div className="space-y-4 mb-6">
            {currentReviews.map(r => {
              // Витягуємо тільки ім'я (перше слово)
              const firstName = (r.displayName || 'Користувач').split(' ')[0];

              return (
                <div key={r.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-purple-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-purple-700">
                          {firstName}
                        </span>
                        <div className="flex gap-0.5" aria-label={`Рейтинг ${r.rating}`}>
                          {[1, 2, 3, 4, 5].map(i => (
                            <span key={i} className={`text-xl ${i <= r.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="text-xs text-purple-400 font-medium opacity-60">#{r.orderId}</div>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {r.text?.length ? `"${r.text}"` : '⭐ Чудова покупка!'}
                  </p>

                  {/* Відповідь адміна якщо є */}
                  {r.adminReply && (
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <div className="flex items-start gap-3 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-purple-500">
                          <img src="/storeimage.jpg" alt="Магазин MLP" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-purple-700">MLP Cutie Family</p>
                            <span className="text-xs text-purple-500">
                              {new Date(r.adminReplyAt ?? r.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{r.adminReply}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'text' && reviews.length === 0 && (
        <p className="text-center text-gray-500 my-8">Ще немає текстових відгуків.</p>
      )}

      {activeTab === 'screenshots' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {currentScreenshots.map(sr => (
              <div key={sr.id} className="rounded-xl overflow-hidden shadow-md border border-purple-100 hover:shadow-xl transition-all cursor-pointer bg-gray-50">
                {sr.type === 'video' ? (
                  <video
                    src={sr.imageUrl}
                    className="w-full h-48 md:h-64 object-cover hover:scale-105 transition-transform duration-300"
                    controls
                    preload="metadata"
                    playsInline
                  />
                ) : (
                  <button onClick={() => setSelectedMedia(sr)} className="w-full text-left focus:outline-none">
                    <img src={sr.imageUrl} alt="Відгук" className="w-full h-48 md:h-64 object-cover hover:scale-105 transition-transform duration-300" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {screenshotReviews.length === 0 && (
            <p className="text-center text-gray-500 my-8">Ще немає скріншотів відгуків.</p>
          )}
        </>
      )}

      {/* Пагінація */}
      {(activeTab === 'text' ? totalTextPages : totalScreenshotPages) > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: activeTab === 'text' ? totalTextPages : totalScreenshotPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-10 h-10 rounded-lg font-bold transition-all ${currentPage === page
                ? 'bg-white text-purple-600 shadow-xl border border-purple-200'
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-3xl font-bold p-2 z-50"
              onClick={() => setSelectedMedia(null)}
            >
              ✕
            </button>
            {selectedMedia.type === 'video' ? (
              <video
                src={selectedMedia.imageUrl}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={selectedMedia.imageUrl}
                alt="Відгук збільшено"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
