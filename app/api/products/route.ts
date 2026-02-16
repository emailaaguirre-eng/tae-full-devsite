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

export const dynamic = "force-dynamic";

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
      const term = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }

    products = products.slice(0, limit);

    const mapped = products.map((p) => {
      const cat = catMap.get(p.categoryId || "");
      const basePrice =
        (p.printfulBasePrice || 0) + (p.taeAddOnFee || 0);

      return {
        id: p.id,
        taeId: p.taeId,
        slug: p.slug,
        name: p.name,
        description: p.description,
        heroImage: p.heroImage,
        basePrice,
        sizeLabel: p.sizeLabel,
        paperType: p.paperType,
        finishType: p.finishType,
        orientation: p.orientation,
        printProvider: p.printProvider || "printful",
        printfulProductId: p.printfulProductId,
        printfulVariantId: p.printfulVariantId,
        requiresQrCode: cat?.requiresQrCode ?? false,
        categoryId: p.categoryId,
        categoryName: cat?.name || "Uncategorized",
        categorySlug: cat?.slug || "",
        categoryIcon: cat?.icon || "",
      };
    });

    return NextResponse.json({
      success: true,
      data: mapped,
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
