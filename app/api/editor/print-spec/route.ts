/**
 * Editor PrintSpec API
 * 
 * GET /api/editor/print-spec?productUid=xxx - Generate PrintSpec from Gelato product
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generatePrintSpec } from '@/lib/gelato/printSpecGenerator';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productUid = searchParams.get('productUid');

    if (!productUid) {
      return NextResponse.json(
        { success: false, error: 'productUid parameter required' },
        { status: 400 }
      );
    }

    // Find the Gelato product
    const product = await prisma.gelatoProduct.findUnique({
      where: { productUid },
      include: {
        catalog: {
          select: {
            catalogUid: true,
            title: true,
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

    // Generate PrintSpec
    const printSpec = generatePrintSpec(product, product.catalog?.catalogUid);

    return NextResponse.json({
      success: true,
      product: {
        productUid: product.productUid,
        paperFormat: product.paperFormat,
        paperType: product.paperType,
        orientation: product.orientation,
        foldingType: product.foldingType,
        coatingType: product.coatingType,
        spotFinishing: product.spotFinishing,
        widthMm: product.widthMm,
        heightMm: product.heightMm,
        catalog: product.catalog?.catalogUid,
      },
      printSpec,
    });
  } catch (error) {
    console.error('[PrintSpec API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate print specification' },
      { status: 500 }
    );
  }
}
