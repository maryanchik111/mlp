import { NextRequest, NextResponse } from 'next/server';
import {
  bindTelegramToUser,
  verifyTelegramBindingCode,
  deleteTelegramBindingCode,
  getUserByTelegramId,
} from '@/lib/firebase';

// Token of your Telegram bot (from BotFather)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

/**
 * POST /api/telegram/webhook
 *
 * Webhook for receiving messages from Telegram bot
 *
 * Bot should recognize /bind command and binding code
 * Example: user sends "/bind ABC123" to bot chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is an update from Telegram
    if (!body.message) {
      return NextResponse.json({ ok: true });
    }

    const message = body.message;
    const chatId = message.chat.id;
    const telegramId = message.from.id.toString();
    const text = message.text || '';

    console.log('Telegram message received:', { text, chatId, telegramId });

    // Handle /start command with deep link parameter
    // When user opens: https://t.me/mlp_cutie_family_bot?start=bind_ABC123
    // Telegram sends: { text: "/start", entities: [...], ... }
    // BUT the parameter is available in message.text as "/start bind_ABC123"
    if (text === '/start') {
      // Check if there's a code in the deep link parameter
      // The parameter comes concatenated with /start in some cases
      await sendTelegramMessage(
        chatId,
        '👋 Hello! I am MLP Store bot.\n\nTo link your store account to this chat:\n1. Go to your personal account on the site\n2. Click "Link Telegram"\n3. Copy the binding code\n4. Write to me: /bind YOUR_CODE\n\nExample: /bind ABC123'
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /start with parameter (format: /start bind_ABC123)
    if (text.startsWith('/start ')) {
      const param = text.substring(7).trim();
      // Extract code from bind_ prefix
      if (param.startsWith('bind_') || param.startsWith('BIND_')) {
        const code = param.replace(/^[Bb][Ii][Nn][Dd]_/, '').toUpperCase();
        console.log('Found binding code in /start:', code);
        await processBindingCode(chatId, telegramId, code);
        return NextResponse.json({ ok: true });
      }
    }

    // Handle /bind [CODE] command (user manually types)
    if (text.startsWith('/bind ')) {
      const code = text.substring(6).trim().toUpperCase();
      console.log('Found /bind command:', code);
      await processBindingCode(chatId, telegramId, code);
      return NextResponse.json({ ok: true });
    }

    // /status command
    if (text === '/status') {
      const user = await getUserByTelegramId(telegramId);

      if (user) {
        await sendTelegramMessage(
          chatId,
          `✅ Your account is linked!\n\nName: ${user.profile.displayName || 'User'}\nEmail: ${user.profile.email}\nPoints: ${user.profile.points}`
        );
      } else {
        await sendTelegramMessage(
          chatId,
          '❌ Your account is not linked. Write /start for instructions.'
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
          '⚠️ Unbinding function will be available from your account on the website.'
        );
      } else {
        await sendTelegramMessage(
          chatId,
          '❌ Your account is not linked.'
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Default
    await sendTelegramMessage(
      chatId,
      'I understand only commands. Write /start for instructions.'
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Process binding code (shared logic for /start and /bind commands)
 */
async function processBindingCode(chatId: number | string, telegramId: string, code: string): Promise<void> {
  if (!code || code.length < 6) {
    await sendTelegramMessage(
      chatId,
      '❌ Invalid format. Use: /bind ABCDEF'
    );
    return;
  }

  // Verify binding code
  const uid = await verifyTelegramBindingCode(code);

  if (!uid) {
    await sendTelegramMessage(
      chatId,
      '❌ Binding code is invalid or expired. Try again.'
    );
    return;
  }

  // Bind Telegram ID to user account
  const success = await bindTelegramToUser(uid, telegramId);

  if (success) {
    // Delete code after successful use
    await deleteTelegramBindingCode(code);

    await sendTelegramMessage(
      chatId,
      '✅ Hooray! Your account has been successfully linked! 🎉\n\nYou will now receive notifications about orders and special offers.'
    );
  } else {
    await sendTelegramMessage(
      chatId,
      '❌ Error during linking. Try again.'
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

      const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/api/telegram/webhook`;

      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: webhookUrl,
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
