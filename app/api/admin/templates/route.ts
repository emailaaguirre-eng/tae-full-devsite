/**
 * Admin Template Management API
 * GET  /api/admin/templates — list all templates (built-in + custom, with enabled/disabled state)
 * POST /api/admin/templates — create a new custom template
 * PATCH /api/admin/templates — toggle built-in template enabled/disabled, or update custom template
 * DELETE /api/admin/templates?id=xxx — delete a custom template
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import fs from 'fs';
import path from 'path';
import { ALL_TEMPLATES, ArtKeyTemplate } from '@/components/artkey/templates';

const DATA_PATH = path.join(process.cwd(), 'data', 'template-overrides.json');

// ----- Persistence helpers -----

interface TemplateOverrides {
  /** Map of built-in template value -> { enabled: boolean } */
  builtinOverrides: Record<string, { enabled: boolean }>;
  /** Custom templates added by admin */
  customTemplates: (ArtKeyTemplate & { id: string; enabled: boolean; createdAt: string })[];
}

function readOverrides(): TemplateOverrides {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading template overrides:', e);
  }
  return { builtinOverrides: {}, customTemplates: [] };
}

function writeOverrides(data: TemplateOverrides): void {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function generateTemplateId(): string {
  return `custom_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

// ----- Route handlers -----

/** GET — return full template list (built-in + custom) with enabled state */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const overrides = readOverrides();

  // Built-in templates with enabled flag
  const builtins = ALL_TEMPLATES.map((t) => ({
    ...t,
    id: t.value, // stable ID = value for built-ins
    builtin: true,
    enabled: overrides.builtinOverrides[t.value]?.enabled !== false, // default enabled
  }));

  // Custom templates
  const customs = overrides.customTemplates.map((t) => ({
    ...t,
    builtin: false,
  }));

  return NextResponse.json({
    templates: [...builtins, ...customs],
    stats: {
      builtinTotal: builtins.length,
      builtinEnabled: builtins.filter((t) => t.enabled).length,
      customTotal: customs.length,
      customEnabled: customs.filter((t) => t.enabled).length,
    },
  });
}

/** POST — create a new custom template */
export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, bg, button, text, title, category, buttonStyle, buttonShape, headerIcon, titleFont, buttonBorder, cloneFrom } = body;

    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    const overrides = readOverrides();

    // If cloning, start from an existing template
    let base: Partial<ArtKeyTemplate> = {};
    if (cloneFrom) {
      const source = ALL_TEMPLATES.find((t) => t.value === cloneFrom)
        || overrides.customTemplates.find((t) => t.id === cloneFrom);
      if (source) {
        base = { ...source };
        delete (base as any).id;
        delete (base as any).value;
      }
    }

    const id = generateTemplateId();
    const newTemplate = {
      id,
      value: id, // value = id for custom templates
      name,
      bg: bg || base.bg || '#FFFFFF',
      button: button || base.button || '#4f46e5',
      text: text || base.text || '#1d1d1f',
      title: title || base.title || '#4f46e5',
      category: (category || base.category || 'classic') as ArtKeyTemplate['category'],
      buttonStyle: buttonStyle || base.buttonStyle,
      buttonShape: buttonShape || base.buttonShape,
      headerIcon: headerIcon || base.headerIcon,
      titleFont: titleFont || base.titleFont,
      buttonBorder: buttonBorder || base.buttonBorder,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    overrides.customTemplates.push(newTemplate);
    writeOverrides(overrides);

    return NextResponse.json({ success: true, template: newTemplate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create template' }, { status: 500 });
  }
}

/** PATCH — toggle enabled/disabled for built-in OR update a custom template */
export async function PATCH(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, enabled, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template id is required' }, { status: 400 });
    }

    const overrides = readOverrides();

    // Check if it's a built-in
    const builtin = ALL_TEMPLATES.find((t) => t.value === id);
    if (builtin) {
      // Only toggle enabled for built-ins
      if (typeof enabled === 'boolean') {
        overrides.builtinOverrides[id] = { enabled };
        writeOverrides(overrides);
      }
      return NextResponse.json({
        success: true,
        template: { ...builtin, id: builtin.value, builtin: true, enabled: enabled !== false },
      });
    }

    // Otherwise it's a custom template — allow full update
    const idx = overrides.customTemplates.findIndex((t) => t.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const current = overrides.customTemplates[idx];
    overrides.customTemplates[idx] = {
      ...current,
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.bg !== undefined && { bg: updates.bg }),
      ...(updates.button !== undefined && { button: updates.button }),
      ...(updates.text !== undefined && { text: updates.text }),
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.buttonStyle !== undefined && { buttonStyle: updates.buttonStyle }),
      ...(updates.buttonShape !== undefined && { buttonShape: updates.buttonShape }),
      ...(updates.headerIcon !== undefined && { headerIcon: updates.headerIcon }),
      ...(updates.titleFont !== undefined && { titleFont: updates.titleFont }),
      ...(updates.buttonBorder !== undefined && { buttonBorder: updates.buttonBorder }),
      ...(typeof enabled === 'boolean' && { enabled }),
    };

    writeOverrides(overrides);
    return NextResponse.json({ success: true, template: overrides.customTemplates[idx] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update template' }, { status: 500 });
  }
}

/** DELETE — remove a custom template (built-ins cannot be deleted, only disabled) */
export async function DELETE(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Template id is required' }, { status: 400 });
  }

  // Cannot delete built-ins
  if (ALL_TEMPLATES.find((t) => t.value === id)) {
    return NextResponse.json({ error: 'Cannot delete built-in templates. Use PATCH to disable.' }, { status: 400 });
  }

  const overrides = readOverrides();
  const idx = overrides.customTemplates.findIndex((t) => t.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  overrides.customTemplates.splice(idx, 1);
  writeOverrides(overrides);

  return NextResponse.json({ success: true, message: 'Template deleted' });
}
