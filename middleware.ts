import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ARTKEY_ADMIN_DASHBOARD_PATH, ARTKEY_ADMIN_LOGIN_PATH } from '@/lib/routes';

const COOKIE_NAME = 'tae_admin_session';
const ARTKEY_SUBDOMAIN = 'artkey';
const STATIC_EXTENSION_REGEX =
  /\.(?:avif|bmp|css|csv|eot|gif|ico|jpeg|jpg|js|json|m4a|m4v|map|mov|mp3|mp4|oga|ogg|ogv|otf|pdf|png|svg|txt|wav|webm|webp|woff|woff2|xml)$/i;
const TOKEN_PATH_REGEX = /^\/([A-Za-z0-9]{32})(\/edit)?\/?$/;
const DASHBOARD_GUARD_PREFIXES = ['/dashboard', '/admin', '/art-key/dashboard', '/art-key/admin', '/b_d_admn_tae'];

function isValidToken(token: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return decoded.email && decoded.exp && Date.now() < decoded.exp;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const isDashboardGuardPath = DASHBOARD_GUARD_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isStaticBypass =
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    STATIC_EXTENSION_REGEX.test(pathname);

  if (isStaticBypass || isDashboardGuardPath) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MW] bypass', { hostname, pathname, reason: isStaticBypass ? 'static-or-upload' : 'dashboard-admin' });
    }
    return NextResponse.next();
  }

  // Handle artkey subdomain: artkey.theartfulexperience.com/{token} -> /art-key/{token}
  const isArtKeySubdomain = hostname.startsWith(`${ARTKEY_SUBDOMAIN}.`);
  if (isArtKeySubdomain) {
    // Root of artkey subdomain -> ArtKey Host Login
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone();
      url.pathname = '/art-key';
      if (process.env.NODE_ENV !== 'production') {
        console.log('[MW] rewrite', { hostname, pathname, to: url.pathname, reason: 'artkey-root' });
      }
      return NextResponse.rewrite(url);
    }

    // Token-only rewrites for guest URLs:
    // /<32-char-token> -> /art-key/<token>
    // /<32-char-token>/edit -> /art-key/<token>/edit
    const tokenMatch = pathname.match(TOKEN_PATH_REGEX);
    if (tokenMatch) {
      const [, token, editSuffix] = tokenMatch;
      const url = request.nextUrl.clone();
      url.pathname = editSuffix ? `/art-key/${token}/edit` : `/art-key/${token}`;
      if (process.env.NODE_ENV !== 'production') {
        console.log('[MW] rewrite', { hostname, pathname, to: url.pathname, reason: 'token-only' });
      }
      return NextResponse.rewrite(url);
    }

    if (process.env.NODE_ENV !== 'production' && (
      pathname === '/dashboard' ||
      pathname === ARTKEY_ADMIN_DASHBOARD_PATH ||
      pathname === '/art-key/dashboard' ||
      pathname === '/admin'
    )) {
      console.log('[MW] pass-through', { hostname, pathname, reason: 'non-token-subdomain-path' });
    }
  }

  // Admin page routes (except login)
  if (pathname.startsWith('/b_d_admn_tae') && !pathname.startsWith(ARTKEY_ADMIN_LOGIN_PATH)) {
    // Dev-only bypass to unblock local QA if browser cookie write is restricted.
    if (process.env.NODE_ENV !== 'production' && searchParams.get('dev_admin_bypass') === '1') {
      const token = Buffer.from(
        JSON.stringify({
          email: 'dev-admin@local',
          iat: Date.now(),
          exp: Date.now() + 24 * 60 * 60 * 1000,
        })
      ).toString('base64');
      const url = request.nextUrl.clone();
      url.searchParams.delete('dev_admin_bypass');
      const res = NextResponse.redirect(url);
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });
      return res;
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token || !isValidToken(token)) {
      return NextResponse.redirect(new URL(ARTKEY_ADMIN_LOGIN_PATH, request.url));
    }
  }

  // Admin API routes (except login)
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token || !isValidToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!uploads/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
