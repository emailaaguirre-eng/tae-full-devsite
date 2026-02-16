/**
 * Public Single Product API
 * GET /api/products/[slug] — Get full product details by slug
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, shopCategories, eq } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const db = await getDb();
    const { slug } = params;

    const products = await db
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.slug, slug))
      .all();

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const product = products[0];

    let category = null;
    if (product.categoryId) {
      const cats = await db
        .select()
        .from(shopCategories)
        .where(eq(shopCategories.id, product.categoryId))
        .all();
      if (cats.length > 0) category = cats[0];
    }

    const basePrice =
      (product.printfulBasePrice || 0) + (product.taeAddOnFee || 0);

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        taeId: product.taeId,
        slug: product.slug,
        name: product.name,
        description: product.description,
        heroImage: product.heroImage,
        basePrice,
        printfulBasePrice: product.printfulBasePrice || 0,
        taeAddOnFee: product.taeAddOnFee || 0,
        sizeLabel: product.sizeLabel,
        paperType: product.paperType,
        finishType: product.finishType,
        orientation: product.orientation,
        printProvider: product.printProvider || "printful",
        printfulProductId: product.printfulProductId,
        printfulVariantId: product.printfulVariantId,
        printWidth: product.printWidth,
        printHeight: product.printHeight,
        printDpi: product.printDpi || 300,
        printFillMode: product.printFillMode,
        requiredPlacements: product.requiredPlacements,
        qrDefaultPosition: product.qrDefaultPosition,
        requiresQrCode: category?.requiresQrCode ?? false,
        category: category
          ? {
              id: category.id,
              slug: category.slug,
              name: category.name,
              icon: category.icon,
              description: category.description,
            }
          : null,
      },
    });
  } catch (err: any) {
    console.error("Failed to fetch product:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}
