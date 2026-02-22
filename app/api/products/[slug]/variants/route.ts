/**
 * Public: Get sibling variants for a product
 * GET /api/products/[slug]/variants
 *
 * Returns all products that share the same printfulProductId
 * (i.e., same product type, different sizes/options).
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, shopCategories, eq } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const db = await getDb();

    const products = await db
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.slug, params.slug))
      .limit(1)
      .all();

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const product = products[0];

    if (!product.printfulProductId) {
      return NextResponse.json({
        success: true,
        data: [],
        current: product.slug,
      });
    }

    const allProducts = await db
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.active, true))
      .all();

    const siblings = allProducts
      .filter(
        (p) => p.printfulProductId === product.printfulProductId
      )
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // If product has printfulDataJson with siblingVariants, include that info
    let printfulVariantData: any[] = [];
    try {
      if (product.printfulDataJson) {
        const parsed = JSON.parse(product.printfulDataJson);
        printfulVariantData = parsed.siblingVariants || [];
      }
    } catch { /* ignore parse errors */ }

    const mapped = siblings.map((p) => {
      const pfVariant = printfulVariantData.find(
        (v: any) => v.id === p.printfulVariantId
      );

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        sizeLabel: p.sizeLabel,
        paperType: p.paperType,
        finishType: p.finishType,
        orientation: p.orientation,
        heroImage: p.heroImage,
        basePrice: (p.printfulBasePrice || 0) + (p.taeAddOnFee || 0),
        printfulVariantId: p.printfulVariantId,
        printWidth: p.printWidth,
        printHeight: p.printHeight,
        isCurrent: p.slug === params.slug,
        pfColor: pfVariant?.color || null,
        pfColorCode: pfVariant?.color_code || null,
        pfSize: pfVariant?.size || null,
        pfName: pfVariant?.name || null,
        inStock: pfVariant?.in_stock !== false,
      };
    });

    return NextResponse.json({
      success: true,
      data: mapped,
      current: params.slug,
      printfulProductId: product.printfulProductId,
    });
  } catch (err: any) {
    console.error("[variants] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch variants" },
      { status: 500 }
    );
  }
}
