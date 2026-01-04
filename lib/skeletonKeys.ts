// Skeleton Key Library
// Pre-designed template overlays for physical products (cards, invitations, etc.)

export interface SkeletonKeyDefinition {
  id: string;
  name: string;
  svg: string; // SVG path or data URL
  defaultScale: number;
  defaultPositionPct: { xPct: number; yPct: number }; // Relative to print area (0-1)
  qrTargetPct: { xPct: number; yPct: number; wPct: number; hPct: number }; // Relative to key bounding box (0-1)
  description?: string;
}

// QR Target Placeholders - Simple targets for QR code placement
export const SKELETON_KEYS: Record<string, SkeletonKeyDefinition> = {
  qr_target_bottom_right: {
    id: 'qr_target_bottom_right',
    name: 'QR Target - Bottom Right',
    svg: `<svg width="500" height="700" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
      <!-- Simple QR Target Area -->
      <rect x="300" y="500" width="180" height="180" fill="none" stroke="#0066cc" stroke-width="4" stroke-dasharray="8,4" rx="5" opacity="0.8"/>
      <text x="390" y="595" text-anchor="middle" font-size="14" font-weight="bold" fill="#0066cc" opacity="0.8">QR CODE</text>
    </svg>`,
    defaultScale: 1.0,
    defaultPositionPct: { xPct: 0.5, yPct: 0.5 },
    qrTargetPct: { xPct: 0.6, yPct: 0.714, wPct: 0.36, hPct: 0.257 }, // Bottom right
    description: 'QR code target in bottom right corner',
  },
  qr_target_bottom_left: {
    id: 'qr_target_bottom_left',
    name: 'QR Target - Bottom Left',
    svg: `<svg width="500" height="700" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
      <!-- Simple QR Target Area -->
      <rect x="20" y="500" width="180" height="180" fill="none" stroke="#0066cc" stroke-width="4" stroke-dasharray="8,4" rx="5" opacity="0.8"/>
      <text x="110" y="595" text-anchor="middle" font-size="14" font-weight="bold" fill="#0066cc" opacity="0.8">QR CODE</text>
    </svg>`,
    defaultScale: 1.0,
    defaultPositionPct: { xPct: 0.5, yPct: 0.5 },
    qrTargetPct: { xPct: 0.04, yPct: 0.714, wPct: 0.36, hPct: 0.257 }, // Bottom left
    description: 'QR code target in bottom left corner',
  },
  qr_target_bottom_center: {
    id: 'qr_target_bottom_center',
    name: 'QR Target - Bottom Center',
    svg: `<svg width="500" height="700" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
      <!-- Simple QR Target Area -->
      <rect x="160" y="500" width="180" height="180" fill="none" stroke="#0066cc" stroke-width="4" stroke-dasharray="8,4" rx="5" opacity="0.8"/>
      <text x="250" y="595" text-anchor="middle" font-size="14" font-weight="bold" fill="#0066cc" opacity="0.8">QR CODE</text>
    </svg>`,
    defaultScale: 1.0,
    defaultPositionPct: { xPct: 0.5, yPct: 0.5 },
    qrTargetPct: { xPct: 0.32, yPct: 0.714, wPct: 0.36, hPct: 0.257 }, // Bottom center
    description: 'QR code target in bottom center',
  },
  qr_target_top_right: {
    id: 'qr_target_top_right',
    name: 'QR Target - Top Right',
    svg: `<svg width="500" height="700" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
      <!-- Simple QR Target Area -->
      <rect x="300" y="20" width="180" height="180" fill="none" stroke="#0066cc" stroke-width="4" stroke-dasharray="8,4" rx="5" opacity="0.8"/>
      <text x="390" y="115" text-anchor="middle" font-size="14" font-weight="bold" fill="#0066cc" opacity="0.8">QR CODE</text>
    </svg>`,
    defaultScale: 1.0,
    defaultPositionPct: { xPct: 0.5, yPct: 0.5 },
    qrTargetPct: { xPct: 0.6, yPct: 0.029, wPct: 0.36, hPct: 0.257 }, // Top right
    description: 'QR code target in top right corner',
  },
  qr_target_center: {
    id: 'qr_target_center',
    name: 'QR Target - Center',
    svg: `<svg width="500" height="700" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
      <!-- Simple QR Target Area -->
      <rect x="160" y="260" width="180" height="180" fill="none" stroke="#0066cc" stroke-width="4" stroke-dasharray="8,4" rx="5" opacity="0.8"/>
      <text x="250" y="355" text-anchor="middle" font-size="14" font-weight="bold" fill="#0066cc" opacity="0.8">QR CODE</text>
    </svg>`,
    defaultScale: 1.0,
    defaultPositionPct: { xPct: 0.5, yPct: 0.5 },
    qrTargetPct: { xPct: 0.32, yPct: 0.371, wPct: 0.36, hPct: 0.257 }, // Center
    description: 'QR code target in center',
  },
};

export function getSkeletonKey(id: string): SkeletonKeyDefinition | undefined {
  return SKELETON_KEYS[id];
}

export function getAllSkeletonKeys(): SkeletonKeyDefinition[] {
  return Object.values(SKELETON_KEYS);
}

