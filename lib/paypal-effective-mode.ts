/**
 * PayPal REST + JS SDK configuration by environment (sandbox vs live).
 *
 * Mode resolution (precedence):
 * 1. SQLite AppSetting key `paypal_api_mode` → `sandbox` | `live`
 * 2. Else `process.env.PAYPAL_MODE`
 * 3. Default `sandbox`
 *
 * Credentials (per mode — required for that mode):
 * - Sandbox: PAYPAL_SANDBOX_CLIENT_ID, PAYPAL_SANDBOX_CLIENT_SECRET
 * - Live: PAYPAL_LIVE_CLIENT_ID, PAYPAL_LIVE_CLIENT_SECRET
 *
 * `publicClientId` is the same string as `clientId` (PayPal app client ID for REST and JS SDK).
 * Checkout loads client ID from GET /api/paypal/public-mode (runtime) so DB mode changes apply without rebuild.
 */

import { getDb, appSettings, eq } from '@/lib/db';

export const PAYPAL_MODE_DB_KEY = 'paypal_api_mode';

export type PayPalApiMode = 'sandbox' | 'live';

export type EffectivePayPalConfig = {
  mode: PayPalApiMode;
  apiBase: string;
  clientId: string;
  clientSecret: string;
  /** Same as clientId; exposed for the browser SDK. */
  publicClientId: string;
};

function trimEnv(key: string): string {
  const v = process.env[key];
  return typeof v === 'string' ? v.trim() : '';
}

export async function getPayPalModeFromDatabase(): Promise<PayPalApiMode | null> {
  const db = await getDb();
  const row = await db.select().from(appSettings).where(eq(appSettings.key, PAYPAL_MODE_DB_KEY)).get();
  if (!row?.value) return null;
  const v = row.value.trim().toLowerCase();
  if (v === 'live' || v === 'sandbox') return v;
  return null;
}

export function getPayPalModeFromEnv(): PayPalApiMode | null {
  const v = (process.env.PAYPAL_MODE || '').trim().toLowerCase();
  if (v === 'live') return 'live';
  if (v === 'sandbox') return 'sandbox';
  return null;
}

export async function getEffectivePayPalApiMode(): Promise<PayPalApiMode> {
  const fromDb = await getPayPalModeFromDatabase();
  if (fromDb) return fromDb;
  const fromEnv = getPayPalModeFromEnv();
  if (fromEnv) return fromEnv;
  return 'sandbox';
}

export function payPalApiBaseUrl(mode: PayPalApiMode): string {
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

/**
 * Full PayPal config for the effective mode. Throws if credentials for that mode are missing.
 */
export async function getEffectivePayPalConfig(): Promise<EffectivePayPalConfig> {
  const mode = await getEffectivePayPalApiMode();
  const apiBase = payPalApiBaseUrl(mode);
  const clientId =
    mode === 'live' ? trimEnv('PAYPAL_LIVE_CLIENT_ID') : trimEnv('PAYPAL_SANDBOX_CLIENT_ID');
  const clientSecret =
    mode === 'live'
      ? trimEnv('PAYPAL_LIVE_CLIENT_SECRET')
      : trimEnv('PAYPAL_SANDBOX_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    const need =
      mode === 'live'
        ? 'PAYPAL_LIVE_CLIENT_ID and PAYPAL_LIVE_CLIENT_SECRET'
        : 'PAYPAL_SANDBOX_CLIENT_ID and PAYPAL_SANDBOX_CLIENT_SECRET';
    throw new Error(`PayPal ${mode} credentials not configured: set ${need}`);
  }

  return {
    mode,
    apiBase,
    clientId,
    clientSecret,
    publicClientId: clientId,
  };
}

export async function getPayPalAccessToken(
  config: Pick<EffectivePayPalConfig, 'apiBase' | 'clientId' | 'clientSecret'>
): Promise<string> {
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const res = await fetch(`${config.apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${data.error_description || res.statusText}`);
  }
  return data.access_token;
}
