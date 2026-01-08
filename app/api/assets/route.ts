/**
 * Asset Upload API
 * Handles image uploads for the designer (replaces base64 storage)
 * Optimizes images with Sharp and returns asset metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 4000; // Max width/height in pixels
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest) {
  try {
    // Parse form data
    const formData = await req.formData();
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
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }
    
    // Generate unique asset ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const assetId = `asset_${timestamp}_${random}`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Process with Sharp
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Resize if needed (preserve aspect ratio, don't upscale)
    let processed = image.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });
    
    // Convert to JPEG for consistency and compression
    processed = processed.jpeg({
      quality: 90,
      mozjpeg: true,
    });
    
    const optimizedBuffer = await processed.toBuffer();
    const optimizedMetadata = await sharp(optimizedBuffer).metadata();
    
    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
    
    // Save to disk
    const filename = `${assetId}.jpg`;
    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, optimizedBuffer);
    
    // Return asset metadata
    return NextResponse.json({
      assetId,
      url: `/uploads/${filename}`,
      width: optimizedMetadata.width || metadata.width || 0,
      height: optimizedMetadata.height || metadata.height || 0,
      mimeType: 'image/jpeg',
      size: optimizedBuffer.length,
      createdAt: timestamp,
    });
  } catch (error) {
    console.error('[Assets API] Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve asset metadata by ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get('id');
    
    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID required' },
        { status: 400 }
      );
    }
    
    // Validate asset exists
    const filename = `${assetId}.jpg`;
    const filepath = join(UPLOAD_DIR, filename);
    
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    // Return metadata (in production, this would query a database)
    return NextResponse.json({
      assetId,
      url: `/uploads/${filename}`,
      exists: true,
    });
  } catch (error) {
    console.error('[Assets API] Get error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve asset' },
      { status: 500 }
    );
  }
}

