/**
 * Store Products API
 * 
 * GET /api/admin/store-products - List all store products
 * POST /api/admin/store-products - Create new store product
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET - List all store products
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = {};
    if (activeOnly) {
      where.active = true;
    }

    const products = await prisma.storeProduct.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      include: {
        gelatoCatalog: {
          select: {
            catalogUid: true,
            title: true,
            _count: {
              select: { products: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: products.map(p => ({
        ...p,
        allowedFormats: p.allowedFormats ? JSON.parse(p.allowedFormats) : null,
        allowedPapers: p.allowedPapers ? JSON.parse(p.allowedPapers) : null,
        allowedCoatings: p.allowedCoatings ? JSON.parse(p.allowedCoatings) : null,
        allowedFoils: p.allowedFoils ? JSON.parse(p.allowedFoils) : null,
        allowedFolds: p.allowedFolds ? JSON.parse(p.allowedFolds) : null,
        galleryImages: p.galleryImages ? JSON.parse(p.galleryImages) : null,
        editorConfig: p.editorConfig ? JSON.parse(p.editorConfig) : null,
      })),
    });
  } catch (error) {
    console.error('[StoreProducts API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch store products' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new store product
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      slug,
      name,
      description,
      shortDescription,
      icon,
      heroImage,
      galleryImages,
      gelatoCatalogUid,
      allowedFormats,
      allowedPapers,
      allowedCoatings,
      allowedFoils,
      allowedFolds,
      basePrice,
      defaultBleedMm,
      defaultSafeMm,
      defaultDpi,
      editorConfig,
      active,
      featured,
      requiresArtKey,
      sortOrder,
      metaTitle,
      metaDescription,
    } = body;

    // Validate required fields
    if (!slug || !name) {
      return NextResponse.json(
        { success: false, error: 'slug and name are required' },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.storeProduct.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A product with this slug already exists' },
        { status: 400 }
      );
    }

    // Get catalog ID if provided
    let gelatoCatalogId: string | null = null;
    if (gelatoCatalogUid) {
      const catalog = await prisma.gelatoCatalog.findUnique({
        where: { catalogUid: gelatoCatalogUid },
      });
      if (!catalog) {
        return NextResponse.json(
          { success: false, error: `Catalog ${gelatoCatalogUid} not found` },
          { status: 400 }
        );
      }
      gelatoCatalogId = catalog.id;
    }

    // Create the product
    const product = await prisma.storeProduct.create({
      data: {
        slug,
        name,
        description: description || null,
        shortDescription: shortDescription || null,
        icon: icon || null,
        heroImage: heroImage || null,
        galleryImages: galleryImages ? JSON.stringify(galleryImages) : null,
        gelatoCatalogId,
        allowedFormats: allowedFormats ? JSON.stringify(allowedFormats) : null,
        allowedPapers: allowedPapers ? JSON.stringify(allowedPapers) : null,
        allowedCoatings: allowedCoatings ? JSON.stringify(allowedCoatings) : null,
        allowedFoils: allowedFoils ? JSON.stringify(allowedFoils) : null,
        allowedFolds: allowedFolds ? JSON.stringify(allowedFolds) : null,
        basePrice: basePrice ?? 0,
        defaultBleedMm: defaultBleedMm ?? 4,
        defaultSafeMm: defaultSafeMm ?? 4,
        defaultDpi: defaultDpi ?? 300,
        editorConfig: editorConfig ? JSON.stringify(editorConfig) : null,
        active: active ?? true,
        featured: featured ?? false,
        requiresArtKey: requiresArtKey ?? false,
        sortOrder: sortOrder ?? 0,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('[StoreProducts API] Create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create store product' },
      { status: 500 }
    );
  }
}
