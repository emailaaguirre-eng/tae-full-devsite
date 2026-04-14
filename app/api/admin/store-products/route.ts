/**
 * Store Products API
 * GET  /api/admin/store-products       - List all products
 * POST /api/admin/store-products       - Create a new product
 *
 * @copyright B&D Servicing LLC 2026
 */
import { NextResponse } from 'next/server';
import { getDb, shopProducts, shopCategories, desc, eq, generateId } from '@/lib/db';
import { saveDatabase } from '@/db';
import {
  DEFAULT_WATERMARK,
  mergeProductMeta,
  parseRequiresQrCode,
  parseArtistSlug,
  parseCoCreatorSlug,
  parseFamilyKey,
  parseCustomizable,
  parseWatermarkSettings,
  parseProductMeta,
  parseSemanticProductType,
  parseVariantMatrix,
  parseProductTags,
} from '@/lib/product-watermark';
import { DEFAULT_PRICING, computeRetailPrice, parsePricingSettings } from '@/lib/product-pricing';
import { ensureStoreCategoryHierarchy } from '@/lib/store-category-tree';
import { loadImagesByProductIds, mergeLegacyAndDbImages } from '@/lib/shop-product-images';
import {
  buildLibraryResolvedForMerge,
  collectLibraryAssetIdsFromProducts,
  fetchProductMediaUrlMap,
} from '@/lib/product-library-assignments';

export const dynamic = 'force-dynamic';

function getProofTermsFromMeta(raw: string | null | undefined): string {
  const parsed = parseProductMeta(raw);
  return typeof parsed?.proofTerms === 'string' ? parsed.proofTerms : '';
}

function withProofTermsMeta(
  raw: string | null | undefined,
  proofTerms: string
): string {
  return mergeProductMeta(raw, { proofTerms });
}

