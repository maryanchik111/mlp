"use client";
import { useEffect, useState } from 'react';
import { fetchRecentReviews, Review } from '@/lib/firebase';

export default function RecentReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  useEffect(() => {
    const load = async () => {
      const data = await fetchRecentReviews(25); // Завантажуємо більше для пагінації
      setReviews(data);
      setLoading(false);
    };
    load();
  }, []);

  // Обчислити середній рейтинг
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // Пагінація
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = reviews.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-sm p-6">
        <p className="text-sm text-white/80 text-center">Завантаження відгуків...</p>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-3 text-white text-center">💬 Відгуки покупців</h2>
        <p className="text-white/80 text-sm text-center">Поки що немає відгуків. Будьте першим!</p>
      </div>
    );
  }

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-sm p-6">
      {/* Заголовок з середнім рейтингом */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-3">
          💬 Відгуки покупців
        </h2>
        <div className="flex items-center justify-center gap-3">
          <div className="flex gap-1">
            {[1,2,3,4,5].map(i => (
              <span key={i} className={`text-2xl ${i <= Math.round(parseFloat(averageRating)) ? 'text-yellow-300' : 'text-white/30'}`}>★</span>
            ))}
          </div>
          <span className="text-2xl font-bold text-white">{averageRating}</span>
          <span className="text-white/80 text-sm">({reviews.length} {reviews.length === 1 ? 'відгук' : 'відгуків'})</span>
        </div>
      </div>

      {/* Список відгуків в колонку */}
      <div className="space-y-4 mb-6">
        {currentReviews.map(r => (
          <div key={r.id} className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-bold text-purple-700">
                    {r.displayName || 'Користувач'}
                  </span>
                  <div className="flex gap-0.5" aria-label={`Рейтинг ${r.rating}`}>
                    {[1,2,3,4,5].map(i => (
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
          </div>
        ))}
      </div>

      {/* Пагінація */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-10 h-10 rounded-lg font-bold transition-all ${
                currentPage === page
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/40 text-white hover:bg-white/60'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
