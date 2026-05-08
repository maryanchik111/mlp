import { NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_NOVA_POSHTA_API_KEY || '';
const API_URL = 'https://api.novaposhta.ua/v2.0/json/';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Передаємо запит на API Нової Пошти, додаючи API Key
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        apiKey: API_KEY, // Використовуємо ключ з серверного оточення
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Nova Poshta Proxy Error:', error);
    return NextResponse.json({ success: false, errors: ['Internal Server Error'] }, { status: 500 });
  }
}
