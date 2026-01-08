import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mark as dynamic
export const dynamic = 'force-dynamic';

interface WordPressProduct {
  title: string;
  image: string;
  description?: string;
  price?: number;
  id?: string;
  slug?: string;
}

/**
 * Fetch product data from WordPress URL
 */
async function fetchWordPressProduct(url: string): Promise<WordPressProduct | null> {
  try {
    // Try to fetch via WordPress REST API
    // Extract post ID or slug from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    
    // Try to find post ID or slug
    let postId: string | null = null;
    let slug: string | null = null;
    
    // Check if URL contains post ID (e.g., /?p=123)
    const postIdParam = urlObj.searchParams.get('p');
    if (postIdParam) {
      postId = postIdParam;
    } else {
      // Try to extract slug from path (e.g., /product-name/)
      slug = pathParts[pathParts.length - 1] || null;
    }
    
    // Try WordPress REST API
    const wpApiBase = process.env.WP_API_BASE;
    if (!wpApiBase) {
      throw new Error('WP_API_BASE not configured');
    }
    
    let apiUrl = '';
    if (postId) {
      apiUrl = `${wpApiBase}/wp/v2/posts/${postId}`;
    } else if (slug) {
      apiUrl = `${wpApiBase}/wp/v2/posts?slug=${slug}`;
    } else {
      throw new Error('Could not extract post ID or slug from URL');
    }
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.WP_APP_USER}:${process.env.WP_APP_PASS}`).toString('base64')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }
    
    const data = await response.json();
    const post = Array.isArray(data) ? data[0] : data;
    
    if (!post) {
      return null;
    }
    
    // Extract featured image
    let image = '';
    if (post.featured_media) {
      try {
        const mediaResponse = await fetch(`${wpApiBase}/wp/v2/media/${post.featured_media}`, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.WP_APP_USER}:${process.env.WP_APP_PASS}`).toString('base64')}`,
          },
        });
        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          image = mediaData.source_url || mediaData.guid?.rendered || '';
        }
      } catch (e) {
        console.warn('Failed to fetch featured image:', e);
      }
    }
    
    // Extract price from meta or content
    let price: number | undefined;
    const priceMeta = post.meta?._price || post.meta?.price;
    if (priceMeta) {
      price = parseFloat(priceMeta);
    }
    
    return {
      title: post.title?.rendered || post.title || 'Untitled',
      image: image || '',
      description: post.excerpt?.rendered || post.excerpt || post.content?.rendered?.substring(0, 500) || '',
      price: price,
      id: post.id?.toString(),
      slug: post.slug || slug,
    };
  } catch (error) {
    console.error(`Failed to fetch WordPress product from ${url}:`, error);
    return null;
  }
}

/**
 * POST /api/admin/artwork-products/import
 * Bulk import products from WordPress URLs
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urls, artist, artistSlug } = body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      );
    }
    
    if (!artist || !artistSlug) {
      return NextResponse.json(
        { error: 'Artist name and slug are required' },
        { status: 400 }
      );
    }
    
    const results = [];
    const errors = [];
    
    // Process each URL
    for (const url of urls) {
      if (!url || typeof url !== 'string') continue;
      
      try {
        const productData = await fetchWordPressProduct(url.trim());
        
        if (!productData) {
          errors.push({ url, error: 'Failed to fetch product data' });
          continue;
        }
        
        // Generate slug from title
        const slug = productData.slug || 
          productData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        // Check if product already exists
        const existing = await prisma.artworkProduct.findUnique({
          where: { slug },
        });
        
        if (existing) {
          // Update existing product
          const updated = await prisma.artworkProduct.update({
            where: { slug },
            data: {
              title: productData.title,
              image: productData.image,
              description: productData.description,
              startingPrice: productData.price,
              wordpressUrl: url.trim(),
              wordpressId: productData.id,
            },
          });
          results.push({ url, action: 'updated', product: updated });
        } else {
          // Create new product
          const created = await prisma.artworkProduct.create({
            data: {
              title: productData.title,
              image: productData.image,
              description: productData.description,
              startingPrice: productData.price,
              artist,
              artistSlug,
              wordpressUrl: url.trim(),
              wordpressId: productData.id,
              slug,
            },
          });
          results.push({ url, action: 'created', product: created });
        }
      } catch (error) {
        errors.push({ 
          url, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      imported: results.length,
      errors: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: 'Failed to import products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

