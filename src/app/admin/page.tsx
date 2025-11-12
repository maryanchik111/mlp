'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllOrders, fetchOrdersByStatus, updateOrderStatus, fetchAllProducts, updateProduct, addProduct, deleteProduct, fetchUserProfile, checkAdminAccess, fetchAllReviews, deleteReview, uploadImage, deleteImage, type Order, type Product, type UserProfile, type Review } from '@/lib/firebase';
import { useAuth } from '@/app/providers';
import { AdminStats } from './admin-stats';

type TabType = 'orders' | 'products' | 'reviews' | 'stats';

// Список доступних категорій товарів
const PRODUCT_CATEGORIES = [
  "Основні персонажі",
  "Набори",
  "Аксесуари",
  "Рідкісні видання",
  "Міні-фігурки",
  "Унікальна",
];

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [mounted, setMounted] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState<Omit<Product, 'id' | 'inStock'>>({
    name: '',
    category: '',
    price: '',
    image: '🎁',
    description: '',
    quantity: 0,
    images: [],
    discount: 0,
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // User profiles cache for authorized orders
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});

  // Перевірка доступу адміністратора
  useEffect(() => {
    if (authLoading) return; // Чекаємо завершення завантаження auth
    
    if (!user || !checkAdminAccess(user)) {
      // Якщо не авторизований або не адмін - редірект на головну
      router.push('/');
    } else {
      setMounted(true);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Функція для завантаження товарів
  useEffect(() => {
    if (!mounted) return;
    fetchAllProducts((loadedProducts) => {
      setProducts(loadedProducts);
    });
  }, [mounted]);

  // Функція для завантаження відгуків
  useEffect(() => {
    if (!mounted) return;
    const loadReviews = async () => {
      const allReviews = await fetchAllReviews();
      setReviews(allReviews);
    };
    loadReviews();
  }, [mounted]);

  // Функція для видалення відгуку
  const handleDeleteReview = async (orderId: string) => {
    if (!confirm('Видалити цей відгук?')) return;
    setActionLoading(true);
    try {
      const success = await deleteReview(orderId);
      if (success) {
        alert('✅ Відгук видалено');
        const allReviews = await fetchAllReviews();
        setReviews(allReviews);
      } else {
        alert('❌ Помилка видалення');
      }
    } catch (error) {
      console.error('Помилка:', error);
      alert('❌ Помилка видалення відгуку');
    } finally {
      setActionLoading(false);
    }
  };

  // Функція для відкриття форми редагування товару
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price,
      description: product.description,
      quantity: product.quantity,
      category: product.category,
      image: product.image,
      images: (product as any).images || [],
      discount: product.discount ?? 0,
    });
  };

  // Функція для збереження змін товару
  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setActionLoading(true);
    try {
      let payload = { ...editForm } as any;
      
      // Price має бути рядком
      if (typeof payload.price === 'number') {
        payload.price = String(payload.price);
      }
      
      // Якщо введено discount як рядок – парсимо
      if (typeof payload.discount === 'string') {
        payload.discount = parseInt(payload.discount) || 0;
      }
      // Якщо введено images і це рядок з комами – парсимо
      if (typeof payload.images === 'string') {
        payload.images = payload.images
          .split(/\n|,/)
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
      // НЕ змінюємо image (емоджі), залишаємо як є
      // image - це емоджі для картки в каталозі
      // images - це галерея фото для сторінки товару
      
      const success = await updateProduct(editingProduct.id, payload);
      if (success) {
        alert('✅ Товар оновлено успішно!');
        setEditingProduct(null);
        setEditForm({});
        fetchAllProducts((loadedProducts) => {
          setProducts(loadedProducts);
        });
      } else {
        alert('❌ Помилка при оновленні товару');
      }
    } catch (error) {
      console.error('Помилка:', error);
      alert('❌ Помилка при оновленні товару');
    } finally {
      setActionLoading(false);
    }
  };

  // Відкрити модаль створення нового товару
  const handleCreateProduct = () => {
    setIsCreatingProduct(true);
    setNewProductForm({
      name: '',
      category: '',
      price: '',
      image: '🎁',
      description: '',
      quantity: 0,
      images: [],
      discount: 0,
    });
  };

  // Зберегти новий товар
  const handleSubmitNewProduct = async () => {
    setActionLoading(true);
    try {
      let payload = { ...newProductForm } as any;
      
      // Валідація
      if (!payload.name || !payload.price || !payload.category) {
        alert('❌ Заповніть обов\'язкові поля: назва, ціна, категорія');
        setActionLoading(false);
        return;
      }
      
      // Price має бути рядком
      if (typeof payload.price === 'number') {
        payload.price = String(payload.price);
      }
      
      // Парсимо discount
      if (typeof payload.discount === 'string') {
        payload.discount = parseInt(payload.discount) || 0;
      }
      // Парсимо images
      if (typeof payload.images === 'string') {
        payload.images = payload.images
          .split(/\n|,/)
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
      
      const success = await addProduct(payload);
      if (success) {
        alert('✅ Товар створено успішно!');
        setIsCreatingProduct(false);
        setNewProductForm({
          name: '',
          category: '',
          price: '',
          image: '🎁',
          description: '',
          quantity: 0,
          images: [],
          discount: 0,
        });
        fetchAllProducts((loadedProducts) => {
          setProducts(loadedProducts);
        });
      } else {
        alert('❌ Помилка при створенні товару');
      }
    } catch (error) {
      console.error('Помилка:', error);
      alert('❌ Помилка при створенні товару');
    } finally {
      setActionLoading(false);
    }
  };

  // Функція для видалення товару
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цей товар? Цю дію не можна скасувати!')) return;
    setActionLoading(true);
    try {
      const success = await deleteProduct(productId);
      if (success) {
        alert('✅ Товар видалено успішно!');
        fetchAllProducts((loadedProducts) => {
          setProducts(loadedProducts);
        });
      } else {
        alert('❌ Помилка при видаленні товару');
      }
    } catch (error) {
      console.error('Помилка:', error);
      alert('❌ Помилка при видаленні товару');
    } finally {
      setActionLoading(false);
    }
  };

  // Функція для завантаження фото
  const handleImageUpload = async (files: FileList | null, formType: 'create' | 'edit') => {
    if (!files || files.length === 0) return;
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Перевіряємо тип файлу
        if (!file.type.startsWith('image/')) {
          alert(`⚠️ Файл ${file.name} не є зображенням`);
          continue;
        }
        
        // Перевіряємо розмір (макс 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`⚠️ Файл ${file.name} завеликий (більше 5MB)`);
          continue;
        }
        
        const url = await uploadImage(file);
        if (url) {
          uploadedUrls.push(url);
        }
      }
      
      if (uploadedUrls.length > 0) {
        if (formType === 'create') {
          setNewProductForm({
            ...newProductForm,
            images: [...(newProductForm.images || []), ...uploadedUrls]
          });
        } else {
          setEditForm({
            ...editForm,
            images: [...(editForm.images as string[] || []), ...uploadedUrls]
          });
        }
        alert(`✅ Завантажено ${uploadedUrls.length} фото`);
      }
    } catch (error) {
      console.error('Помилка завантаження:', error);
      alert('❌ Помилка завантаження фото');
    } finally {
      setUploadingImages(false);
    }
  };

  // Функція для видалення фото з форми
  const handleRemoveImage = async (imageUrl: string, formType: 'create' | 'edit') => {
    if (!confirm('Видалити це фото?')) return;
    
    try {
      // Видаляємо з Storage якщо це Firebase URL
      if (imageUrl.includes('firebasestorage.googleapis.com')) {
        await deleteImage(imageUrl);
      }
      
      // Видаляємо з форми
      if (formType === 'create') {
        setNewProductForm({
          ...newProductForm,
          images: (newProductForm.images || []).filter(url => url !== imageUrl)
        });
      } else {
        setEditForm({
          ...editForm,
          images: (editForm.images as string[] || []).filter(url => url !== imageUrl)
        });
      }
    } catch (error) {
      console.error('Помилка видалення фото:', error);
      alert('❌ Помилка видалення фото');
    }
  };

  // Функція для підтвердження оплати
  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const success = await updateOrderStatus(selectedOrder.id, 'processing');
      if (success) {
        alert('✅ Оплата підтверджена! Статус змінено на "В процесі"');
        // Оновлюємо локальний стан модалю, щоб відобразити новий статус без закриття
        setSelectedOrder({ ...selectedOrder, status: 'processing', updatedAt: Date.now() });
      } else {
        alert('❌ Помилка при оновленні статусу');
      }
    } catch (error) {
      console.error('Помилка:', error);
      alert('❌ Помилка при підтвердженні оплати');
    } finally {
      setActionLoading(false);
    }
  };

  // Функція для скасування замовлення
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    if (!confirm('Ви впевнені? Це дію неможна скасувати!')) return;
    setActionLoading(true);
    try {
      const success = await updateOrderStatus(selectedOrder.id, 'cancelled');
      if (success) {
        alert('✅ Замовлення скасовано');
        // Закриваємо модаль, бо замовлення скасоване
        setSelectedOrder(null);
      } else {
        alert('❌ Помилка при скасуванні');
      }
    } catch (error) {
      console.error('Помилка:', error);
      alert('❌ Помилка при скасуванні замовлення');
    } finally {
      setActionLoading(false);
    }
  };

  // Функція для позначення як виконане
  const handleMarkCompleted = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const success = await updateOrderStatus(selectedOrder.id, 'completed');
      if (success) {
        alert('✅ Замовлення позначено як виконане');
        // Оновлюємо локальний стан, щоб показати статус "completed"
        setSelectedOrder({ ...selectedOrder, status: 'completed', updatedAt: Date.now() });
      } else {
        alert('❌ Помилка при оновленні статусу');
      }
    } catch (error) {
      console.error('Помилка:', error);
      alert('❌ Помилка при оновленні замовлення');
    } finally {
      setActionLoading(false);
    }
  };

  // Завантажити замовлення при завантаженні або зміні фільтра
  useEffect(() => {
    if (!mounted) return;

    if (statusFilter === 'all') {
      fetchAllOrders(setOrders);
    } else {
      fetchOrdersByStatus(statusFilter, setOrders);
    }
  }, [statusFilter, mounted]);

  // Фільтрувати замовлення при зміні списку
  useEffect(() => {
    let filtered = statusFilter === 'all' 
      ? orders 
      : orders.filter(order => order.status === statusFilter);
    
    // Сортуємо за датою створення - нові зверху
    filtered = filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    setFilteredOrders(filtered);
    
    // Завантажуємо профілі користувачів для авторизованих замовлень
    const loadUserProfiles = async () => {
      const userIds = new Set<string>();
      filtered.forEach(order => {
        if (order.userId && typeof order.userId === 'string') {
          userIds.add(order.userId);
        }
      });
      
      const profiles: Record<string, UserProfile> = {};
      for (const uid of Array.from(userIds)) {
        if (!userProfiles[uid]) {
          const profile = await fetchUserProfile(uid);
          if (profile) {
            profiles[uid] = profile;
          }
        } else {
          profiles[uid] = userProfiles[uid];
        }
      }
      
      if (Object.keys(profiles).length > 0) {
        setUserProfiles(prev => ({ ...prev, ...profiles }));
      }
    };
    
    loadUserProfiles();
  }, [orders, statusFilter]);

  // Показуємо екран завантаження під час перевірки доступу
  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Перевірка доступу...</p>
        </div>
      </div>
    );
  }

  // Якщо немає користувача або він не адмін, не показуємо нічого (вже редірект)
  if (!user || !checkAdminAccess(user)) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Очікує обробки';
      case 'processing':
        return 'В процесі';
      case 'completed':
        return 'Завершено';
      case 'cancelled':
        return 'Скасовано';
      default:
        return status;
    }
  };

  const getDeliveryLabel = (method: string) => {
    if (method === 'courier') return 'Кур\'єр';
    if (method === 'nova') return 'Нова Пошта';
    return method;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('uk-UA');
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Панель адміністратора</h1>
          <p className="text-gray-600">
            Вітаємо, {user?.displayName || user?.email?.split('@')[0] || 'Адміністратор'}! 👋
          </p>
          <p className="text-gray-500 text-sm mt-1">Управління замовленнями та товарами</p>
        </div>

        {/* Tabs (адаптивні) */}
        <div className="bg-white rounded-lg shadow-sm p-2 mb-8">
          <div className="grid grid-cols-2 md:flex gap-2">
            <button
              onClick={() => setActiveTab('stats')}
              className={`md:w-full px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Статистика
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`md:w-full px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 Замовлення
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`md:w-full px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🛍️ Товари
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`md:w-full px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💬 Відгуки
            </button>
          </div>
        </div>

        {/* Stats Tab Content */}
        {activeTab === 'stats' && <AdminStats orders={orders} products={products} />}

        {/* Orders Tab Content */}
        {activeTab === 'orders' && (
          <>
            {/* Фільтри */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Фільтр по статусу</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-3">
                {(['all', 'pending', 'processing', 'completed', 'cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      statusFilter === status
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {status === 'all' ? 'Все (Усі)' : getStatusLabel(status)}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Всього замовлень: <span className="font-bold">{filteredOrders.length}</span>
              </p>
            </div>

            {/* Список замовлень */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <p className="text-gray-600 text-lg">Немає замовлень з вибраним статусом</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Номер замовлення</p>
                          <p className="text-lg font-bold text-gray-900"># {order.id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-gray-600">Замовник</p>
                          <p className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                            {order.firstName} {order.lastName}
                            {order.userId ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium" title={`Авторизований користувач${userProfiles[order.userId]?.displayName ? ': ' + userProfiles[order.userId].displayName : ''}`}>
                                👤 {userProfiles[order.userId]?.displayName || 'auth'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs" title="Гість">👥 guest</span>
                            )}
                          </p>
                          {order.userId && userProfiles[order.userId] && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs" title="Рейтинг">⭐ Рейтинг {userProfiles[order.userId].rating}</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs" title="Замовлень">📦 {userProfiles[order.userId].totalOrders}</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs" title="Знижка">💳 {userProfiles[order.userId].discountPercent}%</span>
                            </div>
                          )}
                          {order.redeemedPoints && order.redeemedPoints > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs mt-1" title="Списано балів">🎯 −{order.redeemedPoints} балів</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Контакт</p>
                          <p className="font-semibold text-gray-900">{order.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Місто</p>
                          <p className="font-semibold text-gray-900">{order.city}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Дата замовлення</p>
                          <p className="font-semibold text-gray-900 text-sm">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                        <div>
                          <p className="text-sm text-gray-600">Сума товарів</p>
                          <p className="font-semibold text-gray-900">{order.totalPrice}₴</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Доставка</p>
                          <p className="font-semibold text-gray-900">{order.deliveryPrice === 0 ? 'Безкоштовна' : `${order.deliveryPrice}₴`}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">До оплати</p>
                          <p className="font-bold text-purple-600 text-lg">{order.finalPrice}₴</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">{order.items.length}</span> товарів в замовленні
                        </div>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          📋 Інформація
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Products Tab Content */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Всього товарів: {products.length}</h2>
              <button
                onClick={handleCreateProduct}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ➕ Додати товар
              </button>
            </div>
            
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      {product.images && product.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-full border-2 border-purple-200"
                        />
                      ) : (
                        <div className="w-16 h-16 text-4xl flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-full">
                          {product.image || '📦'}
                        </div>
                      )}
                      <div>
                        <p className="text-lg font-bold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      product.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.quantity > 0 ? 'В наявності' : 'Немає в наявності'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Ціна</p>
                      <p className="font-bold text-purple-600 text-lg">{product.price}₴</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Кількість</p>
                      <p className="font-semibold text-gray-900">{product.quantity} шт</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Опис</p>
                      <p className="text-gray-900">{product.description}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={actionLoading}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                    >
                      🗑️ Видалити
                    </button>
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      ✏️ Редагувати
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviews Tab Content */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Всього відгуків: {reviews.length}</h2>
            </div>
            
            {reviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-600">Немає відгуків</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-lg font-bold text-purple-700">{review.displayName || 'Користувач'}</p>
                        <div className="flex gap-0.5" aria-label={`Рейтинг ${review.rating}`}>
                          {[1,2,3,4,5].map(i => (
                            <span key={i} className={`text-lg ${i <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">Замовлення: #{review.orderId}</p>
                      <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleString('uk-UA')}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteReview(review.orderId)}
                      disabled={actionLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        actionLoading
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      🗑️ Видалити
                    </button>
                  </div>
                  <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
                    <p className="text-gray-800 leading-relaxed">
                      {review.text?.length ? `"${review.text}"` : '⭐ Без коментаря'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Модальне вікно створення нового товару */}
      {isCreatingProduct && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Заголовок */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm opacity-90">Додавання нового товару</p>
                  <p className="text-2xl font-bold">Новий товар</p>
                </div>
                <button
                  onClick={() => setIsCreatingProduct(false)}
                  className="text-white text-2xl font-bold hover:scale-110 transition-transform"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Форма створення */}
            <div className="p-6 space-y-4 text-purple-600">
              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Назва *</label>
                <input
                  type="text"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                  placeholder="Наприклад: Twilight Sparkle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Категорія *</label>
                <select
                  value={newProductForm.category}
                  onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                >
                  <option value="">Оберіть категорію</option>
                  {PRODUCT_CATEGORIES.map((cat: string) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-600 mb-2">Ціна (₴) *</label>
                  <input
                    type="text"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                    placeholder="299"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-600 mb-2">Кількість</label>
                  <input
                    type="number"
                    value={newProductForm.quantity}
                    onChange={(e) => setNewProductForm({ ...newProductForm, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Іконка (emoji) / Головне зображення</label>
                <input
                  type="text"
                  value={newProductForm.image}
                  onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                  placeholder="🎁"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Опис</label>
                <textarea
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                  placeholder="Опис товару..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Знижка на товар (%)</label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={newProductForm.discount ?? 0}
                  onChange={e => setNewProductForm(f => ({ ...f, discount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 bg-green-50/30 text-gray-900"
                  placeholder="0"
                />
                <span className="text-xs text-gray-500">Вкажіть від 0 до 90. Знижка буде показана у каталозі та при оформленні.</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Фото товару 📸</label>
                
                {/* Завантажені фото */}
                {newProductForm.images && newProductForm.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {newProductForm.images.map((url, idx) => (
                      <div key={idx} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={url} 
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-24 object-cover rounded border border-purple-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(url, 'create')}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Кнопка завантаження */}
                <label className={`block w-full border-2 border-dashed border-purple-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/30 transition-colors ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input 
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImages}
                    onChange={(e) => handleImageUpload(e.target.files, 'create')}
                    className="hidden"
                  />
                  <div className="text-purple-600">
                    {uploadingImages ? (
                      <>
                        <span className="text-2xl">⏳</span>
                        <p className="text-sm font-medium mt-2">Завантаження...</p>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl">📸</span>
                        <p className="text-sm font-medium mt-2">Завантажити фото</p>
                        <p className="text-xs text-gray-500 mt-1">Натисніть або перетягніть (макс 5MB на фото)</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={handleSubmitNewProduct}
                  disabled={actionLoading}
                  className={`w-full font-bold py-2.5 rounded-lg transition-all ${
                    actionLoading
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {actionLoading ? '⏳ Додавання...' : '➕ Додати товар'}
                </button>
                <button
                  onClick={() => setIsCreatingProduct(false)}
                  className="w-full bg-gray-200 text-gray-800 font-bold py-2.5 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно редагування товару */}
      {editingProduct && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Заголовок */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm opacity-90">Редагування товару</p>
                  <p className="text-2xl font-bold">{editingProduct.name}</p>
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-white text-2xl font-bold hover:scale-110 transition-transform"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Форма редагування */}
            <div className="p-6 space-y-4 text-purple-600">
              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Назва</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Категорія</label>
                <select
                  value={editForm.category || ''}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                >
                  <option value="">Оберіть категорію</option>
                  {PRODUCT_CATEGORIES.map((cat: string) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-600 mb-2">Ціна (₴)</label>
                  <input
                    type="text"
                    value={editForm.price || ''}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-600 mb-2">Кількість</label>
                  <input
                    type="number"
                    value={editForm.quantity || 0}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Іконка (emoji) / Головне зображення</label>
                <input
                  type="text"
                  value={editForm.image || ''}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Опис</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Знижка на товар (%)</label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={editForm.discount ?? 0}
                  onChange={e => setEditForm(f => ({ ...f, discount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 bg-green-50/30 text-gray-900"
                />
                <span className="text-xs text-gray-500">Вкажіть від 0 до 90. Знижка буде показана у каталозі та при оформленні.</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Фото товару 📸</label>
                
                {/* Завантажені фото */}
                {editForm.images && Array.isArray(editForm.images) && editForm.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {editForm.images.map((url, idx) => (
                      <div key={idx} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={url} 
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-24 object-cover rounded border border-purple-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(url, 'edit')}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Кнопка завантаження */}
                <label className={`block w-full border-2 border-dashed border-purple-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/30 transition-colors ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input 
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImages}
                    onChange={(e) => handleImageUpload(e.target.files, 'edit')}
                    className="hidden"
                  />
                  <div className="text-purple-600">
                    {uploadingImages ? (
                      <>
                        <span className="text-2xl">⏳</span>
                        <p className="text-sm font-medium mt-2">Завантаження...</p>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl">📸</span>
                        <p className="text-sm font-medium mt-2">Завантажити фото</p>
                        <p className="text-xs text-gray-500 mt-1">Натисніть або перетягніть (макс 5MB на фото)</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={handleSaveProduct}
                  disabled={actionLoading}
                  className={`w-full font-bold py-2.5 rounded-lg transition-all ${
                    actionLoading
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {actionLoading ? '⏳ Збереження...' : '💾 Зберегти зміни'}
                </button>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="w-full bg-gray-200 text-gray-800 font-bold py-2.5 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно створення товару */}
      {isCreatingProduct && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Заголовок */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm opacity-90">Новий товар</p>
                  <p className="text-2xl font-bold">Створення товару</p>
                </div>
                <button
                  onClick={() => setIsCreatingProduct(false)}
                  className="text-white text-2xl font-bold hover:scale-110 transition-transform"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Форма створення */}
            <div className="p-6 space-y-4 text-purple-600">
              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Назва *</label>
                <input
                  type="text"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                  placeholder="Назва товару"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Категорія *</label>
                <select
                  value={newProductForm.category}
                  onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                >
                  <option value="">Оберіть категорію</option>
                  {PRODUCT_CATEGORIES.map((cat: string) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-600 mb-2">Ціна (₴) *</label>
                  <input
                    type="text"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                    placeholder="299"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-600 mb-2">Кількість</label>
                  <input
                    type="number"
                    value={newProductForm.quantity}
                    onChange={(e) => setNewProductForm({ ...newProductForm, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Опис</label>
                <textarea
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                  placeholder="Опис товару..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Іконка (emoji) / Головне зображення</label>
                <input
                  type="text"
                  value={newProductForm.image}
                  onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                  placeholder="🎁"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Знижка на товар (%)</label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={newProductForm.discount ?? 0}
                  onChange={e => setNewProductForm(f => ({ ...f, discount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 bg-green-50/30 text-gray-900"
                  placeholder="0"
                />
                <span className="text-xs text-gray-500">Вкажіть від 0 до 90. Знижка буде показана у каталозі та при оформленні.</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-600 mb-2">Фото товару 📸</label>
                
                {/* Завантажені фото */}
                {newProductForm.images && newProductForm.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {newProductForm.images.map((url, idx) => (
                      <div key={idx} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={url} 
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-24 object-cover rounded border border-purple-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(url, 'create')}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Кнопка завантаження */}
                <label className={`block w-full border-2 border-dashed border-purple-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/30 transition-colors ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input 
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImages}
                    onChange={(e) => handleImageUpload(e.target.files, 'create')}
                    className="hidden"
                  />
                  <div className="text-purple-600">
                    {uploadingImages ? (
                      <>
                        <span className="text-2xl">⏳</span>
                        <p className="text-sm font-medium mt-2">Завантаження...</p>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl">📸</span>
                        <p className="text-sm font-medium mt-2">Завантажити фото</p>
                        <p className="text-xs text-gray-500 mt-1">Натисніть або перетягніть (макс 5MB на фото)</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={handleSubmitNewProduct}
                  disabled={actionLoading}
                  className={`w-full font-bold py-2.5 rounded-lg transition-all ${
                    actionLoading
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {actionLoading ? '⏳ Створення...' : '✅ Створити товар'}
                </button>
                <button
                  onClick={() => setIsCreatingProduct(false)}
                  className="w-full bg-gray-200 text-gray-800 font-bold py-2.5 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно з деталями */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Заголовок модалю */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 sm:p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm opacity-90">Замовлення №</p>
                  <p className="text-xl sm:text-2xl font-bold truncate">{selectedOrder.id}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-white text-2xl font-bold hover:scale-110 transition-transform flex-shrink-0"
                  aria-label="Закрити"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Вміст модалю */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Статус */}
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-gray-600 text-sm sm:text-base">Статус:</p>
                <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>

              {/* Контактна інформація */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                  👤 Контактна інформація
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Ім'я</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedOrder.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Прізвище</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedOrder.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base break-all">{selectedOrder.email}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Телефон</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedOrder.phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Тип клієнта</p>
                    {selectedOrder.userId ? (
                      <div>
                        <p className="font-semibold text-green-700 text-sm sm:text-base flex items-center gap-2">
                          Авторизований 
                          {userProfiles[selectedOrder.userId]?.displayName && (
                            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                              👤 {userProfiles[selectedOrder.userId].displayName}
                            </span>
                          )}
                        </p>
                        {userProfiles[selectedOrder.userId] && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs sm:text-sm" title="Рейтинг">⭐ Рейтинг: {userProfiles[selectedOrder.userId].rating}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm" title="Замовлень">📦 Замовлень: {userProfiles[selectedOrder.userId].totalOrders}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs sm:text-sm" title="Знижка">💳 Знижка: {userProfiles[selectedOrder.userId].discountPercent}%</span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs sm:text-sm" title="Бали">🎁 Бали: {userProfiles[selectedOrder.userId].points}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="font-semibold text-gray-600 text-sm sm:text-base">Гість (без акаунту)</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Адреса доставки */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                  🏠 Адреса доставки
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-900 text-sm sm:text-base">
                    <span className="text-xs sm:text-sm text-gray-600">Місто:</span> <span className="font-semibold">{selectedOrder.city}</span>
                  </p>
                  <p className="text-gray-900 text-sm sm:text-base break-words">
                    <span className="text-xs sm:text-sm text-gray-600">Адреса:</span> <span className="font-semibold">{selectedOrder.address}</span>
                  </p>
                  {selectedOrder.postalCode && (
                    <p className="text-gray-900 text-sm sm:text-base">
                      <span className="text-xs sm:text-sm text-gray-600">Поштовий індекс:</span> <span className="font-semibold">{selectedOrder.postalCode}</span>
                    </p>
                  )}
                </div>
              </section>

              {/* Способ доставки та оплати */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                  🚚 Доставка та оплата
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Способ доставки</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{getDeliveryLabel(selectedOrder.deliveryMethod)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Способ оплати</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">Оплата онлайн</p>
                  </div>
                </div>
              </section>

              {/* Товари */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                  📦 Товари ({selectedOrder.items.length})
                </h3>
                <div className="space-y-2 sm:space-y-3 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-2 sm:p-3 bg-gray-50 rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">{item.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Категорія: {item.category}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Кількість: {item.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">{item.price}₴ за од.</p>
                        <p className="text-xs sm:text-sm text-purple-600 font-bold">{(typeof item.price === 'string' ? parseFloat(item.price) : item.price) * item.quantity}₴</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Розрахунки */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                  💰 Розрахунки
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                    <span>Сума товарів:</span>
                    <span className="font-semibold">{selectedOrder.totalPrice}₴</span>
                  </div>
                  {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 ? (
                    <>
                      <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                        <span>Знижка ({selectedOrder.discountPercent}%):</span>
                        <span className="font-semibold text-green-600">−{selectedOrder.discountAmount}₴</span>
                      </div>
                      <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                        <span>Після знижки:</span>
                        <span className="font-semibold">{selectedOrder.discountedSubtotal}₴</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                      <span>Знижка (0%):</span>
                      <span className="font-semibold text-gray-500">0₴</span>
                    </div>
                  )}
                  {selectedOrder.redeemedPoints && selectedOrder.redeemedPoints > 0 ? (
                    <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                      <span>Списано балів ({selectedOrder.redeemedPoints}):</span>
                      <span className="font-semibold text-yellow-600">−{selectedOrder.redeemedAmount}₴</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                      <span>Списано балів (0):</span>
                      <span className="font-semibold text-gray-500">0₴</span>
                    </div>
                  )}
                  {selectedOrder.deliveryPrice > 0 && (
                    <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                      <span>Доставка:</span>
                      <span className="font-semibold text-orange-600">+{selectedOrder.deliveryPrice}₴</span>
                    </div>
                  )}
                  {selectedOrder.deliveryPrice === 0 && (
                    <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                      <span>Доставка:</span>
                      <span className="font-semibold text-green-600">Безкоштовна ✓</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base sm:text-lg font-bold text-purple-600 pt-2 sm:pt-3 border-t border-gray-200">
                    <span>До оплати:</span>
                    <span>{selectedOrder.finalPrice}₴</span>
                  </div>
                </div>
              </section>

              {/* Коментарі */}
              {selectedOrder.comments && (
                <section>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                    📝 Коментарі
                  </h3>
                  <p className="text-gray-700 text-sm sm:text-base whitespace-pre-wrap break-words">{selectedOrder.comments}</p>
                </section>
              )}

              {/* Дати */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                  📅 Дати
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Створено</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Оновлено</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatDate(selectedOrder.updatedAt)}</p>
                  </div>
                </div>
              </section>

              {/* Дії адміна та закриття модалю */}
              <div className="pt-4 sm:pt-6 border-t border-gray-200 space-y-3">
                {/* Дії для NEW замовлення: підтвердити оплату або скасувати */}
                {selectedOrder.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleConfirmPayment}
                      disabled={actionLoading}
                      className={`flex-1 font-bold py-2 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base ${
                        actionLoading
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {actionLoading ? '⏳ Обробка...' : '✅ Підтвердити оплату'}
                    </button>
                    <button
                      onClick={handleCancelOrder}
                      disabled={actionLoading}
                      className={`flex-1 font-bold py-2 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base ${
                        actionLoading
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {actionLoading ? '⏳ Обробка...' : '❌ Скасувати'}
                    </button>
                  </div>
                )}

                {/* Дії для оброблюваних замовлень: позначити як виконане + скасувати */}
                {selectedOrder.status === 'processing' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleMarkCompleted}
                      disabled={actionLoading}
                      className={`flex-1 font-bold py-2 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base ${
                        actionLoading
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {actionLoading ? '⏳ Обробка...' : '🏁 Позначити як виконане'}
                    </button>
                    <button
                      onClick={handleCancelOrder}
                      disabled={actionLoading}
                      className={`flex-1 font-bold py-2 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base ${
                        actionLoading
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {actionLoading ? '⏳ Обробка...' : '❌ Скасувати'}
                    </button>
                  </div>
                )}

                {/* Закрити завжди */}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-gray-200 text-gray-800 font-bold py-2 sm:py-2.5 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
