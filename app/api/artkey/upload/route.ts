import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { canAdminAccessDemoPortal, hasValidAdminSession, validateOwnerToken } from '@/lib/portal-auth';
import { validatePortalSession } from '@/lib/portal-session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Allow larger file uploads (up to 10MB)
export const maxDuration = 30;


const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'artkey');

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

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Max 10MB.' },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/quicktime',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `File type ${file.type} not allowed` },
        { status: 400 }
      );
    }

    ensureDir(UPLOAD_DIR);

    const filename = generateFilename(file.name);
    const filepath = path.join(UPLOAD_DIR, filename);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(bytes));

    const url = `/uploads/artkey/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      fileUrl: url,
      id: Date.now(),
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (err: any) {
    console.error('File upload failed:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
