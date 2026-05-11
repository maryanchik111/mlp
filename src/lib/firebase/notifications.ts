import { ref, get, set, update } from 'firebase/database';
import { database } from './config';
import { Order, UserProfile } from './types';
import { ADMIN_TELEGRAM_IDS } from './admin';

/**
 * Зв'язати Telegram ID з обліком користувача
 */
export async function bindTelegramToUser(uid: string, telegramId: string, telegramUsername?: string): Promise<boolean> {
  try {
    const userRef = ref(database, `users/${uid}`);
    const updateData: Partial<UserProfile> = {
      telegramId: telegramId.trim(),
      updatedAt: Date.now(),
    };

    if (telegramUsername) {
      updateData.telegramUsername = telegramUsername.trim();
    }

    await update(userRef, updateData);

    const telegramIndexRef = ref(database, `telegram_users/${telegramId}`);
    await set(telegramIndexRef, {
      uid: uid,
      username: telegramUsername || null,
      bindedAt: Date.now(),
    });

    return true;
  } catch (error) {
    console.error('Помилка прив\'язки Telegram:', error);
    return false;
  }
}

/**
 * Отримати користувача за Telegram ID
 */
export async function getUserByTelegramId(telegramId: string): Promise<{ uid: string; profile: UserProfile } | null> {
  try {
    const telegramIndexRef = ref(database, `telegram_users/${telegramId}`);
    const snapshot = await get(telegramIndexRef);

    if (!snapshot.exists()) return null;
    const { uid } = snapshot.val();

    const userRef = ref(database, `users/${uid}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) return null;

    return {
      uid,
      profile: userSnapshot.val() as UserProfile,
    };
  } catch (error) {
    console.error('Помилка пошуку користувача за Telegram ID:', error);
    return null;
  }
}

/**
 * Відправити сповіщення про замовлення в Telegram
 */
export async function sendOrderNotificationToTelegram(
  uid: string,
  order: Order,
  status: Order['status'] | 'created'
): Promise<boolean> {
  try {
    const userRef = ref(database, `users/${uid}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) return false;
    const user = userSnapshot.val() as UserProfile;

    if (!user.telegramId) return false;

    const messages: { [key: string]: string } = {
      created: `🎉 <b>Нове замовлення!</b>\n\n` +
        `📦 Замовлення №<code>${order.id}</code>\n` +
        `💰 Сума: <b>${order.finalPrice}₴</b>\n` +
        `🛍️ Товарів: <b>${order.items.length}</b>\n` +
        `📍 Місто: <b>${order.city}</b>\n\n` +
        `⏳ Статус: <i>Очікує обробки</i>\n` +
        `✨ Ми обробимо ваше замовлення найближчим часом!`,
      processing: `⚙️ <b>Замовлення в обробці!</b>\n\n` +
        `📦 Замовлення №<code>${order.id}</code>\n` +
        `💰 Сума: <b>${order.finalPrice}₴</b>\n\n` +
        `✅ Платіж підтверджено\n` +
        `🚚 Замовлення готується до відправлення`,
      shipped: `🚀 <b>Замовлення відправлено!</b>\n\n` +
        `📦 Замовлення №<code>${order.id}</code>\n` +
        `💰 Сума: <b>${order.finalPrice}₴</b>\n\n` +
        `🛣️ Ваше замовлення у дорозі!\n` +
        `🆔 Трек-номер: <code>${order.trackingNumber || 'N/A'}</code>\n` +
        `🔍 Стежте за доставкою на сайті Нової Пошти`,
      ready_for_pickup: `🎁 <b>Замовлення готове до забору!</b>\n\n` +
        `📦 Замовлення №<code>${order.id}</code>\n` +
        `💰 Сума: <b>${order.finalPrice}₴</b>\n\n` +
        `🏢 Ваше замовлення прибуло на відділення Нової Пошти!\n` +
        `📍 Адреса отримання вказана при оформленні замовлення\n` +
        `📅 Зберігається 5 днів\n` +
        `🏃‍♀️ Спішіть забрати! ✨`,
      completed: `💖 <b>Замовлення завершене!</b>\n\n` +
        `📦 Замовлення №<code>${order.id}</code>\n` +
        `💰 Сума: <b>${order.finalPrice}₴</b>\n\n` +
        `🙏 Дякуємо за покупку!\n` +
        `🌈 До нових зустрічей у нашому магазині!\n` +
        `✨ Залишайтеся чарівними!`,
      cancelled: `❌ <b>Замовлення скасоване</b>\n\n` +
        `📦 Замовлення №<code>${order.id}</code>\n` +
        `💰 Сума: <b>${order.finalPrice}₴</b>\n\n` +
        `😔 На жаль, замовлення було скасоване\n` +
        `📞 Зв'яжіться з нами якщо є питання`
    };

    const message = messages[status];
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return false;

    // Notify Admin on new order
    if (status === "created") {
      const adminMsg = `🎁 <b>Нове замовлення №${order.id}</b>\n` +
        `Продукт: <b>${order.items.map((i: any) => i.name).join(", ")}</b>\n` +
        `Сума: <b>${order.finalPrice}₴</b>\n` +
        `User: <code>${uid}</code>`;
      
      for (const adminId of ADMIN_TELEGRAM_IDS) {
        if (!adminId || adminId.includes('ID_')) continue;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminId,
            text: adminMsg,
            parse_mode: 'HTML',
          }),
        });
      }
    }

    // Notify User
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: user.telegramId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}
/**
 * Отримати код для прив'язки Telegram (одноразовий код)
 */
