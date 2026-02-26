/**
 * Admin: Generate Mockup from Design
 * POST /api/admin/mockups/generate
 *
 * Accepts a studio export reference, uploads the matching placement file,
 * creates a mockup generation task, and stores the result.
 *
 * Body: {
 *   shopProductId: string,
 *   studioExportId: string,    // server-registered studio export id
 *   placement?: string,        // default "default"
 * }
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, productMockups, eq } from "@/lib/db";
import { saveDatabase } from "@/db";
import { generateId } from "@/lib/db";
import { getStudioExportById } from "@/lib/studio-exports";
import {
  uploadFileByUrl,
  createMockupTask,
  getMockupTaskResult,
} from "@/lib/printful";

export const dynamic = "force-dynamic";

const DEBUG = process.env.DEBUG_MOCKUPS === "true";
const MAX_POLLS = 20;
const POLL_INTERVAL_MS = 3000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      shopProductId,
      studioExportId,
      placement = "default",
    } = body;

    if (!shopProductId || !studioExportId) {
      return NextResponse.json(
        { success: false, error: "shopProductId and studioExportId are required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const [product] = await db
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.id, shopProductId))
      .limit(1)
      .all();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    if (!product.printfulProductId) {
      return NextResponse.json(
        { success: false, error: "Product has no Printful product mapping" },
        { status: 400 }
      );
    }

    let variantId = product.printfulVariantId || null;
    if (!variantId && product.printfulDataJson) {
      try {
        const parsed = JSON.parse(product.printfulDataJson);
        const siblingId = parsed?.siblingVariants?.[0]?.id;
        if (typeof siblingId === "number") {
          variantId = siblingId;
        }
      } catch {
        // Keep null and fail below with actionable message.
      }
    }

    if (!variantId) {
      return NextResponse.json(
        { success: false, error: "Product has no Printful variant mapping" },
        { status: 400 }
      );
    }

    const normalizedPlacement = placement === "front" ? "default" : placement;
    const exportRecord = getStudioExportById(String(studioExportId));
    if (!exportRecord || exportRecord.source !== "studio") {
      return NextResponse.json(
        { success: false, error: "Invalid studio export source" },
        { status: 400 }
      );
    }
    if (exportRecord.shopProductId !== shopProductId) {
      return NextResponse.json(
        { success: false, error: "Studio export does not belong to this product" },
        { status: 400 }
      );
    }
    const exportFile = exportRecord.files.find((f) => f.placement === normalizedPlacement);
    if (!exportFile) {
      return NextResponse.json(
        {
          success: false,
          error: `Placement "${normalizedPlacement}" not found in studio export`,
          placements: exportRecord.placements,
        },
        { status: 400 }
      );
    }
    const origin =
      req.headers.get("origin") ||
      (() => {
        const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
        if (!host) return null;
        const proto = req.headers.get("x-forwarded-proto") || "https";
        return `${proto}://${host}`;
      })();
    if (!origin) {
      return NextResponse.json(
        { success: false, error: "Request origin missing for studio export URL resolution" },
        { status: 400 }
      );
    }
    const designFileUrl = `${origin}${exportFile.relativeUrl}`;
    const designDraftId = exportRecord.exportId;

    // Check cache: reuse existing mockup if (product + designDraft + placement) match
    if (designDraftId) {
      const existing = await db
        .select()
        .from(productMockups)
        .where(eq(productMockups.shopProductId, shopProductId))
        .all();

      const cached = existing.find(
        (m) =>
          m.designDraftId === designDraftId &&
          m.placement === normalizedPlacement &&
          m.status === "completed"
      );

      if (cached) {
        if (DEBUG) console.log("[mockup-generate] Cache hit:", cached.id);
        return NextResponse.json({
          success: true,
          cached: true,
          mockup: {
            id: cached.id,
            mockupUrl: cached.mockupUrl,
            placement: cached.placement,
            status: cached.status,
          },
        });
      }
    }

    // Upload design to Printful
    if (DEBUG) console.log("[mockup-generate] Uploading design file");
    const uploaded = await uploadFileByUrl(designFileUrl, `design-${shopProductId}.png`);

    // Create mockup task
    if (DEBUG) console.log("[mockup-generate] Creating mockup task");
    const task = await createMockupTask(product.printfulProductId, {
      variant_ids: [variantId],
      // Use Printful placement names ("default", "inside", "back"...)
      format: "jpg",
      files: [
        {
          placement: normalizedPlacement,
          image_url: uploaded.url,
        },
      ],
    });

    if (DEBUG) console.log("[mockup-generate] Task created:", task.task_key);

    // Poll for completion
    let result: any = null;
    for (let i = 0; i < MAX_POLLS; i++) {
      await sleep(POLL_INTERVAL_MS);
      const taskResult = await getMockupTaskResult(task.task_key);

      if (taskResult.status === "completed") {
        result = taskResult;
        break;
      }
      if (taskResult.status === "error") {
        return NextResponse.json(
          { success: false, error: taskResult.error || "Mockup generation failed" },
          { status: 500 }
        );
      }
      if (DEBUG) console.log(`[mockup-generate] Poll ${i + 1}: ${taskResult.status}`);
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Mockup generation timed out" },
        { status: 504 }
      );
    }

    // Store mockup
    const mockup = result.mockups?.[0];
    if (!mockup) {
      return NextResponse.json(
        { success: false, error: "No mockup returned" },
        { status: 500 }
      );
    }

    const mockupId = generateId();
    const now = new Date().toISOString();

    await db.insert(productMockups).values({
      id: mockupId,
      shopProductId,
      designDraftId: designDraftId || null,
      placement: mockup.placement || normalizedPlacement,
      mockupUrl: mockup.mockup_url,
      printfulTaskKey: task.task_key,
      status: "completed",
      extraMockups: mockup.extra?.length
        ? JSON.stringify(mockup.extra)
        : null,
      createdAt: now,
    });

    await saveDatabase();

    return NextResponse.json({
      success: true,
      cached: false,
      mockup: {
        id: mockupId,
        mockupUrl: mockup.mockup_url,
        placement: mockup.placement || normalizedPlacement,
        status: "completed",
        extra: mockup.extra || [],
      },
    });
  } catch (err: any) {
    console.error("[mockup-generate] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Mockup generation failed" },
      { status: 500 }
    );
  }
}
