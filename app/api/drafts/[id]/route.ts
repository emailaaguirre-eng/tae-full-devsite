/**
 * Draft Detail API
 * GET /api/drafts/[id] - Retrieve a specific draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { PhysicalDesignDraft } from '@/lib/designer/types';

const DRAFTS_DIR = join(process.cwd(), 'data', 'drafts');

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const draftId = params.id;
    
    if (!draftId) {
      return NextResponse.json(
        { error: 'Draft ID required' },
        { status: 400 }
      );
    }
    
    // Validate draft exists
    const filepath = join(DRAFTS_DIR, `${draftId}.json`);
    
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }
    
    // Read draft
    const content = await readFile(filepath, 'utf-8');
    const draft: PhysicalDesignDraft = JSON.parse(content);
    
    return NextResponse.json(draft);
  } catch (error) {
    console.error('[Drafts API] Get error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve draft' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const draftId = params.id;
    const filepath = join(DRAFTS_DIR, `${draftId}.json`);
    
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }
    
    // Delete draft file
    const { unlink } = await import('fs/promises');
    await unlink(filepath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Drafts API] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}

