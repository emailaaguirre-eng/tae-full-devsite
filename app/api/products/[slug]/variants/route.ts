/**
 * Public: Get sibling variants for a product
 * GET /api/products/[slug]/variants
 *
 * Returns all products that share the same printfulProductId
 * (i.e., same product type, different sizes/options).
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, shopCategories, eq } from "@/lib/db";
import {
  buildProductPreviewUrl,
  matrixRowPrimaryPreviewUrl,
  parseVariantMatrix,
} from "@/lib/product-watermark";
import {
  computeMatrixRowShopDisplay,
  computeRetailPrice,
  parsePricingSettings,
} from "@/lib/product-pricing";

export const dynamic = "force-dynamic";

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function extractSiblingVariantBasePrice(
  sibling: any,
  pfDataForRow: any
): number {
  const candidates = [
    sibling?.retail_price,
    sibling?.price,
    sibling?.price_usd,
    sibling?.base_price,
    pfDataForRow?.variant?.retail_price,
    pfDataForRow?.variant?.price,
  ];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return 0;
}

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
    const variantMatrix = parseVariantMatrix(product.printfulDataJson);

    if (variantMatrix.length > 0) {
      const activeMatrix = variantMatrix.filter((row) => row.active !== false);
      const productPricingSource = {
        printfulBasePrice: product.printfulBasePrice,
        taeAddOnFee: product.taeAddOnFee,
        printfulDataJson: product.printfulDataJson,
      };
      const mappedFromMatrix = activeMatrix.map((row) => {
        const pfVid = Math.trunc(Number(row.printfulVariantId));
        const rowHero = matrixRowPrimaryPreviewUrl(product.id, row);
        const heroImage = rowHero
          ? rowHero
          : product.heroImage
            ? buildProductPreviewUrl(product.id, "hero")
            : null;

        const rowAny = row as unknown as Record<string, unknown>;
        const { printfulBasePrice, basePrice, taeAddOnFee, artistRoyalty } =
          computeMatrixRowShopDisplay(row, productPricingSource);
        const paperFromRow =
          (typeof rowAny.paperType === "string" && rowAny.paperType) ||
          row.material ||
          null;
        const productPfVid = Math.trunc(Number(product.printfulVariantId));
        const isCurrent =
          Number.isFinite(productPfVid) &&
          productPfVid > 0 &&
          Number.isFinite(pfVid) &&
          pfVid > 0
            ? productPfVid === pfVid
            : activeMatrix[0]?.id === row.id;

        return {
          id: row.id,
          slug: product.slug,
          name: product.name,
          sizeLabel: row.size ?? product.sizeLabel,
          paperType: paperFromRow ?? product.paperType,
          finishType: row.frame ?? product.finishType,
          orientation: product.orientation,
          heroImage,
          basePrice,
          printfulBasePrice,
          taeAddOnFee,
          artistRoyalty,
          printfulVariantId:
            Number.isFinite(pfVid) && pfVid > 0 ? pfVid : null,
          printWidth: row.printWidth ?? product.printWidth,
          printHeight: row.printHeight ?? product.printHeight,
          isCurrent,
          pfColor: null,
          pfColorCode: null,
          pfSize: row.size ?? null,
          pfName: null,
          inStock: true,
        };
      });

      return NextResponse.json({
        success: true,
        data: mappedFromMatrix,
        current: params.slug,
        printfulProductId: product.printfulProductId,
      });
    }

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

      let pfDataForRow: any = {};
      try {
        pfDataForRow = p.printfulDataJson ? JSON.parse(p.printfulDataJson) : {};
      } catch {
        pfDataForRow = {};
      }

      const printfulBasePrice = toNumber(
        p.printfulBasePrice,
        extractSiblingVariantBasePrice(pfVariant, pfDataForRow)
      );
      const taeAddOnFee = toNumber(p.taeAddOnFee);
      const pricing = parsePricingSettings(p.printfulDataJson);
      const artistRoyalty = toNumber(pricing.artistRoyalty);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        sizeLabel: p.sizeLabel,
        paperType: p.paperType,
        finishType: p.finishType,
        orientation: p.orientation,
        heroImage: p.heroImage ? buildProductPreviewUrl(p.id, "hero") : null,
        basePrice: computeRetailPrice({
          printfulBasePrice,
          taeAddOnFee,
          artistRoyalty,
        }),
        printfulBasePrice,
        taeAddOnFee,
        artistRoyalty,
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
