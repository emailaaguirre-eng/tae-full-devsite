/**
 * Export Tests
 * SPRINT 1: Golden master and preflight tests
 */

import { GOLDEN_MASTER_DESIGN, PREFLIGHT_FAILURE_DESIGN, getExpectedPNGDimensions } from '@/lib/testFixtures';
import { renderDesignToPNG } from '@/lib/serverRender';
import { runPreflightChecks } from '@/lib/preflight';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

describe('Export Tests', () => {
  const exportDir = path.join(process.cwd(), 'exports');
  
  beforeAll(() => {
    // Ensure export directory exists
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
  });
  
  test('Golden Master: PNG dimensions match PrintSpec', async () => {
    const design = GOLDEN_MASTER_DESIGN;
    const dpi = design.printSpec.dpi || 300;
    const expected = getExpectedPNGDimensions(design, dpi);
    
    // Render design
    const pngBuffer = await renderDesignToPNG(design, 'front', { dpi, includeBleed: true });
    
    // Get actual dimensions
    const image = sharp(pngBuffer);
    const metadata = await image.metadata();
    
    expect(metadata.width).toBe(expected.width);
    expect(metadata.height).toBe(expected.height);
    
    // Save for visual inspection
    const filepath = path.join(exportDir, 'golden-master-test.png');
    fs.writeFileSync(filepath, pngBuffer);
    console.log(`Golden master test PNG saved to ${filepath}`);
  });
  
  test('Preflight: Blocks export when text is outside safeBox', async () => {
    const design = PREFLIGHT_FAILURE_DESIGN;
    
    // Convert to preflight format
    const printSpec = {
      id: 'test',
      name: 'Test',
      sides: design.pages.map(page => ({
        id: page.id,
        name: page.name,
        trimMm: { w: design.printSpec.trimW_mm, h: design.printSpec.trimH_mm },
        bleedMm: design.printSpec.bleed_mm,
        safeMm: design.printSpec.safe_mm,
      })),
      sideIds: design.pages.map(p => p.id),
      dpi: design.printSpec.dpi || 300,
    };
    
    const sideStates: Record<string, { objects: any[] }> = {};
    for (const page of design.pages) {
      sideStates[page.id] = {
        objects: page.elements.map(el => {
          if (el.type === 'text' || el.type === 'label') {
            return {
              type: el.type === 'label' ? 'label-shape' : 'text',
              text: el.type === 'text' ? el.text : el.textProps.text,
              x: el.x_mm * (96 / 25.4), // Convert mm to screen px
              y: el.y_mm * (96 / 25.4),
              width: el.w_mm * (96 / 25.4),
              height: el.h_mm * (96 / 25.4),
              fontSize: el.type === 'text' ? (el.fontSize_pt / 0.75) : (el.textProps.fontSize_pt / 0.75),
              scaleX: 1,
              scaleY: 1,
            };
          }
          return null;
        }).filter(Boolean),
      };
    }
    
    // Run preflight
    const result = runPreflightChecks(printSpec, sideStates);
    
    // Should fail (text is outside safe zone)
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('outside the safe area'))).toBe(true);
  });
  
  test('Golden Master: Rectangle border at trim edge', async () => {
    const design = GOLDEN_MASTER_DESIGN;
    const pngBuffer = await renderDesignToPNG(design, 'front', { dpi: 300, includeBleed: true });
    
    // Verify PNG was created
    expect(pngBuffer).toBeInstanceOf(Buffer);
    expect(pngBuffer.length).toBeGreaterThan(0);
    
    // Save for visual inspection
    const filepath = path.join(exportDir, 'golden-master-border.png');
    fs.writeFileSync(filepath, pngBuffer);
    console.log(`Golden master border test PNG saved to ${filepath}`);
    
    // Note: Visual inspection needed to verify border position
    // Automated pixel inspection could be added here
  });
});

