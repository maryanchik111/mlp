'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { fetchUserOrders, type Order, updateUserName, updateUserPhoto } from '@/lib/firebase';
import TelegramBinder from '@/app/components/client/telegram-binder';
import SupportButton from '@/app/components/client/support-button';
import { useModal } from '@/app/providers';
import {
  SparklesIcon,
  LockClosedIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
  StarIcon,
  TrophyIcon,
  MoonIcon,
  AcademicCapIcon,
  CameraIcon,
  PencilSquareIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  MapPinIcon,
  TruckIcon,
  CurrencyDollarIcon,
  CheckIcon,
  DocumentTextIcon,
  CalendarIcon,
  XMarkIcon,
  GiftIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  CurrencyEuroIcon,
} from '@heroicons/react/24/outline';

/* ─── helpers ─── */
function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-50 text-amber-800 border border-amber-200';
    case 'processing': return 'bg-blue-50 text-blue-800 border border-blue-200';
    case 'shipped': return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
    case 'ready_for_pickup': return 'bg-purple-50 text-purple-800 border border-purple-200';
    case 'completed': return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
    case 'cancelled': return 'bg-red-50 text-red-800 border border-red-200';
    default: return 'bg-gray-50 text-gray-700 border border-gray-200';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'pending': return 'Очікує обробки';
    case 'processing': return 'В процесі';
    case 'shipped': return 'Відправлено';
    case 'ready_for_pickup': return 'Готово до забору';
    case 'completed': return 'Завершено';
    case 'cancelled': return 'Скасовано';
    default: return status;
  }
}

const formatDate = (ts: number) => new Date(ts).toLocaleString('uk-UA');

/* ─── rating config ─── */
const ratingBadges = [
  { level: 0, label: 'Новий друг Еквестрії', Icon: SparklesIcon },
  { level: 1, label: 'Друг місяця', Icon: MoonIcon },
  { level: 2, label: 'Істинний шанувальник', Icon: StarIcon },
  { level: 3, label: 'Колекціонер MLP', Icon: GiftIcon },
  { level: 4, label: 'Королева Понів', Icon: AcademicCapIcon },
  { level: 5, label: 'Легенда Еквестрії', Icon: TrophyIcon },
];

