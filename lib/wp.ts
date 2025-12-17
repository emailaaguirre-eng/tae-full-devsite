const base = process.env.WP_API_BASE;
const user = process.env.WP_APP_USER;
const pass = process.env.WP_APP_PASS;

function authHeader() {
  if (!user || !pass) return {};
  const token = Buffer.from(`${user}:${pass}`).toString('base64');
  return { Authorization: `Basic ${token}` };
}

async function wpFetch(path: string, options: RequestInit = {}) {
  if (!base) throw new Error('WP_API_BASE not set');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...authHeader(),
  } as Record<string, string>;
  const res = await fetch(base.replace(/\/$/, '') + path, { ...options, headers });
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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL || 
                   'http://localhost:3000';
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
  if (!base) throw new Error('WP_API_BASE not set');
  if (!user || !pass) throw new Error('WP creds not set');
  const token = Buffer.from(`${user}:${pass}`).toString('base64');
  const res = await fetch(base.replace(/\/$/, '') + '/wp/v2/media', {
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
