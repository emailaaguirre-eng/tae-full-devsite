/**
 * Public Single Product API
 * GET /api/products/[slug] — Get full product details by slug
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, shopCategories, shopProductImages, eq } from "@/lib/db";
import { asc } from "drizzle-orm";
import {
  buildProductPreviewUrl,
  parseRequiresQrCode,
  parseFamilyKey,
  parseSemanticProductType,
} from "@/lib/product-watermark";
import { computeRetailPrice, parsePricingSettings } from "@/lib/product-pricing";
import { buildStorefrontProductImageRows } from "@/lib/storefront-product-image-rows";

export const dynamic = "force-dynamic";

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function extractPrintfulVariantBasePrice(printfulData: any): number {
  const variant = printfulData?.variant ?? {};
  const candidates = [
    variant?.retail_price,
    variant?.price,
    variant?.price_usd,
    variant?.base_price,
    printfulData?.retail_price,
    printfulData?.price,
  ];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return 0;
}

function cleanDescription(desc: string | null): string | null {
  if (!desc) return null;
  return desc
    .replace(/\s*[-—–]\s*(printed|fulfilled)\s+by\s+\w+\.?/gi, "")
    .replace(/\s*[-—–]\s*$/, "")
    .trim() || null;
}

function getProofTerms(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.proofTerms === "string" ? parsed.proofTerms : "";
  } catch {
    return "";
  }
}

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

    let gallery: string[] = [];
    try {
      gallery = product.galleryImages ? JSON.parse(product.galleryImages) : [];
    } catch {
      gallery = [];
    }

    const imageRows = await db
      .select()
      .from(shopProductImages)
      .where(eq(shopProductImages.productId, product.id))
      .orderBy(asc(shopProductImages.sortOrder))
      .all();
    const productImages = buildStorefrontProductImageRows(
      product.id,
      product.heroImage,
      product.galleryImages,
      imageRows
    );

    let printfulData: any = {};
    try {
      printfulData = product.printfulDataJson ? JSON.parse(product.printfulDataJson) : {};
    } catch {
      printfulData = {};
    }

    const printfulBasePrice = toNumber(
      product.printfulBasePrice,
      extractPrintfulVariantBasePrice(printfulData)
    );
    const taeAddOnFee = toNumber(product.taeAddOnFee);
    const pricing = parsePricingSettings(product.printfulDataJson);
    const artistRoyalty = toNumber(pricing.artistRoyalty);
    const basePrice = computeRetailPrice({
      printfulBasePrice,
      taeAddOnFee,
      artistRoyalty,
    });

    const requiresQrCode =
      parseRequiresQrCode(product.printfulDataJson) ??
      (category?.requiresQrCode ?? false);

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        taeId: product.taeId,
        slug: product.slug,
        name: product.name,
        productType: parseSemanticProductType(product.printfulDataJson),
        description: cleanDescription(product.description),
        heroImage: product.heroImage
          ? buildProductPreviewUrl(product.id, "hero")
          : null,
        galleryImages: gallery.map((_url, idx) =>
          buildProductPreviewUrl(product.id, "gallery", idx)
        ),
        productImages,
        basePrice,
        printfulBasePrice,
        taeAddOnFee,
        artistRoyalty,
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
        proofTerms: getProofTerms(product.printfulDataJson),
        printfulDataJson: product.printfulDataJson,
        familyKey: parseFamilyKey(product.printfulDataJson) || null,
        customizable: printfulData?.customizable !== false,
        requiresQrCode,
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
