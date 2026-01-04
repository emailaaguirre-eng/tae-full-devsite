/**
 * Test Fixtures
 * SPRINT 1: Golden master design for testing
 */

import type { DesignJSON } from './designModel';

/**
 * Golden Master Design
 * Rectangle border aligned to trimBox edges
 * Text element inside safe zone
 */
export const GOLDEN_MASTER_DESIGN: DesignJSON = {
  printSpec: {
    trimW_mm: 101.6, // 4 inches
    trimH_mm: 152.4, // 6 inches
    bleed_mm: 4,
    safe_mm: 4,
    orientation: 'portrait',
    dpi: 300,
  },
  pages: [
    {
      id: 'front',
      name: 'Front',
      elements: [
        // Rectangle border at trimBox edges (orange guide)
        {
          id: 'border-trim',
          type: 'label',
          x_mm: 0, // At trim edge (accounting for bleed offset)
          y_mm: 0,
          w_mm: 101.6, // Trim width
          h_mm: 152.4, // Trim height
          rotation_deg: 0,
          zIndex: 0,
          shapePreset: 'rectangle',
          padding_mm: 0,
          stroke: {
            enabled: true,
            width_mm: 1,
            color: '#f59e0b', // Orange (trim guide color)
          },
          fill: 'transparent',
          textProps: {
            text: '',
            fontFamily: 'Helvetica',
            fontWeight: 400,
            fontSize_pt: 12,
            fill: '#000000',
          },
        },
        // Text element inside safe zone (green guide)
        {
          id: 'text-safe',
          type: 'text',
          x_mm: 4 + 20, // safe_mm (4mm) + 20mm offset
          y_mm: 4 + 20, // safe_mm (4mm) + 20mm offset
          w_mm: undefined,
          h_mm: undefined,
          rotation_deg: 0,
          zIndex: 1,
          text: 'Test Text Inside Safe Zone',
          fontFamily: 'Helvetica',
          fontWeight: 400,
          fontSize_pt: 24,
          lineHeight: 1.2,
          tracking: 0,
          align: 'left',
          fill: '#000000',
        },
      ],
    },
  ],
  version: '1.0',
  createdAt: new Date().toISOString(),
};

/**
 * Preflight Failure Design
 * Text element outside safe zone (should be blocked)
 */
export const PREFLIGHT_FAILURE_DESIGN: DesignJSON = {
  printSpec: {
    trimW_mm: 101.6,
    trimH_mm: 152.4,
    bleed_mm: 4,
    safe_mm: 4,
    orientation: 'portrait',
    dpi: 300,
  },
  pages: [
    {
      id: 'front',
      name: 'Front',
      elements: [
        // Text element outside safe zone (should fail preflight)
        {
          id: 'text-unsafe',
          type: 'text',
          x_mm: 0, // At edge (outside safe zone)
          y_mm: 0,
          w_mm: undefined,
          h_mm: undefined,
          rotation_deg: 0,
          zIndex: 0,
          text: 'Unsafe Text',
          fontFamily: 'Helvetica',
          fontWeight: 400,
          fontSize_pt: 24,
          lineHeight: 1.2,
          tracking: 0,
          align: 'left',
          fill: '#000000',
        },
      ],
    },
  ],
  version: '1.0',
  createdAt: new Date().toISOString(),
};

/**
 * Expected PNG dimensions for golden master
 */
export function getExpectedPNGDimensions(design: DesignJSON, dpi: number = 300): {
  width: number;
  height: number;
} {
  const { printSpec } = design;
  const bleedW_mm = printSpec.trimW_mm + (printSpec.bleed_mm * 2);
  const bleedH_mm = printSpec.trimH_mm + (printSpec.bleed_mm * 2);
  
  // Formula: px = round((mm / 25.4) * DPI)
  const width = Math.round((bleedW_mm / 25.4) * dpi);
  const height = Math.round((bleedH_mm / 25.4) * dpi);
  
  return { width, height };
}

