'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchProductById, type Product } from '@/lib/firebase';
import Basket from '@/app/components/client/busket';
import AccountButton from '@/app/components/client/account-button';

export default function ProductPage() {
  const params = useParams();
  const idParam = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string | undefined);
  const productId = useMemo(() => {
    const n = Number(idParam);
    return Number.isFinite(n) ? n : null;
  }, [idParam]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState<'none' | 'added' | 'updated'>('none');
  const [isInCart, setIsInCart] = useState(false);
  // IMPORTANT: hooks must not be conditional; declare here before any early returns
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Повноекранний режим: обробка клавіш Escape / стрілки
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex(prev => {
          const imagesLen = product?.images?.length || 0;
          if (imagesLen === 0) return prev;
          return (prev + 1) % imagesLen;
        });
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex(prev => {
          const imagesLen = product?.images?.length || 0;
          if (imagesLen === 0) return prev;
          return (prev - 1 + imagesLen) % imagesLen;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen, product]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!productId) return;
      setLoading(true);
      const p = await fetchProductById(productId);
      if (mounted) {
        setProduct(p);
        setLoading(false);
        if (p) setQty(Math.min(1, Math.max(0, p.quantity)) || 1);
        
        // Перевіряємо чи товар вже в кошику
        const cartRaw = localStorage.getItem('mlp-cart');
        if (cartRaw && p) {
          const cart = JSON.parse(cartRaw);
          const exists = cart.some((item: any) => item.id === p.id);
          setIsInCart(exists);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [productId]);

  const maxQty = product?.quantity ?? 0;
  const isOut = maxQty === 0;

  const handleAddToCart = () => {
    if (!product) return;
    
    if (isInCart) {
      // Видаляємо з кошика
      const cartRaw = localStorage.getItem('mlp-cart');
      if (!cartRaw) return;
      const cart = JSON.parse(cartRaw);
      const updatedCart = cart.filter((item: any) => item.id !== product.id);
      localStorage.setItem('mlp-cart', JSON.stringify(updatedCart));
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: updatedCart }));
      setIsInCart(false);
      return;
    }
    
    // Додаємо в кошик
    const cartRaw = localStorage.getItem('mlp-cart');
    const cart = cartRaw ? JSON.parse(cartRaw) : [];

    const newItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity: qty,
      maxQuantity: product.quantity,
      discount: product.discount ?? 0,
    };

    cart.push(newItem);
    setAdded('added');
    setIsInCart(true);

    localStorage.setItem('mlp-cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
    setTimeout(() => setAdded('none'), 1500);
  };

  // Derive images list safely before any conditional return
  const images = product?.images && product.images.length > 0 ? product.images : [];

  // Loading
  if (loading) {
    return (
      <>
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🦄</div>
            <p className="text-gray-600 text-lg">Завантаження товару...</p>
          </div>
        </main>
        <Basket />
      </>
    );
  }

  // Not found
  if (!product || !productId) {
    return (
      <>
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-700 mb-4">Товар не знайдено</p>
              <Link href="/catalog" className="text-purple-600 hover:text-purple-700">← Повернутися до каталогу</Link>
            </div>
          </div>
        </main>
        <Basket />
      </>
    );
  }

  return (
    <>
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <nav className="text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-purple-600">Головна</Link> <span>/</span> <Link href="/catalog" className="hover:text-purple-600">Каталог</Link> <span>/</span> <span className="text-gray-900 font-semibold">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Галерея */}
          <div>
            {images.length > 0 ? (
              <div>
                <div className="w-full h-80 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[Math.min(activeIndex, images.length - 1)]}
                    alt={product.name}
                    className="object-contain max-h-80 cursor-zoom-in"
                    onClick={() => setIsFullscreen(true)}
                  />
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Переглянути на весь екран"
                  >🔍</button>
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {images.map((src, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={idx}
                        src={src}
                        onClick={() => setActiveIndex(idx)}
                        className={`h-16 w-16 object-cover rounded border cursor-pointer ${idx === activeIndex ? 'ring-2 ring-purple-600' : 'opacity-80 hover:opacity-100'}`}
                        alt="thumb"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-80 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg shadow-sm flex items-center justify-center text-8xl">
                {product.image}
              </div>
            )}
          </div>

          {/* Інформація */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-sm text-gray-600 mb-4">{product.category}</p>
            <p className="text-gray-700 mb-6">{product.description}</p>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {product.discount && product.discount > 0 ? (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      {product.price}₴
                    </span>
                    <span className="text-3xl font-extrabold text-purple-600">
                      {Math.round((typeof product.price === 'string' ? parseFloat(product.price) : product.price) * (1 - product.discount / 100))}₴
                    </span>
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      −{product.discount}%
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-extrabold text-purple-600">{product.price}₴</span>
                )}
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${isOut ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {isOut ? 'Немає в наявності' : `В наявності: ${product.quantity}`}
              </span>
            </div>

            {/* Кількість */}
            <div className="flex items-center gap-3 mb-6">
              <label className="text-gray-700">Кількість:</label>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1 || isInCart} className={`px-3 py-1 rounded ${qty <= 1 || isInCart ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-white'}`}>−</button>
                <span className="text-purple-600 px-3 py-1 font-semibold min-w-8 text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty || isInCart} className={`px-3 py-1 rounded ${qty >= maxQty || isInCart ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-white'}`}>+</button>
              </div>
            </div>

            <button onClick={handleAddToCart} disabled={isOut || qty <= 0} className={`w-full py-3 rounded-lg font-bold transition-colors ${isOut ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : isInCart ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
              {isInCart ? '🗑️ Забрати з кошика' : (added === 'added' ? '✓ Додано в кошик' : 'Додати в кошик')}
            </button>

            <div className="mt-6 text-sm text-gray-600">
              <p>Доставка по Україні. Оплата онлайн.</p>
            </div>
          </div>
        </div>

        {/* SEO JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: images.length > 0 ? images : undefined,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'UAH',
              price: String(product.price),
              availability: product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            }
          })
        }} />
      </div>
    </main>
    <Basket />
    <AccountButton />
    {isFullscreen && images.length > 0 && (
      <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 text-white text-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 font-medium"
            >Закрити (Esc)</button>
            {images.length > 1 && (
              <span className="text-white/70">{activeIndex + 1} / {images.length}</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setActiveIndex(prev => (prev - 1 + images.length) % images.length)}
                className="px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                aria-label="Попереднє"
              >←</button>
              <button
                onClick={() => setActiveIndex(prev => (prev + 1) % images.length)}
                className="px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                aria-label="Наступне"
              >→</button>
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-4 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[Math.min(activeIndex, images.length - 1)]}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
            draggable={false}
          />
        </div>
        {images.length > 1 && (
          <div className="p-4 flex gap-2 overflow-x-auto bg-black/60">
            {images.map((src, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={idx}
                src={src}
                alt={product.name + ' thumbnail ' + (idx + 1)}
                onClick={() => setActiveIndex(idx)}
                className={`h-16 w-16 object-cover rounded cursor-pointer transition-all ${idx === activeIndex ? 'ring-2 ring-purple-400 scale-105' : 'opacity-70 hover:opacity-100'}`}
                draggable={false}
              />
            ))}
          </div>
        )}
      </div>
    )}
    </>
  );
}
