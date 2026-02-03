import { NextRequest, NextResponse } from 'next/server';
import { getAllSupportTickets } from '@/lib/firebase';

/**
 * GET /api/support/tickets
 * 
 * Отримати всі тікети підтримки (для адмін панелі)
 */
export async function GET(request: NextRequest) {
  try {
    const tickets = await getAllSupportTickets();

    return NextResponse.json({
      ok: true,
      tickets,
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
