import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { spawn } from 'child_process';
import { canAdminAccessDemoPortal, hasValidAdminSession, validateOwnerToken } from '@/lib/portal-auth';
import { validatePortalSession } from '@/lib/portal-session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Allow longer processing time for larger uploads.
export const maxDuration = 120;


const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'artkey');
const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateFilename(originalName: string): string {
  const ext = path.extname(originalName) || '.png';
  const timestamp = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${rand}${ext}`;
}

function ensurePathWithinDir(filePath: string, dirPath: string) {
  const resolvedFile = path.resolve(filePath);
  const resolvedDir = path.resolve(dirPath);
  if (resolvedFile !== resolvedDir && !resolvedFile.startsWith(`${resolvedDir}${path.sep}`)) {
    throw new Error('Invalid upload file path');
  }
}

async function convertMovToMp4(inputPath: string, outputPath: string): Promise<void> {
  ensurePathWithinDir(inputPath, UPLOAD_DIR);
  ensurePathWithinDir(outputPath, UPLOAD_DIR);

  await new Promise<void>((resolve, reject) => {
    const args = [
      '-i',
      inputPath,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '23',
      '-c:a',
      'aac',
      '-movflags',
      '+faststart',
      outputPath,
    ];

    const child = spawn(FFMPEG_BIN, args, {
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `ffmpeg exited with code ${code}`));
      }
    });
  });
}

async function convertHeicToJpeg(inputPath: string, outputPath: string): Promise<void> {
  ensurePathWithinDir(inputPath, UPLOAD_DIR);
  ensurePathWithinDir(outputPath, UPLOAD_DIR);

  const mod = await import('heic-convert');
  const convert = (mod as any).default || mod;
  const inputBuffer = fs.readFileSync(inputPath);

  const outputBuffer = await convert({
    buffer: inputBuffer,
    format: 'JPEG',
    quality: 0.92,
  });

  fs.writeFileSync(outputPath, Buffer.from(outputBuffer));
}

async function convertBmpToPng(inputPath: string, outputPath: string): Promise<void> {
  ensurePathWithinDir(inputPath, UPLOAD_DIR);
  ensurePathWithinDir(outputPath, UPLOAD_DIR);

  await new Promise<void>((resolve, reject) => {
    const args = [
      '-y',
      '-i',
      inputPath,
      outputPath,
    ];

    const child = spawn(FFMPEG_BIN, args, {
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `ffmpeg exited with code ${code}`));
      }
    });
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const publicToken = (formData.get('publicToken') as string | null)?.trim() || '';
    const ownerToken = (formData.get('ownerToken') as string | null)?.trim() || '';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Host-only uploads: require portal context + owner/admin authorization.
    if (!publicToken) {
      return NextResponse.json(
        { success: false, error: 'Missing portal token for upload' },
        { status: 400 }
      );
    }

    const ownerMatch = ownerToken
      ? (await validateOwnerToken(publicToken, ownerToken)).valid
      : false;
    const session = validatePortalSession(req, publicToken);
    const sessionAllowed = session.valid && (session.mode === 'owner' || session.mode === 'admin_demo');
    const adminDemoAccess = canAdminAccessDemoPortal(req, publicToken);
    const adminSession = hasValidAdminSession(req);

    if (!ownerMatch && !sessionAllowed && !adminDemoAccess && !adminSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized upload attempt' },
        { status: 403 }
      );
    }

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'image/heic', 'image/heif', 'image/bmp',
      'video/mp4', 'video/webm', 'video/quicktime',
    ];

    const ext = path.extname(file.name || '').toLowerCase();
    const inferredTypeByExtension: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.heic': 'image/heic',
      '.heif': 'image/heif',
      '.bmp': 'image/bmp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.m4v': 'video/mp4',
    };

    const rawType = (file.type || '').toLowerCase();
    const effectiveType =
      rawType && rawType !== 'application/octet-stream'
        ? rawType
        : (inferredTypeByExtension[ext] || rawType);

    if (!allowedTypes.includes(effectiveType)) {
      return NextResponse.json(
        {
          success: false,
          error: `File type ${file.type || 'unknown'} not allowed${ext ? ` (extension: ${ext})` : ''}`,
        },
        { status: 400 }
      );
    }

    const defaultImageMaxBytes = 20 * 1024 * 1024; // 20MB
    const defaultVideoMaxBytes = 200 * 1024 * 1024; // 200MB
    const configuredImageMaxBytes = Number(process.env.ARTKEY_IMAGE_UPLOAD_MAX_BYTES || defaultImageMaxBytes);
    const configuredVideoMaxBytes = Number(process.env.ARTKEY_VIDEO_UPLOAD_MAX_BYTES || defaultVideoMaxBytes);
    const isVideo = effectiveType.startsWith('video/');
    const maxSize = isVideo ? configuredVideoMaxBytes : configuredImageMaxBytes;

    if (file.size > maxSize) {
      const maxMb = Math.round(maxSize / 1024 / 1024);
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Max ${maxMb}MB for ${isVideo ? 'videos' : 'images'}.`,
        },
        { status: 400 }
      );
    }

    ensureDir(UPLOAD_DIR);

    const filename = generateFilename(file.name);
    const filepath = path.join(UPLOAD_DIR, filename);
    ensurePathWithinDir(filepath, UPLOAD_DIR);

    try {
      await pipeline(
        Readable.fromWeb(file.stream() as any),
        fs.createWriteStream(filepath)
      );
    } catch (writeError: any) {
      console.error('File upload write failed:', writeError);
      return NextResponse.json(
        { success: false, error: 'Video upload failed while writing file.' },
        { status: 500 }
      );
    }

    let finalFilename = filename;
    let finalFilePath = filepath;
    let finalType = effectiveType;
    let converted = false;

    const shouldConvertMov = false; // Preserve MOV uploads as-is to avoid large-file conversion failures.
    const shouldConvertHeic = !isVideo && ['.heic', '.heif'].includes(ext.toLowerCase());
    const shouldConvertBmp = !isVideo && ext.toLowerCase() === '.bmp';

    if (shouldConvertMov) {
      const mp4Filename = `${path.basename(filename, path.extname(filename))}.mp4`;
      const mp4FilePath = path.join(UPLOAD_DIR, mp4Filename);
      ensurePathWithinDir(mp4FilePath, UPLOAD_DIR);

      try {
        await convertMovToMp4(filepath, mp4FilePath);
      } catch (conversionError: any) {
        console.error('MOV to MP4 conversion failed:', conversionError);
        return NextResponse.json(
          { success: false, error: 'Video conversion failed. Please contact support.' },
          { status: 500 }
        );
      }

      fs.unlinkSync(filepath);
      finalFilename = mp4Filename;
      finalFilePath = mp4FilePath;
      finalType = 'video/mp4';
      converted = true;
    }

    if (shouldConvertHeic) {
      const jpgFilename = `${path.basename(filename, path.extname(filename))}.jpg`;
      const jpgFilePath = path.join(UPLOAD_DIR, jpgFilename);
      ensurePathWithinDir(jpgFilePath, UPLOAD_DIR);

      try {
        await convertHeicToJpeg(filepath, jpgFilePath);
      } catch (conversionError: any) {
        console.error('HEIC to JPEG conversion failed:', conversionError);
        return NextResponse.json(
          { success: false, error: 'Image conversion failed. Please try a JPG/PNG, or contact support.' },
          { status: 500 }
        );
      }

      fs.unlinkSync(filepath);
      finalFilename = jpgFilename;
      finalFilePath = jpgFilePath;
      finalType = 'image/jpeg';
      converted = true;
    }

    if (shouldConvertBmp) {
      const pngFilename = `${path.basename(filename, path.extname(filename))}.png`;
      const pngFilePath = path.join(UPLOAD_DIR, pngFilename);
      ensurePathWithinDir(pngFilePath, UPLOAD_DIR);

      try {
        await convertBmpToPng(filepath, pngFilePath);
      } catch (conversionError: any) {
        console.error('BMP to PNG conversion failed:', conversionError);
        return NextResponse.json(
          { success: false, error: 'BMP conversion failed. Please try another image, or contact support.' },
          { status: 500 }
        );
      }

      fs.unlinkSync(filepath);
      finalFilename = pngFilename;
      finalFilePath = pngFilePath;
      finalType = 'image/png';
      converted = true;
    }

    const finalSize = fs.statSync(finalFilePath).size;
    const url = `/uploads/artkey/${finalFilename}`;

    return NextResponse.json({
      success: true,
      url,
      fileUrl: url,
      id: Date.now(),
      filename: finalFilename,
      size: finalSize,
      type: finalType,
      converted,
    });
  } catch (err: any) {
    console.error('File upload failed:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
