/**
 * Public Templates API
 * GET /api/templates — returns all enabled templates (built-in + custom)
 * Used by the ArtKey editor to populate the template picker.
 * No auth required (public).
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ALL_TEMPLATES } from '@/components/artkey/templates';

export const dynamic = 'force-dynamic';

const DATA_PATH = path.join(process.cwd(), 'data', 'template-overrides.json');

export async function GET() {
  // Read overrides (if file doesn't exist, all built-ins are enabled, no custom)
  let builtinOverrides: Record<string, { enabled: boolean }> = {};
  let customTemplates: any[] = [];

  try {
    if (fs.existsSync(DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
      builtinOverrides = data.builtinOverrides || {};
      customTemplates = data.customTemplates || [];
    }
  } catch { /* use defaults */ }

  // Built-in templates — only include enabled ones
  const enabledBuiltins = ALL_TEMPLATES.filter(
    (t) => builtinOverrides[t.value]?.enabled !== false
  );

  // Custom templates — only include enabled ones
  const enabledCustom = customTemplates.filter((t: any) => t.enabled !== false);

  // Combine and return
  const all = [
    ...enabledBuiltins.map((t) => ({ ...t, id: t.value, builtin: true })),
    ...enabledCustom.map((t: any) => ({ ...t, builtin: false })),
  ];

  return NextResponse.json({ templates: all });
}
