import { NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin-auth';

export async function GET(req: Request) {
  const session = await getAdminSessionFromRequest(req);
  if (!session.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      userId: session.userId,
      email: session.email,
      role: session.role,
      isOwner: !!session.isOwner,
    },
  });
}
