import { NextResponse } from 'next/server';
import {
  countActiveOwnerSuperusers,
  deleteAdminUserById,
  getAdminUserById,
  requireSuperuserSession,
  updateAdminUserById,
  writeAdminAuditLog,
} from '@/lib/admin-auth';

type RouteParams = { params: { id: string } };

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await requireSuperuserSession(req);
  if (!session.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isOwner) {
    return NextResponse.json(
      { success: false, error: 'An error has occured, please contact program administrator.' },
      { status: 403 }
    );
  }

  const target = await getAdminUserById(params.id);
  if (!target) {
    return NextResponse.json({ success: false, error: 'Admin user not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updates: {
      email?: string;
      password?: string;
      role?: 'superuser' | 'admin';
      isActive?: boolean;
      mustResetPassword?: boolean;
    } = {};

    if (typeof body?.email === 'string' && body.email.trim()) {
      updates.email = body.email.trim();
    }
    if (typeof body?.password === 'string' && body.password.trim()) {
      updates.password = body.password.trim();
    }
    if (body?.role === 'admin' || body?.role === 'superuser') {
      updates.role = body.role;
    }
    if (typeof body?.isActive === 'boolean') {
      updates.isActive = body.isActive;
    }
    if (typeof body?.mustResetPassword === 'boolean') {
      updates.mustResetPassword = body.mustResetPassword;
    }

    if (target.isOwner) {
      const changingRole = updates.role && updates.role !== 'superuser';
      const deactivating = updates.isActive === false;
      if (changingRole || deactivating) {
        const activeOwners = await countActiveOwnerSuperusers();
        if (activeOwners <= 1) {
          return NextResponse.json(
            { success: false, error: 'Cannot remove or deactivate the last active owner superuser' },
            { status: 400 }
          );
        }
      }
    }

    await updateAdminUserById(params.id, updates);
    await writeAdminAuditLog({
      actorAdminId: session.userId,
      actorEmail: session.email,
      action: 'admin_user_update',
      targetAdminId: target.id,
      targetEmail: target.email,
      detailsJson: JSON.stringify({
        changedEmail: !!updates.email,
        changedPassword: !!updates.password,
        role: updates.role || null,
        isActive: typeof updates.isActive === 'boolean' ? updates.isActive : null,
        mustResetPassword:
          typeof updates.mustResetPassword === 'boolean' ? updates.mustResetPassword : null,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update admin user' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await requireSuperuserSession(req);
  if (!session.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isOwner) {
    return NextResponse.json(
      { success: false, error: 'An error has occured, please contact program administrator.' },
      { status: 403 }
    );
  }

  const target = await getAdminUserById(params.id);
  if (!target) {
    return NextResponse.json({ success: false, error: 'Admin user not found' }, { status: 404 });
  }

  if (target.isOwner) {
    const activeOwners = await countActiveOwnerSuperusers();
    if (activeOwners <= 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the last active owner superuser' },
        { status: 400 }
      );
    }
  }

  await deleteAdminUserById(params.id);
  await writeAdminAuditLog({
    actorAdminId: session.userId,
    actorEmail: session.email,
    action: 'admin_user_delete',
    targetAdminId: target.id,
    targetEmail: target.email,
  });

  return NextResponse.json({ success: true });
}
