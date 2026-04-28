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
import { parseVariantMatrix } from "@/lib/product-watermark";

export const dynamic = "force-dynamic";

function validateEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.PRINTFUL_TOKEN) missing.push("PRINTFUL_TOKEN");
  return missing;
}

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

interface BackfillOptions {
  force?: boolean;
  dryRun?: boolean;
  syncGallery?: boolean;
}

interface ProductMapping {
  printfulProductId: number;
  printfulVariantId: number | null;
}

function toPositiveInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const int = Math.trunc(n);
  return int > 0 ? int : null;
}

function resolveProductMapping(p: any): ProductMapping | null {
  const topLevelProductId = toPositiveInt(p.printfulProductId);
  if (topLevelProductId) {
    return {
      printfulProductId: topLevelProductId,
      printfulVariantId: toPositiveInt(p.printfulVariantId),
    };
  }

  const activeMappedRows = parseVariantMatrix(p.printfulDataJson).filter((row) => {
    if (row.active === false) return false;
    return !!toPositiveInt(row.printfulProductId);
  });

  if (activeMappedRows.length === 0) return null;

  const preferredRow =
    activeMappedRows.find((row) => (row.frame || "").trim().toLowerCase() === "framed") ||
    activeMappedRows[0];

  const printfulProductId = toPositiveInt(preferredRow.printfulProductId);
  if (!printfulProductId) return null;

  return {
    printfulProductId,
    printfulVariantId: toPositiveInt(preferredRow.printfulVariantId),
  };
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

function isMappedProduct(p: any) {
  return !!resolveProductMapping(p);
}

function isMissingHero(p: any) {
  return !p.heroImage || String(p.heroImage).trim() === "";
}

function isMissingGallery(p: any) {
  if (!p.galleryImages) return true;
  try {
    const parsed = JSON.parse(p.galleryImages);
    return !Array.isArray(parsed) || parsed.length === 0;
  } catch {
    return true;
  }
}

function getTargets(products: any[], options: BackfillOptions) {
  const force = !!options.force;
  const syncGallery = !!options.syncGallery;
  return products.filter(
    (p) =>
      p.active &&
      isMappedProduct(p) &&
      (force || isMissingHero(p) || (syncGallery && isMissingGallery(p)) || syncGallery)
  );
}

export async function GET() {
  return NextResponse.json({
    success: false,
    disabled: true,
    error: "Printful image backfill has been retired. Manual product image management is now the only supported source for storefront images.",
  }, { status: 410 });

  try {
    const missingEnv = validateEnv();
    const db = await getDb();
    const allProducts = await db.select().from(shopProducts).all();
    const active = allProducts.filter((p) => p.active);
    const activeMapped = active.filter((p) => isMappedProduct(p));
    const eligible = activeMapped.filter((p) => isMissingHero(p));
    const uniqueProductIds = [
      ...new Set(
        eligible.map((p) => resolveProductMapping(p)?.printfulProductId).filter(Boolean)
      ),
    ];

    return NextResponse.json({
      success: true,
      preflight: {
        missingEnv,
        totals: {
          allProducts: allProducts.length,
          activeProducts: active.length,
          activeMappedProducts: activeMapped.length,
          eligibleForBackfill: eligible.length,
          alreadyHasHero: activeMapped.length - eligible.length,
          uniqueMappedPrintfulProductIds: uniqueProductIds.length,
        },
        sampleProductIds: uniqueProductIds.slice(0, 20),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Preflight failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return NextResponse.json({
    success: false,
    disabled: true,
    error: "Printful image backfill has been retired. Manual product image management is now the only supported source for storefront images.",
  }, { status: 410 });

  try {
    const body = await req.json().catch(() => ({}));
    const options: BackfillOptions = {
      force: !!body?.force,
      dryRun: !!body?.dryRun,
      syncGallery: body?.syncGallery !== false,
    };

    const missingEnv = validateEnv();
    if (missingEnv.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Backfill is not configured: missing ${missingEnv.join(", ")}`,
        },
        { status: 500 }
      );
    }

    const db = await getDb();

    const allProducts = await db.select().from(shopProducts).all();
    const targets = getTargets(allProducts, options);

    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        skippedCount: allProducts.filter((p) => p.active).length,
        dryRun: options.dryRun,
        force: options.force,
        errors: [],
        message: "No products need image backfill (all active products already have images, or none are mapped to Printful).",
      });
    }

    // Cache Printful data by productId to avoid duplicate calls
    const pfCache = new Map<number, PfCacheEntry | null>();
    const uniqueIds = [
      ...new Set(targets.map((p) => resolveProductMapping(p)?.printfulProductId).filter(Boolean)),
    ] as number[];
    const errors: Array<{ id: string; message: string }> = [];

    for (const pfId of uniqueIds) {
      try {
        pfCache.set(pfId, await fetchPrintfulData(pfId));
      } catch (err: any) {
        pfCache.set(pfId, null);
        errors.push({
          id: String(pfId),
          message: `Printful fetch failed for ${pfId}: ${err?.message || "Unknown error"}`,
        });
      }
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const results: Array<{
      id: string;
      slug: string;
      printfulProductId: number | null;
      status: "updated" | "would_update" | "skipped";
      reason?: string;
      heroImage?: string | null;
    }> = [];

    for (const product of targets) {
      const mapping = resolveProductMapping(product);
      if (!mapping) {
        skippedCount++;
        const message = "No usable Printful mapping on parent or variantMatrix";
        errors.push({ id: product.id, message });
        results.push({
          id: product.id,
          slug: product.slug,
          printfulProductId: null,
          status: "skipped",
          reason: message,
        });
        continue;
      }

      const pfData = pfCache.get(mapping.printfulProductId);
      if (!pfData) {
        skippedCount++;
        const message = `No Printful data for product ${mapping.printfulProductId}`;
        errors.push({ id: product.id, message });
        results.push({
          id: product.id,
          slug: product.slug,
          printfulProductId: mapping.printfulProductId,
          status: "skipped",
          reason: message,
        });
        continue;
      }

      // Pick best image: variant-specific > product-level > first variant with image
      const matchingVariant = mapping.printfulVariantId
        ? pfData.variants.find((v) => v.id === mapping.printfulVariantId)
        : null;

      const heroImage =
        matchingVariant?.image ||
        pfData.productImage ||
        pfData.variants.find((v) => v.image)?.image ||
        null;

      if (!heroImage) {
        skippedCount++;
        const message = "No image found in Printful response";
        errors.push({ id: product.id, message });
        results.push({
          id: product.id,
          slug: product.slug,
          printfulProductId: mapping.printfulProductId,
          status: "skipped",
          reason: message,
        });
        continue;
      }

      // Build gallery from all unique product + variant images
      const galleryUrls: string[] = [];
      const pushUnique = (url: string | null | undefined) => {
        if (!url || galleryUrls.includes(url)) return;
        galleryUrls.push(url);
      };
      pushUnique(pfData.productImage);
      pushUnique(matchingVariant?.image);
      for (const v of pfData.variants) {
        pushUnique(v.image);
      }

      // Also store variant data for the variant selector to use
      const variantData = matchingVariant || null;
      const siblingVariants = pfData.variants;

      if (options.dryRun) {
        updatedCount++;
        results.push({
          id: product.id,
          slug: product.slug,
          printfulProductId: mapping.printfulProductId,
          status: "would_update",
          heroImage,
        });
        continue;
      }

      let existingPrintfulData: any = {};
      if (product.printfulDataJson) {
        try {
          existingPrintfulData = JSON.parse(product.printfulDataJson);
        } catch {
          existingPrintfulData = {};
        }
      }

      const now = new Date().toISOString();
      const nextHeroImage = options.force || isMissingHero(product) ? heroImage : product.heroImage;
      const nextGalleryImages =
        options.force || isMissingGallery(product)
          ? (galleryUrls.length > 0 ? JSON.stringify(galleryUrls) : product.galleryImages)
          : product.galleryImages;
      await db
        .update(shopProducts)
        .set({
          heroImage: nextHeroImage,
          galleryImages: nextGalleryImages,
          printfulDataJson: JSON.stringify({
            ...existingPrintfulData,
            product: { ...(existingPrintfulData.product || {}), image: pfData.productImage },
            variant: variantData,
            siblingVariants,
            variantImages: pfData.variants
              .filter((v) => !!v.image)
              .map((v) => ({
                id: v.id,
                image: v.image,
                name: v.name,
                size: v.size,
                color: v.color,
              })),
          }),
          lastSyncedAt: now,
          updatedAt: now,
        })
        .where(eq(shopProducts.id, product.id));

      updatedCount++;
      results.push({
        id: product.id,
        slug: product.slug,
        printfulProductId: mapping.printfulProductId,
        status: "updated",
        heroImage,
      });
    }

    if (!options.dryRun) {
      await saveDatabase();
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      skippedCount,
      dryRun: options.dryRun,
      force: options.force,
      totalTargets: targets.length,
      errors,
      results,
    });
  } catch (err: any) {
    console.error("[backfill-images] Error:", err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || "Backfill failed" },
      { status: 500 }
    );
  }
}
