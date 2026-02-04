import { NextRequest, NextResponse } from 'next/server';
import { renderDesignToPNG } from '@/lib/serverRender';
import { runPreflightChecks } from '@/lib/preflight';
import type { DesignJSON } from '@/lib/designModel';
import fs from 'fs';
import path from 'path';
import { getSamplePostcardSpec } from '@/lib/printSpecs';

/**
 * POST /api/export
 * SPRINT 1: Server-side PNG export from Design JSON
 * 
 * Request body:
 * {
 *   design: DesignJSON,
 *   pageId?: string, // Default: 'front'
 *   options?: {
 *     dpi?: number, // Default: 300
 *     includeBleed?: boolean // Default: true
 *   }
 * }
 * 
 * Returns: PNG file
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { design, pageId = 'front', options = {} }: {
      design: DesignJSON;
      pageId?: string;
      options?: {
        dpi?: number;
        includeBleed?: boolean;
      };
    } = body;
    
    if (!design || !design.printSpec || !design.pages) {
      return NextResponse.json(
        { error: 'Invalid design JSON. Required: printSpec, pages' },
        { status: 400 }
      );
    }
    
    // Convert Design JSON to format expected by preflight
    // (Preflight expects PrintSpec and sideStates format)
    const printSpec: import('@/lib/printSpecs').PrintSpec = {
      id: 'export',
      name: 'Export',
      sides: design.pages.map(page => ({
        id: page.id as 'front' | 'inside' | 'inside-left' | 'inside-right' | 'inside-top' | 'inside-bottom' | 'back',
        name: page.name,
        trimMm: { w: design.printSpec.trimW_mm, h: design.printSpec.trimH_mm },
        bleedMm: design.printSpec.bleed_mm,
        safeMm: design.printSpec.safe_mm,
      })),
      sideIds: design.pages.map(p => p.id) as Array<'front' | 'inside' | 'inside-left' | 'inside-right' | 'inside-top' | 'inside-bottom' | 'back'>,
      dpi: design.printSpec.dpi || 300,
    };
    
    const sideStates: Record<string, { objects: any[] }> = {};
    for (const page of design.pages) {
      // Convert DesignElement to EditorObject format for preflight
      sideStates[page.id] = {
        objects: page.elements.map(el => {
          // Minimal conversion for preflight checks
          if (el.type === 'text' || el.type === 'label') {
            const w_mm = el.w_mm ?? 50;
            const h_mm = el.h_mm ?? 20;
            return {
              type: el.type === 'label' ? 'label-shape' : 'text',
              text: el.type === 'text' ? el.text : el.textProps?.text ?? '',
              x: el.x_mm * (96 / 25.4), // Convert mm to screen px
              y: el.y_mm * (96 / 25.4),
              width: w_mm * (96 / 25.4),
              height: h_mm * (96 / 25.4),
              fontSize: el.type === 'text' ? ((el.fontSize_pt ?? 12) / 0.75) : ((el.textProps?.fontSize_pt ?? 12) / 0.75),
              scaleX: 1,
              scaleY: 1,
            };
          }
          return null;
        }).filter(Boolean),
      };
    }
    
    // Run preflight checks
    const preflight = runPreflightChecks(printSpec, sideStates);
    if (!preflight.isValid) {
      return NextResponse.json(
        {
          error: 'Preflight check failed',
          errors: preflight.errors,
          warnings: preflight.warnings,
        },
        { status: 400 }
      );
    }
    
    // Render design to PNG
    const pngBuffer = await renderDesignToPNG(design, pageId, {
      dpi: options.dpi || design.printSpec.dpi || 300,
      includeBleed: options.includeBleed !== false,
    });
    
    // Store PNG in local folder for debugging
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `export-${pageId}-${timestamp}.png`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, pngBuffer);
    console.log(`[Export] PNG saved to ${filepath}`);
    
    // Return PNG
    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Export-Path': filepath, // For debugging
      },
    });
  } catch (error: any) {
    console.error('Error exporting PNG:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export PNG' },
      { status: 500 }
    );
  }
}

