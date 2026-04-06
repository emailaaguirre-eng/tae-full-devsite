import { NextResponse } from "next/server";
import { getDb, listingMediaAssignments, eq } from "@/lib/db";
import { saveDatabase } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    const assignment = await db
      .select()
      .from(listingMediaAssignments)
      .where(eq(listingMediaAssignments.id, id))
      .get();

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assignment,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const body = await req.json();

    const existing = await db
      .select()
      .from(listingMediaAssignments)
      .where(eq(listingMediaAssignments.id, id))
      .get();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 }
      );
    }

    const updates: Record<string, any> = {};

    if (body.enabled !== undefined) {
      updates.enabled = !!body.enabled;
    }

    if (body.priceOverride !== undefined) {
      if (body.priceOverride === null || body.priceOverride === "") {
        updates.priceOverride = null;
      } else {
        const n = Number(body.priceOverride);
        if (!Number.isFinite(n)) {
          return NextResponse.json(
            { success: false, error: "priceOverride must be a valid number or null" },
            { status: 400 }
          );
        }
        updates.priceOverride = n;
      }
    }

    if (body.proofTermsOverride !== undefined) {
      const value = String(body.proofTermsOverride ?? "").trim();
      updates.proofTermsOverride = value || null;
    }

    if (body.requiresQrCode !== undefined) {
      updates.requiresQrCode =
        body.requiresQrCode === null ? null : !!body.requiresQrCode;
    }

    if (body.customizable !== undefined) {
      updates.customizable =
        body.customizable === null ? null : !!body.customizable;
    }

    updates.updatedAt = Date.now().toString();

    await db
      .update(listingMediaAssignments)
      .set(updates)
      .where(eq(listingMediaAssignments.id, id));

    await saveDatabase();

    return NextResponse.json({
      success: true,
      data: {
        id,
        ...updates,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update assignment" },
      { status: 500 }
    );
  }
}
