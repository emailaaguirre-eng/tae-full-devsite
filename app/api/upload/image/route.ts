import { NextResponse } from 'next/server';

/**
 * Image Upload API
 * Supports multiple backends: WordPress Media Library, Cloudinary, or local storage
 * 
 * POST /api/upload/image
 * Body: FormData with 'file' field
 * Query params: ?backend=wordpress|cloudinary|local
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const backend = searchParams.get('backend') || 'wordpress'; // Default to WordPress

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    let result: { url: string; id: string | number; metadata?: any };

    switch (backend) {
      case 'wordpress':
        result = await uploadToWordPress(file);
        break;
      case 'cloudinary':
        result = await uploadToCloudinary(file);
        break;
      case 'local':
        result = await uploadToLocal(file);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid backend specified' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      id: result.id,
      backend: backend,
      metadata: result.metadata || {},
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

/**
 * Upload to WordPress Media Library
 */
async function uploadToWordPress(file: File) {
  const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_URL;
  
  if (!WP_URL) {
    throw new Error('WordPress URL not configured. Set NEXT_PUBLIC_WORDPRESS_URL');
  }

  // Get WordPress credentials (optional - for authenticated uploads)
  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Create form data for WordPress
  const formData = new FormData();
  const blob = new Blob([buffer], { type: file.type });
  formData.append('file', blob, file.name);

  // Prepare headers
  const headers: HeadersInit = {};
  
  if (username && appPassword) {
    // Use Application Password authentication
    const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  // Upload to WordPress
  const response = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WordPress upload failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    url: data.source_url || data.media_details?.sizes?.full?.source_url || data.guid?.rendered,
    id: data.id,
    metadata: {
      width: data.media_details?.width,
      height: data.media_details?.height,
      mime_type: data.mime_type,
    },
  };
}

/**
 * Upload to Cloudinary (if configured)
 */
async function uploadToCloudinary(file: File) {
  const cloudinaryUrl = process.env.CLOUDINARY_UPLOAD_URL;
  
  if (!cloudinaryUrl) {
    throw new Error('Cloudinary not configured. Set CLOUDINARY_UPLOAD_URL');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'default');

  const response = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    url: data.secure_url || data.url,
    id: data.public_id,
    metadata: {
      width: data.width,
      height: data.height,
      format: data.format,
    },
  };
}

/**
 * Upload to local storage (for development/testing)
 * Note: This won't work on Netlify - use WordPress or Cloudinary for production
 */
async function uploadToLocal(file: File): Promise<{ url: string; id: string | number; metadata?: any }> {
  // For production, you'd want to use a proper storage solution
  // This is just for development/testing
  throw new Error('Local upload not supported in production. Use WordPress or Cloudinary backend.');
}

