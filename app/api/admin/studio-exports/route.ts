import { NextRequest, NextResponse } from "next/server";
import { listStudioExports } from "@/lib/studio-exports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const shopProductId = req.nextUrl.searchParams.get("shopProductId") || undefined;
  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 20;

  const exportsList = listStudioExports(shopProductId, Number.isFinite(limit) ? limit : 20);
  return NextResponse.json({
    success: true,
    exports: exportsList.map((entry) => ({
      exportId: entry.exportId,
      shopProductId: entry.shopProductId,
      productName: entry.productName,
      placements: entry.placements,
      createdAt: entry.createdAt,
    })),
  });
}
