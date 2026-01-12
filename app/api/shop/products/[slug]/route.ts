/**
 * Single Store Product API
 * 
 * GET /api/shop/products/[slug] - Get product details with Gelato catalog info
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const product = await prisma.storeProduct.findUnique({
      where: { slug, active: true },
      include: {
        gelatoCatalog: {
          select: {
            id: true,
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
    console.error('[Shop Product API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
