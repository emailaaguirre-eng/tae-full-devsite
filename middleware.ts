import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to ensure /_next/* static assets are never blocked
 * 
 * This middleware explicitly allows all Next.js static assets and API routes
 * to pass through without any processing.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log in dev/preview only (remove in production if not needed)
  if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview') {
    console.log('[MW]', pathname);
  }

  // CRITICAL: Always allow Next.js static assets and internal routes
  // These must NEVER be processed by middleware
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/_next/webpack') ||
    pathname.startsWith('/_next/data') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$/i)
  ) {
    // Explicitly allow and pass through
    return NextResponse.next();
  }

  // For all other routes, continue normally
  return NextResponse.next();
}

/**
 * Matcher configuration
 * Excludes all Next.js internal paths, static assets, and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack (webpack chunks)
     * - _next/data (data routes)
     * - api (API routes)
     * - favicon.ico, robots.txt, sitemap.xml (static files)
     * - images, fonts (static directories)
     * - files with extensions (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|_next/webpack|_next/data|api|favicon.ico|robots.txt|sitemap.xml|images|fonts|.*\\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)).*)',
  ],
};

