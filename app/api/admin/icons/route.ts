/**
 * Admin Icon Management API
 * GET    /api/admin/icons — list all icons (built-in + Lucide + custom uploads) with enabled state
 * POST   /api/admin/icons — add a Lucide icon or upload a custom SVG
 * PATCH  /api/admin/icons — toggle enabled/disabled
 * DELETE /api/admin/icons?id=xxx — remove a custom/Lucide icon
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'icon-overrides.json');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'icons');
const MAX_SVG_SIZE = 100 * 1024; // 100KB

// Built-in icon keys (from ElegantIcons.tsx)
const BUILTIN_ICONS = [
  { id: 'rings', label: 'Rings', category: 'wedding' },
  { id: 'heart', label: 'Heart', category: 'love' },
  { id: 'wreath', label: 'Wreath', category: 'botanical' },
  { id: 'monogram', label: 'Monogram', category: 'formal' },
  { id: 'diamond', label: 'Diamond', category: 'luxury' },
  { id: 'infinity', label: 'Infinity', category: 'love' },
  { id: 'champagne', label: 'Champagne', category: 'celebration' },
  { id: 'dove', label: 'Dove', category: 'wedding' },
  { id: 'sparkle', label: 'Sparkle', category: 'celebration' },
  { id: 'rose', label: 'Rose', category: 'botanical' },
  { id: 'bell', label: 'Bell', category: 'celebration' },
  { id: 'crown', label: 'Crown', category: 'luxury' },
];

interface IconOverrides {
  builtinOverrides: Record<string, { enabled: boolean }>;
  customIcons: {
    id: string;
    label: string;
    category: string;
    type: 'lucide' | 'upload';
    lucideName?: string;     // Lucide icon name (e.g., 'Heart', 'Star')
    svgFilename?: string;    // uploaded SVG filename
    enabled: boolean;
    createdAt: string;
  }[];
}

function readOverrides(): IconOverrides {
  try {
    if (fs.existsSync(DATA_PATH)) return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  } catch { /* defaults */ }
  return { builtinOverrides: {}, customIcons: [] };
}

function writeOverrides(data: IconOverrides): void {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function generateIconId(): string {
  return `icon_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
}

/**
 * Sanitize SVG: strip scripts, event handlers, javascript URIs
 */
function sanitizeSvg(svg: string): string {
  // Remove <script> tags
  let clean = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Remove event handlers (onload, onerror, onclick, etc.)
  clean = clean.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
  // Remove javascript: URIs
  clean = clean.replace(/javascript\s*:/gi, 'blocked:');
  // Remove data: URIs in href/xlink:href (potential XSS)
  clean = clean.replace(/(href\s*=\s*["'])data:/gi, '$1blocked:');
  return clean;
}

// ---- Route handlers ----

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const overrides = readOverrides();

  const builtins = BUILTIN_ICONS.map((icon) => ({
    ...icon,
    type: 'builtin' as const,
    enabled: overrides.builtinOverrides[icon.id]?.enabled !== false,
  }));

  const customs = overrides.customIcons.map((icon) => ({
    ...icon,
    svgUrl: icon.svgFilename ? `/uploads/icons/${icon.svgFilename}` : undefined,
  }));

  return NextResponse.json({
    icons: [...builtins, ...customs],
    stats: {
      builtinTotal: builtins.length,
      builtinEnabled: builtins.filter((i) => i.enabled).length,
      customTotal: customs.length,
    },
  });
}

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // --- SVG upload ---
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const label = (formData.get('label') as string) || 'Custom Icon';
      const category = (formData.get('category') as string) || 'custom';

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
        return NextResponse.json({ error: 'Only SVG files are allowed' }, { status: 400 });
      }

      if (file.size > MAX_SVG_SIZE) {
        return NextResponse.json({ error: `SVG file too large. Max ${MAX_SVG_SIZE / 1024}KB.` }, { status: 400 });
      }

      // Read and sanitize
      const rawSvg = await file.text();
      const cleanSvg = sanitizeSvg(rawSvg);

      // Save to uploads
      if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      const id = generateIconId();
      const filename = `${id}.svg`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), cleanSvg);

      // Store in overrides
      const overrides = readOverrides();
      const newIcon = {
        id, label, category,
        type: 'upload' as const,
        svgFilename: filename,
        enabled: true,
        createdAt: new Date().toISOString(),
      };
      overrides.customIcons.push(newIcon);
      writeOverrides(overrides);

      return NextResponse.json({
        success: true,
        icon: { ...newIcon, svgUrl: `/uploads/icons/${filename}` },
      });
    } else {
      // --- Add Lucide icon ---
      const body = await request.json();
      const { lucideName, label, category } = body;

      if (!lucideName) {
        return NextResponse.json({ error: 'lucideName is required' }, { status: 400 });
      }

      const overrides = readOverrides();

      // Check for duplicates
      if (overrides.customIcons.find((i) => i.lucideName === lucideName)) {
        return NextResponse.json({ error: `Lucide icon "${lucideName}" already added` }, { status: 400 });
      }

      const id = generateIconId();
      const newIcon = {
        id,
        label: label || lucideName,
        category: category || 'lucide',
        type: 'lucide' as const,
        lucideName,
        enabled: true,
        createdAt: new Date().toISOString(),
      };
      overrides.customIcons.push(newIcon);
      writeOverrides(overrides);

      return NextResponse.json({ success: true, icon: newIcon });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add icon' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { id, enabled } = await request.json();
    if (!id || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'id and enabled (boolean) are required' }, { status: 400 });
    }

    const overrides = readOverrides();

    // Check built-in
    if (BUILTIN_ICONS.find((i) => i.id === id)) {
      overrides.builtinOverrides[id] = { enabled };
      writeOverrides(overrides);
      return NextResponse.json({ success: true, id, enabled });
    }

    // Check custom
    const custom = overrides.customIcons.find((i) => i.id === id);
    if (custom) {
      custom.enabled = enabled;
      writeOverrides(overrides);
      return NextResponse.json({ success: true, id, enabled });
    }

    return NextResponse.json({ error: 'Icon not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  if (BUILTIN_ICONS.find((i) => i.id === id)) {
    return NextResponse.json({ error: 'Cannot delete built-in icons. Use PATCH to disable.' }, { status: 400 });
  }

  const overrides = readOverrides();
  const idx = overrides.customIcons.findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Icon not found' }, { status: 404 });

  // Delete uploaded SVG file if exists
  const icon = overrides.customIcons[idx];
  if (icon.svgFilename) {
    const filePath = path.join(UPLOAD_DIR, icon.svgFilename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  overrides.customIcons.splice(idx, 1);
  writeOverrides(overrides);

  return NextResponse.json({ success: true, message: 'Icon deleted' });
}
