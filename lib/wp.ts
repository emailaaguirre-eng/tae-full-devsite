const rawBase =
  process.env.WP_API_BASE ||
  process.env.NEXT_PUBLIC_WORDPRESS_URL ||
  process.env.NEXT_PUBLIC_WOOCOMMERCE_URL ||
  process.env.NEXT_WORDPRESS_URL;
const user = process.env.WP_APP_USER;
const pass = process.env.WP_APP_PASS;

function normalizeWpSiteBase(input: string) {
  const trimmed = input.trim().replace(/\/$/, '');
  // Accept either:
  // - https://example.com
  // - https://example.com/wp-json
  // - https://example.com/wp-json/wp/v2
  const idx = trimmed.indexOf('/wp-json');
  return idx >= 0 ? trimmed.slice(0, idx) : trimmed;
}

export function getWpSiteBase() {
  if (!rawBase) {
    throw new Error(
      'WordPress URL not configured. Set WP_API_BASE, NEXT_PUBLIC_WORDPRESS_URL, or NEXT_WORDPRESS_URL (e.g., https://theartfulexperience.com)'
    );
  }
  return normalizeWpSiteBase(rawBase);
}

export function getWpApiBase() {
  // Always returns ".../wp-json"
  return getWpSiteBase().replace(/\/$/, '') + '/wp-json';
}

export function getAppBaseUrl() {
  // VERCEL_URL is typically like "my-app.vercel.app" (no protocol)
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    'http://localhost:3000';
  return site.replace(/\/$/, '');
}

function authHeader() {
  if (!user || !pass) return {};
  // WordPress application passwords are often displayed with spaces; strip them if present.
  const cleanPass = pass.replace(/\s+/g, '');
  const token = Buffer.from(`${user}:${cleanPass}`).toString('base64');
  return { Authorization: `Basic ${token}` };
}

async function wpFetch(path: string, options: RequestInit = {}) {
  const apiBase = getWpApiBase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...authHeader(),
  } as Record<string, string>;
  const res = await fetch(apiBase.replace(/\/$/, '') + path, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WP fetch failed: ${text}`);
  }
  return res.json();
}

export async function fetchArtKey(token: string) {
  // Fetch from WordPress REST API via Next.js API route
  try {
    // Use absolute URL for server-side calls
    const baseUrl = getAppBaseUrl();
    const res = await fetch(`${baseUrl}/api/artkey/${token}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch ArtKey', e);
    return null;
  }
}

export async function saveArtKeyMeta(id: number, meta: Record<string, any>) {
  // meta keys should match WP registered meta: _artkey_token, _artkey_json, _artkey_qr_url, _artkey_print_url, etc.
  return wpFetch(`/wp/v2/artkey/${id}`, {
    method: 'POST',
    body: JSON.stringify({ meta }),
  });
}

export async function uploadMedia(fileBuffer: Buffer, filename: string, mime: string) {
  const apiBase = getWpApiBase();
  if (!user || !pass) throw new Error('WP creds not set');
  const cleanPass = pass.replace(/\s+/g, '');
  const token = Buffer.from(`${user}:${cleanPass}`).toString('base64');
  const res = await fetch(apiBase.replace(/\/$/, '') + '/wp/v2/media', {
    method: 'POST',
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': mime,
      Authorization: `Basic ${token}`,
    },
    body: fileBuffer,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Media upload failed: ${text}`);
  }
  return res.json();
}
