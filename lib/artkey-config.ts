/**
 * Utility functions for working with ArtKey configurations
 */

export interface ArtKeyConfig {
  enabled: boolean;
  productId: string;
  productName: string;
  hotspot: {
    x: string;
    y: string;
    size: string;
  };
  artKeyData: {
    title: string;
    theme: {
      template: string;
      bg_color: string;
      bg_image_url?: string;
      text_color?: string;
      title_color?: string;
      button_color?: string;
      button_gradient?: string;
      font?: string;
    };
    links: Array<{ label: string; url: string }>;
    features: {
      enable_gallery: boolean;
      enable_video: boolean;
      show_guestbook: boolean;
      allow_img_uploads: boolean;
      allow_vid_uploads?: boolean;
    };
    spotify?: { url: string };
    gallery_images?: string[];
    gallery_videos?: string[];
  };
}

/**
 * Fetch ArtKey configuration for a product
 */
export async function getArtKeyConfig(productId: string): Promise<ArtKeyConfig | null> {
  try {
    const response = await fetch(`/api/artkey/config?productId=${productId}`);
    const data = await response.json();
    
    if (data.success && data.config) {
      return data.config;
    }
    return null;
  } catch (error) {
    console.error('Error fetching ArtKey config:', error);
    return null;
  }
}

/**
 * Save ArtKey configuration for a product
 */
export async function saveArtKeyConfig(config: Partial<ArtKeyConfig>): Promise<boolean> {
  try {
    const response = await fetch('/api/artkey/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: config.productId, config }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error saving ArtKey config:', error);
    return false;
  }
}

/**
 * Delete ArtKey configuration for a product
 */
export async function deleteArtKeyConfig(productId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/artkey/config?productId=${productId}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error deleting ArtKey config:', error);
    return false;
  }
}

