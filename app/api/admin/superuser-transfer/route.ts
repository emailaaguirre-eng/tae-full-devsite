import { NextResponse } from 'next/server';
import {
  createTransferRequest,
  getAdminUserById,
  listPendingTransferRequests,
  requireSuperuserSession,
  writeAdminAuditLog,
} from '@/lib/admin-auth';

export async function GET(req: Request) {
  const session = await requireSuperuserSession(req);
  if (!session.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isOwner) {
    return NextResponse.json({ success: false, error: 'Owner superuser required' }, { status: 403 });
  }

  const pending = await listPendingTransferRequests();
  return NextResponse.json({ success: true, data: pending });
}

export async function POST(req: Request) {
  const session = await requireSuperuserSession(req);
  if (!session.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isOwner) {
    return NextResponse.json({ success: false, error: 'Owner superuser required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const targetAdminId = String(body?.targetAdminId || '').trim();
    if (!targetAdminId) {
      return NextResponse.json(
        { success: false, error: 'targetAdminId is required' },
        { status: 400 }
      );
    }

    const target = await getAdminUserById(targetAdminId);
    if (!target) {
      return NextResponse.json({ success: false, error: 'Target admin not found' }, { status: 404 });
    }
    if (!target.isActive) {
      return NextResponse.json({ success: false, error: 'Target admin must be active' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const transferId = await createTransferRequest({
      targetAdminId: target.id,
      initiatedByAdminId: session.userId!,
      expiresAt,
    });

    await writeAdminAuditLog({
      actorAdminId: session.userId,
      actorEmail: session.email,
      action: 'superuser_transfer_initiated',
      targetAdminId: target.id,
      targetEmail: target.email,
      detailsJson: JSON.stringify({ transferId, expiresAt }),
    });

    return NextResponse.json({ success: true, data: { transferId, expiresAt } });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to initiate transfer' },
      { status: 500 }
    );
  }
}