export async function GET(req: Request) {
  try {
    await ensureStoreCategoryHierarchy();
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');

    // Get all categories for lookup
    const cats = await db.select().from(shopCategories).all();
    const catMap = new Map(cats.map(c => [c.id, c]));

    // Get products
    let products;
    if (categorySlug) {
      const cat = cats.find(c => c.slug === categorySlug);
      if (!cat) {
        return NextResponse.json({ success: true, data: [], categories: cats.map(c => ({ slug: c.slug, name: c.name, id: c.id })) });
      }
      products = await db
        .select()
        .from(shopProducts)
        .where(eq(shopProducts.categoryId, cat.id))
        .orderBy(desc(shopProducts.active), desc(shopProducts.sortOrder))
        .all();
    } else {
      products = await db
        .select()
        .from(shopProducts)
        .orderBy(desc(shopProducts.active), desc(shopProducts.sortOrder))
        .all();
    }

    const productIds = products.map((p) => p.id);
    const imagesByProduct = await loadImagesByProductIds(db, productIds);
    const libAssetIds = collectLibraryAssetIdsFromProducts(products);
    const libUrlMap = await fetchProductMediaUrlMap(db, libAssetIds);

    const buildPathLabel = (categoryId: string | null | undefined): string => {
      if (!categoryId) return "";
      const names: string[] = [];
      const visited = new Set<string>();
      let current = catMap.get(categoryId);
      while (current && !visited.has(current.id)) {
        visited.add(current.id);
        names.unshift(current.name);
        current = current.parentId ? catMap.get(current.parentId) : undefined;
      }
      return names.join(" > ");
    };

    const mapped = products.map((p) => {
      const cat = catMap.get(p.categoryId || '');
      const pricing = parsePricingSettings(p.printfulDataJson);
      const dbImg = imagesByProduct.get(p.id) || [];
      const libraryResolved = buildLibraryResolvedForMerge(
        p.libraryHeroMediaId,
        p.libraryGalleryMediaIdsJson,
        libUrlMap
      );
      const productImages = mergeLegacyAndDbImages(
        p.id,
        p.heroImage,
        p.galleryImages,
        dbImg,
        libraryResolved
      );
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        productType: parseSemanticProductType(p.printfulDataJson),
        heroImage: p.heroImage,
        galleryImages: p.galleryImages,
        libraryHeroMediaId: p.libraryHeroMediaId || null,
        libraryGalleryMediaIdsJson: p.libraryGalleryMediaIdsJson || null,
        productImages,
        artworkSourceUrl: p.artworkSourceUrl || null,
        basePrice: computeRetailPrice({
          printfulBasePrice: p.printfulBasePrice,
          taeAddOnFee: p.taeAddOnFee,
          artistRoyalty: pricing.artistRoyalty,
        }),
        printfulBasePrice: p.printfulBasePrice || 0,
        taeAddOnFee: p.taeAddOnFee || 0,
        active: p.active ?? false,
        sortOrder: p.sortOrder ?? 0,
        createdAt: p.createdAt || '',
        updatedAt: p.updatedAt || '',
        printProvider: p.printProvider || 'printful',
        printfulProductId: p.printfulProductId,
        printfulVariantId: p.printfulVariantId,
        sizeLabel: p.sizeLabel,
        paperType: p.paperType,
        finishType: p.finishType,
        taeId: p.taeId,
        categoryId: p.categoryId,
        categoryName: cat?.name || 'Uncategorized',
        categorySlug: cat?.slug || '',
        categoryPathLabel: buildPathLabel(p.categoryId),
        proofTerms: getProofTermsFromMeta(p.printfulDataJson),
        requiresQrCode: parseRequiresQrCode(p.printfulDataJson) ?? (cat?.requiresQrCode ?? false),
        customizable: parseCustomizable(p.printfulDataJson) ?? false,
        artistSlug: parseArtistSlug(p.printfulDataJson) || null,
        coCreatorSlug: parseCoCreatorSlug(p.printfulDataJson) || null,
        familyKey: parseFamilyKey(p.printfulDataJson) || null,
        variantMatrix: parseVariantMatrix(p.printfulDataJson),
        watermark: parseWatermarkSettings(p.printfulDataJson),
        pricing,
        tags: parseProductTags(p.printfulDataJson),
        artistId: p.artistId || null,
        coCreatorId: p.coCreatorId || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: mapped,
      categories: cats.map(c => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        parentId: c.parentId || null,
        categoryType: c.categoryType || "leaf",
        pathLabel: buildPathLabel(c.id),
        icon: c.icon,
        taeBaseFee: c.taeBaseFee,
        requiresQrCode: c.requiresQrCode ?? false,
        productCount: products.filter(p => p.categoryId === c.id).length,
      })),
    });
  } catch (err: any) {
    console.error('Failed to fetch products:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureStoreCategoryHierarchy();
    const db = await getDb();
    const body = await req.json();

    const id = generateId();
    const now = Date.now().toString();
    const slug = body.slug || body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || id;
    const taeId = body.taeId || `TAE-${slug.toUpperCase().slice(0, 20)}`;
    const semanticProductType =
      typeof body.productType === 'string' && body.productType.trim()
        ? body.productType.trim()
        : 'art-print';

    let categoryId = body.categoryId;
    if (!categoryId) {
      const cats = await db.select().from(shopCategories).all();
      const defaultLeaf = cats.find((c) => (c.categoryType || "leaf") === "leaf");
      categoryId = defaultLeaf?.id || cats[0]?.id || null;
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'No categories found. Run seed-all.js first.' },
        { status: 400 }
      );
    }

    const tagsFromBody = Array.isArray(body.tags)
      ? (body.tags as unknown[])
          .filter((t): t is string => typeof t === 'string')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    await db.insert(shopProducts).values({
      id,
      taeId,
      categoryId,
      slug,
      name: body.name || 'New Product',
      description: body.description || null,
      printProvider: body.productType === 'printful_print' ? 'printful' : (body.printProvider || 'printful'),
      printfulProductId: body.printfulProductId || null,
      printfulVariantId: body.printfulVariantId || null,
      printfulBasePrice: body.printfulBasePrice || 0,
      taeAddOnFee: body.taeAddOnFee || 0,
      sizeLabel: body.sizeLabel || null,
      paperType: body.paperType || null,
      finishType: body.finishType || null,
      heroImage: body.heroImage || null,
      galleryImages: body.galleryImages || null,
      artworkSourceUrl: body.artworkSourceUrl || null,
      printDpi: body.defaultDpi || body.printDpi || 300,
      printWidth: body.printWidth || null,
      printHeight: body.printHeight || null,
      requiredPlacements: body.requiredPlacements || null,
      qrDefaultPosition: body.qrDefaultPosition || null,
      artistId:
        body.artistId === null || body.artistId === ""
          ? null
          : typeof body.artistId === "string" && body.artistId.trim()
            ? body.artistId.trim()
            : null,
      coCreatorId:
        body.coCreatorId === null || body.coCreatorId === ""
          ? null
          : typeof body.coCreatorId === "string" && body.coCreatorId.trim()
            ? body.coCreatorId.trim()
            : null,
      printfulDataJson: mergeProductMeta(
        withProofTermsMeta(null, body.proofTerms || ''),
        {
          productType: semanticProductType,
          requiresQrCode: typeof body.requiresQrCode === 'boolean' ? body.requiresQrCode : undefined,
          customizable: typeof body.customizable === 'boolean' ? body.customizable : undefined,
          artistSlug: typeof body.artistSlug === 'string' ? body.artistSlug.trim() || undefined : undefined,
          coCreatorSlug: typeof body.coCreatorSlug === 'string' ? body.coCreatorSlug.trim() || undefined : undefined,
          familyKey: typeof body.familyKey === 'string' ? body.familyKey.trim() || undefined : undefined,
          variantMatrix: Array.isArray(body.variantMatrix) ? body.variantMatrix : undefined,
          ...(Array.isArray(body.tags) ? { tags: tagsFromBody } : {}),
          watermark: body.watermark || DEFAULT_WATERMARK,
          pricing: body.pricing || DEFAULT_PRICING,
        }
      ),
      active: body.active !== false,
      sortOrder: body.sortOrder || 0,
      createdAt: now,
      updatedAt: now,
    });

    await saveDatabase();
    return NextResponse.json({ success: true, data: { id, slug } });
  } catch (err: any) {
    console.error('Failed to create product:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
