/**
 * File Upload API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 * 
 * Handles file uploads for print-ready files
 * Uploads to WordPress Media Library via REST API
 */

import { NextRequest, NextResponse } from 'next/server';

const WP_API_BASE = process.env.WP_API_BASE;
const WP_APP_USER = process.env.WP_APP_USER;
const WP_APP_PASS = process.env.WP_APP_PASS;

// POST /api/upload - Upload a file to WordPress Media Library
export async function POST(request: NextRequest) {
  try {
    // Check WordPress credentials
    if (!WP_API_BASE || !WP_APP_USER || !WP_APP_PASS) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'WordPress API not configured',
          instructions: [
            'Set these environment variables:',
            'WP_API_BASE=https://your-site.com/wp-json',
            'WP_APP_USER=your_app_username',
            'WP_APP_PASS=your_app_password',
          ],
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileName = formData.get('fileName') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: PNG, JPEG, PDF' },
        { status: 400 }
      );
    }

    // Check file size (max 50MB for print files)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create Basic Auth header
    const auth = Buffer.from(`${WP_APP_USER}:${WP_APP_PASS}`).toString('base64');

    // Upload to WordPress Media Library
    const wpResponse = await fetch(`${WP_API_BASE}/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': file.type,
        'Content-Disposition': `attachment; filename="${fileName || file.name}"`,
      },
      body: buffer,
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error('WordPress upload failed:', errorText);
      return NextResponse.json(
        { success: false, error: `WordPress upload failed: ${wpResponse.status}` },
        { status: wpResponse.status }
      );
    }

    const wpMedia = await wpResponse.json();

    return NextResponse.json({
      success: true,
      url: wpMedia.source_url,
      mediaId: wpMedia.id,
      fileName: wpMedia.title?.rendered || fileName || file.name,
      size: file.size,
      type: file.type,
      wpDetails: {
        id: wpMedia.id,
        link: wpMedia.link,
        sizes: wpMedia.media_details?.sizes,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
