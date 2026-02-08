/**
 * Admin authentication utilities
 * Client-side: localStorage token management
 * Server-side: in-memory token store with TTL
 */

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// Client-side helpers (run in browser only)
// =============================================================================

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

// =============================================================================
// Server-side token store (in-memory with TTL)
// =============================================================================

interface StoredToken {
  username: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory map of token -> metadata
// Tokens expire after 24 hours by default
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Use globalThis to survive Next.js HMR (hot module replacement) in dev mode.
// Without this, every file change wipes the Map and invalidates all tokens.
const globalForTokens = globalThis as unknown as {
  __adminTokenStore?: Map<string, StoredToken>;
};
const tokenStore =
  globalForTokens.__adminTokenStore ?? new Map<string, StoredToken>();
if (process.env.NODE_ENV !== 'production') {
  globalForTokens.__adminTokenStore = tokenStore;
}

/**
 * Store a token server-side after successful login
 */
export function storeAdminToken(token: string, username: string): void {
  const now = Date.now();
  tokenStore.set(token, {
    username,
    createdAt: now,
    expiresAt: now + TOKEN_TTL_MS,
  });

  // Cleanup expired tokens on every store operation (lightweight)
  cleanupExpiredTokens();
}

/**
 * Validate a token server-side
 * Returns the username if valid, null if invalid/expired
 */
export function validateAdminTokenServer(token: string | null): string | null {
  if (!token) return null;

  const stored = tokenStore.get(token);
  if (!stored) return null;

  // Check expiry
  if (Date.now() > stored.expiresAt) {
    tokenStore.delete(token);
    return null;
  }

  return stored.username;
}

/**
 * Revoke a token (logout)
 */
export function revokeAdminToken(token: string): void {
  tokenStore.delete(token);
}

/**
 * Remove all expired tokens from the store
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (now > data.expiresAt) {
      tokenStore.delete(token);
    }
  }
}

// =============================================================================
// Route protection helper
// =============================================================================

/**
 * Extract Bearer token from request headers
 */
function extractBearerToken(request: NextRequest | Request): string | null {
  const authHeader = (request as NextRequest).headers?.get('authorization')
    || (request as any).headers?.get?.('authorization');

  if (!authHeader) return null;

  // Support "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Also support raw token (for backwards compatibility)
  return authHeader;
}

/**
 * Verify admin authentication on an API route.
 * Returns null if authenticated, or a 401 NextResponse if not.
 *
 * Usage in a route handler:
 *   const authError = requireAdmin(request);
 *   if (authError) return authError;
 */
export function requireAdmin(request: NextRequest | Request): NextResponse | null {
  const token = extractBearerToken(request);

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required. Provide a Bearer token in the Authorization header.' },
      { status: 401 }
    );
  }

  const username = validateAdminTokenServer(token);
  if (!username) {
    return NextResponse.json(
      { error: 'Invalid or expired token. Please log in again.' },
      { status: 401 }
    );
  }

  // Token is valid — allow request to proceed
  return null;
}
