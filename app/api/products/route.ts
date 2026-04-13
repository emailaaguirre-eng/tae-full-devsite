/**
 * Public Products API
 * GET /api/products — List products for the storefront
 *
 * Query params:
 *   ?category=slug    — filter by category slug (includes products in that category OR linked to Artist/CoCreator with the same slug)
 *   ?tag=label       — filter by tag in printfulDataJson meta (case-insensitive)
 *   ?search=term      — search by name
 *   ?type=customizable|artist|cocreator — filter by product source
 *   ?artistId=id       — with artistSlug: match column artistId first, else meta artistSlug
 *   ?coCreatorId=id    — with coCreatorSlug: match column coCreatorId first, else meta slug
 *   ?featured=true    — featured products only
 *   ?limit=N          — max results (default 50)
 *   ?group=true|false — collapse variants into grouped cards (default true)
 */
import { NextResponse } from "next/server";
import {
  getDb,
  shopProducts,
  shopCategories,
  artists,
  coCreators,
  eq,
  desc,
} from "@/lib/db";
import {
  buildProductPreviewUrl,
  parseRequiresQrCode,
  parseArtistSlug,
  parseCoCreatorSlug,
  productMetaHasTag,
} from "@/lib/product-watermark";
import {
  computeRetailPrice,
  minActiveVariantMatrixShopPrice,
  parsePricingSettings,
} from "@/lib/product-pricing";

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
    const tagFilter = (searchParams.get("tag") || "").trim();
    const search = searchParams.get("search");
    const type = (searchParams.get("type") || "").toLowerCase();
    const artistSlug = (searchParams.get("artistSlug") || "").trim();
    const artistIdParam = (searchParams.get("artistId") || "").trim();
    const coCreatorSlug = (searchParams.get("coCreatorSlug") || "").trim();
    const coCreatorIdParam = (searchParams.get("coCreatorId") || "").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const shouldGroup = searchParams.get("group") !== "false";

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
        const slugNorm = categorySlug.trim().toLowerCase();
        const artistForSlug = await db
          .select()
          .from(artists)
          .where(eq(artists.slug, categorySlug))
          .get();
        const coCreatorForSlug = await db
          .select()
          .from(coCreators)
          .where(eq(coCreators.slug, categorySlug))
          .get();

        products = products.filter((p) => {
          if (p.categoryId === cat.id) return true;
          const rowArtistId = String(p.artistId || "").trim();
          const rowCoId = String(p.coCreatorId || "").trim();
          if (artistForSlug && rowArtistId === artistForSlug.id) return true;
          if (coCreatorForSlug && rowCoId === coCreatorForSlug.id) return true;
          const metaArtist = (parseArtistSlug(p.printfulDataJson) || "").trim().toLowerCase();
          const metaCo = (parseCoCreatorSlug(p.printfulDataJson) || "").trim().toLowerCase();
          if (slugNorm && metaArtist === slugNorm) return true;
          if (slugNorm && metaCo === slugNorm) return true;
          return false;
        });
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

    if (type === "artist") {
      products = products.filter(
        (p) =>
          !!(parseArtistSlug(p.printfulDataJson) || String(p.artistId || "").trim())
      );
    } else if (type === "cocreator") {
      products = products.filter(
        (p) =>
          !!(parseCoCreatorSlug(p.printfulDataJson) || String(p.coCreatorId || "").trim())
      );
    } else if (type === "customizable") {
      products = products.filter((p) => {
        try {
          const parsed = JSON.parse(p.printfulDataJson || "{}");
          return parsed?.customizable !== false;
        } catch {
          return true;
        }
      });
    }

    if (artistIdParam || artistSlug) {
      let resolvedArtistId: string | null = null;
      let resolvedArtistSlugNorm: string | null = null;
      if (artistIdParam) {
        const byId = await db.select().from(artists).where(eq(artists.id, artistIdParam)).get();
        if (byId) {
          resolvedArtistId = byId.id;
          resolvedArtistSlugNorm = String(byId.slug || "")
            .trim()
            .toLowerCase();
        }
      }
      if (artistSlug && !resolvedArtistSlugNorm) {
        const bySlug = await db.select().from(artists).where(eq(artists.slug, artistSlug)).get();
        if (bySlug) {
          resolvedArtistId = bySlug.id;
          resolvedArtistSlugNorm = String(bySlug.slug || "")
            .trim()
            .toLowerCase();
        }
      }
      const slugNorm = (artistSlug || "").trim().toLowerCase();
      const metaSlugMatch =
        resolvedArtistSlugNorm ||
        (slugNorm || null);

      products = products.filter((p) => {
        const rowId = String(p.artistId || "").trim();
        const metaSlug = (parseArtistSlug(p.printfulDataJson) || "").trim().toLowerCase();
        if (resolvedArtistId && rowId === resolvedArtistId) return true;
        if (metaSlugMatch && metaSlug === metaSlugMatch) return true;
        return false;
      });
    }

    if (coCreatorIdParam || coCreatorSlug) {
      let resolvedCoId: string | null = null;
      let resolvedCoSlugNorm: string | null = null;
      if (coCreatorIdParam) {
        const byId = await db
          .select()
          .from(coCreators)
          .where(eq(coCreators.id, coCreatorIdParam))
          .get();
        if (byId) {
          resolvedCoId = byId.id;
          resolvedCoSlugNorm = String(byId.slug || "")
            .trim()
            .toLowerCase();
        }
      }
      if (coCreatorSlug && !resolvedCoSlugNorm) {
        const bySlug = await db
          .select()
          .from(coCreators)
          .where(eq(coCreators.slug, coCreatorSlug))
          .get();
        if (bySlug) {
          resolvedCoId = bySlug.id;
          resolvedCoSlugNorm = String(bySlug.slug || "")
            .trim()
            .toLowerCase();
        }
      }
      const coSlugNorm = (coCreatorSlug || "").trim().toLowerCase();
      const coMetaSlugMatch =
        resolvedCoSlugNorm ||
        (coSlugNorm || null);

      products = products.filter((p) => {
        const rowId = String(p.coCreatorId || "").trim();
        const metaSlug = (parseCoCreatorSlug(p.printfulDataJson) || "").trim().toLowerCase();
        if (resolvedCoId && rowId === resolvedCoId) return true;
        if (coMetaSlugMatch && metaSlug === coMetaSlugMatch) return true;
        return false;
      });
    }

    if (tagFilter) {
      products = products.filter((p) =>
        productMetaHasTag(p.printfulDataJson, tagFilter)
      );
    }

    const retailPriceFor = (p: typeof products[number]) => {
      const fromMatrix = minActiveVariantMatrixShopPrice({
        printfulBasePrice: p.printfulBasePrice,
        taeAddOnFee: p.taeAddOnFee,
        printfulDataJson: p.printfulDataJson,
      });
      if (fromMatrix != null && Number.isFinite(fromMatrix)) {
        return fromMatrix;
      }
      const pricing = parsePricingSettings(p.printfulDataJson);
      return computeRetailPrice({
        printfulBasePrice: p.printfulBasePrice,
        taeAddOnFee: p.taeAddOnFee,
        artistRoyalty: pricing.artistRoyalty,
      });
    };

    const flat = products.map((p) => {
      const cat = catMap.get(p.categoryId || "");
      const requiresQrCode =
        parseRequiresQrCode(p.printfulDataJson) ??
        (cat?.requiresQrCode ?? false);
      let fallbackHero: string | null = null;
      if (!p.heroImage && p.printfulDataJson) {
        try {
          const parsed = JSON.parse(p.printfulDataJson);
          fallbackHero = parsed?.variant?.image || parsed?.product?.image || null;
        } catch {
          fallbackHero = null;
        }
      }
      return {
        id: p.id,
        taeId: p.taeId,
        slug: p.slug,
        name: p.name,
        description: cleanDescription(p.description),
        heroImage: p.heroImage ? buildProductPreviewUrl(p.id, "hero") : fallbackHero,
        basePrice: retailPriceFor(p),
        hasMultipleVariants: false,
        variantCount: 1,
        sizeLabel: p.sizeLabel,
        paperType: p.paperType,
        orientation: p.orientation,
        requiresQrCode,
        artistSlug: parseArtistSlug(p.printfulDataJson) || null,
        coCreatorSlug: parseCoCreatorSlug(p.printfulDataJson) || null,
        categoryId: p.categoryId,
        categoryName: cat?.name || "Uncategorized",
        categorySlug: cat?.slug || "",
        categoryIcon: cat?.icon || "",
      };
    });

    const grouped = shouldGroup
      ? (() => {
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

          return Array.from(groups.values()).map((variants) => {
            // Sort by price ascending, pick cheapest as the representative
            variants.sort(
              (a, b) =>
                retailPriceFor(a) - retailPriceFor(b)
            );
            const rep = variants[0];
            const cat = catMap.get(rep.categoryId || "");
            const lowestPrice = retailPriceFor(rep);
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
              artistSlug: parseArtistSlug(rep.printfulDataJson) || null,
              coCreatorSlug: parseCoCreatorSlug(rep.printfulDataJson) || null,
              categoryId: rep.categoryId,
              categoryName: cat?.name || "Uncategorized",
              categorySlug: cat?.slug || "",
              categoryIcon: cat?.icon || "",
            };
          });
        })()
      : flat;

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
