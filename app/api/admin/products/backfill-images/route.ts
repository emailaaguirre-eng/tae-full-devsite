/**
 * Admin: Backfill Product Images from Printful
 * POST /api/admin/products/backfill-images
 *
 * For each active product with a null heroImage and a printfulProductId,
 * fetches an image URL from Printful and stores it.
 *
 * Strategy:
 *  1) Try Catalog endpoint: GET /products/{id}  (returns .product.image + .variants[].image)
 *  2) If that fails (auth/scope), try Store endpoint: GET /store/products/{id}
 *  3) Pick best image: matching variant image > product image > first variant image
 *
 * Caches per printfulProductId so we only call Printful once per product type.
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, eq } from "@/lib/db";
import { saveDatabase } from "@/db";

export const dynamic = "force-dynamic";

function getToken(): string {
  const token = process.env.PRINTFUL_TOKEN;
  if (!token) throw new Error("Missing PRINTFUL_TOKEN env var");
  return token;
}

function getStoreId(): string {
  return process.env.PRINTFUL_STORE_ID || "17578870";
}

async function pfFetch(path: string): Promise<{ ok: boolean; data: any }> {
  const res = await fetch(`https://api.printful.com${path}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "X-PF-Store-ID": getStoreId(),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) return { ok: false, data: json };
  return { ok: true, data: json?.result ?? json };
}

interface PfCacheEntry {
  productImage: string | null;
  variants: Array<{ id: number; image: string | null; name?: string; size?: string; color?: string; color_code?: string; price?: string; in_stock?: boolean }>;
}

async function fetchPrintfulData(printfulProductId: number): Promise<PfCacheEntry | null> {
  // Try catalog endpoint first
  const catalogRes = await pfFetch(`/products/${printfulProductId}`);
  if (catalogRes.ok && catalogRes.data) {
    const product = catalogRes.data.product || catalogRes.data;
    const variants = catalogRes.data.variants || [];
    return {
      productImage: product?.image || null,
      variants: variants.map((v: any) => ({
        id: v.id,
        image: v.image || null,
        name: v.name,
        size: v.size,
        color: v.color,
        color_code: v.color_code,
        price: v.price,
        in_stock: v.in_stock,
      })),
    };
  }

  // Fallback: store endpoint
  const storeRes = await pfFetch(`/store/products/${printfulProductId}`);
  if (storeRes.ok && storeRes.data) {
    const syncProduct = storeRes.data.sync_product || storeRes.data;
    const syncVariants = storeRes.data.sync_variants || [];
    const productImg = syncProduct?.thumbnail_url || null;
    return {
      productImage: productImg,
      variants: syncVariants.map((sv: any) => ({
        id: sv.variant_id || sv.id,
        image: sv.files?.[0]?.thumbnail_url || sv.files?.[0]?.preview_url || null,
        name: sv.name,
        size: sv.size,
        color: sv.color,
        color_code: sv.color_code,
        price: sv.retail_price,
        in_stock: true,
      })),
    };
  }

  return null;
}

export async function POST() {
  try {
    const db = await getDb();

    // Only process active products with no hero image and a Printful mapping
    const allProducts = await db.select().from(shopProducts).all();
    const targets = allProducts.filter(
      (p) => p.active && !p.heroImage && p.printfulProductId
    );

    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        skippedCount: allProducts.filter((p) => p.active).length,
        errors: [],
        message: "No products need image backfill (all active products already have images, or none are mapped to Printful).",
      });
    }

    // Cache Printful data by productId to avoid duplicate calls
    const pfCache = new Map<number, PfCacheEntry | null>();
    const uniqueIds = [...new Set(targets.map((p) => p.printfulProductId!))];

    for (const pfId of uniqueIds) {
      try {
        pfCache.set(pfId, await fetchPrintfulData(pfId));
      } catch {
        pfCache.set(pfId, null);
      }
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ id: string; message: string }> = [];

    for (const product of targets) {
      const pfData = pfCache.get(product.printfulProductId!);
      if (!pfData) {
        skippedCount++;
        errors.push({ id: product.id, message: `No Printful data for product ${product.printfulProductId}` });
        continue;
      }

      // Pick best image: variant-specific > product-level > first variant with image
      const matchingVariant = product.printfulVariantId
        ? pfData.variants.find((v) => v.id === product.printfulVariantId)
        : null;

      const heroImage =
        matchingVariant?.image ||
        pfData.productImage ||
        pfData.variants.find((v) => v.image)?.image ||
        null;

      if (!heroImage) {
        skippedCount++;
        errors.push({ id: product.id, message: "No image found in Printful response" });
        continue;
      }

      // Build gallery from all unique images
      const galleryUrls: string[] = [];
      if (pfData.productImage) galleryUrls.push(pfData.productImage);
      if (matchingVariant?.image && !galleryUrls.includes(matchingVariant.image)) {
        galleryUrls.push(matchingVariant.image);
      }

      // Also store variant data for the variant selector to use
      const variantData = matchingVariant || null;
      const siblingVariants = pfData.variants;

      const now = new Date().toISOString();
      await db
        .update(shopProducts)
        .set({
          heroImage,
          galleryImages: galleryUrls.length > 0 ? JSON.stringify(galleryUrls) : null,
          printfulDataJson: JSON.stringify({
            product: { image: pfData.productImage },
            variant: variantData,
            siblingVariants,
          }),
          lastSyncedAt: now,
          updatedAt: now,
        })
        .where(eq(shopProducts.id, product.id));

      updatedCount++;
    }

    await saveDatabase();

    return NextResponse.json({
      success: true,
      updatedCount,
      skippedCount,
      errors,
    });
  } catch (err: any) {
    console.error("[backfill-images] Error:", err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || "Backfill failed" },
      { status: 500 }
    );
  }
}
