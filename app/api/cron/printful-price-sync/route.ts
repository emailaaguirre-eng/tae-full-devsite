import { NextResponse } from "next/server";
import { getDb, shopProducts, eq } from "@/lib/db";
import { saveDatabase } from "@/db";
import { getVariant } from "@/lib/printful";
import { mergeProductMeta } from "@/lib/product-watermark";
import { parsePricingSettings } from "@/lib/product-pricing";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // If no secret is configured, allow non-production use only.
    return process.env.NODE_ENV !== "production";
  }
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

function toPrice(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function extractVariantPrice(variant: any): number | null {
  const candidates = [
    variant?.retail_price,
    variant?.price,
    variant?.price_usd,
    variant?.base_price,
  ];
  for (const value of candidates) {
    const p = toPrice(value);
    if (p !== null) return p;
  }
  return null;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const now = new Date().toISOString();
    const products = await db.select().from(shopProducts).all();
    const targets = products.filter((p) => !!p.printfulVariantId);

    let checked = 0;
    let updated = 0;
    const errors: Array<{ productId: string; slug: string; error: string }> = [];

    for (const product of targets) {
      checked += 1;
      try {
        const variant = await getVariant(product.printfulVariantId!);
        const nextPrice = extractVariantPrice(variant);
        if (nextPrice === null) {
          errors.push({
            productId: product.id,
            slug: product.slug,
            error: `No usable price for variant ${product.printfulVariantId}`,
          });
          continue;
        }

        const current = Number(product.printfulBasePrice ?? 0);
        const changed = !Number.isFinite(current) || Math.abs(current - nextPrice) > 0.0001;
        const pricing = parsePricingSettings(product.printfulDataJson);
        const nextMeta = mergeProductMeta(product.printfulDataJson, {
          pricing: {
            ...pricing,
            lastPrintfulSyncAt: now,
          } as any,
        } as any);

        if (changed) {
          await db
            .update(shopProducts)
            .set({
              printfulBasePrice: nextPrice,
              lastSyncedAt: now,
              updatedAt: now,
              printfulDataJson: nextMeta,
            })
            .where(eq(shopProducts.id, product.id));
          updated += 1;
        } else {
          await db
            .update(shopProducts)
            .set({
              lastSyncedAt: now,
              printfulDataJson: nextMeta,
            })
            .where(eq(shopProducts.id, product.id));
        }
      } catch (err: any) {
        errors.push({
          productId: product.id,
          slug: product.slug,
          error: err?.message || "Unknown Printful variant lookup error",
        });
      }
    }

    await saveDatabase();

    return NextResponse.json({
      success: true,
      checked,
      updated,
      failed: errors.length,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Price sync failed" },
      { status: 500 }
    );
  }
}

