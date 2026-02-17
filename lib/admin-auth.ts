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

export function validateAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@theartfulexperience.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'tae-admin-2026';
  return email === adminEmail && password === adminPassword;
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
