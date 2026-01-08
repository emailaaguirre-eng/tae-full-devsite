/**
 * Drafts API
 * Handles saving and retrieving design drafts (NO base64 allowed!)
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { PhysicalDesignDraft } from '@/lib/designer/types';

const DRAFTS_DIR = join(process.cwd(), 'data', 'drafts');

// Ensure drafts directory exists
async function ensureDraftsDir() {
  if (!existsSync(DRAFTS_DIR)) {
    await mkdir(DRAFTS_DIR, { recursive: true });
  }
}

/**
 * POST /api/drafts - Save a new draft
 */
export async function POST(req: NextRequest) {
  try {
    const draft: PhysicalDesignDraft = await req.json();
    
    // CRITICAL: Validate no base64 data in draft
    const validation = validateDraft(draft);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Draft validation failed', details: validation.errors },
        { status: 400 }
      );
    }
    
    // Generate draft ID if not provided
    const draftId = draft.id || `draft_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const updatedDraft: PhysicalDesignDraft = {
      ...draft,
      id: draftId,
      updatedAt: Date.now(),
      version: 1, // Schema version
    };
    
    // Save to file system (in production, use database)
    await ensureDraftsDir();
    const filepath = join(DRAFTS_DIR, `${draftId}.json`);
    await writeFile(filepath, JSON.stringify(updatedDraft, null, 2));
    
    return NextResponse.json({
      success: true,
      draftId,
      url: `/designer/draft/${draftId}`,
    });
  } catch (error) {
    console.error('[Drafts API] Save error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save draft' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/drafts - List all drafts (optional: filter by user)
 */
export async function GET(req: NextRequest) {
  try {
    await ensureDraftsDir();
    
    // In production, query database with pagination
    // For now, just return success (implementation TBD)
    return NextResponse.json({
      drafts: [],
      message: 'List endpoint not yet implemented',
    });
  } catch (error) {
    console.error('[Drafts API] List error:', error);
    return NextResponse.json(
      { error: 'Failed to list drafts' },
      { status: 500 }
    );
  }
}

/**
 * Validate draft for base64 data
 */
function validateDraft(draft: PhysicalDesignDraft): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!draft.productType) errors.push('productType is required');
  if (!draft.selection) errors.push('selection is required');
  if (!draft.printSpecId) errors.push('printSpecId is required');
  if (!draft.design) errors.push('design is required');
  
  // Check for base64 in design objects
  for (const sideId in draft.design.sides) {
    const side = draft.design.sides[sideId];
    for (const obj of side.objects) {
      // Check assetUrl for base64 data URLs
      if (obj.assetUrl && obj.assetUrl.startsWith('data:')) {
        errors.push(
          `Object ${obj.id} on side ${sideId} contains base64 data. ` +
          `Upload assets via /api/assets first.`
        );
      }
      
      // Check for any src fields (legacy)
      if ((obj as any).src && (obj as any).src.startsWith('data:')) {
        errors.push(
          `Object ${obj.id} on side ${sideId} contains base64 in 'src' field. ` +
          `Use assetId/assetUrl instead.`
        );
      }
    }
    
    // Check background images
    if (side.background?.imageAssetId && side.background.imageAssetId.startsWith('data:')) {
      errors.push(`Side ${sideId} background contains base64 data`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

