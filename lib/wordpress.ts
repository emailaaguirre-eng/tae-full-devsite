/**
 * WordPress REST API Integration
 * Fetches content from WordPress headless CMS
 * 
 * Use this to pull blog posts, pages, media, and other content
 * from your WordPress site into Next.js
 */

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || 'https://theartfulexperience.com';

/**
 * Fetch WordPress posts (blog posts)
 * @param limit - Number of posts to fetch (default: 10)
 * @param category - Optional category ID or slug
 */
export async function getPosts(limit = 10, category?: string | number) {
  try {
    if (!WP_URL) {
      console.warn('WordPress URL not configured, returning empty posts array');
      return [];
    }
    
    let url = `${WP_URL}/wp-json/wp/v2/posts?_embed&per_page=${limit}`;
    
    if (category) {
      url += `&categories=${category}`;
    }

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Get single post by slug
 */
export async function getPost(slug: string) {
  try {
    if (!WP_URL) {
      console.warn('WordPress URL not configured, returning null');
      return null;
    }
    
    const response = await fetch(
      `${WP_URL}/wp-json/wp/v2/posts?slug=${slug}&_embed`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch post');
    }

    const posts = await response.json();
    return posts[0] || null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

/**
 * Fetch WordPress pages
 */
export async function getPages() {
  try {
    if (!WP_URL) {
      console.warn('WordPress URL not configured, returning empty pages array');
      return [];
    }
    
    const response = await fetch(
      `${WP_URL}/wp-json/wp/v2/pages?_embed`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch pages');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

/**
 * Get single page by slug
 */
export async function getPage(slug: string) {
  try {
    // Ensure WP_URL is defined
    if (!WP_URL) {
      console.warn('WordPress URL not configured, skipping page fetch');
      return null;
    }
    
    const response = await fetch(
      `${WP_URL}/wp-json/wp/v2/pages?slug=${slug}&_embed`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch page');
    }

    const pages = await response.json();
    return pages[0] || null;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

/**
 * Fetch media (images) from WordPress by ID
 */
export async function getMedia(mediaId: number) {
  try {
    if (!WP_URL) {
      console.warn('WordPress URL not configured, returning null');
      return null;
    }
    
    const response = await fetch(
      `${WP_URL}/wp-json/wp/v2/media/${mediaId}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch media');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching media:', error);
    return null;
  }
}

/**
 * Fetch all media (images) from WordPress Media Library
 * @param limit - Number of images to fetch (default: 100)
 * @param mimeType - Filter by MIME type (e.g., 'image/jpeg', 'image/png')
 */
export async function getAllMedia(limit = 100, mimeType?: string) {
  try {
    if (!WP_URL) {
      console.warn('WordPress URL not configured, returning empty media array');
      return [];
    }
    
    let url = `${WP_URL}/wp-json/wp/v2/media?per_page=${limit}&_embed`;
    
    if (mimeType) {
      url += `&media_type=${mimeType}`;
    }

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch media');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching media:', error);
    return [];
  }
}

/**
 * Get image URL in specific size from WordPress media object
 * @param media - WordPress media object
 * @param size - Image size ('thumbnail', 'medium', 'large', 'full', or custom size)
 */
export function getImageUrl(media: any, size: string = 'full'): string | null {
  if (!media) return null;

  // If size is 'full', return source_url
  if (size === 'full') {
    return media.source_url || media.guid?.rendered || null;
  }

  // Check media_details for size
  if (media.media_details?.sizes?.[size]?.source_url) {
    return media.media_details.sizes[size].source_url;
  }

  // Fallback to full size
  return media.source_url || media.guid?.rendered || null;
}

/**
 * Get all available image sizes from WordPress media object
 */
export function getImageSizes(media: any): Record<string, { url: string; width: number; height: number }> {
  if (!media?.media_details?.sizes) {
    return {};
  }

  const sizes: Record<string, { url: string; width: number; height: number }> = {};
  
  Object.keys(media.media_details.sizes).forEach((sizeName) => {
    const size = media.media_details.sizes[sizeName];
    sizes[sizeName] = {
      url: size.source_url,
      width: size.width,
      height: size.height,
    };
  });

  // Add full size
  if (media.source_url) {
    sizes.full = {
      url: media.source_url,
      width: media.media_details?.width || 0,
      height: media.media_details?.height || 0,
    };
  }

  return sizes;
}

/**
 * Get featured image from post/page
 */
export function getFeaturedImage(post: any) {
  if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    return {
      url: post._embedded['wp:featuredmedia'][0].source_url,
      alt: post._embedded['wp:featuredmedia'][0].alt_text || post.title.rendered,
      width: post._embedded['wp:featuredmedia'][0].media_details?.width,
      height: post._embedded['wp:featuredmedia'][0].media_details?.height,
    };
  }
  return null;
}

/**
 * Search WordPress content
 */
export async function searchContent(query: string) {
  try {
    if (!WP_URL) {
      console.warn('WordPress URL not configured, returning empty search results');
      return [];
    }
    
    const response = await fetch(
      `${WP_URL}/wp-json/wp/v2/search?search=${encodeURIComponent(query)}&per_page=10`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search content');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
}

/**
 * Get WordPress categories
 */
export async function getCategories() {
  try {
    const response = await fetch(
      `${WP_URL}/wp-json/wp/v2/categories`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Get custom post types (if you have custom post types in WordPress)
 * Example: ArtKey configurations, CoCreators profiles
 */
export async function getCustomPosts(postType: string, limit = 10) {
  try {
    const response = await fetch(
      `${WP_URL}/wp-json/wp/v2/${postType}?per_page=${limit}&_embed`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch ${postType}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${postType}:`, error);
    return [];
  }
}

// WooCommerce functions removed - no longer using WooCommerce
// Products are now managed via Gelato API

/**
 * Get hero section content from WordPress
 * Fetches from a WordPress page with slug "home-settings" or uses default values
 */
export async function getHeroContent() {
  try {
    // Check if WP_URL is configured
    if (!WP_URL) {
      console.warn('WordPress URL not configured, returning default hero content');
      return {
        headline1: 'Every image has a story.',
        headline2: 'Embedded within is a treasure.',
        subtitle: 'Where fine art, prints & images\nmeet your personal expression.',
        description: 'Upload an image or browse our gallery.',
      };
    }
    
    // Try to fetch from a WordPress page called "Home Settings"
    const page = await getPage('home-settings');
    
    if (page) {
      // If page exists, extract content from custom fields or page content
      // You can use ACF (Advanced Custom Fields) or page content
      return {
        headline1: page.acf?.hero_headline_1 || page.acf?.headline_1 || 'Every image has a story.',
        headline2: page.acf?.hero_headline_2 || page.acf?.headline_2 || 'Embedded within is a treasure.',
        subtitle: page.acf?.hero_subtitle || page.acf?.subtitle || 'Where fine art, prints & images\nmeet your personal expression.',
        description: page.acf?.hero_description || page.acf?.description || 'Upload an image or browse our gallery.',
      };
    }
    
    // Fallback: Try to get from site options (requires authentication)
    // For now, return defaults
    return {
      headline1: 'Every image has a story.',
      headline2: 'Embedded within is a treasure.',
      subtitle: 'Where fine art, prints & images\nmeet your personal expression.',
      description: 'Upload an image or browse our gallery.',
    };
  } catch (error) {
    console.error('Error fetching hero content:', error);
    // Return defaults if WordPress is unavailable
    return {
      headline1: 'Every image has a story.',
      headline2: 'Embedded within is a treasure.',
      subtitle: 'Where fine art, prints & images\nmeet your personal expression.',
      description: 'Upload an image or browse our gallery.',
    };
  }
}

