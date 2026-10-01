import { NextResponse } from 'next/server';
import { keeperStatus, runKeeper } from '@/lib/market/keeper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`. Without the
 * secret the route only reports status, so anyone can see whether the keeper
 * is funded, and nobody else can make it spend gas.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized = Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
  try {
    const body = authorized ? await runKeeper() : await keeperStatus();
    return NextResponse.json(body, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'keeper failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
