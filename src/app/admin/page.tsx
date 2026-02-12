'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllOrders, fetchOrdersByStatus, updateOrderStatus, fetchAllProducts, updateProduct, addProduct, deleteProduct, fetchUserProfile, fetchUsersCount, checkAdminAccess, fetchAllReviews, deleteReview, addAdminReply, uploadImage, deleteImage, createAuction, fetchAllAuctions, deleteAuction, updateAuction, type Order, type Product, type UserProfile, type Review, type SupportTicket, type SupportMessage, type Auction, listenToSupportTickets } from '@/lib/firebase';
import { useAuth, useModal } from '@/app/providers';
import { AdminStats } from './admin-stats';

type TabType = 'orders' | 'products' | 'reviews' | 'stats' | 'support' | 'auctions';

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
  const { showSuccess, showError, showWarning, showInfo, showConfirm } = useModal();
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'ready_for_pickup' | 'completed' | 'cancelled'>('all');
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
    costPrice: '',
    deliveryPrice: '120',
    deliveryDays: '1-2',
    image: '🎁',
    description: '',
    quantity: 0,
    images: [],
    discount: 0,
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyingToReview, setReplyingToReview] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // Support tickets state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketReplyLoading, setTicketReplyLoading] = useState(false);
  
  // Auctions state
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [uploadingAuctionImage, setUploadingAuctionImage] = useState(false);
  const [newAuctionForm, setNewAuctionForm] = useState({
    name: '',
    description: '',
    startPrice: '',
    minBidStep: '50',
    timeoutMinutes: '30',
    openTime: '',
    image: '',
    imageFile: null as File | null,
  });
  
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

  // Функція для завантаження товарів
  useEffect(() => {
    if (!mounted) return;
    fetchAllProducts((loadedProducts) => {
      setProducts(loadedProducts);
    });
  }, [mounted]);

  // Функція для завантаження аукціонів
  useEffect(() => {
    if (!mounted) return;
    fetchAllAuctions((loadedAuctions) => {
      setAuctions(loadedAuctions);
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

  // Слухати зміни тікетів підтримки в реальному часі
  useEffect(() => {
    if (!mounted) return;

    const unsubscribe = listenToSupportTickets((tickets) => {
      setSupportTickets(tickets);
      
      // Якщо вибраний тікет був видалений, очищуємо
      if (selectedTicket && !tickets.find(t => t.id === selectedTicket.id)) {
        setSelectedTicket(null);
      } else if (selectedTicket) {
        // Оновлюємо вибраний тікет якщо він змінився
        const updated = tickets.find(t => t.id === selectedTicket.id);
        if (updated && JSON.stringify(updated) !== JSON.stringify(selectedTicket)) {
          setSelectedTicket(updated);
        }
      }
    });

    return () => unsubscribe();
  }, [mounted, selectedTicket]);

  // Кількість зареєстрованих акаунтів
  useEffect(() => {
    if (!mounted) return;
    const loadUsersCount = async () => {
      const count = await fetchUsersCount();
      setUsersCount(count);
    };
    loadUsersCount();
  }, [mounted]);

  // Функція для видалення відгуку
  const handleDeleteReview = async (orderId: string) => {
    if (!confirm('Видалити цей відгук?')) return;
    setActionLoading(true);
    try {
      const success = await deleteReview(orderId);
      if (success) {
        showSuccess('Відгук видалено');
        const allReviews = await fetchAllReviews();
        setReviews(allReviews);
      } else {
        showError('Не вдалося видалити відгук');
      }
    } catch (error) {
      console.error('Помилка:', error);
      showError('Помилка видалення відгуку');
    } finally {
      setActionLoading(false);
    }
  };

  // Функція для відправки відповіді адміна
  const handleSendReply = async (orderId: string) => {
    if (!replyText.trim()) {
      showWarning('Введіть текст відповіді');
      return;
    }
    
    setActionLoading(true);
    try {
      const success = await addAdminReply(orderId, replyText);
      if (success) {
        showSuccess('Відповідь додано');
        setReplyText('');
        setReplyingToReview(null);
        const allReviews = await fetchAllReviews();
        setReviews(allReviews);
      } else {
        showError('Помилка додавання відповіді');
      }
    } catch (error) {
      console.error('Помилка:', error);
      showError('Помилка додавання відповіді');
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
      costPrice: product.costPrice,
      deliveryPrice: product.deliveryPrice || '120',
      deliveryDays: product.deliveryDays || '1-2',
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
      
      // CostPrice має бути рядком (якщо вказана)
      if (payload.costPrice && typeof payload.costPrice === 'number') {
        payload.costPrice = String(payload.costPrice);
      }

      // DeliveryPrice має бути рядком, fallback на '120' якщо пусто
      if (!payload.deliveryPrice) {
        payload.deliveryPrice = '120';
      } else if (typeof payload.deliveryPrice === 'number') {
        payload.deliveryPrice = String(payload.deliveryPrice);
      }

      // DeliveryDays має бути рядком, fallback на '1-2' якщо пусто
      if (!payload.deliveryDays) {
        payload.deliveryDays = '1-2';
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
        showSuccess('Товар оновлено успішно!');
        setEditingProduct(null);
        setEditForm({});
        fetchAllProducts((loadedProducts) => {
          setProducts(loadedProducts);
        });
      } else {
        showError('Помилка при оновленні товару');
      }
    } catch (error) {
      console.error('Помилка:', error);
      showError('Помилка при оновленні товару');
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
      costPrice: '',
      deliveryPrice: '120',
      deliveryDays: '1-2',
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
        showError('Заповніть обов\'язкові поля: назва, ціна, категорія');
        setActionLoading(false);
        return;
      }
      
      // Price має бути рядком
      if (typeof payload.price === 'number') {
        payload.price = String(payload.price);
      }
      
      // CostPrice має бути рядком (якщо вказана)
      if (payload.costPrice && typeof payload.costPrice === 'number') {
        payload.costPrice = String(payload.costPrice);
      }

      // DeliveryPrice має бути рядком, fallback на '120' якщо пусто
      if (!payload.deliveryPrice) {
        payload.deliveryPrice = '120';
      } else if (typeof payload.deliveryPrice === 'number') {
        payload.deliveryPrice = String(payload.deliveryPrice);
      }

      // DeliveryDays має бути рядком, fallback на '1-2' якщо пусто
      if (!payload.deliveryDays) {
        payload.deliveryDays = '1-2';
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
        showSuccess('Товар створено успішно!');
        setIsCreatingProduct(false);
        setNewProductForm({
          name: '',
          category: '',
          price: '',
          costPrice: '',
          deliveryPrice: '120',
          deliveryDays: '1-2',
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
        showError('Помилка при створенні товару');
      }
    } catch (error) {
      console.error('Помилка:', error);
      showError('Помилка при створенні товару');
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
        showSuccess('Товар видалено успішно!');
        fetchAllProducts((loadedProducts) => {
          setProducts(loadedProducts);
        });
      } else {
        showError('Помилка при видаленні товару');
      }
    } catch (error) {
      console.error('Помилка:', error);
      showError('Помилка при видаленні товару');
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
          showWarning(`Файл ${file.name} не є зображенням`);
          continue;
        }
        
        // Перевіряємо розмір (макс 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showWarning(`Файл ${file.name} завеликий (більше 5MB)`);
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
        showSuccess(`Завантажено ${uploadedUrls.length} фото`);
      }
    } catch (error) {
      console.error('Помилка завантаження:', error);
      showError('Помилка завантаження фото');
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
      showError('Помилка видалення фото');
    }
  };

  // Функція для підтвердження оплати
  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const success = await updateOrderStatus(selectedOrder.id, 'processing');
      if (success) {
        showSuccess('Оплата підтверджена! Статус змінено на "В процесі"');
        // Оновлюємо локальний стан модалю, щоб відобразити новий статус без закриття
        setSelectedOrder({ ...selectedOrder, status: 'processing', updatedAt: Date.now() });
      } else {
        showError('Помилка при оновленні статусу');
      }
    } catch (error) {
      console.error('Помилка:', error);
      showError('Помилка при підтвердженні оплати');
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
        showSuccess('Замовлення скасовано');
        // Закриваємо модаль, бо замовлення скасоване
        setSelectedOrder(null);
      } else {
        showError('Помилка при скасуванні');
      }
    } catch (error) {
      console.error('Помилка:', error);
      showError('Помилка при скасуванні замовлення');
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
        showSuccess('Замовлення позначено як виконане');
        // Оновлюємо локальний стан, щоб показати статус "completed"
        setSelectedOrder({ ...selectedOrder, status: 'completed', updatedAt: Date.now() });
      } else {
        showError('Помилка при оновленні статусу');
      }
    } catch (error) {
      console.error('Помилка:', error);
      showError('Помилка при оновленні замовлення');
    } finally {
      setActionLoading(false);
    }
  };

  // Функція для позначення як відправлено
  const handleMarkShipped = async () => {
    if (!selectedOrder) return;
    
    const trackingNumber = prompt('Введіть трек-номер ТТН (12 цифр):', '');
    if (trackingNumber === null) return; // Користувач скасував
    
    if (!trackingNumber.trim()) {
      showError('ТТН не можна пропустити');
      return;
    }

    setActionLoading(true);
    try {
      const success = await updateOrderStatus(selectedOrder.id, 'shipped', trackingNumber);
      if (success) {
        showSuccess('Замовлення позначено як відправлене!\n📦 ТТН відправлено користувачу');
        setSelectedOrder({ 
          ...selectedOrder, 
          status: 'shipped', 
          trackingNumber: trackingNumber,
          updatedAt: Date.now() 
        });
      } else {
        showError('Помилка при оновленні статусу');
      }
    } catch (error) {
      console.error('Помилка:', error);
      showError('Помилка при оновленні замовлення');
    } finally {
      setActionLoading(false);
    }
  };

  // Функція для позначення як готово до забору
  const handleMarkReadyForPickup = async () => {
    if (!selectedOrder) return;
    if (!confirm('Позначити замовлення як готове до забору з пошти?')) return;

    setActionLoading(true);
    try {
      const success = await updateOrderStatus(selectedOrder.id, 'ready_for_pickup');
      if (success) {
        showSuccess('Замовлення позначено як готове до забору!\n📮 Сповіщення відправлено користувачу');
        setSelectedOrder({ 
          ...selectedOrder, 
          status: 'ready_for_pickup', 
          updatedAt: Date.now() 
        });
      } else {
        showError('Помилка при оновленні статусу');
      }
    } catch (error) {
      console.error('Помилка:', error);
      showError('Помилка при оновленні замовлення');
    } finally {
      setActionLoading(false);
    }
  };

  // Функція для відправки відповіді на тікет підтримки
  const handleRespondToTicket = async () => {
    if (!selectedTicket || !ticketReply.trim()) {
      showWarning('Напишіть відповідь');
      return;
    }

    setTicketReplyLoading(true);
    try {
      // Отримуємо ім'я адміна з email або displayName
      const adminName = user?.displayName || user?.email?.split('@')[0] || 'MLP Cutie Family';

      const response = await fetch('/api/support/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: selectedTicket.telegramId,
          adminReply: ticketReply,
          adminName: adminName,
          status: 'responded',
        }),
      });

      if (response.ok) {
        showSuccess('Відповідь відправлена користувачу');
        setTicketReply('');
        // Real-time listener автоматично оновить дані
      } else {
        showError('Помилка при відправці відповіді');
      }
    } catch (error) {
      console.error('Помилка:', error);
      showError('Помилка при відправці');
    } finally {
      setTicketReplyLoading(false);
    }
  };

  // Функція для закриття тікета
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    if (!confirm('Закрити цей тікет?')) return;

    setTicketReplyLoading(true);
    try {
      const response = await fetch('/api/support/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: selectedTicket.telegramId,
          adminReply: '', // Не обов'язково для закриття
          status: 'closed',
        }),
      });

      if (response.ok) {
        showSuccess('Тікет закрито');
        setSelectedTicket(null);
        // Real-time listener автоматично оновить дані
      } else {
        showError('Помилка при закриванні тікета');
      }
    } catch (error) {
      console.error('Помилка:', error);
      showError('Помилка при закриванні');
    } finally {
      setTicketReplyLoading(false);
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
      case 'shipped':
        return 'Відправлено';
      case 'ready_for_pickup':
        return 'Готове до забору';
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
            <button
              onClick={() => setActiveTab('support')}
              className={`md:w-full px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'support'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🆘 Підтримка
            </button>
            <button
              onClick={() => setActiveTab('auctions')}
              className={`md:w-full px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'auctions'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔨 Аукціони
            </button>
          </div>
        </div>

        {/* Stats Tab Content */}
        {activeTab === 'stats' && <AdminStats orders={orders} products={products} usersCount={usersCount} />}

        {/* Orders Tab Content */}
        {activeTab === 'orders' && (
          <>
            {/* Фільтри */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Фільтр по статусу</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-3">
                {(['all', 'pending', 'processing', 'shipped', 'ready_for_pickup', 'completed', 'cancelled'] as const).map((status) => (
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
            <div className="space-y-4 mb-8">
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
                          Info
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
          <div className="space-y-4 mb-16">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Всього товарів: {products.length}</h2>
              <button
                onClick={handleCreateProduct}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Додати
              </button>
            </div>
            
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col items-start gap-4">
                      {product.images && product.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="object-cover rounded-[.8em]"
                        />
                      ) : (
                        <div className="w-16 h-16 text-4xl flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-full">
                          {product.image || '📦'}
                        </div>
                      )}
                      <div>
                        <p className="text-lg font-bold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.category}</p>
                        <div className={`text-sm font-medium ${
                      product.quantity > 0 ? 'text-green-400' : 'text-red-800'
                    }`}>
                      {product.quantity > 0 ? 'В наявності' : 'Немає в наявності'}
                    </div>
                      </div>
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

                  <div className="flex justify-between gap-2">
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={actionLoading}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 w-full"
                    >
                     Видалити
                    </button>
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium w-full"
                    >
                     Редагувати
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
                  
                  {/* Відповідь адміна якщо є */}
                  {review.adminReply && (
                    <div className="mt-4 ml-8 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-600 p-4 rounded">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-purple-500">
                          <img src="/storeimage.jpg" alt="Магазин MLP" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-purple-700">MLP Cutie Family</p>
                            <span className="text-xs text-purple-500">
                              {new Date(review.adminReplyAt || Date.now()).toLocaleString('uk-UA')}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{review.adminReply}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Форма для додавання відповіді */}
                  {!review.adminReply && (
                    <div className="mt-4">
                      {replyingToReview === review.orderId ? (
                        <div className="ml-8 space-y-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Напишіть відповідь від імені магазину..."
                            className="text-purple-600 w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            rows={3}
                            disabled={actionLoading}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSendReply(review.orderId)}
                              disabled={actionLoading || !replyText.trim()}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                actionLoading || !replyText.trim()
                                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                              }`}
                            >
                              📤 Відправити
                            </button>
                            <button
                              onClick={() => {
                                setReplyingToReview(null);
                                setReplyText('');
                              }}
                              disabled={actionLoading}
                              className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                            >
                              Скасувати
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingToReview(review.orderId)}
                          disabled={actionLoading}
                          className="ml-8 px-4 py-2 rounded-lg font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                        >
                          💬 Відповісти
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Support Tab Content */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Список тікетів */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6 max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🆘 Тікети підтримки</h2>
              <p className="text-sm text-gray-600 mb-4">
                Всього: <span className="font-bold text-purple-600">{supportTickets.length}</span>
              </p>
              
              {supportTickets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Немає тікетів підтримки</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {supportTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full text-left p-3 rounded-lg transition-all border-l-4 ${
                        selectedTicket?.id === ticket.id
                          ? 'bg-purple-100 border-l-purple-600 shadow-md'
                          : ticket.status === 'closed'
                          ? 'bg-gray-50 border-l-gray-400 hover:bg-gray-100'
                          : ticket.status === 'responded'
                          ? 'bg-blue-50 border-l-blue-500 hover:bg-blue-100'
                          : 'bg-yellow-50 border-l-yellow-500 hover:bg-yellow-100'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <p className="font-semibold text-gray-900 truncate flex-1">{ticket.telegramUsername || `ID: ${ticket.telegramId}`}</p>
                        <span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${
                          ticket.status === 'open' ? 'bg-yellow-200 text-yellow-800' :
                          ticket.status === 'responded' ? 'bg-blue-200 text-blue-800' :
                          'bg-green-200 text-green-800'
                        }`}>
                          {ticket.status === 'open' ? '🔴 Нове' : ticket.status === 'responded' ? '🟡 Відповідь' : 'Завершено'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {ticket.messages && ticket.messages.length > 0
                          ? ticket.messages[ticket.messages.length - 1].text.substring(0, 40) + '...'
                          : 'Немає повідомлень'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(ticket.updatedAt).toLocaleString('uk-UA').split(',')[0]}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Деталі тікета та форма відповіді */}
            {selectedTicket ? (
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex justify-between items-start mb-2 pb-2 border-b border-gray-200">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">#{selectedTicket.id}</h2>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-semibold">Користувач:</span> {selectedTicket.telegramUsername ? `@${selectedTicket.telegramUsername}` : selectedTicket.telegramId}</p>
                      <p><span className="font-semibold">Статус:</span> 
                        {selectedTicket.status === 'open' ? ' 🔴 Нове' : selectedTicket.status === 'responded' ? ' 🟡 Відповідь отримана' : ' Завершено'}
                      </p>
                      <p><span className="font-semibold">Дата:</span> {new Date(selectedTicket.createdAt).toLocaleString('uk-UA')}</p>
                      {selectedTicket.updatedAt && (
                        <p><span className="font-semibold">Оновлено:</span> {new Date(selectedTicket.updatedAt).toLocaleString('uk-UA')}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Діалог всіх повідомлень */}
                <p className="text-sm font-semibold text-gray-700 mb-2">Історія діалогу:</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto space-y-4">
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.isAdmin
                            ? 'bg-purple-100 border-l-4 border-purple-600 ml-8'
                            : 'bg-yellow-100 border-l-4 border-yellow-500 mr-8'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-xs font-semibold ${msg.isAdmin ? 'text-purple-700' : 'text-yellow-700'}`}>
                            {msg.isAdmin ? '🔧 Адміністратор' : '👤 Користувач'}
                          </p>
                          <p className="text-xs text-gray-600">{new Date(msg.timestamp).toLocaleString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap text-sm">{msg.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Немає повідомлень</p>
                  )}
                </div>

                {/* Форма для відповіді */}
                {selectedTicket.status !== 'closed' && (
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ваша відповідь:</label>
                      <textarea
                        value={ticketReply}
                        onChange={(e) => setTicketReply(e.target.value)}
                        placeholder="Напишіть відповідь для користувача..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 bg-white"
                        rows={4}
                        disabled={ticketReplyLoading}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleRespondToTicket}
                        disabled={ticketReplyLoading || !ticketReply.trim()}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          ticketReplyLoading || !ticketReply.trim()
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        Відправити
                      </button>
                      <button
                        onClick={handleCloseTicket}
                        disabled={ticketReplyLoading}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          ticketReplyLoading
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        Закрити тікет
                      </button>
                    </div>
                  </div>
                )}

                {selectedTicket.status === 'closed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-700 font-semibold">✅ Цей тікет закрито</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-12 flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  {supportTickets.length === 0 ? '🎉 Немає тікетів для підтримки' : '👈 Виберіть тікет для перегляду деталей'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Auctions Tab Content */}
        {activeTab === 'auctions' && (
          <div className="space-y-8">
            {/* Кнопка створення аукціону */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">🔨 Аукціони</h2>
                <button
                  onClick={() => {
                    setShowAuctionModal(true);
                    setNewAuctionForm({
                      name: '',
                      description: '',
                      startPrice: '',
                      minBidStep: '50',
                      timeoutMinutes: '30',
                      openTime: '',
                      image: '',
                      imageFile: null,
                    });
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all"
                >
                  ＋ Новий аукціон
                </button>
              </div>
            </div>

            {/* Модальне вікно створення аукціону */}
            {showAuctionModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
                  {/* Заголовок модалі */}
                  <div className="bg-purple-600 p-6 flex justify-between items-center sticky top-0">
                    <h2 className="text-2xl font-bold text-white">🔨 Створення аукціону</h2>
                    <button
                      onClick={() => setShowAuctionModal(false)}
                      className="text-white hover:opacity-80 transition-opacity text-2xl font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Форма створення */}
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Назва аукціону *</label>
                      <input
                        type="text"
                        value={newAuctionForm.name}
                        onChange={(e) => setNewAuctionForm({ ...newAuctionForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-900"
                        placeholder="Наприклад: Рідка фігурка Rainbow Dash"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Опис</label>
                      <textarea
                        value={newAuctionForm.description}
                        onChange={(e) => setNewAuctionForm({ ...newAuctionForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-900"
                        placeholder="Детальний опис товару"
                        rows={3}
                      />
                    </div>

                    {/* Завантаження фото */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Зображення товару *</label>
                      <div className="space-y-3">
                        {/* Upload Button / Drop Zone */}
                        <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all">
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            <svg className="w-10 h-10 text-purple-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <p className="text-sm font-medium text-gray-700">
                              {newAuctionForm.imageFile ? newAuctionForm.imageFile.name : 'Натисніть або перетягніть фото'}
                            </p>
                            {newAuctionForm.imageFile && (
                              <p className="text-xs text-gray-500 mt-1">
                                {(newAuctionForm.imageFile.size / 1024 / 1024).toFixed(2)} МБ
                              </p>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewAuctionForm(prev => ({ ...prev, imageFile: file }));
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setNewAuctionForm(prev => ({ ...prev, image: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* Preview */}
                        {newAuctionForm.image && (
                          <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0">
                              <img 
                                src={newAuctionForm.image} 
                                alt="Preview" 
                                className="w-32 h-32 rounded-lg object-cover border border-gray-300 shadow-sm"
                              />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Файл вибраний:</p>
                                <p className="text-xs text-gray-600 break-all">{newAuctionForm.imageFile?.name}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setNewAuctionForm(prev => ({ 
                                    ...prev, 
                                    imageFile: null,
                                    image: ''
                                  }));
                                }}
                                className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-all"
                              >
                                ✕ Видалити
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Стартова ціна (₴) *</label>
                        <input
                          type="number"
                          value={newAuctionForm.startPrice}
                          onChange={(e) => setNewAuctionForm({ ...newAuctionForm, startPrice: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-900"
                          placeholder="100"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Крок ставки (₴) *</label>
                        <input
                          type="number"
                          value={newAuctionForm.minBidStep}
                          onChange={(e) => setNewAuctionForm({ ...newAuctionForm, minBidStep: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-900"
                          placeholder="50"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Час неперебивання (хв) *</label>
                        <input
                          type="number"
                          value={newAuctionForm.timeoutMinutes}
                          onChange={(e) => setNewAuctionForm({ ...newAuctionForm, timeoutMinutes: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-900"
                          placeholder="30"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Час відкриття аукціону *</label>
                        <input
                          type="datetime-local"
                          value={newAuctionForm.openTime}
                          onChange={(e) => setNewAuctionForm({ ...newAuctionForm, openTime: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Кнопки дій */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setShowAuctionModal(false)}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition-all"
                      >
                        Скасувати
                      </button>
                      <button
                        onClick={async () => {
                          if (!newAuctionForm.name || !newAuctionForm.startPrice || !newAuctionForm.minBidStep || !newAuctionForm.timeoutMinutes || !newAuctionForm.openTime || !newAuctionForm.imageFile) {
                            showWarning('Заповніть всі обов\'язкові поля');
                            return;
                          }

                          setActionLoading(true);
                          try {
                            // Завантажити зображення
                            let imageUrl: string = '';
                            if (newAuctionForm.imageFile) {
                              setUploadingAuctionImage(true);
                              const file = newAuctionForm.imageFile;
                              const uploadedUrl = await uploadImage(file, 'auctions');
                              if (!uploadedUrl) {
                                throw new Error('Помилка при завантаженні зображення');
                              }
                              imageUrl = uploadedUrl;
                            }

                            const openTimeMs = new Date(newAuctionForm.openTime).getTime();
                            await createAuction(
                              newAuctionForm.name,
                              newAuctionForm.description,
                              parseInt(newAuctionForm.startPrice),
                              parseInt(newAuctionForm.minBidStep),
                              parseInt(newAuctionForm.timeoutMinutes),
                              openTimeMs,
                              imageUrl
                            );
                            showSuccess('Аукціон створено успішно!');
                            setShowAuctionModal(false);
                            setNewAuctionForm({
                              name: '',
                              description: '',
                              startPrice: '',
                              minBidStep: '50',
                              timeoutMinutes: '30',
                              openTime: '',
                              image: '',
                              imageFile: null,
                            });
                            fetchAllAuctions(setAuctions);
                          } catch (error) {
                            showError('Помилка створення аукціону');
                            console.error(error);
                          } finally {
                            setActionLoading(false);
                            setUploadingAuctionImage(false);
                          }
                        }}
                        disabled={actionLoading || uploadingAuctionImage}
                        className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
                          actionLoading || uploadingAuctionImage
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {actionLoading ? '⏳ Обробка...' : uploadingAuctionImage ? '📤 Завантаження фото...' : '✅ Створити'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Список аукціонів */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Всі аукціони</h2>

              {auctions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Немає аукціонів</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auctions.map((auction) => (
                    <div
                      key={auction.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{auction.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{auction.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ml-4 ${
                          auction.status === 'active' ? 'bg-green-100 text-green-800'
                          : auction.status === 'scheduled' ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                          {auction.status === 'active' ? '🟢 Активний'
                          : auction.status === 'scheduled' ? '🔵 Запланований'
                          : '⚫ Завершений'}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-3 text-sm">
                        <div className="bg-purple-50 p-3 rounded">
                          <p className="text-gray-600">Поточна ціна</p>
                          <p className="font-bold text-purple-600 text-lg">{auction.currentPrice}₴</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-gray-600">Крок</p>
                          <p className="font-bold text-blue-600">{auction.minBidStep}₴</p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded">
                          <p className="text-gray-600">Ставок</p>
                          <p className="font-bold text-yellow-600">{auction.bids?.length || 0}</p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded">
                          <p className="text-gray-600">Таймаут</p>
                          <p className="font-bold text-orange-600">{auction.timeoutMinutes} хв</p>
                        </div>
                      </div>

                      {auction.status === 'ended' && auction.winnerUserName && (
                        <div className="mb-3 p-3 bg-green-50 rounded border border-green-200">
                          <p className="text-sm text-green-700"><strong>🏆 Переможець:</strong> {auction.winnerUserName}</p>
                          <p className="text-sm text-green-700"><strong>Фінальна ціна:</strong> {auction.currentPrice}₴</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (confirm('Видалити цей аукціон?')) {
                              setActionLoading(true);
                              deleteAuction(auction.id).then(() => {
                                showSuccess('Аукціон видалено');
                                fetchAllAuctions(setAuctions);
                                setActionLoading(false);
                              }).catch(() => {
                                showError('Помилка видалення');
                                setActionLoading(false);
                              });
                            }
                          }}
                          disabled={actionLoading}
                          className={`flex-1 font-bold py-2 rounded-lg transition-all text-sm ${
                            actionLoading
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          🗑️ Видалити
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Модальне вікно створення нового товару */}
      {isCreatingProduct && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
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
                  {actionLoading ? '⏳ Додавання...' : 'Додати'}
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
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
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

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-600 mb-2">Ціна продажу (₴)</label>
                  <input
                    type="text"
                    value={editForm.price || ''}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-600 mb-2">Ціна закупки (₴)</label>
                  <input
                    type="text"
                    value={editForm.costPrice || ''}
                    onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-400 bg-orange-50/30 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-600 mb-2">Кількість</label>
                  <input
                    type="number"
                    value={editForm.quantity || ''}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value ? parseInt(e.target.value) : 0 })}
                    className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                    placeholder="Наприклад: 10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-green-600 mb-2">Ціна доставки (₴)</label>
                  <input
                    type="text"
                    value={editForm.deliveryPrice || ''}
                    onChange={(e) => setEditForm({ ...editForm, deliveryPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 bg-green-50/30 text-gray-900"
                    placeholder="120"
                  />
                  <span className="text-xs text-gray-500">Введіть ціну доставки в гривнях</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">Термін доставки</label>
                  <input
                    type="text"
                    value={editForm.deliveryDays || ''}
                    onChange={(e) => setEditForm({ ...editForm, deliveryDays: e.target.value })}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-blue-50/30 text-gray-900"
                    placeholder="1-2"
                  />
                  <span className="text-xs text-gray-500">Введіть термін доставки у днях (наприклад: 1-2)</span>
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
                  {actionLoading ? '⏳ Збереження...' : 'Зберегти зміни'}
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
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
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

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-sm font-medium text-purple-600 mb-2">Ціна продажу (₴) *</label>
                  <input
                    type="text"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                    placeholder="299"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-600 mb-2">Ціна закупки (₴)</label>
                  <input
                    type="text"
                    value={newProductForm.costPrice || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, costPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-400 bg-orange-50/30 text-gray-900"
                    placeholder="150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-600 mb-2">Кількість</label>
                  <input
                    type="number"
                    value={newProductForm.quantity || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, quantity: e.target.value ? parseInt(e.target.value) : 0 })}
                    className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-purple-50/30 text-gray-900"
                    placeholder="Наприклад: 10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-green-600 mb-2">Ціна доставки (₴)</label>
                  <input
                    type="text"
                    value={newProductForm.deliveryPrice || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, deliveryPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 bg-green-50/30 text-gray-900"
                    placeholder="120"
                  />
                  <span className="text-xs text-gray-500">Введіть ціну доставки в гривнях</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">Термін доставки</label>
                  <input
                    type="text"
                    value={newProductForm.deliveryDays || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, deliveryDays: e.target.value })}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-blue-50/30 text-gray-900"
                    placeholder="1-2"
                  />
                  <span className="text-xs text-gray-500">Введіть термін доставки в днях</span>
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
                <span className="text-xs text-gray-500">Якщо немає фотографій</span>
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
                  {actionLoading ? '⏳ Створення...' : 'Створити товар'}
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
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
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
                            {userProfiles[selectedOrder.userId].telegramUsername && (
                              <a 
                                href={`https://t.me/${userProfiles[selectedOrder.userId].telegramUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-100 text-sky-700 text-xs sm:text-sm hover:bg-sky-200 transition-colors"
                                title="Перейти до Telegram профілю"
                              >
                                💬 @{userProfiles[selectedOrder.userId].telegramUsername}
                              </a>
                            )}
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
                        
                        {/* Вміст коробки (якщо це конструктор боксу) */}
                        {(item as any).customBox && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Вміст боксу:</p>
                            <ul className="text-xs text-gray-600 space-y-0.5">
                              {(item as any).customBox.items.map((customItem: any, idx: number) => (
                                <li key={idx}>• {customItem.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
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

                {/* Дії для оброблюваних замовлень: відправити / готове до забору / скасувати */}
                {selectedOrder.status === 'processing' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleMarkShipped}
                      disabled={actionLoading}
                      className={`flex-1 font-bold py-2 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base ${
                        actionLoading
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {actionLoading ? '⏳ Обробка...' : '📮 Відправлено (ТТН)'}
                    </button>
                    <button
                      onClick={handleMarkReadyForPickup}
                      disabled={actionLoading}
                      className={`flex-1 font-bold py-2 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base ${
                        actionLoading
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {actionLoading ? '⏳ Обробка...' : '✅ Готове до забору'}
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

                {/* Дії для відправлених замовлень: позначити готове до забору */}
                {selectedOrder.status === 'shipped' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 bg-purple-50 border border-purple-200 rounded-lg p-2 sm:p-3">
                      <p className="text-xs sm:text-sm text-gray-600">📦 ТТН:</p>
                      <p className="text-sm sm:text-base font-bold text-purple-700">{selectedOrder.trackingNumber || 'N/A'}</p>
                    </div>
                    <button
                      onClick={handleMarkReadyForPickup}
                      disabled={actionLoading}
                      className={`flex-1 font-bold py-2 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base ${
                        actionLoading
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {actionLoading ? '⏳ Обробка...' : '✅ Готове до забору'}
                    </button>
                  </div>
                )}

                {/* Дії для замовлень готових до забору: позначити виконане */}
                {selectedOrder.status === 'ready_for_pickup' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleMarkCompleted}
                      disabled={actionLoading}
                      className={`flex-1 font-bold py-2 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base ${
                        actionLoading
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {actionLoading ? '⏳ Обробка...' : '🏁 Позначити як завершене'}
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
