import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'tae_admin_session';
const ARTKEY_SUBDOMAIN = 'artkey';
const PORTAL_X_ROBOTS = 'noindex, nofollow, noarchive, nosnippet, noimageindex';

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
  const isPortalPath = pathname === '/art-key' || pathname.startsWith('/art-key/');

  const withPortalRobots = (response: NextResponse) => {
    if (isPortalPath || hostname.startsWith(`${ARTKEY_SUBDOMAIN}.`)) {
      response.headers.set('X-Robots-Tag', PORTAL_X_ROBOTS);
    }
    return response;
  };

  // Handle artkey subdomain: artkey.theartfulexperience.com/{token} -> /art-key/{token}
  const isArtKeySubdomain = hostname.startsWith(`${ARTKEY_SUBDOMAIN}.`);
  if (isArtKeySubdomain) {
    // Root of artkey subdomain -> ArtKey Host Login
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone();
      url.pathname = '/art-key';
      return withPortalRobots(NextResponse.rewrite(url));
    }
    // artkey.domain.com/{token} -> /art-key/{token}
    // artkey.domain.com/{token}/edit -> /art-key/{token}/edit
    if (!pathname.startsWith('/art-key') && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/') && !pathname.startsWith('/favicon') && !pathname.startsWith('/manifest')) {
      const url = request.nextUrl.clone();
      url.pathname = `/art-key${pathname}`;
      return withPortalRobots(NextResponse.rewrite(url));
    }
  }

  // Admin page routes (except login)
  if (pathname.startsWith('/b_d_admn_tae') && !pathname.startsWith('/b_d_admn_tae/login')) {
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
      return withPortalRobots(NextResponse.redirect(new URL('/b_d_admn_tae/login', request.url)));
    }
  }

  // Admin API routes (except login)
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token || !isValidToken(token)) {
      return withPortalRobots(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }
  }

  return withPortalRobots(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
