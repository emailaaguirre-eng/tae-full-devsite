/**
 * Public Icons API
 * GET /api/icons — returns all enabled icons (built-in + Lucide + custom)
 * Used by the ArtKey editor to populate the icon picker.
 * No auth required (public).
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_PATH = path.join(process.cwd(), 'data', 'icon-overrides.json');

const BUILTIN_ICONS = [
  { id: 'rings', label: 'Rings', category: 'wedding', type: 'builtin' },
  { id: 'heart', label: 'Heart', category: 'love', type: 'builtin' },
  { id: 'wreath', label: 'Wreath', category: 'botanical', type: 'builtin' },
  { id: 'monogram', label: 'Monogram', category: 'formal', type: 'builtin' },
  { id: 'diamond', label: 'Diamond', category: 'luxury', type: 'builtin' },
  { id: 'infinity', label: 'Infinity', category: 'love', type: 'builtin' },
  { id: 'champagne', label: 'Champagne', category: 'celebration', type: 'builtin' },
  { id: 'dove', label: 'Dove', category: 'wedding', type: 'builtin' },
  { id: 'sparkle', label: 'Sparkle', category: 'celebration', type: 'builtin' },
  { id: 'rose', label: 'Rose', category: 'botanical', type: 'builtin' },
  { id: 'bell', label: 'Bell', category: 'celebration', type: 'builtin' },
  { id: 'crown', label: 'Crown', category: 'luxury', type: 'builtin' },
];

export async function GET() {
  let builtinOverrides: Record<string, { enabled: boolean }> = {};
  let customIcons: any[] = [];

  try {
    if (fs.existsSync(DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
      builtinOverrides = data.builtinOverrides || {};
      customIcons = data.customIcons || [];
    }
  } catch { /* defaults */ }

  const enabledBuiltins = BUILTIN_ICONS.filter(
    (i) => builtinOverrides[i.id]?.enabled !== false
  );

  const enabledCustom = customIcons
    .filter((i: any) => i.enabled !== false)
    .map((i: any) => ({
      id: i.id,
      label: i.label,
      category: i.category,
      type: i.type,
      lucideName: i.lucideName,
      svgUrl: i.svgFilename ? `/uploads/icons/${i.svgFilename}` : undefined,
    }));

  return NextResponse.json({
    icons: [...enabledBuiltins, ...enabledCustom],
  });
}
