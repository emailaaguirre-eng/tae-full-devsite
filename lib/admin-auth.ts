import { cookies } from 'next/headers';

const COOKIE_NAME = 'tae_admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const ADMIN_USERNAME_KEY = 'ADMIN1_USERNAME';
const ADMIN_PASSWORD_KEY = 'ADMIN1_PASSWORD';
const LEGACY_ADMIN_USERNAME_KEY = 'ADMIN_USERNAME';
const LEGACY_ADMIN_PASSWORD_KEY = 'ADMIN_PASSWORD';

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
  const adminUser = (
    process.env[ADMIN_USERNAME_KEY] ||
    process.env[LEGACY_ADMIN_USERNAME_KEY] ||
    ''
  ).trim();
  const adminPass = (
    process.env[ADMIN_PASSWORD_KEY] ||
    process.env[LEGACY_ADMIN_PASSWORD_KEY] ||
    ''
  ).trim();
  if (!adminUser || !adminPass) return false;

  const adminUserLower = adminUser.toLowerCase();
  const inputLocal = normalizedUsernameLower.split("@")[0];
  const adminLocal = adminUserLower.split("@")[0];

  return (
    normalizedPassword === adminPass &&
    (
      normalizedUsername === adminUser ||
      normalizedUsernameLower === adminUserLower ||
      inputLocal === adminLocal
    )
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
