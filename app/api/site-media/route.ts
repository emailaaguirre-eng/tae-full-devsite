/**
 * Public: Get all site media overrides
 * GET /api/site-media
 *
 * Returns { success, data: Array<{ key, url, alt }> }
 * No auth required — these are just public URL mappings.
 */
import { NextResponse } from "next/server";
import { getDb, siteMedia } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(siteMedia).all();
    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({ key: r.key, url: r.url, alt: r.alt })),
    });
  } catch (err: any) {
    console.error("[site-media] Error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Failed" }, { status: 500 });
  }
}
