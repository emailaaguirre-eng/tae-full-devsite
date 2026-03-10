import { NextResponse } from 'next/server';
import {
  getAdminSessionFromRequest,
  getAdminUserById,
  updateAdminUserById,
  writeAdminAuditLog,
} from '@/lib/admin-auth';

export async function GET(req: Request) {
  const session = await getAdminSessionFromRequest(req);
  if (!session.authenticated || !session.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getAdminUserById(session.userId);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Admin user not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      isOwner: !!user.isOwner,
      isActive: !!user.isActive,
      mustResetPassword: !!user.mustResetPassword,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await getAdminSessionFromRequest(req);
  if (!session.authenticated || !session.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getAdminUserById(session.userId);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Admin user not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updates: {
      username?: string;
      email?: string;
      firstName?: string | null;
      lastName?: string | null;
      password?: string;
      mustResetPassword?: boolean;
    } = {};

    if (typeof body?.username === 'string' && body.username.trim()) {
      updates.username = body.username.trim();
    }
    if (typeof body?.email === 'string' && body.email.trim()) {
      updates.email = body.email.trim();
    }
    if (typeof body?.firstName === 'string') {
      updates.firstName = body.firstName.trim() || null;
    }
    if (typeof body?.lastName === 'string') {
      updates.lastName = body.lastName.trim() || null;
    }
    if (typeof body?.password === 'string' && body.password.trim()) {
      updates.password = body.password.trim();
      updates.mustResetPassword = false;
    }

    await updateAdminUserById(session.userId, updates);

    await writeAdminAuditLog({
      actorAdminId: session.userId,
      actorEmail: session.email,
      action: 'admin_self_update',
      targetAdminId: user.id,
      targetEmail: user.email,
      detailsJson: JSON.stringify({
        changedUsername: !!updates.username,
        changedEmail: !!updates.email,
        changedFirstName: typeof updates.firstName !== 'undefined',
        changedLastName: typeof updates.lastName !== 'undefined',
        changedPassword: !!updates.password,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update admin profile' },
      { status: 500 }
    );
  }
}
