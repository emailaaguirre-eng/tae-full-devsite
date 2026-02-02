/**
 * Media URL Helper
 * 
 * Provides a single source-of-truth for media URLs, allowing easy migration
 * from WordPress media hosting to a future CDN/storage solution.
 * 
 * WordPress is currently used as a media repository only. All image URLs
 * under https://theartfulexperience.com/wp-content/uploads/... must continue
 * to work with zero changes.
 */

/**
 * Get the media base URL from environment variable
 * Defaults to https://theartfulexperience.com if not set
 */
function getMediaBaseUrl(): string {
  return process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 'https://theartfulexperience.com';
}

/**
 * Build a full media URL from a path
 * 
 * @param path - Image path. Can be:
 *   - Absolute URL (starts with http:// or https://) → returned as-is
 *   - Relative path (e.g., /wp-content/uploads/2024/01/image.jpg) → prefixed with base URL
 *   - WP uploads path (e.g., wp-content/uploads/...) → normalized and prefixed
 * 
 * @returns Full absolute URL to the media file
 * 
 * @example
 * mediaUrl('/wp-content/uploads/2024/01/image.jpg')
 * // → 'https://theartfulexperience.com/wp-content/uploads/2024/01/image.jpg'
 * 
 * @example
 * mediaUrl('https://theartfulexperience.com/wp-content/uploads/2024/01/image.jpg')
 * // → 'https://theartfulexperience.com/wp-content/uploads/2024/01/image.jpg' (unchanged)
 * 
 * @example
 * mediaUrl('wp-content/uploads/2024/01/image.jpg')
 * // → 'https://theartfulexperience.com/wp-content/uploads/2024/01/image.jpg'
 */
export function mediaUrl(path: string | null | undefined): string {
  // Handle null/undefined
  if (!path) {
    return '';
  }

  // If already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Normalize path: ensure it starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Get base URL and remove trailing slash if present
  const baseUrl = getMediaBaseUrl().replace(/\/$/, '');

  // Combine base URL with normalized path
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Check if a URL is from WordPress media
 * 
 * @param url - URL to check
 * @returns true if URL contains wp-content/uploads
 */
export function isWordPressMedia(url: string): boolean {
  return url.includes('wp-content/uploads');
}

/**
 * Extract the relative path from a WordPress media URL
 * 
 * @param url - Full WordPress media URL
 * @returns Relative path (e.g., /wp-content/uploads/2024/01/image.jpg)
 *          or empty string if not a WordPress media URL
 * 
 * @example
 * extractWpMediaPath('https://theartfulexperience.com/wp-content/uploads/2024/01/image.jpg')
 * // → '/wp-content/uploads/2024/01/image.jpg'
 */
export function extractWpMediaPath(url: string): string {
  if (!isWordPressMedia(url)) {
    return '';
  }

  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    // If URL parsing fails, try to extract path manually
    const match = url.match(/\/wp-content\/uploads\/.*/);
    return match ? match[0] : '';
  }
}