/* ═══════════════════════════════════════════
   Page
═══════════════════════════════════════════ */
export default function AccountPage() {
  const { user, profile, loading, signIn, signOut, refreshProfile } = useAuth();
  const { showSuccess, showError } = useModal();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    setNewName(profile?.displayName || user?.displayName || '');
  }, [profile, user]);

  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    fetchUserOrders(user.uid).then(list => {
      setOrders(list);
      setOrdersLoading(false);
    });
  }, [user]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!user || !file) return;
    if (file.size > 2 * 1024 * 1024) { showError('Фото занадто велике (макс 2 MB)'); return; }
    setIsUploadingPhoto(true);
    try {
      await updateUserPhoto(user, file);
      await refreshProfile();
      showSuccess('Фото оновлено!');
    } catch { showError('Не вдалося оновити фото.'); }
    finally { setIsUploadingPhoto(false); }
  };

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;
    setIsSavingName(true);
    try {
      await updateUserName(user, newName);
      await refreshProfile();
      setIsEditingName(false);
      showSuccess('Імʼя оновлено!');
    } catch { showError('Не вдалося оновити імʼя.'); }
    finally { setIsSavingName(false); }
  };

  const reloadOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    await refreshProfile();
    const list = await fetchUserOrders(user.uid);
    setOrders(list);
    setOrdersLoading(false);
  };

  /* ── loading ── */
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Завантаження...</p>
      </main>
    );
  }

  /* ── not logged in ── */
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-5">
            <SparklesIcon className="w-7 h-7 text-purple-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Увійдіть в акаунт</h1>
          <p className="text-sm text-gray-400 mb-6">
            Щоб бачити замовлення, рейтинг та бали
          </p>
          <button
            onClick={() => signIn().then(() => refreshProfile())}
            className="w-full bg-[#534AB7] hover:bg-[#3C3489] text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <LockClosedIcon className="w-4 h-4" /> Увійти через Google
          </button>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 mt-5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> До каталогу
          </Link>
        </div>
      </main>
    );
  }

  /* ── blocked ── */
  if (profile?.isBlocked) {
    return (
      <main className="min-h-screen bg-red-50 flex items-center justify-center py-12">
        <div className="bg-white border-2 border-red-100 rounded-2xl shadow-sm p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <LockClosedIcon className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-red-700 mb-2">Акаунт заблоковано</h1>
          <p className="text-sm text-gray-400 mb-6">
            Доступ до особистого кабінету призупинено. Зверніться в підтримку.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="https://t.me/mlp_cutie_family_bot"
              className="w-full bg-gray-900 hover:bg-black text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <EnvelopeIcon className="w-4 h-4" /> Написати в підтримку
            </a>
            <button
              onClick={() => signOut()}
              className="w-full border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" /> Вийти
            </button>
          </div>
        </div>
      </main>
    );
  }

  const badge = ratingBadges.find(b => b.level === profile?.rating) ?? ratingBadges[0];
  const BadgeIcon = badge.Icon;

  /* ── main ── */
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-20">

        {/* Page header */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-0.5">Мій кабінет</h1>
        <p className="text-sm text-gray-400 mb-6">Замовлення, бонуси та налаштування профілю</p>

        {/* ── Profile card ── */}
        <div className="bg-[#534AB7] rounded-2xl p-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">

            {/* Avatar */}
            <div className="relative group/av flex-shrink-0">
              {user.photoURL || profile?.photoURL ? (
                <img
                  src={profile?.photoURL || user.photoURL || ''}
                  alt="avatar"
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#7F77DD] border-2 border-white/20 flex items-center justify-center text-white text-xl font-medium">
                  {(profile?.displayName || user.displayName || 'К')[0].toUpperCase()}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover/av:opacity-100 transition-opacity cursor-pointer">
                {isUploadingPhoto
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <CameraIcon className="w-5 h-5 text-white" />
                }
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isUploadingPhoto}
                />
              </label>
            </div>

            {/* Name / email */}
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    maxLength={30}
                    autoFocus
                    className="bg-white/10 border border-white/30 rounded-lg px-2 py-1 text-white text-sm font-medium focus:outline-none w-40"
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={isSavingName || !newName.trim()}
                    className="bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg p-1.5 text-white disabled:opacity-40 transition-colors"
                  >
                    <CheckIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    disabled={isSavingName}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-1.5 text-white/70 transition-colors"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-base">
                    {profile?.displayName || user.displayName || 'Користувач'}
                  </p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="bg-white/10 hover:bg-white/20 rounded-md p-1 transition-colors"
                    title="Редагувати імʼя"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5 text-white/70" />
                  </button>
                </div>
              )}
              <p className="text-white/50 text-xs mt-0.5">{user.email || user.phoneNumber}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:flex-col">
            <SupportButton />
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-white text-sm transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" /> Вийти
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {(
            [
              {
                label: 'Рейтинг',
                value: `Рівень ${profile?.rating ?? 0}`,
                hint: badge.label,
                iconBg: 'bg-purple-50',
                iconColor: 'text-purple-600',
                Icon: ShieldCheckIcon,
                small: true,
              },
              {
                label: 'Бали',
                value: profile?.points ?? 0,
                hint: '1 бал = 100 ₴',
                iconBg: 'bg-pink-50',
                iconColor: 'text-pink-600',
                Icon: StarIcon,
              },
              {
                label: 'Знижка',
                value: `${profile?.discountPercent ?? 0}%`,
                hint: 'Застосовується авто',
                iconBg: 'bg-emerald-50',
                iconColor: 'text-emerald-600',
                Icon: CurrencyEuroIcon,
              },
              {
                label: 'Замовлень',
                value: profile?.totalOrders ?? 0,
                hint: `${profile?.totalSpent ?? 0} ₴`,
                iconBg: 'bg-blue-50',
                iconColor: 'text-blue-600',
                Icon: CubeIcon,
              },
            ] as {
              label: string;
              value: string | number;
              hint: string;
              iconBg: string;
              iconColor: string;
              Icon: React.ElementType;
              small?: boolean;
            }[]
          ).map(({ label, value, hint, iconBg, iconColor, Icon, small }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${iconBg} ${iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">{label}</p>
              <p className={`font-medium text-gray-900 leading-tight ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>
            </div>
          ))}
        </div>

        {/* ── Telegram ── */}
        <section className="mb-8">
          <TelegramBinder
            uid={user.uid}
            telegramId={profile?.telegramId}
            telegramUsername={profile?.telegramUsername}
            onBoundSuccess={() => refreshProfile()}
            onUnboundSuccess={() => refreshProfile()}
          />
        </section>

        {/* ── Orders ── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
              <CubeIcon className="w-5 h-5 text-gray-400" /> Замовлення
            </h2>
            <button
              onClick={reloadOrders}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" /> Оновити
            </button>
          </div>

          {ordersLoading ? (
            <p className="text-sm text-gray-400">Завантаження...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400">Замовлень ще немає</p>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">№ {order.id}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[#534AB7] text-base">{order.finalPrice} ₴</p>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {order.items.slice(0, 6).map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-xs text-gray-600"
                      >
                        <CubeIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{item.name}</span>
                        <span className="text-gray-400">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center gap-1.5 bg-[#534AB7] hover:bg-[#3C3489] text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    <ClipboardDocumentListIcon className="w-3.5 h-3.5" /> Деталі замовлення
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2.5 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> До каталогу
        </Link>
      </div>

      {/* ── Order detail modal ── */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
          onClick={e => { if (e.target === e.currentTarget) setSelectedOrder(null); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100">

            {/* Modal header */}
            <div className="bg-[#534AB7] px-6 py-5 rounded-t-2xl sticky top-0 z-10 flex justify-between items-start">
              <div>
                <p className="text-xs text-white/50 mb-0.5">Замовлення</p>
                <h2 className="text-lg font-medium text-white">№ {selectedOrder.id}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-white/10 hover:bg-white/20 rounded-lg p-1.5 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Статус:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>

              {/* Contact */}
              <section>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Контактна інформація</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Імʼя', selectedOrder.firstName],
                    ['Прізвище', selectedOrder.lastName],
                    ['Email', selectedOrder.email],
                    ['Телефон', selectedOrder.phone],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{lbl}</p>
                      <p className="text-sm text-gray-800 break-all">{val}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Address */}
              <section>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <MapPinIcon className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Адреса доставки</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Місто', selectedOrder.city],
                    ['Адреса', selectedOrder.address],
                    ...(selectedOrder.postalCode ? [['Поштовий код', selectedOrder.postalCode]] : []),
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{lbl}</p>
                      <p className="text-sm text-gray-800 break-words">{val}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Delivery & payment */}
              <section>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <TruckIcon className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Доставка та оплата</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Доставка</p>
                    <p className="text-sm text-gray-800">Нова Пошта</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Оплата</p>
                    <p className="text-sm text-gray-800">Онлайн</p>
                  </div>
                </div>
              </section>

              {/* Items */}
              <section>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <CubeIcon className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Товари ({selectedOrder.items.length})
                  </h3>
                </div>
                <div className="flex flex-col gap-2 max-h-44 overflow-y-auto">
                  {selectedOrder.items.map(item => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">×{item.quantity} · {item.category}</p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-xs text-gray-400">{item.price} ₴/шт</p>
                        <p className="text-sm font-medium text-[#534AB7]">
                          {parseInt(item.price) * item.quantity} ₴
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Totals */}
              <section>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Розрахунки</h3>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Сума товарів</span><span>{selectedOrder.totalPrice} ₴</span>
                  </div>
                  {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Знижка ({selectedOrder.discountPercent}%)</span>
                      <span className="text-emerald-600">−{selectedOrder.discountAmount} ₴</span>
                    </div>
                  )}
                  {selectedOrder.redeemedPoints && selectedOrder.redeemedPoints > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Списано балів ({selectedOrder.redeemedPoints})</span>
                      <span className="text-amber-600">−{selectedOrder.redeemedAmount} ₴</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Доставка</span>
                    {selectedOrder.deliveryPrice > 0
                      ? <span className="text-orange-600">+{selectedOrder.deliveryPrice} ₴</span>
                      : <span className="text-emerald-600">Безкоштовна</span>
                    }
                  </div>
                  <div className="flex justify-between items-center bg-[#534AB7] text-white rounded-lg px-4 py-3 mt-1">
                    <span className="text-sm font-medium">До оплати</span>
                    <span className="text-base font-medium">{selectedOrder.finalPrice} ₴</span>
                  </div>
                </div>
              </section>

              {/* Comments */}
              {selectedOrder.comments && (
                <section>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                    <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Коментарі</h3>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3 whitespace-pre-wrap break-words">
                    {selectedOrder.comments}
                  </p>
                </section>
              )}

              {/* Dates */}
              <section>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Дати</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Створено</p>
                    <p className="text-sm text-gray-800">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Оновлено</p>
                    <p className="text-sm text-gray-800">{formatDate(selectedOrder.updatedAt)}</p>
                  </div>
                </div>
              </section>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-[#534AB7] hover:bg-[#3C3489] text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}