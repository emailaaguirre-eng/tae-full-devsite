/**
 * GET  /api/admin/paypal-mode — effective mode + sources (admin session required)
 * PUT  /api/admin/paypal-mode — set DB mode; requires confirm === "LIVE" | "SANDBOX"
 */
import { NextResponse } from 'next/server';
import { getDb, appSettings, eq } from '@/lib/db';
import { saveDatabase } from '@/db';
import { getAdminSessionFromRequest, writeAdminAuditLog } from '@/lib/admin-auth';
import {
  PAYPAL_MODE_DB_KEY,
  getEffectivePayPalApiMode,
  getPayPalModeFromDatabase,
  getPayPalModeFromEnv,
  type PayPalApiMode,
} from '@/lib/paypal-effective-mode';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getAdminSessionFromRequest(req);
  if (!session.authenticated || !session.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const effectiveMode = await getEffectivePayPalApiMode();
  const databaseMode = await getPayPalModeFromDatabase();
  const envMode = getPayPalModeFromEnv();

  return NextResponse.json({
    success: true,
    data: {
      effectiveMode,
      databaseMode,
      envMode,
      databaseOverridesEnv: databaseMode != null,
    },
  });
}

export async function PUT(req: Request) {
  const session = await getAdminSessionFromRequest(req);
  if (!session.authenticated || !session.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const modeRaw = typeof body?.mode === 'string' ? body.mode.trim().toLowerCase() : '';
    const confirm = typeof body?.confirm === 'string' ? body.confirm.trim() : '';

    if (modeRaw !== 'sandbox' && modeRaw !== 'live') {
      return NextResponse.json(
        { success: false, error: 'mode must be "sandbox" or "live"' },
        { status: 400 }
      );
    }
    const mode = modeRaw as PayPalApiMode;

    if (mode === 'live' && confirm !== 'LIVE') {
      return NextResponse.json(
        {
          success: false,
          error: 'To switch to Live, send confirm: "LIVE" (exact uppercase) to acknowledge production payments.',
        },
        { status: 400 }
      );
    }
    if (mode === 'sandbox' && confirm !== 'SANDBOX') {
      return NextResponse.json(
        {
          success: false,
          error: 'To switch to Sandbox, send confirm: "SANDBOX" (exact uppercase).',
        },
        { status: 400 }
      );
    }

    const previousEffective = await getEffectivePayPalApiMode();

    const db = await getDb();
    const now = new Date().toISOString();
    const existing = await db.select().from(appSettings).where(eq(appSettings.key, PAYPAL_MODE_DB_KEY)).get();
    if (existing) {
      await db
        .update(appSettings)
        .set({ value: mode, updatedAt: now })
        .where(eq(appSettings.key, PAYPAL_MODE_DB_KEY));
    } else {
      await db.insert(appSettings).values({
        key: PAYPAL_MODE_DB_KEY,
        value: mode,
        updatedAt: now,
      });
    }
    await saveDatabase();

    await writeAdminAuditLog({
      actorAdminId: session.userId,
      actorEmail: session.email,
      action: 'paypal_api_mode_update',
      detailsJson: JSON.stringify({ newMode: mode, previousEffective }),
    });

    const effectiveMode = await getEffectivePayPalApiMode();

    return NextResponse.json({
      success: true,
      data: {
        effectiveMode,
        databaseMode: mode,
      },
    });
  } catch (err: unknown) {
    console.error('[admin/paypal-mode]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 }
    );
  }
}
