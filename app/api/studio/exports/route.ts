import { NextResponse } from "next/server";
import { createStudioExport } from "@/lib/studio-exports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      shopProductId,
      productSlug,
      productName,
      studioRenderSignature,
      designFiles,
    } = body || {};

    const record = createStudioExport({
      shopProductId: String(shopProductId || "").trim(),
      productSlug: productSlug || null,
      productName: productName || null,
      studioRenderSignature: studioRenderSignature || null,
      designFiles: Array.isArray(designFiles) ? designFiles : [],
    });

    return NextResponse.json({
      success: true,
      export: {
        exportId: record.exportId,
        placements: record.placements,
        createdAt: record.createdAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to register studio export" },
      { status: 400 }
    );
  }
}
