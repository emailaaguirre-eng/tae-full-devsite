import { NextResponse } from "next/server";
import { and, eq, getDb, shopProducts } from "@/lib/db";
import {
  computeLinePricing,
  getBasePricingComponents,
  normalizePriceAdjustments,
} from "@/lib/pricing-engine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug =
      typeof body?.productSlug === "string" ? body.productSlug.trim() : "";
    const variantId = Number(body?.printfulVariantId);
    const quantity = body?.quantity;
    const adjustments = normalizePriceAdjustments(body?.adjustments);

    if (!slug && !Number.isFinite(variantId)) {
      return NextResponse.json(
        { success: false, error: "productSlug or printfulVariantId is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    let product: any | null = null;

    if (slug) {
      const rows = await db
        .select()
        .from(shopProducts)
        .where(and(eq(shopProducts.slug, slug), eq(shopProducts.active, true)))
        .limit(1)
        .all();
      product = rows[0] || null;
    } else if (Number.isFinite(variantId)) {
      const rows = await db
        .select()
        .from(shopProducts)
        .where(
          and(
            eq(shopProducts.printfulVariantId, Math.trunc(variantId)),
            eq(shopProducts.active, true)
          )
        )
        .limit(1)
        .all();
      product = rows[0] || null;
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found for pricing quote" },
        { status: 404 }
      );
    }

    const base = getBasePricingComponents(product);
    const line = computeLinePricing({
      baseUnitPrice: base.baseUnitPrice,
      quantity,
      adjustments,
    });

    return NextResponse.json({
      success: true,
      data: {
        productId: product.id,
        productSlug: product.slug,
        printfulVariantId: product.printfulVariantId,
        quantity: line.quantity,
        adjustments,
        breakdown: {
          printfulBasePrice: base.printfulBasePrice,
          taeAddOnFee: base.taeAddOnFee,
          artistRoyalty: base.artistRoyalty,
          optionsTotal: line.adjustmentsTotal,
        },
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to compute pricing quote" },
      { status: 500 }
    );
  }
}

