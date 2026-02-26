import { createReadStream, existsSync, statSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type RouteContext = {
  params: {
    path: string[];
  };
};

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

const CACHE_CONTROL = 'no-store';

function hasUnsafeSegments(segments: string[]): boolean {
  return segments.some((segment) => {
    const decoded = decodeURIComponent(segment);
    return (
      decoded.includes('..') ||
      decoded.includes('\0') ||
      decoded.startsWith('/') ||
      decoded.startsWith('\\') ||
      decoded.includes(':')
    );
  });
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function resolveUploadPath(segments: string[]): string | null {
  const root = process.cwd();
  const candidateBases = [path.join(root, 'uploads'), path.join(root, 'public', 'uploads')];

  for (const base of candidateBases) {
    const resolved = path.resolve(base, ...segments);
    if (!resolved.startsWith(path.resolve(base) + path.sep) && resolved !== path.resolve(base)) {
      continue;
    }
    if (existsSync(resolved) && statSync(resolved).isFile()) {
      return resolved;
    }
  }

  return null;
}

function rangeNotSatisfiable(fileSize: number): NextResponse {
  return new NextResponse('Range Not Satisfiable', {
    status: 416,
    headers: {
      'Content-Range': `bytes */${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': CACHE_CONTROL,
    },
  });
}

function parseRange(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return null;

  const startRaw = match[1];
  const endRaw = match[2];

  let start: number;
  let end: number;

  if (!startRaw && !endRaw) return null;

  if (!startRaw && endRaw) {
    const suffixLength = Number.parseInt(endRaw, 10);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(fileSize - suffixLength, 0);
    end = fileSize - 1;
  } else {
    start = Number.parseInt(startRaw, 10);
    end = endRaw ? Number.parseInt(endRaw, 10) : fileSize - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= fileSize) {
    return null;
  }

  end = Math.min(end, fileSize - 1);
  return { start, end };
}

async function handleRequest(request: NextRequest, context: RouteContext, isHead: boolean): Promise<NextResponse> {
  const segments = context.params.path || [];
  if (segments.length === 0 || hasUnsafeSegments(segments)) {
    return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': CACHE_CONTROL } });
  }

  const filePath = resolveUploadPath(segments);
  if (!filePath) {
    return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': CACHE_CONTROL } });
  }

  const stats = statSync(filePath);
  const fileSize = stats.size;
  const contentType = getContentType(filePath);
  const rangeHeader = request.headers.get('range');

  if (!rangeHeader) {
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Length': String(fileSize),
      'Accept-Ranges': 'bytes',
      'Cache-Control': CACHE_CONTROL,
    });

    if (isHead) return new NextResponse(null, { status: 200, headers });

    const stream = createReadStream(filePath);
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers,
    });
  }

  const parsed = parseRange(rangeHeader, fileSize);
  if (!parsed) {
    return rangeNotSatisfiable(fileSize);
  }

  const { start, end } = parsed;
  const chunkSize = end - start + 1;
  const headers = new Headers({
    'Content-Type': contentType,
    'Content-Length': String(chunkSize),
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Cache-Control': CACHE_CONTROL,
  });

  if (isHead) return new NextResponse(null, { status: 206, headers });

  const stream = createReadStream(filePath, { start, end });
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    status: 206,
    headers,
  });
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return handleRequest(request, context, false);
}

export async function HEAD(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return handleRequest(request, context, true);
}
