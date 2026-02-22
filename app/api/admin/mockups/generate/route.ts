/**
 * Admin: Generate Mockup from Design
 * POST /api/admin/mockups/generate
 *
 * Accepts a design file URL, uploads to Printful if needed,
 * creates a mockup generation task, and stores the result.
 *
 * Body: {
 *   shopProductId: string,
 *   designDraftId?: string,
 *   designFileUrl: string,     // public URL to the design PNG
 *   placement?: string,        // default "front"
 * }
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, productMockups, eq } from "@/lib/db";
import { saveDatabase } from "@/db";
import { generateId } from "@/lib/db";
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
      designDraftId,
      designFileUrl,
      placement = "front",
    } = body;

    if (!shopProductId || !designFileUrl) {
      return NextResponse.json(
        { success: false, error: "shopProductId and designFileUrl are required" },
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

    if (!product.printfulProductId || !product.printfulVariantId) {
      return NextResponse.json(
        { success: false, error: "Product has no Printful mapping" },
        { status: 400 }
      );
    }

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
          m.placement === placement &&
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
      variant_ids: [product.printfulVariantId],
      format: "jpg",
      files: [
        {
          placement,
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
      placement: mockup.placement || placement,
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
        placement: mockup.placement || placement,
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
