import { cookies } from 'next/headers';

const COOKIE_NAME = 'tae_admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function createAdminToken(email: string): string {
  const payload = {
    email,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function validateAdminToken(token: string): { valid: boolean; email?: string } {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (!decoded.email || !decoded.exp) return { valid: false };
    if (Date.now() > decoded.exp) return { valid: false };
    return { valid: true, email: decoded.email };
  } catch {
    return { valid: false };
  }
}

export function validateAdminCredentials(username: string, password: string): boolean {
  const normalizedUsername = username.trim();
  const normalizedUsernameLower = normalizedUsername.toLowerCase();
  const normalizedPassword = password.trim();

  // Temporary local fallback for demo testing when env loading is inconsistent.
  if (
    normalizedPassword === 'tae-admin-2026' &&
    (normalizedUsernameLower === 'admin' || normalizedUsernameLower === 'admin@theartfulexperience.com')
  ) {
    return true;
  }

  const admins = [
    { user: process.env.ADMIN1_USERNAME, pass: process.env.ADMIN1_PASSWORD },
    { user: process.env.ADMIN2_USERNAME, pass: process.env.ADMIN2_PASSWORD },
    { user: process.env.ADMIN3_USERNAME, pass: process.env.ADMIN3_PASSWORD },
    { user: process.env.ADMIN4_USERNAME, pass: process.env.ADMIN4_PASSWORD },
  ];

  // Support single-admin variables used in older/local setups.
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    admins.push({ user: process.env.ADMIN_USERNAME, pass: process.env.ADMIN_PASSWORD });
  }

  // Support ADMIN_USERS as JSON array or comma-separated pairs (user:pass,user2:pass2).
  const adminUsersRaw = process.env.ADMIN_USERS;
  if (adminUsersRaw) {
    try {
      const parsed = JSON.parse(adminUsersRaw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === 'object') {
            const user = typeof item.username === 'string' ? item.username : undefined;
            const pass = typeof item.password === 'string' ? item.password : undefined;
            if (user && pass) admins.push({ user, pass });
          }
        }
      }
    } catch {
      // Not JSON; attempt comma-separated format.
      for (const pair of adminUsersRaw.split(',')) {
        const idx = pair.indexOf(':');
        if (idx <= 0) continue;
        const user = pair.slice(0, idx).trim();
        const pass = pair.slice(idx + 1);
        if (user && pass) admins.push({ user, pass });
      }
    }
  }

  for (const admin of admins) {
    if (admin.user && admin.pass) {
      const adminUser = admin.user.trim();
      const adminUserLower = adminUser.toLowerCase();
      const adminPass = admin.pass.trim();
      const inputLocal = normalizedUsernameLower.split("@")[0];
      const adminLocal = adminUserLower.split("@")[0];

      if (
        normalizedPassword === adminPass &&
        (normalizedUsername === adminUser ||
          normalizedUsernameLower === adminUserLower ||
          inputLocal === adminLocal)
      ) {
        return true;
      }
    }
  }

  // Fallback defaults if no env vars are set
  const fallbackUser = process.env.ADMIN_EMAIL || process.env.ADMIN_USERNAME || 'admin@theartfulexperience.com';
  const fallbackPass = process.env.ADMIN_PASSWORD || 'tae-admin-2026';
  const fallbackUserLower = fallbackUser.trim().toLowerCase();
  const inputLocal = normalizedUsernameLower.split("@")[0];
  const fallbackLocal = fallbackUserLower.split("@")[0];
  return (
    normalizedPassword === fallbackPass.trim() &&
    (normalizedUsernameLower === fallbackUserLower || inputLocal === fallbackLocal)
  );
}

export async function getAdminSession(): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return { authenticated: false };
    const result = validateAdminToken(token);
    return { authenticated: result.valid, email: result.email };
  } catch {
    return { authenticated: false };
  }
}

export { COOKIE_NAME };
