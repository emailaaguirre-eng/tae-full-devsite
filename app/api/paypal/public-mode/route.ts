/**
 * GET /api/paypal/public-mode
 * Returns effective mode + public client ID for the JS SDK (no secrets). Checkout uses this at runtime.
 */
import { NextResponse } from 'next/server';
import {
  getEffectivePayPalApiMode,
  getEffectivePayPalConfig,
} from '@/lib/paypal-effective-mode';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getEffectivePayPalConfig();
    return NextResponse.json({
      mode: config.mode,
      clientId: config.publicClientId,
      configured: true,
    });
  } catch {
    const mode = await getEffectivePayPalApiMode();
    return NextResponse.json({
      mode,
      clientId: null,
      configured: false,
    });
  }
}
