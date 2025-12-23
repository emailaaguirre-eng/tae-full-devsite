import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { readPsd } from 'ag-psd';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const psdFile = formData.get('psd') as File;
    
    if (!psdFile) {
      return NextResponse.json(
        { success: false, error: 'No PSD file provided' },
        { status: 400 }
      );
    }
    
    // Check file type
    if (!psdFile.name.toLowerCase().endsWith('.psd')) {
      return NextResponse.json(
        { success: false, error: 'File must be a PSD file' },
        { status: 400 }
      );
    }
    
    // Check file size (limit to 50MB for serverless)
    const fileSize = psdFile.size;
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { success: false, error: 'PSD file is too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }
    
    // Read PSD file
    const arrayBuffer = await psdFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    try {
      // Parse PSD file
      const psd = readPsd(buffer, {
        // Use canvas if available (flattened image)
        useRawThumbnail: false,
        // Log errors but continue
        logErrors: true,
      });
      
      // Check if we have a canvas (flattened image)
      if (psd.canvas) {
        // ag-psd returns canvas as ImageData-like object
        // Convert to buffer format that sharp can understand
        const width = psd.canvas.width;
        const height = psd.canvas.height;
        const data = psd.canvas.data; // Uint8ClampedArray
        
        // Convert RGBA data to buffer format for sharp
        // ImageData is RGBA, we need to create a proper buffer
        const buffer = Buffer.from(data);
        
        // Use sharp to create PNG from raw RGBA data
        const pngBuffer = await sharp(buffer, {
          raw: {
            width: width,
            height: height,
            channels: 4 // RGBA
          }
        })
        .png()
        .toBuffer();
        
        // Convert to base64 data URL
        const base64 = pngBuffer.toString('base64');
        const dataUrl = `data:image/png;base64,${base64}`;
        
        return NextResponse.json({
          success: true,
          imageUrl: dataUrl,
          message: 'PSD converted successfully',
          width: width,
          height: height
        });
      } 
      // If no canvas, try to create one from layers
      else if (psd.children && psd.children.length > 0) {
        // For now, return error - layer composition is complex
        // In the future, we could implement layer merging
        return NextResponse.json(
          { 
            success: false, 
            error: 'PSD file contains layers but no flattened image. Please flatten your PSD in Photoshop before uploading, or export as PNG.',
            suggestion: 'In Photoshop: Layer > Flatten Image, then save. Or File > Export > Export As > PNG'
          },
          { status: 400 }
        );
      } 
      else {
        return NextResponse.json(
          { success: false, error: 'Could not extract image from PSD file. The file may be corrupted or in an unsupported format.' },
          { status: 400 }
        );
      }
    } catch (parseError: any) {
      console.error('PSD parsing error:', parseError);
      
      // Provide helpful error messages
      if (parseError.message?.includes('Invalid PSD')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid PSD file format. Please ensure the file is a valid Photoshop document.',
            suggestion: 'Try opening and re-saving the file in Photoshop, or export as PNG instead.'
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to parse PSD file',
          details: parseError.message || 'Unknown error',
          suggestion: 'Please try exporting your PSD as PNG or SVG from Photoshop.'
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('PSD conversion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

