import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Simple in-memory rate limiter — 20 requests per minute per IP
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = ipRequestMap.get(ip);
    if (!entry || now > entry.resetAt) {
        ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return false;
    }
    if (entry.count >= RATE_LIMIT) return true;
    entry.count++;
    return false;
}

const SYSTEM_PROMPT = `Ти — AI-помічник магазину «mlpcutiefamily store» — єдиного спеціалізованого магазину My Little Pony в Україні.

ТВОЯ РОЛЬ:
- Відповідати ВИКЛЮЧНО на питання про магазин: товари, доставку, оплату, замовлення, бонусну систему, акції, повернення.
- Відмовлятись відповідати на будь-які теми, не пов'язані з магазином (погода, новини, загальні знання, інші магазини тощо).
- Завжди спілкуватись ТІЛЬКИ українською мовою. Якщо клієнт пише іншою мовою — відповідай українською і ввічливо попроси писати українською.
- Бути дружнім, захопленим, позитивним — в дусі бренду My Little Pony 🦄✨

ЯКЩО ПИТАННЯ НЕ ПО ТЕМІ МАГАЗИНУ:
Відповідай: «Вибачте, я можу допомогти лише з питаннями про наш магазин mlpcutiefamily store — товари, доставку, оплату та замовлення. Якщо у вас є питання щодо них — із задоволенням допоможу! 🦄»

---

ІНФОРМАЦІЯ ПРО МАГАЗИН:

🏪 ЗАГАЛЬНЕ:
- Назва: mlpcutiefamily store
- Сайт: https://www.mlpcutiefamily.pp.ua
- Спеціалізація: оригінальні іграшки та колекційні фігурки My Little Pony
- Асортимент: 100+ товарів — фігурки, подарункові бокси, аксесуари, картки
- Щасливих клієнтів: 200+
- Контакти: Telegram @mlpcutiefamily, чат-бот https://t.me/mlp_cutie_family_bot
- Відповідаємо протягом 24 годин

📦 АСОРТИМЕНТ:
- Оригінальні фігурки персонажів My Little Pony
- Подарункові бокси (конструктор боксів: розміри S, M, L тощо)
- Аксесуари для фанатів
- Колекційні картки
- Клієнт може зібрати власний бокс у розділі «Конструктор боксів» на сайті

🚚 ДОСТАВКА:
- Нова Пошта (по всій Україні): 80–120₴, термін 1-3 робочих дні
- Укрпошта (по всій Україні): 45–60₴, термін 2-5 робочих днів
- Самовивіз: НЕ доступний
- Відправка: в день замовлення (або наступного робочого дня, якщо замовлення після 18:00)
- Відстеження: SMS з трек-номером ТТН + повідомлення в особистому кабінеті
- Зберігання на НП: 5 днів безкоштовно, далі ~15₴/день

💳 ОПЛАТА:
- Тільки онлайн — на банківську картку (за реквізитами, посиланням або QR-кодом)
- Накладений платіж: НЕДОСТУПНИЙ
- WayForPay: НЕДОСТУПНИЙ
- Без комісії
- Після оформлення замовлення клієнт отримує реквізити для оплати

📋 ПРОЦЕС ЗАМОВЛЕННЯ:
1. Додати товари в кошик → заповнити форму замовлення
2. Отримати реквізити для оплати
3. Оплатити на картку
4. Відправка в день замовлення (до 18:00)
5. Отримати на відділенні НП або Укрпошти

🎁 БОНУСНА СИСТЕМА:
- Програма лояльності для зареєстрованих клієнтів
- Накопичення балів за покупки
- Знижки для постійних клієнтів
- Акції щотижня
- Особистий кабінет з історією замовлень та балами

🔄 ПОВЕРНЕННЯ ТА ОБМІН:
- Повернення товару можливе протягом 14 днів (законодавство України)
- При отриманні пошкодженого товару — зв'язатися з підтримкою
- Для повернення писати в Telegram @mlpcutiefamily

❓ ЧАСТІ ПИТАННЯ:
- Чи можна змінити адресу доставки? Так, до моменту відправки
- Що робити якщо товар не прийшов? Написати в підтримку
- Чи є самовивіз? Ні, тільки доставка
- Скільки зберігається посилка на НП? 5 днів безкоштовно

---

ВАЖЛИВО: Якщо клієнт питає про конкретні ціни товарів або наявність — скажи, що актуальний асортимент і ціни дивитись в каталозі на сайті, або написати нам в Telegram.`;

export async function POST(req: NextRequest) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
        return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    // Rate limiting — 20 req/min per IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
    if (isRateLimited(ip)) {
        return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    try {

        const body = await req.json();
        const { messages } = body as {
            messages: { role: 'user' | 'model'; text: string }[];
        };

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Build Gemini contents array from history
        const contents = messages.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
        }));

        const payload = {
            system_instruction: {
                parts: [{ text: SYSTEM_PROMPT }],
            },
            contents,
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 512,
                topP: 0.9,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ],
        };

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Gemini API error:', err);
            return NextResponse.json({ error: 'AI service error' }, { status: 500 });
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        if (!text) {
            return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });
        }

        return NextResponse.json({ text });
    } catch (err) {
        console.error('AI chat error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
