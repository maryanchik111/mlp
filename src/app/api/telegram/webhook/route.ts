import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin-config';
import { createSupportTicketAdmin } from '@/lib/firebase/support-server';

// Token of your Telegram bot (from BotFather)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
// Secret token set when registering the webhook (prevents forged updates)
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

/**
 * POST /api/telegram/webhook
 *
 * Webhook for receiving messages from Telegram bot
 */
export async function POST(request: NextRequest) {
  // Validate Telegram webhook secret token
  if (TELEGRAM_WEBHOOK_SECRET) {
    const incomingSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (incomingSecret !== TELEGRAM_WEBHOOK_SECRET) {
      // silently accept — Telegram expects 200 for all requests
      return NextResponse.json({ ok: true });
    }
  }

  let chatIdForError: number | null = null;

  try {
    const body = await request.json();

    // Check if this is an update from Telegram
    if (!body.message) {
      return NextResponse.json({ ok: true });
    }

    const message = body.message;
    const chatId = message.chat.id;
    chatIdForError = chatId;
    const telegramId = message.from.id.toString();
    const text = message.text || '';
    const username = message.from.username || null; // може бути undefined

    console.log('Telegram message received:', { text, chatId, telegramId, username });

    const adminDb = getAdminDb();

    // Handle /start command with deep link parameter
    if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        '👋 <b>Привіт! Я бот MLP Store 🦄</b>\n\n' +
        'Щоб прив\'язати свій акаунт в магазині до цього чату:\n\n' +
        '1️⃣ Перейдіть на <b>mlpcutiefamily.pp.ua</b>\n' +
        '2️⃣ Увійдіть в свій кабінет\n' +
        '3️⃣ Натисніть "📱 Генерувати код"\n' +
        '4️⃣ Скопіюйте код і напишіть мені:\n' +
        '<code>/bind ABC123</code>\n\n' +
        '✨ Після прив\'язки ви матимете сповіщення про замовлення, спеціальні пропозиції та новини сезону!'
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /start with parameter (format: /start bind_ABC123)
    if (text.startsWith('/start ')) {
      const param = text.substring(7).trim();
      if (param.startsWith('bind_') || param.startsWith('BIND_')) {
        const code = param.replace(/^[Bb][Ii][Nn][Dd]_/, '').toUpperCase();
        console.log('Found binding code in /start:', code);
        await processBindingCode(chatId, telegramId, username, code, adminDb);
        return NextResponse.json({ ok: true });
      }
    }

    // Handle /bind [CODE] command (user manually types)
    if (text.startsWith('/bind ')) {
      const code = text.substring(6).trim().toUpperCase();
      console.log('Found /bind command:', code);
      await processBindingCode(chatId, telegramId, username, code, adminDb);
      return NextResponse.json({ ok: true });
    }

    // Helper to get user
    const getUserByTelegramId = async (tId: string) => {
      const tSnap = await adminDb.ref(`telegram_users/${tId}`).get();
      if (!tSnap.exists()) return null;
      const uid = tSnap.val().uid;
      const uSnap = await adminDb.ref(`users/${uid}`).get();
      if (!uSnap.exists()) return null;
      return { uid, profile: uSnap.val() };
    };

    // /status command
    if (text === '/status') {
      const user = await getUserByTelegramId(telegramId);

      if (user) {
        await sendTelegramMessage(
          chatId,
          `✅ <b>Ваш акаунт прив'язаний!</b>\n\n👤 Ім'я: <b>${user.profile.displayName || 'Користувач'}</b>\n📧 Email: <code>${user.profile.email}</code>\n⭐ Бали: <b>${user.profile.points}</b>`
        );
      } else {
        await sendTelegramMessage(
          chatId,
          '❌ Ваш акаунт не прив\'язаний. Напишіть /start для інструкцій.'
        );
      }

      return NextResponse.json({ ok: true });
    }

    // /unbind command
    if (text === '/unbind') {
      const user = await getUserByTelegramId(telegramId);

      if (user) {
        await sendTelegramMessage(
          chatId,
          '⚠️ Функція розв\'язування буде доступна в особистому кабінеті на сайті.'
        );
      } else {
        await sendTelegramMessage(
          chatId,
          '❌ Ваш акаунт не прив\'язаний.'
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Якщо це звичайне повідомлення (не команда) - створюємо тікет підтримки
    if (text && !text.startsWith('/')) {
      const user = await getUserByTelegramId(telegramId);
      const ticketId = await createSupportTicketAdmin(
        telegramId,
        text,
        username,
        user?.uid
      );

      if (ticketId) {
        await sendTelegramMessage(
          chatId,
          `✅ <b>Ваше повідомлення отримано!</b>\n\n` +
          `🎫 Номер тікета: <code>${ticketId}</code>\n` +
          `⏳ Наша команда відповість найближчим часом\n\n` +
          `🦄 Дякуємо за звернення! 💜`
        );
      } else {
        await sendTelegramMessage(
          chatId,
          '❌ Помилка при створенні тікета. Спробуйте ще раз.'
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Default
    await sendTelegramMessage(
      chatId,
      '🦄 Я розумію тільки команди. Напишіть /start для інструкцій.\n\n' +
      'Або просто напишіть своє питання, і я створю тікет підтримки!'
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    if (chatIdForError) {
      try {
        await sendTelegramMessage(
          chatIdForError,
          '⚠️ <b>Системна помилка сервера:</b>\n' + String(error)
        );
      } catch (e) {}
    }
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Process binding code (shared logic for /start and /bind commands)
 */
async function processBindingCode(chatId: number | string, telegramId: string, username: string | undefined, code: string, adminDb: any): Promise<void> {
  if (!code || code.length < 6) {
    await sendTelegramMessage(
      chatId,
      '❌ Невірний формат. Використовуйте: <code>/bind ABCDEF</code>'
    );
    return;
  }

  try {
    const codeRef = adminDb.ref(`telegram_binding_codes/${code}`);
    const snapshot = await codeRef.get();

    if (!snapshot.exists() || snapshot.val().expiresAt < Date.now()) {
      if (snapshot.exists()) await codeRef.remove();
      await sendTelegramMessage(
        chatId,
        '❌ Код прив\'язки невірний або закінчився. Спробуйте ще раз.'
      );
      return;
    }

    const uid = snapshot.val().uid;

    // Bind Telegram ID to user account
    await adminDb.ref(`users/${uid}`).update({
      telegramId: telegramId.trim(),
      telegramUsername: username?.trim() || null,
      updatedAt: Date.now(),
    });

    await adminDb.ref(`telegram_users/${telegramId}`).set({
      uid: uid,
      username: username || null,
      bindedAt: Date.now(),
    });

    // Delete code after successful use
    await codeRef.remove();

    await sendTelegramMessage(
      chatId,
      '✨ <b>Ура! Ваш акаунт успішно прив\'язаний!</b> 🎉\n\n' +
      '🦄 Тепер ви матимете:\n' +
      '📦 Сповіщення про нові замовлення\n' +
      '🎁 Спеціальні пропозиції та знижки\n' +
      '⭐ Новини з MLP світу\n\n' +
      'Дякуємо, що ви з нами! 💜'
    );
  } catch (error) {
    console.error('Processing binding error:', error);
    await sendTelegramMessage(
      chatId,
      '❌ Помилка при прив\'язці. Спробуйте ще раз.'
    );
  }
}

/**
 * Helper function to send a message to Telegram
 */
async function sendTelegramMessage(chatId: number | string, text: string): Promise<void> {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN is not set');
      return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Telegram API error:', error);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

/**
 * GET /api/telegram/webhook
 * For manual webhook setup if needed
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'set-webhook') {
      if (!TELEGRAM_BOT_TOKEN) {
        return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not set' }, { status: 400 });
      }

      const origin = request.nextUrl.origin;
      const webhookUrl = `${origin}/api/telegram/webhook`;

      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: webhookUrl,
            ...(TELEGRAM_WEBHOOK_SECRET && { secret_token: TELEGRAM_WEBHOOK_SECRET }),
          }),
        }
      );

      const data = await response.json();
      return NextResponse.json(data);
    }

    if (action === 'get-webhook-info') {
      if (!TELEGRAM_BOT_TOKEN) {
        return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not set' }, { status: 400 });
      }

      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ message: 'Telegram webhook API' });
  } catch (error) {
    console.error('Telegram API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
