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

// Skeleton Key Definitions
export const SKELETON_KEYS: Record<string, SkeletonKeyDefinition> = {
  card_classic: {
    id: 'card_classic',
    name: 'Classic Card',
    svg: `<svg width="500" height="700" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="500" height="700" fill="none" stroke="#333" stroke-width="2"/>
      <rect x="20" y="20" width="460" height="660" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
      <rect x="400" y="600" width="60" height="60" fill="none" stroke="#0066cc" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="430" y="635" text-anchor="middle" font-size="12" fill="#0066cc">QR</text>
    </svg>`,
    defaultScale: 1.0,
    defaultPositionPct: { xPct: 0.5, yPct: 0.5 },
    qrTargetPct: { xPct: 0.8, yPct: 0.857, wPct: 0.12, hPct: 0.086 }, // Bottom right corner
    description: 'Traditional greeting card layout with QR in bottom right',
  },
  card_centered: {
    id: 'card_centered',
    name: 'Centered Design',
    svg: `<svg width="500" height="700" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="500" height="700" fill="none" stroke="#333" stroke-width="2"/>
      <rect x="50" y="50" width="400" height="500" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
      <rect x="20" y="600" width="60" height="60" fill="none" stroke="#0066cc" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="50" y="635" text-anchor="middle" font-size="12" fill="#0066cc">QR</text>
    </svg>`,
    defaultScale: 1.0,
    defaultPositionPct: { xPct: 0.5, yPct: 0.5 },
    qrTargetPct: { xPct: 0.04, yPct: 0.857, wPct: 0.12, hPct: 0.086 }, // Bottom left corner
    description: 'Centered content area with QR in bottom left',
  },
  card_minimal: {
    id: 'card_minimal',
    name: 'Minimal Frame',
    svg: `<svg width="500" height="700" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="500" height="700" fill="none" stroke="#333" stroke-width="1"/>
      <line x1="10" y1="10" x2="490" y2="10" stroke="#ccc" stroke-width="1"/>
      <line x1="10" y1="690" x2="490" y2="690" stroke="#ccc" stroke-width="1"/>
      <rect x="400" y="20" width="60" height="60" fill="none" stroke="#0066cc" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="430" y="50" text-anchor="middle" font-size="12" fill="#0066cc">QR</text>
    </svg>`,
    defaultScale: 1.0,
    defaultPositionPct: { xPct: 0.5, yPct: 0.5 },
    qrTargetPct: { xPct: 0.8, yPct: 0.029, wPct: 0.12, hPct: 0.086 }, // Top right corner
    description: 'Minimal border with QR in top right',
  },
  invitation_elegant: {
    id: 'invitation_elegant',
    name: 'Elegant Invitation',
    svg: `<svg width="500" height="700" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="500" height="700" fill="none" stroke="#333" stroke-width="2"/>
      <rect x="30" y="30" width="440" height="640" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
      <path d="M 50 100 L 450 100" stroke="#ccc" stroke-width="1"/>
      <path d="M 50 600 L 450 600" stroke="#ccc" stroke-width="1"/>
      <rect x="210" y="620" width="80" height="60" fill="none" stroke="#0066cc" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="250" y="655" text-anchor="middle" font-size="12" fill="#0066cc">QR</text>
    </svg>`,
    defaultScale: 1.0,
    defaultPositionPct: { xPct: 0.5, yPct: 0.5 },
    qrTargetPct: { xPct: 0.42, yPct: 0.886, wPct: 0.16, hPct: 0.086 }, // Bottom center
    description: 'Elegant invitation layout with centered QR',
  },
  announcement_modern: {
    id: 'announcement_modern',
    name: 'Modern Announcement',
    svg: `<svg width="500" height="700" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="500" height="700" fill="none" stroke="#333" stroke-width="2"/>
      <rect x="40" y="40" width="420" height="620" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
      <circle cx="250" cy="200" r="80" fill="none" stroke="#ccc" stroke-width="1"/>
      <rect x="20" y="620" width="70" height="70" fill="none" stroke="#0066cc" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="55" y="655" text-anchor="middle" font-size="12" fill="#0066cc">QR</text>
    </svg>`,
    defaultScale: 1.0,
    defaultPositionPct: { xPct: 0.5, yPct: 0.5 },
    qrTargetPct: { xPct: 0.04, yPct: 0.886, wPct: 0.14, hPct: 0.1 }, // Bottom left
    description: 'Modern announcement with circular photo area',
  },
  postcard_simple: {
    id: 'postcard_simple',
    name: 'Simple Postcard',
    svg: `<svg width="500" height="700" viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="500" height="700" fill="none" stroke="#333" stroke-width="2"/>
      <rect x="20" y="20" width="460" height="500" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
      <rect x="380" y="550" width="80" height="80" fill="none" stroke="#0066cc" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="420" y="595" text-anchor="middle" font-size="12" fill="#0066cc">QR</text>
    </svg>`,
    defaultScale: 1.0,
    defaultPositionPct: { xPct: 0.5, yPct: 0.5 },
    qrTargetPct: { xPct: 0.76, yPct: 0.786, wPct: 0.16, hPct: 0.114 }, // Bottom right
    description: 'Simple postcard layout with photo area',
  },
};

export function getSkeletonKey(id: string): SkeletonKeyDefinition | undefined {
  return SKELETON_KEYS[id];
}

export function getAllSkeletonKeys(): SkeletonKeyDefinition[] {
  return Object.values(SKELETON_KEYS);
}

