import { ref, get } from 'firebase/database';
import { database } from './config';

/**
 * Перетворення українського тексту в англійський slug (lowercase, translit)
 */
export function slugify(text: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh',
    'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ye', 'Ж': 'Zh',
    'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '', 'Ю': 'Yu', 'Я': 'Ya'
  };

  const translit = text.split('').map(char => map[char] || char).join('');

  return translit
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Функція для генерації людського номеру замовлення (наприклад: NW4343)
 */
export const generateOrderNumber = async (): Promise<string> => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let isUnique = false;
  let orderNumber = '';

  while (!isUnique) {
    const randomLetter1 = letters[Math.floor(Math.random() * letters.length)];
    const randomLetter2 = letters[Math.floor(Math.random() * letters.length)];
    const randomNumbers = Math.floor(1000 + Math.random() * 9000);
    orderNumber = `${randomLetter1}${randomLetter2}${randomNumbers}`;

    // Перевірка на унікальність
    const orderRef = ref(database, `orders/${orderNumber}`);
    const snapshot = await get(orderRef);
    if (!snapshot.exists()) {
      isUnique = true;
    }
  }

  return orderNumber;
};

/**
 * Форматування дати
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Функція для отримання конфігурації платежу (QR, карта, посилання)
 */
export const getPaymentConfig = () => {
  const cardNumber = process.env.NEXT_PUBLIC_PAYMENT_CARD_NUMBER || '—';
  const cardName = process.env.NEXT_PUBLIC_PAYMENT_CARD_NAME || '—';
  const paymentLink = process.env.NEXT_PUBLIC_PAYMENT_LINK || '#';
  const monobankJar = process.env.NEXT_PUBLIC_PAYMENT_MONOBANK_JAR || 'https://send.monobank.ua/jar/8ewEKnZQRq';
  
  return {
    cardNumber,
    cardName,
    paymentLink,
    monobankJar,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentLink)}`,
    jarQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(monobankJar)}`,
  };
};
