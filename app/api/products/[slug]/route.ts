/**
 * Public Single Product API
 * GET /api/products/[slug] — Get full product details by slug
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, shopCategories, eq } from "@/lib/db";
import { buildProductPreviewUrl, parseRequiresQrCode } from "@/lib/product-watermark";

export const dynamic = "force-dynamic";

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

    const basePrice =
      (product.printfulBasePrice || 0) + (product.taeAddOnFee || 0);

    let gallery: string[] = [];
    try {
      gallery = product.galleryImages ? JSON.parse(product.galleryImages) : [];
    } catch {
      gallery = [];
    }

    let printfulData: any = {};
    try {
      printfulData = product.printfulDataJson ? JSON.parse(product.printfulDataJson) : {};
    } catch {
      printfulData = {};
    }

    const fallbackHero =
      printfulData?.variant?.image ||
      printfulData?.product?.image ||
      null;

    const fallbackGallery: string[] = Array.isArray(printfulData?.variantImages)
      ? printfulData.variantImages
          .map((v: any) => (typeof v?.image === "string" ? v.image : null))
          .filter((url: string | null): url is string => !!url)
      : [];

    const finalGallery = gallery.length > 0 ? gallery : fallbackGallery;
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
        description: cleanDescription(product.description),
        heroImage: product.heroImage
          ? buildProductPreviewUrl(product.id, "hero")
          : fallbackHero,
        galleryImages:
          gallery.length > 0
            ? finalGallery.map((_url, idx) =>
                buildProductPreviewUrl(product.id, "gallery", idx)
              )
            : finalGallery,
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
        proofTerms: getProofTerms(product.printfulDataJson),
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
