const base = process.env.WP_API_BASE;
const user = process.env.WP_APP_USER;
const pass = process.env.WP_APP_PASS;

function authHeader() {
  if (!user || !pass) return {};
  const token = Buffer.from(${user}:).toString('base64');
  return { Authorization: Basic  };
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
    throw new Error(WP fetch failed : );
  }
  return res.json();
}

export async function fetchArtKey(token: string) {
  // TODO: implement lookup by token (custom endpoint or meta query)
  return { token, data: null };
}

export async function saveArtKeyMeta(id: number, meta: Record<string, any>) {
  // meta keys should match WP registered meta: _artkey_token, _artkey_json, _artkey_qr_url, _artkey_print_url, etc.
  return wpFetch(/wp/v2/artkey/, {
    method: 'POST',
    body: JSON.stringify({ meta }),
  });
}

export async function uploadMedia(fileBuffer: Buffer, filename: string, mime: string) {
  if (!base) throw new Error('WP_API_BASE not set');
  if (!user || !pass) throw new Error('WP creds not set');
  const token = Buffer.from(${user}:).toString('base64');
  const res = await fetch(base.replace(/\/$/, '') + '/wp/v2/media', {
    method: 'POST',
    headers: {
      'Content-Disposition': ttachment; filename="",
      'Content-Type': mime,
      Authorization: Basic ,
    },
    body: fileBuffer,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(Media upload failed : );
  }
  return res.json();
}
