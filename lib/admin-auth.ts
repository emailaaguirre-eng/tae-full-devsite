// Admin authentication utilities

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_token', token);
}

export function removeAdminToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_token');
}

export function isAdminAuthenticated(): boolean {
  return getAdminToken() !== null;
}

// Server-side token validation (simplified - in production use proper JWT validation)
export async function validateAdminToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  // In production, validate token against database or JWT secret
  // For now, just check if token exists and is valid format
  return token.length === 64; // Simple check for hex token format
}