export async function generateTelegramBindingCode(uid: string): Promise<string> {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const bindingCodeRef = ref(database, `telegram_binding_codes/${code}`);

    await set(bindingCodeRef, {
      uid: uid,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 хвилин
    });

    return code;
  } catch (error) {
    console.error('Помилка генерування коду для прив\'язки:', error);
    throw error;
  }
}

/**
 * Перевірити код для прив'язки та отримати uid
 */
export async function verifyTelegramBindingCode(code: string): Promise<string | null> {
  try {
    const bindingCodeRef = ref(database, `telegram_binding_codes/${code}`);
    const snapshot = await get(bindingCodeRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.val();

    // Перевірити, чи код не закінчився
    if (data.expiresAt < Date.now()) {
      await set(bindingCodeRef, null); // Видалити протермінований код
      return null;
    }

    return data.uid;
  } catch (error) {
    console.error('Помилка перевірки коду для прив\'язки:', error);
    return null;
  }
}

/**
 * Видалити код для прив'язки після використання
 */
export async function deleteTelegramBindingCode(code: string): Promise<void> {
  try {
    const bindingCodeRef = ref(database, `telegram_binding_codes/${code}`);
    await set(bindingCodeRef, null);
  } catch (error) {
    console.error('Помилка видалення коду:', error);
  }
}

/**
 * Розв'язати Telegram від акаунту
 */
export async function unbindTelegramFromUser(uid: string): Promise<boolean> {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) return false;

    const profile = snapshot.val() as UserProfile;
    const telegramId = profile.telegramId;

    await update(userRef, {
      telegramId: null,
      updatedAt: Date.now(),
    });

    if (telegramId) {
      const telegramIndexRef = ref(database, `telegram_users/${telegramId}`);
      await set(telegramIndexRef, null);
    }

    return true;
  } catch (error) {
    console.error('Помилка розв\'язання Telegram:', error);
    return false;
  }
}

/**
 * Оновити статус замовлення і відправити сповіщення
 */
export async function updateOrderStatusWithNotification(
  orderId: string,
  newStatus: Order['status'],
  userId?: string | null
): Promise<boolean> {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    await update(orderRef, {
      status: newStatus,
      updatedAt: Date.now(),
    });

    if (userId) {
      const orderSnapshot = await get(orderRef);
      if (orderSnapshot.exists()) {
        const order = orderSnapshot.val() as Order;
        await sendOrderNotificationToTelegram(userId, order, newStatus);
      }
    }

    return true;
  } catch (error) {
    console.error('Помилка оновлення статусу замовлення:', error);
    return false;
  }
}
