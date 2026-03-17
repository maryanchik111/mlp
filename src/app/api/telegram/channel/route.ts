import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

export async function POST(request: NextRequest) {
    try {
        const { product } = await request.json();

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
            return NextResponse.json(
                { error: 'Telegram credentials missing (Bot Token or Channel ID)' },
                { status: 500 }
            );
        }

        // Форматуємо повідомлення
        const priceLine = product.discount && product.discount > 0
            ? `💰 Ціна: <del>${product.price}₴</del> <b>${Math.round(product.price * (1 - product.discount / 100))}₴</b> (-${product.discount}%)`
            : `💰 Ціна: <b>${product.price}₴</b>`;

        const abroadTag = product.isAbroad ? '🌍 <b>Товар з-за кордону</b>\n' : '';
        const deliveryLine = `🚚 Термін доставки: <b>${product.deliveryDays || '1-2'} днів</b>`;

        const caption = `🦄 <b>Новий товар у наявності!</b>\n\n` +
            `<b>${product.name}</b>\n` +
            `📦 Категорія: <i>${product.category || 'Різне'}</i>\n\n` +
            `${priceLine}\n` +
            `${abroadTag}` +
            `${deliveryLine}\n\n` +
            `📝 <i>${product.description || 'Немає опису'}</i>\n` +
            `\n` +
            `👉 <a href="https://mlpcutiefamily.pp.ua/catalog/product/${product.id}">Купити на сайті</a>`;

        // Знаходимо перше фото (якщо є)
        let mainImageUrl = null;
        if (product.images && product.images.length > 0) {
            mainImageUrl = product.images[0];
        } else if (product.image && product.image.startsWith('http')) {
            mainImageUrl = product.image;
        }

        let url = '';
        let bodyData: any = {};

        if (mainImageUrl) {
            // Відправляємо фото з текстом
            url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
            bodyData = {
                chat_id: TELEGRAM_CHANNEL_ID,
                photo: mainImageUrl,
                caption: caption,
                parse_mode: 'HTML',
            };
        } else {
            // Відправляємо просто текст (додаємо емодзі якщо було замість фото)
            url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            const textWithEmoji = product.image && !product.image.startsWith('http')
                ? `${product.image}\n${caption}`
                : caption;

            bodyData = {
                chat_id: TELEGRAM_CHANNEL_ID,
                text: textWithEmoji,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Telegram API error:', errorData);
            return NextResponse.json({ error: 'Failed to send to Telegram', details: errorData }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error sending channel notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
