/**
 * Store Product by ID API
 *
 * @copyright B&D Servicing LLC 2026
 */
import { NextResponse } from 'next/server';
import { inArray } from 'drizzle-orm';
import { getDb, shopProducts, shopProductImages, productMediaLibrary, eq } from '@/lib/db';
import { saveDatabase } from '@/db';
import {
  mergeLegacyAndDbImages,
  parseIncomingProductImages,
  replaceProductImagesForProduct,
  deleteImagesForProduct,
  reconcileImagesTableWithProductColumns,
} from '@/lib/shop-product-images';
import { mergeProductMeta, parseProductMeta, parseRequiresQrCode,
  parseArtistSlug,
  parseCoCreatorSlug, parseFamilyKey, parseCustomizable, parseWatermarkSettings, parseVariantMatrix, parseSemanticProductType, parseProductTags } from '@/lib/product-watermark';
import { parsePricingSettings } from '@/lib/product-pricing';
import { galleryIdsJsonFromList, parseLibraryGalleryIdsJson } from '@/lib/product-library-ids';
import { buildLibraryResolvedForMerge, fetchProductMediaUrlMap } from '@/lib/product-library-assignments';

export const dynamic = 'force-dynamic';

async function validateLibraryAssignmentRefs(
  db: Awaited<ReturnType<typeof getDb>>,
  heroId: string | null | undefined,
  galleryJson: string | null | undefined
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ids: string[] = [];
  if (heroId?.trim()) ids.push(heroId.trim());
  ids.push(...parseLibraryGalleryIdsJson(galleryJson));
  const uniq = [...new Set(ids)];
  if (uniq.length === 0) return { ok: true };
  const rows = await db
    .select({ id: productMediaLibrary.id })
    .from(productMediaLibrary)
    .where(inArray(productMediaLibrary.id, uniq))
    .all();
  const found = new Set(rows.map((r) => r.id));
  for (const x of uniq) {
    if (!found.has(x)) return { ok: false, error: `Unknown Product Media Library asset: ${x}` };
  }
  return { ok: true };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const product = await db.select().from(shopProducts).where(eq(shopProducts.id, id)).get();
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    const imgRows = await db.select().from(shopProductImages).where(eq(shopProductImages.productId, id)).all();
    const libIds: string[] = [];
    if (product.libraryHeroMediaId?.trim()) libIds.push(product.libraryHeroMediaId.trim());
    libIds.push(...parseLibraryGalleryIdsJson(product.libraryGalleryMediaIdsJson));
    const libUrlMap = await fetchProductMediaUrlMap(db, libIds);
    const libraryResolved = buildLibraryResolvedForMerge(
      product.libraryHeroMediaId,
      product.libraryGalleryMediaIdsJson,
      libUrlMap
    );
    const productImages = mergeLegacyAndDbImages(
      product.id,
      product.heroImage,
      product.galleryImages,
      imgRows,
      libraryResolved
    );
    return NextResponse.json({
      success: true,
      data: {
        ...product,
        productImages,
        artworkSourceUrl: product.artworkSourceUrl || null,
        productType: parseSemanticProductType(product.printfulDataJson),
        requiresQrCode: parseRequiresQrCode(product.printfulDataJson),
        customizable: parseCustomizable(product.printfulDataJson),
        artistSlug: parseArtistSlug(product.printfulDataJson) || null,
        coCreatorSlug: parseCoCreatorSlug(product.printfulDataJson) || null,
        familyKey: parseFamilyKey(product.printfulDataJson) || null,
        variantMatrix: parseVariantMatrix(product.printfulDataJson),
        watermark: parseWatermarkSettings(product.printfulDataJson),
        pricing: parsePricingSettings(product.printfulDataJson),
        tags: parseProductTags(product.printfulDataJson),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const body = await req.json();
    const existing = await db.select().from(shopProducts).where(eq(shopProducts.id, id)).get();
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    const allowedFields = [
      'name', 'slug', 'description', 'heroImage', 'galleryImages', 'artworkSourceUrl', 'sizeLabel',
      'paperType', 'finishType', 'orientation', 'active', 'sortOrder',
      'printProvider', 'printfulProductId', 'printfulVariantId',
      'printfulBasePrice', 'taeAddOnFee', 'printDpi', 'categoryId',
      'printWidth', 'printHeight', 'requiredPlacements', 'qrDefaultPosition',
      'artistId', 'coCreatorId',
    ];

    const skipLegacyImageColumns = body.productImages !== undefined;
    for (const field of allowedFields) {
      if (skipLegacyImageColumns && (field === 'heroImage' || field === 'galleryImages')) {
        continue;
      }
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (body.productType !== undefined) {
      const pt =
        typeof body.productType === 'string' && body.productType.trim()
          ? body.productType.trim()
          : 'art-print';
      updates.printfulDataJson = mergeProductMeta(
        updates.printfulDataJson ?? existing.printfulDataJson,
        { productType: pt }
      );
    }

    if (body.proofTerms !== undefined) {
      updates.printfulDataJson = mergeProductMeta(
        updates.printfulDataJson ?? existing.printfulDataJson,
        { proofTerms: typeof body.proofTerms === 'string' ? body.proofTerms : '' }
      );
    }

    if (body.requiresQrCode !== undefined) {
      updates.printfulDataJson = mergeProductMeta(
        updates.printfulDataJson ?? existing.printfulDataJson,
        { requiresQrCode: !!body.requiresQrCode }
      );
    }

    if (body.customizable !== undefined) {
      updates.printfulDataJson = mergeProductMeta(
        updates.printfulDataJson ?? existing.printfulDataJson,
        { customizable: !!body.customizable }
      );
    }

    if (body.artistSlug !== undefined) {
      updates.printfulDataJson = mergeProductMeta(
        updates.printfulDataJson ?? existing.printfulDataJson,
        { artistSlug: typeof body.artistSlug === 'string' ? body.artistSlug.trim() || undefined : undefined }
      );
    }

    if (body.coCreatorSlug !== undefined) {
      updates.printfulDataJson = mergeProductMeta(
        updates.printfulDataJson ?? existing.printfulDataJson,
        { coCreatorSlug: typeof body.coCreatorSlug === 'string' ? body.coCreatorSlug.trim() || undefined : undefined }
      );
    }

    if (body.familyKey !== undefined) {
      updates.printfulDataJson = mergeProductMeta(
        updates.printfulDataJson ?? existing.printfulDataJson,
        { familyKey: typeof body.familyKey === 'string' ? body.familyKey.trim() || undefined : undefined }
      );
    }

    if (body.variantMatrix !== undefined) {
      updates.printfulDataJson = mergeProductMeta(
        updates.printfulDataJson ?? existing.printfulDataJson,
        { variantMatrix: Array.isArray(body.variantMatrix) ? body.variantMatrix : [] }
      );
    }

    if (body.tags !== undefined) {
      const list = Array.isArray(body.tags)
        ? (body.tags as unknown[])
            .filter((t): t is string => typeof t === 'string')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      updates.printfulDataJson = mergeProductMeta(
        updates.printfulDataJson ?? existing.printfulDataJson,
        { tags: list }
      );
    }

    if (body.watermark !== undefined) {
      const baseMeta = parseProductMeta(updates.printfulDataJson ?? existing.printfulDataJson);
      updates.printfulDataJson = mergeProductMeta(JSON.stringify(baseMeta), {
        watermark: body.watermark,
      });
    }

    if (body.pricing !== undefined) {
      const baseMeta = parseProductMeta(updates.printfulDataJson ?? existing.printfulDataJson);
      updates.printfulDataJson = mergeProductMeta(JSON.stringify(baseMeta), {
        pricing: body.pricing,
      });
    }

    if (body.productImages !== undefined) {
      const parsed = parseIncomingProductImages(body.productImages);
      if (parsed === null) {
        return NextResponse.json({ success: false, error: 'Invalid productImages array' }, { status: 400 });
      }
      if (parsed.length > 30) {
        return NextResponse.json({ success: false, error: 'Maximum 30 images per product' }, { status: 400 });
      }
      const derived = await replaceProductImagesForProduct(db, id, parsed);
      updates.heroImage = derived.heroImage;
      updates.galleryImages = derived.galleryImagesJson;
    }

    if (body.libraryHeroMediaId !== undefined) {
      const v = body.libraryHeroMediaId;
      if (v === null || v === '') {
        updates.libraryHeroMediaId = null;
      } else if (typeof v === 'string' && v.trim()) {
        updates.libraryHeroMediaId = v.trim();
      } else {
        return NextResponse.json({ success: false, error: 'Invalid libraryHeroMediaId' }, { status: 400 });
      }
    }
    if (body.libraryGalleryMediaIdsJson !== undefined || body.libraryGalleryMediaIds !== undefined) {
      const raw = body.libraryGalleryMediaIdsJson ?? body.libraryGalleryMediaIds;
      if (raw === null || raw === '') {
        updates.libraryGalleryMediaIdsJson = JSON.stringify([]);
      } else if (Array.isArray(raw)) {
        updates.libraryGalleryMediaIdsJson = galleryIdsJsonFromList(raw as string[]);
      } else if (typeof raw === 'string') {
        updates.libraryGalleryMediaIdsJson = raw.trim() ? raw : JSON.stringify([]);
      } else {
        return NextResponse.json({ success: false, error: 'Invalid library gallery ids' }, { status: 400 });
      }
    }

    if (
      body.libraryHeroMediaId !== undefined ||
      body.libraryGalleryMediaIdsJson !== undefined ||
      body.libraryGalleryMediaIds !== undefined
    ) {
      const nextHero =
        updates.libraryHeroMediaId !== undefined ? updates.libraryHeroMediaId : existing.libraryHeroMediaId;
      const nextGal =
        updates.libraryGalleryMediaIdsJson !== undefined
          ? updates.libraryGalleryMediaIdsJson
          : existing.libraryGalleryMediaIdsJson;
      const check = await validateLibraryAssignmentRefs(db, nextHero, nextGal);
      if (!check.ok) {
        return NextResponse.json({ success: false, error: check.error }, { status: 400 });
      }
    }

    updates.updatedAt = Date.now().toString();

    await db.update(shopProducts).set(updates).where(eq(shopProducts.id, id));

    if (body.productImages === undefined && (updates.heroImage !== undefined || updates.galleryImages !== undefined)) {
      const hero = updates.heroImage !== undefined ? updates.heroImage : existing.heroImage;
      const gal = updates.galleryImages !== undefined ? updates.galleryImages : existing.galleryImages;
      await reconcileImagesTableWithProductColumns(db, id, hero, gal);
    }
    await saveDatabase();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    await deleteImagesForProduct(db, id);
    await db.delete(shopProducts).where(eq(shopProducts.id, id));
    await saveDatabase();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete product' }, { status: 500 });
  }
}
