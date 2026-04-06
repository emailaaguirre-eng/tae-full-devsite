/**
 * GET /api/proof/snapshot/[id]
 * Returns customer-facing proof display + portal meta (no production files).
 */
import { NextResponse } from "next/server";
import { eq, getDb, checkoutProofSnapshots } from "@/lib/db";
import { enforceRequestRateLimit } from "@/lib/request-rate-limit";

type ProofSnapshotMeta = {
  portalToken?: string;
  ownerToken?: string;
  portalUrl?: string;
  editUrl?: string;
  reusedPortal?: boolean;
  qrCodeDataUrl?: string;
};

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rate = enforceRequestRateLimit(req, {
      keyPrefix: "proof-snapshot-get",
      windowMs: 5 * 60_000,
      maxRequests: 60,
    });
    if (!rate.ok) return rate.response;

    const { id: rawId } = await context.params;
    const id = String(rawId || "").trim();
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    const db = await getDb();
    const rows = await db
      .select()
      .from(checkoutProofSnapshots)
      .where(eq(checkoutProofSnapshots.id, id))
      .limit(1)
      .all();
    const snap = rows[0];
    if (!snap) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    let displayProofFiles: unknown;
    try {
      displayProofFiles = JSON.parse(snap.displayProofFilesJson);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid snapshot" }, { status: 500 });
    }

    let meta: ProofSnapshotMeta = {};
    try {
      meta = JSON.parse(snap.metaJson || "{}") as ProofSnapshotMeta;
    } catch {
      meta = {};
    }

    return NextResponse.json({
      success: true,
      proofSnapshotId: snap.id,
      cartItemId: snap.cartItemId,
      displayProofFiles,
      portalToken: meta.portalToken ?? snap.publicToken ?? null,
      ownerToken: meta.ownerToken ?? null,
      portalUrl: meta.portalUrl ?? null,
      editUrl: meta.editUrl ?? null,
      reusedPortal: meta.reusedPortal,
      qrCodeDataUrl: meta.qrCodeDataUrl ?? null,
      approved: !!snap.approvedAt,
    });
  } catch (err: unknown) {
    console.error("[proof/snapshot]", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load snapshot" },
      { status: 500 }
    );
  }
}
