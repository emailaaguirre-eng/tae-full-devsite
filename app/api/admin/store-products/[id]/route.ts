/**
 * Store Product CRUD API
 * 
 * GET /api/admin/store-products/[id] - Get single product
 * PUT /api/admin/store-products/[id] - Update product
 * DELETE /api/admin/store-products/[id] - Delete product
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get single store product
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const product = await prisma.storeProduct.findUnique({
      where: { id },
      include: {
        gelatoCatalog: {
          select: {
            catalogUid: true,
            title: true,
            attributesJson: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        allowedFormats: product.allowedFormats ? JSON.parse(product.allowedFormats) : null,
        allowedPapers: product.allowedPapers ? JSON.parse(product.allowedPapers) : null,
        allowedCoatings: product.allowedCoatings ? JSON.parse(product.allowedCoatings) : null,
        allowedFoils: product.allowedFoils ? JSON.parse(product.allowedFoils) : null,
        allowedFolds: product.allowedFolds ? JSON.parse(product.allowedFolds) : null,
        galleryImages: product.galleryImages ? JSON.parse(product.galleryImages) : null,
        editorConfig: product.editorConfig ? JSON.parse(product.editorConfig) : null,
        gelatoCatalog: product.gelatoCatalog ? {
          ...product.gelatoCatalog,
          attributes: product.gelatoCatalog.attributesJson 
            ? JSON.parse(product.gelatoCatalog.attributesJson) 
            : [],
        } : null,
      },
    });
  } catch (error) {
    console.error('[StoreProducts API] Get error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch store product' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update store product
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if product exists
    const existing = await prisma.storeProduct.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changing
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.storeProduct.findUnique({
        where: { slug: body.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'A product with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Get catalog ID if changing
    let gelatoCatalogId = existing.gelatoCatalogId;
    if (body.gelatoCatalogUid !== undefined) {
      if (body.gelatoCatalogUid === null) {
        gelatoCatalogId = null;
      } else {
        const catalog = await prisma.gelatoCatalog.findUnique({
          where: { catalogUid: body.gelatoCatalogUid },
        });
        if (!catalog) {
          return NextResponse.json(
            { success: false, error: `Catalog ${body.gelatoCatalogUid} not found` },
            { status: 400 }
          );
        }
        gelatoCatalogId = catalog.id;
      }
    }

    // Build update data
    const updateData: any = {};

    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.shortDescription !== undefined) updateData.shortDescription = body.shortDescription;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.heroImage !== undefined) updateData.heroImage = body.heroImage;
    if (body.galleryImages !== undefined) {
      updateData.galleryImages = body.galleryImages ? JSON.stringify(body.galleryImages) : null;
    }
    if (gelatoCatalogId !== existing.gelatoCatalogId) {
      updateData.gelatoCatalogId = gelatoCatalogId;
    }
    if (body.allowedFormats !== undefined) {
      updateData.allowedFormats = body.allowedFormats ? JSON.stringify(body.allowedFormats) : null;
    }
    if (body.allowedPapers !== undefined) {
      updateData.allowedPapers = body.allowedPapers ? JSON.stringify(body.allowedPapers) : null;
    }
    if (body.allowedCoatings !== undefined) {
      updateData.allowedCoatings = body.allowedCoatings ? JSON.stringify(body.allowedCoatings) : null;
    }
    if (body.allowedFoils !== undefined) {
      updateData.allowedFoils = body.allowedFoils ? JSON.stringify(body.allowedFoils) : null;
    }
    if (body.allowedFolds !== undefined) {
      updateData.allowedFolds = body.allowedFolds ? JSON.stringify(body.allowedFolds) : null;
    }
    if (body.basePrice !== undefined) updateData.basePrice = body.basePrice;
    if (body.defaultBleedMm !== undefined) updateData.defaultBleedMm = body.defaultBleedMm;
    if (body.defaultSafeMm !== undefined) updateData.defaultSafeMm = body.defaultSafeMm;
    if (body.defaultDpi !== undefined) updateData.defaultDpi = body.defaultDpi;
    if (body.editorConfig !== undefined) {
      updateData.editorConfig = body.editorConfig ? JSON.stringify(body.editorConfig) : null;
    }
    if (body.active !== undefined) updateData.active = body.active;
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.metaTitle !== undefined) updateData.metaTitle = body.metaTitle;
    if (body.metaDescription !== undefined) updateData.metaDescription = body.metaDescription;

    const product = await prisma.storeProduct.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('[StoreProducts API] Update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update store product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete store product
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await prisma.storeProduct.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    await prisma.storeProduct.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted',
    });
  } catch (error) {
    console.error('[StoreProducts API] Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete store product' },
      { status: 500 }
    );
  }
}
