/**
 * ArtKey Compose Route
 * Generates a print-ready PNG by compositing a QR code onto the ArtKey SVG template.
 *
 * POST /api/artkey/compose
 * Body: { public_token: string }
 *
 * Uses ArtKey-Template-v3.svg (cropped viewBox 80 5 1170 550, aspect ~2.13:1)
 * Key anatomy in SVG coords:
 *   Teeth:     x ≈ 973–1206, y ≈ 20–125
 *   Shaft bar: y ≈ 348–376 (center ≈ 362)
 *
 * QR placement: centered in gap between teeth and bar.
 *   SVG coords: (983, 129) size 215×215
 *   ViewBox-relative: (903, 124) size 215×215
 *   Render matches viewBox (1170×550) for 1:1 pixel mapping.
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { getDb, artKeys, eq } from '@/lib/db';

// Compose dimensions — cropped template (viewBox 80 5 1170 550, aspect ~2.13:1)
// Render matches viewBox for 1:1 coordinate mapping.
const RENDER_W = 1170;
const RENDER_H = 550;

// Box dimensions in viewBox-relative coords
const BOX_X = 880;
const BOX_Y = 105;
const BOX_W = 260;    // wider to span teeth
const BOX_H = 230;    // fits above bar with clearance

// QR code is square (230×230), centered horizontally in the wider box
const QR_SIZE = 230;
const QR_X = BOX_X + Math.round((BOX_W - QR_SIZE) / 2);  // centered in box
const QR_Y = BOX_Y;  // top-aligned with box

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_token } = body;

    if (!public_token || !/^[a-z0-9]+$/.test(public_token)) {
      return NextResponse.json(
        { error: 'Valid public_token is required' },
        { status: 400 }
      );
    }

    // Verify the ArtKey exists
    const db = await getDb();
    const artKey = await db
      .select({ id: artKeys.id, publicToken: artKeys.publicToken })
      .from(artKeys)
      .where(eq(artKeys.publicToken, public_token))
      .get();

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found' },
        { status: 404 }
      );
    }

    // 1. Load SVG template — prefer v3, then FINAL, then fallback
    const templateNames = ['ArtKey-Template-v3.svg', 'ArtKey-Template-FINAL.svg', 'theAE_ArtKey.svg'];
    let svgPath = '';
    for (const name of templateNames) {
      const candidate = path.join(process.cwd(), 'public', 'templates', name);
      if (fs.existsSync(candidate)) { svgPath = candidate; break; }
    }
    if (!svgPath) {
      return NextResponse.json(
        { error: 'ArtKey SVG template not found' },
        { status: 500 }
      );
    }
    const svgBuffer = fs.readFileSync(svgPath);

    // 2. Generate QR code as PNG buffer
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.theartfulexperience.com';
    const qrTargetUrl = `${siteUrl}/artkey/${public_token}`;

    const qrBuffer = await QRCode.toBuffer(qrTargetUrl, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: QR_SIZE,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    // 3. Render SVG to PNG at target size (16:9), then composite QR on top
    const svgPng = await sharp(svgBuffer)
      .resize(RENDER_W, RENDER_H, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();

    const qrResized = await sharp(qrBuffer)
      .resize(QR_SIZE, QR_SIZE)
      .png()
      .toBuffer();

    const composed = await sharp(svgPng)
      .composite([
        {
          input: qrResized,
          left: QR_X,
          top: QR_Y,
        },
      ])
      .png()
      .toBuffer();

    // 4. Save files
    const composedDir = path.join(process.cwd(), 'public', 'uploads', 'composed');
    if (!fs.existsSync(composedDir)) {
      fs.mkdirSync(composedDir, { recursive: true });
    }

    const outputFilename = `${public_token}.png`;
    const outputPath = path.join(composedDir, outputFilename);
    fs.writeFileSync(outputPath, composed);

    const qrDir = path.join(process.cwd(), 'public', 'uploads', 'qr');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
    const qrOutputPath = path.join(qrDir, `${public_token}.png`);
    fs.writeFileSync(qrOutputPath, qrBuffer);

    // 5. Return URLs
    const composedUrl = `${siteUrl}/uploads/composed/${outputFilename}`;
    const qrUrl = `${siteUrl}/uploads/qr/${public_token}.png`;

    return NextResponse.json({
      success: true,
      composedUrl,
      qrUrl,
      qrTargetUrl,
      dimensions: { width: RENDER_W, height: RENDER_H },
    });
  } catch (error: any) {
    console.error('Error composing ArtKey:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compose ArtKey image' },
      { status: 500 }
    );
  }
}
