import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'tae_admin_session';

function isValidToken(token: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return decoded.email && decoded.exp && Date.now() < decoded.exp;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin page routes (except login)
  if (pathname.startsWith('/b_d_admn_tae') && !pathname.startsWith('/b_d_admn_tae/login')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token || !isValidToken(token)) {
      return NextResponse.redirect(new URL('/b_d_admn_tae/login', request.url));
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
  matcher: ['/b_d_admn_tae/:path*', '/api/admin/:path*'],
};
