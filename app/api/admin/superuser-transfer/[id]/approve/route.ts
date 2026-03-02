import { NextResponse } from 'next/server';
import {
  approveTransferRequest,
  getAdminUserById,
  getTransferRequestById,
  requireSuperuserSession,
  updateAdminUserById,
  writeAdminAuditLog,
} from '@/lib/admin-auth';

type RouteParams = { params: { id: string } };

export async function POST(req: Request, { params }: RouteParams) {
  const session = await requireSuperuserSession(req);
  if (!session.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isOwner) {
    return NextResponse.json({ success: false, error: 'Owner superuser required' }, { status: 403 });
  }

  const transfer = await getTransferRequestById(params.id);
  if (!transfer) {
    return NextResponse.json({ success: false, error: 'Transfer request not found' }, { status: 404 });
  }
  if (transfer.status !== 'pending') {
    return NextResponse.json({ success: false, error: 'Transfer request is not pending' }, { status: 400 });
  }
  if (new Date(transfer.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ success: false, error: 'Transfer request has expired' }, { status: 400 });
  }
  if (transfer.initiatedByAdminId === session.userId) {
    return NextResponse.json(
      { success: false, error: 'A different owner must approve this transfer' },
      { status: 400 }
    );
  }

  const target = await getAdminUserById(transfer.targetAdminId);
  if (!target) {
    return NextResponse.json({ success: false, error: 'Target admin not found' }, { status: 404 });
  }

  await updateAdminUserById(target.id, { role: 'superuser', isActive: true, mustResetPassword: false });
  await approveTransferRequest({ transferId: transfer.id, approvedByAdminId: session.userId! });

  await writeAdminAuditLog({
    actorAdminId: session.userId,
    actorEmail: session.email,
    action: 'superuser_transfer_approved',
    targetAdminId: target.id,
    targetEmail: target.email,
    detailsJson: JSON.stringify({ transferId: transfer.id }),
  });

  return NextResponse.json({
    success: true,
    data: {
      transferId: transfer.id,
      targetAdminId: target.id,
      targetEmail: target.email,
      role: 'superuser',
    },
  });
}
