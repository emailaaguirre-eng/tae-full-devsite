/**
 * Admin: Backfill Product Images from Printful
 * POST /api/admin/products/backfill-images
 *
 * Fetches catalog images from Printful for all mapped products
 * and stores heroImage + galleryImages in the database.
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, eq } from "@/lib/db";
import { saveDatabase } from "@/db";
import { getProduct } from "@/lib/printful";
import type { Placement } from "@/customization-studio/types";

export const dynamic = "force-dynamic";

const DEBUG = process.env.DEBUG_IMAGES === "true";

const SURFACE_MAP: Record<number, Placement[]> = {
  568: ["front", "inside1", "inside2", "back"],
  433: ["front", "back"],
  1:   ["front"],
  2:   ["front"],
  3:   ["front"],
  614: ["front"],
  171: ["front"],
  172: ["front"],
};

export async function POST() {
  try {
    const db = await getDb();
    const products = await db.select().from(shopProducts).all();

    if (DEBUG) console.log(`[backfill-images] Processing ${products.length} products`);

    const uniqueProductIds = new Set<number>();
    products.forEach((p) => {
      if (p.printfulProductId) uniqueProductIds.add(p.printfulProductId);
    });

    const pfCache = new Map<number, any>();
    for (const pfId of uniqueProductIds) {
      try {
        const pfData = await getProduct(pfId);
        pfCache.set(pfId, pfData);
        if (DEBUG) console.log(`[backfill-images] Fetched Printful product ${pfId}`);
      } catch (err: any) {
        console.error(`[backfill-images] Failed to fetch product ${pfId}:`, err.message);
      }
    }

    const results: Array<{
      id: string;
      slug: string;
      status: string;
      heroImage?: string;
      galleryCount?: number;
    }> = [];

    for (const product of products) {
      if (!product.printfulProductId || !product.printfulVariantId) {
        results.push({ id: product.id, slug: product.slug, status: "skipped_no_mapping" });
        continue;
      }

      const pfData = pfCache.get(product.printfulProductId);
      if (!pfData) {
        results.push({ id: product.id, slug: product.slug, status: "skipped_no_pf_data" });
        continue;
      }

      const pfProduct = pfData.product || pfData;
      const pfVariants = pfData.variants || [];

      const matchingVariant = pfVariants.find(
        (v: any) => v.id === product.printfulVariantId
      );

      const heroImage =
        matchingVariant?.image || pfProduct?.image || product.heroImage;

      const galleryUrls: string[] = [];
      if (pfProduct?.image) galleryUrls.push(pfProduct.image);
      if (matchingVariant?.image && matchingVariant.image !== pfProduct?.image) {
        galleryUrls.push(matchingVariant.image);
      }

      const now = new Date().toISOString();

      const placements = SURFACE_MAP[product.printfulProductId] || ["front"];

      await db
        .update(shopProducts)
        .set({
          heroImage: heroImage || product.heroImage,
          galleryImages: galleryUrls.length > 0 ? JSON.stringify(galleryUrls) : null,
          requiredPlacements: JSON.stringify(placements),
          printfulDataJson: JSON.stringify({
            product: {
              id: pfProduct?.id,
              title: pfProduct?.title,
              type_name: pfProduct?.type_name,
              image: pfProduct?.image,
            },
            variant: matchingVariant
              ? {
                  id: matchingVariant.id,
                  name: matchingVariant.name,
                  size: matchingVariant.size,
                  color: matchingVariant.color,
                  color_code: matchingVariant.color_code,
                  image: matchingVariant.image,
                  price: matchingVariant.price,
                  in_stock: matchingVariant.in_stock,
                }
              : null,
            siblingVariants: pfVariants.map((v: any) => ({
              id: v.id,
              name: v.name,
              size: v.size,
              color: v.color,
              color_code: v.color_code,
              image: v.image,
              price: v.price,
              in_stock: v.in_stock,
            })),
          }),
          lastSyncedAt: now,
          updatedAt: now,
        })
        .where(eq(shopProducts.id, product.id));

      results.push({
        id: product.id,
        slug: product.slug,
        status: "updated",
        heroImage: heroImage || undefined,
        galleryCount: galleryUrls.length,
      });
    }

    await saveDatabase();

    const updated = results.filter((r) => r.status === "updated").length;
    const skipped = results.filter((r) => r.status.startsWith("skipped")).length;

    return NextResponse.json({
      success: true,
      summary: { total: products.length, updated, skipped },
      results,
    });
  } catch (err: any) {
    console.error("[backfill-images] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Backfill failed" },
      { status: 500 }
    );
  }
}
