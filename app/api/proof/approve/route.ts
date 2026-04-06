/**
 * POST /api/proof/approve
 * Marks a checkout proof snapshot as customer-approved (server is source of truth).
 * Body: { proofSnapshotId: string, customerEmail: string }
 */
import { NextResponse } from "next/server";
import { eq, getDb, checkoutProofSnapshots } from "@/lib/db";
import { saveDatabase } from "@/db";
import { enforceRequestRateLimit } from "@/lib/request-rate-limit";
import { normalizeCheckoutEmail } from "@/lib/checkout-proof-email";

export async function POST(req: Request) {
  try {
    const rate = enforceRequestRateLimit(req, {
      keyPrefix: "proof-approve",
      windowMs: 5 * 60_000,
      maxRequests: 40,
    });
    if (!rate.ok) return rate.response;

    const body = await req.json();
    const proofSnapshotId =
      typeof body?.proofSnapshotId === "string" ? body.proofSnapshotId.trim() : "";
    const emailNorm = normalizeCheckoutEmail(body?.customerEmail);

    if (!proofSnapshotId) {
      return NextResponse.json(
        { success: false, error: "proofSnapshotId is required" },
        { status: 400 }
      );
    }
    if (!emailNorm) {
      return NextResponse.json(
        { success: false, error: "customerEmail is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const rows = await db
      .select()
      .from(checkoutProofSnapshots)
      .where(eq(checkoutProofSnapshots.id, proofSnapshotId))
      .limit(1)
      .all();
    const snap = rows[0];
    if (!snap) {
      return NextResponse.json(
        { success: false, error: "Proof snapshot not found" },
        { status: 404 }
      );
    }

    if (snap.customerEmail && snap.customerEmail !== emailNorm) {
      return NextResponse.json(
        { success: false, error: "Email does not match this proof" },
        { status: 403 }
      );
    }
    if (!snap.customerEmail) {
      return NextResponse.json(
        { success: false, error: "This proof cannot be approved (missing email binding)" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    if (snap.approvedAt) {
      await saveDatabase();
      return NextResponse.json({
        success: true,
        proofSnapshotId,
        approvedAt: snap.approvedAt,
        alreadyApproved: true,
      });
    }

    await db
      .update(checkoutProofSnapshots)
      .set({ approvedAt: now })
      .where(eq(checkoutProofSnapshots.id, proofSnapshotId));
    await saveDatabase();

    return NextResponse.json({
      success: true,
      proofSnapshotId,
      approvedAt: now,
    });
  } catch (err: unknown) {
    console.error("[proof/approve]", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Approval failed" },
      { status: 500 }
    );
  }
}
