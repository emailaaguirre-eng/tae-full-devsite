import { NextRequest, NextResponse } from 'next/server';
import { exportDesignToPDF } from '@/lib/pdfExport';
import type { PrintSpec } from '@/lib/printSpecs';
import type { EditorObject } from '@/components/ProjectEditor/types';

/**
 * POST /api/export/pdf
 * Export design as print-native PDF
 * SPRINT 4: Vector text, ornaments, and images at correct resolution
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      printSpec,
      sideStates,
      options = {},
    }: {
      printSpec: PrintSpec;
      sideStates: Record<string, { objects: EditorObject[] }>;
      options?: {
        includeBleed?: boolean;
        embedFonts?: boolean;
      };
    } = body;
    
    if (!printSpec || !sideStates) {
      return NextResponse.json(
        { error: 'printSpec and sideStates are required' },
        { status: 400 }
      );
    }
    
    // Generate PDF
    const pdfBuffer = await exportDesignToPDF(printSpec, sideStates, options);
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="design-export.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export PDF' },
      { status: 500 }
    );
  }
}

