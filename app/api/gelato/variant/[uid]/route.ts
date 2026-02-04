import { NextRequest, NextResponse } from 'next/server';
import { getGelatoProduct } from '@/lib/gelato';
import { findVariantByUid, loadCachedCatalog, gelatoDimensionToMm } from '@/lib/gelatoCatalog';

/**
 * GET /api/gelato/variant/[uid]
 * Returns Gelato variant details with dimensions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const variantUid = params.uid;
    
    // Try to find variant in cached catalog first
    const cached = loadCachedCatalog();
    if (cached) {
      const result = findVariantByUid(cached.products, variantUid);
      if (result) {
        const { product, variant } = result;
        
        // Convert dimensions to mm if available
        let trimMm = null;
        if (variant.dimensions) {
          trimMm = gelatoDimensionToMm(variant.dimensions);
        }
        
        return NextResponse.json({
          uid: variant.uid,
          name: variant.name,
          productUid: product.uid,
          productName: product.name,
          catalogUid: product.catalogUid,
          dimensions: variant.dimensions,
          trimMm,
          attributes: variant.attributes,
        });
      }
    }
    
    // Fallback: fetch from Gelato API directly
    // This is less efficient but works if cache is missing
    try {
      // Extract product UID from variant UID (format: productUid_variantId)
      const productUid = variantUid.split('_')[0];
      const productData = await getGelatoProduct(productUid);
      
      // Find variant in product data
      const variant = productData.variants?.find((v: any) => v.uid === variantUid);
      if (variant) {
        let trimMm = null;
        if (variant.dimensions) {
          trimMm = gelatoDimensionToMm({
            width: variant.dimensions.width || variant.dimensions.w,
            height: variant.dimensions.height || variant.dimensions.h,
            unit: variant.dimensions.unit || 'mm',
          });
        }
        
        return NextResponse.json({
          uid: variant.uid,
          name: variant.name,
          productUid: productData.uid,
          productName: productData.name,
          dimensions: variant.dimensions,
          trimMm,
          attributes: variant.attributes,
        });
      }
    } catch (error) {
      console.error('Error fetching variant from API:', error);
    }
    
    return NextResponse.json(
      { error: 'Variant not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error fetching variant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch variant' },
      { status: 500 }
    );
  }
}

