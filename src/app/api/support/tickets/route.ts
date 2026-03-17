import { NextRequest, NextResponse } from 'next/server';
import { getAllSupportTickets } from '@/lib/firebase';

const API_SECRET = process.env.API_SECRET || '';

/**
 * GET /api/support/tickets
 *
 * Отримати всі тікети підтримки (для адмін панелі)
 * Захищено: потребує заголовок x-api-secret
 */
export async function GET(request: NextRequest) {
  // Auth check — internal use only
  if (API_SECRET) {
    const secret = request.headers.get('x-api-secret');
    if (secret !== API_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const tickets = await getAllSupportTickets();
    return NextResponse.json({ ok: true, tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
