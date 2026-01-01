// Collage Templates Library
// Pre-defined frame layouts for quick collage creation

export interface CollageFrame {
  id: string;
  shape: 'rect' | 'circle' | 'polaroid';
  xPct: number; // Relative to safe zone (0-1)
  yPct: number; // Relative to safe zone (0-1)
  wPct: number; // Relative to safe zone (0-1)
  hPct: number; // Relative to safe zone (0-1)
  rotation?: number; // Degrees
  paddingPct?: number; // Padding inside frame (0-1, relative to frame size)
  stroke?: string; // Frame border color
  strokeWidth?: number; // Frame border width
  cornerRadiusPct?: number; // For rounded rectangles (0-1, relative to frame size)
}

export interface CollageTemplate {
  id: string;
  name: string;
  description?: string;
  frames: CollageFrame[];
}

// Template Definitions
export const COLLAGE_TEMPLATES: Record<string, CollageTemplate> = {
  full_bleed_1: {
    id: 'full_bleed_1',
    name: 'Full Bleed',
    description: 'Single image covering the entire safe zone',
    frames: [
      {
        id: 'frame_1',
        shape: 'rect',
        xPct: 0,
        yPct: 0,
        wPct: 1,
        hPct: 1,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
    ],
  },
  split_vertical_2: {
    id: 'split_vertical_2',
    name: 'Split Vertical',
    description: 'Two equal vertical sections',
    frames: [
      {
        id: 'frame_1',
        shape: 'rect',
        xPct: 0,
        yPct: 0,
        wPct: 0.5,
        hPct: 1,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
      {
        id: 'frame_2',
        shape: 'rect',
        xPct: 0.5,
        yPct: 0,
        wPct: 0.5,
        hPct: 1,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
    ],
  },
  split_horizontal_2: {
    id: 'split_horizontal_2',
    name: 'Split Horizontal',
    description: 'Two equal horizontal sections',
    frames: [
      {
        id: 'frame_1',
        shape: 'rect',
        xPct: 0,
        yPct: 0,
        wPct: 1,
        hPct: 0.5,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
      {
        id: 'frame_2',
        shape: 'rect',
        xPct: 0,
        yPct: 0.5,
        wPct: 1,
        hPct: 0.5,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
    ],
  },
  grid_2x2: {
    id: 'grid_2x2',
    name: 'Grid 2x2',
    description: 'Four equal sections in a grid',
    frames: [
      {
        id: 'frame_1',
        shape: 'rect',
        xPct: 0,
        yPct: 0,
        wPct: 0.5,
        hPct: 0.5,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
      {
        id: 'frame_2',
        shape: 'rect',
        xPct: 0.5,
        yPct: 0,
        wPct: 0.5,
        hPct: 0.5,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
      {
        id: 'frame_3',
        shape: 'rect',
        xPct: 0,
        yPct: 0.5,
        wPct: 0.5,
        hPct: 0.5,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
      {
        id: 'frame_4',
        shape: 'rect',
        xPct: 0.5,
        yPct: 0.5,
        wPct: 0.5,
        hPct: 0.5,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
    ],
  },
  grid_3: {
    id: 'grid_3',
    name: 'Grid 3',
    description: 'Three sections: one large, two small',
    frames: [
      {
        id: 'frame_1',
        shape: 'rect',
        xPct: 0,
        yPct: 0,
        wPct: 0.5,
        hPct: 1,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
      {
        id: 'frame_2',
        shape: 'rect',
        xPct: 0.5,
        yPct: 0,
        wPct: 0.5,
        hPct: 0.5,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
      {
        id: 'frame_3',
        shape: 'rect',
        xPct: 0.5,
        yPct: 0.5,
        wPct: 0.5,
        hPct: 0.5,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
    ],
  },
  filmstrip_3: {
    id: 'filmstrip_3',
    name: 'Filmstrip',
    description: 'Three horizontal frames',
    frames: [
      {
        id: 'frame_1',
        shape: 'rect',
        xPct: 0.05,
        yPct: 0.1,
        wPct: 0.9,
        hPct: 0.25,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
        cornerRadiusPct: 0.1,
      },
      {
        id: 'frame_2',
        shape: 'rect',
        xPct: 0.05,
        yPct: 0.375,
        wPct: 0.9,
        hPct: 0.25,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
        cornerRadiusPct: 0.1,
      },
      {
        id: 'frame_3',
        shape: 'rect',
        xPct: 0.05,
        yPct: 0.65,
        wPct: 0.9,
        hPct: 0.25,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
        cornerRadiusPct: 0.1,
      },
    ],
  },
  polaroid_trio: {
    id: 'polaroid_trio',
    name: 'Polaroid Trio',
    description: 'Three polaroid-style frames',
    frames: [
      {
        id: 'frame_1',
        shape: 'polaroid',
        xPct: 0.1,
        yPct: 0.1,
        wPct: 0.25,
        hPct: 0.3,
        rotation: -5,
        paddingPct: 0.05,
        stroke: '#ffffff',
        strokeWidth: 8,
        cornerRadiusPct: 0.02,
      },
      {
        id: 'frame_2',
        shape: 'polaroid',
        xPct: 0.375,
        yPct: 0.15,
        wPct: 0.25,
        hPct: 0.3,
        rotation: 0,
        paddingPct: 0.05,
        stroke: '#ffffff',
        strokeWidth: 8,
        cornerRadiusPct: 0.02,
      },
      {
        id: 'frame_3',
        shape: 'polaroid',
        xPct: 0.65,
        yPct: 0.1,
        wPct: 0.25,
        hPct: 0.3,
        rotation: 5,
        paddingPct: 0.05,
        stroke: '#ffffff',
        strokeWidth: 8,
        cornerRadiusPct: 0.02,
      },
    ],
  },
  circle_trio: {
    id: 'circle_trio',
    name: 'Circle Trio',
    description: 'Three circular frames',
    frames: [
      {
        id: 'frame_1',
        shape: 'circle',
        xPct: 0.2,
        yPct: 0.2,
        wPct: 0.25,
        hPct: 0.25,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 3,
      },
      {
        id: 'frame_2',
        shape: 'circle',
        xPct: 0.5,
        yPct: 0.2,
        wPct: 0.25,
        hPct: 0.25,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 3,
      },
      {
        id: 'frame_3',
        shape: 'circle',
        xPct: 0.35,
        yPct: 0.5,
        wPct: 0.3,
        hPct: 0.3,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 3,
      },
    ],
  },
};

export function getCollageTemplate(id: string): CollageTemplate | undefined {
  return COLLAGE_TEMPLATES[id];
}

export function getAllCollageTemplates(): CollageTemplate[] {
  return Object.values(COLLAGE_TEMPLATES);
}

