import { NextResponse } from 'next/server';

const COOKIE_NAME = 'tae_admin_session';

function parseSessionFromCookie(req: Request): null | { email?: string; role?: string; isOwner?: boolean; userId?: string } {
  const cookieHeader = req.headers.get('cookie') || '';
  const tokenPair = cookieHeader
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE_NAME}=`));

  if (!tokenPair) return null;

  try {
    const token = decodeURIComponent(tokenPair.slice(COOKIE_NAME.length + 1));
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (!decoded?.exp || Date.now() > decoded.exp) return null;

    return {
      email: decoded.email || null,
      role: decoded.role || 'admin',
      isOwner: !!decoded.isOwner,
      userId: decoded.userId || null,
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const session = parseSessionFromCookie(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      userId: session.userId,
      email: session.email,
      role: session.role,
      isOwner: session.isOwner,
    },
  });
}
