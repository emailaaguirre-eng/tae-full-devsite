/**
 * Public Products API
 * GET /api/products — List products for the storefront
 *
 * Query params:
 *   ?category=slug    — filter by category slug
 *   ?search=term      — search by name
 *   ?type=customizable|artist|cocreator — filter by product source
 *   ?featured=true    — featured products only
 *   ?limit=N          — max results (default 50)
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, shopCategories, eq, desc, like, and } from "@/lib/db";
import { buildProductPreviewUrl, parseRequiresQrCode } from "@/lib/product-watermark";

export const dynamic = "force-dynamic";

function cleanDescription(desc: string | null): string | null {
  if (!desc) return null;
  return desc
    .replace(/\s*[-—–]\s*(printed|fulfilled)\s+by\s+\w+\.?/gi, "")
    .replace(/\s*[-—–]\s*$/, "")
    .trim() || null;
}

export async function GET(req: Request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    const categories = await db.select().from(shopCategories).all();
    const catMap = new Map(categories.map((c) => [c.id, c]));

    let products = await db
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.active, true))
      .orderBy(desc(shopProducts.sortOrder))
      .all();

    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) {
        products = products.filter((p) => p.categoryId === cat.id);
      } else {
        products = [];
      }
    }

    if (search) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Group variants: collapse products with the same printfulProductId + categoryId
    // into a single storefront card showing the product type, lowest price, and variant count
    const groupKey = (p: typeof products[0]) =>
      `${p.printfulProductId || "none"}_${p.categoryId || "none"}`;

    const groups = new Map<string, typeof products>();
    for (const p of products) {
      const key = groupKey(p);
      const arr = groups.get(key) || [];
      arr.push(p);
      groups.set(key, arr);
    }

    const grouped = Array.from(groups.values()).map((variants) => {
      // Sort by price ascending, pick cheapest as the representative
      variants.sort(
        (a, b) =>
          ((a.printfulBasePrice || 0) + (a.taeAddOnFee || 0)) -
          ((b.printfulBasePrice || 0) + (b.taeAddOnFee || 0))
      );
      const rep = variants[0];
      const cat = catMap.get(rep.categoryId || "");
      const lowestPrice = (rep.printfulBasePrice || 0) + (rep.taeAddOnFee || 0);
      const requiresQrCode =
        parseRequiresQrCode(rep.printfulDataJson) ??
        (cat?.requiresQrCode ?? false);

      // Use category name as display name (e.g. "Greeting Cards") instead of variant-specific name
      const productTypeName = cat?.name || rep.name.split(" — ")[0] || rep.name;

      const withImage = variants.find((v) => v.heroImage) || rep;
      let fallbackHero: string | null = null;
      if (!withImage.heroImage && withImage.printfulDataJson) {
        try {
          const parsed = JSON.parse(withImage.printfulDataJson);
          fallbackHero = parsed?.variant?.image || parsed?.product?.image || null;
        } catch {
          fallbackHero = null;
        }
      }

      return {
        id: rep.id,
        taeId: rep.taeId,
        slug: rep.slug,
        name: productTypeName,
        description: cleanDescription(cat?.description || rep.description),
        heroImage: withImage.heroImage
          ? buildProductPreviewUrl(withImage.id, "hero")
          : fallbackHero,
        basePrice: lowestPrice,
        hasMultipleVariants: variants.length > 1,
        variantCount: variants.length,
        sizeLabel: null,
        paperType: null,
        orientation: null,
        requiresQrCode,
        categoryId: rep.categoryId,
        categoryName: cat?.name || "Uncategorized",
        categorySlug: cat?.slug || "",
        categoryIcon: cat?.icon || "",
      };
    });

    const limited = grouped.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: limited,
      categories: categories
        .filter((c) => c.active)
        .map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          icon: c.icon,
          description: c.description,
        })),
    });
  } catch (err: any) {
    console.error("Failed to fetch products:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
