// Pre-designed ornate border frames for formal invitations
// These are SVG-based designs that can be applied to text labels or as full-card frames

export interface BorderDesign {
  id: string;
  name: string;
  category: 'simple' | 'classic' | 'ornate' | 'floral' | 'geometric' | 'art-deco';
  // SVG path data for the border pattern (used for corners/edges)
  svgCorner?: string;
  svgEdge?: string;
  // For simple CSS-based borders
  cssStyle?: {
    borderStyle: string;
    borderWidth: number;
    cornerRadius?: number;
  };
  // Whether this design supports foil
  foilCompatible: boolean;
  // Preview color (for thumbnails)
  previewColor: string;
  // Description for UI
  description: string;
}

// Simple line borders
export const SIMPLE_BORDERS: BorderDesign[] = [
  {
    id: 'single-line',
    name: 'Single Line',
    category: 'simple',
    cssStyle: { borderStyle: 'solid', borderWidth: 1 },
    foilCompatible: true,
    previewColor: '#333333',
    description: 'Clean single line border',
  },
  {
    id: 'double-line',
    name: 'Double Line',
    category: 'simple',
    cssStyle: { borderStyle: 'double', borderWidth: 4 },
    foilCompatible: true,
    previewColor: '#333333',
    description: 'Classic double line border',
  },
  {
    id: 'thick-thin',
    name: 'Thick & Thin',
    category: 'simple',
    cssStyle: { borderStyle: 'solid', borderWidth: 3 },
    foilCompatible: true,
    previewColor: '#333333',
    description: 'Elegant thick and thin lines',
  },
];

// Classic formal borders
export const CLASSIC_BORDERS: BorderDesign[] = [
  {
    id: 'classic-frame',
    name: 'Classic Frame',
    category: 'classic',
    svgCorner: `<svg viewBox="0 0 50 50"><path d="M0,50 L0,10 Q0,0 10,0 L50,0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5,50 L5,15 Q5,5 15,5 L50,5" fill="none" stroke="currentColor" stroke-width="1"/></svg>`,
    foilCompatible: true,
    previewColor: '#8B7355',
    description: 'Traditional double-line frame with rounded corners',
  },
  {
    id: 'victorian-simple',
    name: 'Victorian Simple',
    category: 'classic',
    svgCorner: `<svg viewBox="0 0 50 50"><path d="M0,50 L0,5 L5,0 L50,0" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="5" cy="5" r="3" fill="currentColor"/></svg>`,
    foilCompatible: true,
    previewColor: '#8B7355',
    description: 'Victorian-inspired corner accents',
  },
  {
    id: 'elegant-scroll',
    name: 'Elegant Scroll',
    category: 'classic',
    svgCorner: `<svg viewBox="0 0 60 60"><path d="M0,60 C0,30 0,0 30,0 L60,0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10,50 Q5,40 15,35 Q25,30 20,20 Q15,10 25,5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
    foilCompatible: true,
    previewColor: '#C9A961',
    description: 'Graceful scrollwork corners',
  },
];

// Ornate decorative borders
export const ORNATE_BORDERS: BorderDesign[] = [
  {
    id: 'baroque-flourish',
    name: 'Baroque Flourish',
    category: 'ornate',
    svgCorner: `<svg viewBox="0 0 80 80"><path d="M0,80 C0,40 20,20 40,0 L80,0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5,70 Q10,50 25,45 Q40,40 35,25 Q30,10 45,5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M15,60 Q20,45 30,42 Q40,38 38,28" fill="none" stroke="currentColor" stroke-width="1"/></svg>`,
    foilCompatible: true,
    previewColor: '#D4AF37',
    description: 'Elaborate baroque-style flourishes',
  },
  {
    id: 'royal-crest',
    name: 'Royal Crest',
    category: 'ornate',
    svgCorner: `<svg viewBox="0 0 70 70"><path d="M0,70 L0,15 C0,5 5,0 15,0 L70,0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8,55 L8,20 C8,12 12,8 20,8 L55,8" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="14" cy="14" r="4" fill="currentColor"/></svg>`,
    foilCompatible: true,
    previewColor: '#D4AF37',
    description: 'Regal double frame with accent',
  },
  {
    id: 'filigree',
    name: 'Filigree',
    category: 'ornate',
    svgCorner: `<svg viewBox="0 0 80 80"><path d="M0,80 Q0,40 40,40 Q80,40 80,0" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10,70 Q10,50 30,50 Q50,50 50,30 Q50,10 70,10" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="40" cy="40" r="3" fill="currentColor"/></svg>`,
    foilCompatible: true,
    previewColor: '#C9A961',
    description: 'Delicate interlocking filigree pattern',
  },
];

// Floral borders
export const FLORAL_BORDERS: BorderDesign[] = [
  {
    id: 'rose-corner',
    name: 'Rose Corner',
    category: 'floral',
    svgCorner: `<svg viewBox="0 0 80 80"><path d="M0,80 L0,0 L80,0" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="1"/><path d="M20,12 Q25,15 20,20 Q15,15 20,12" fill="currentColor"/><path d="M12,20 Q15,25 20,20 Q15,15 12,20" fill="currentColor"/><path d="M20,28 Q15,25 20,20 Q25,25 20,28" fill="currentColor"/><path d="M28,20 Q25,15 20,20 Q25,25 28,20" fill="currentColor"/></svg>`,
    foilCompatible: true,
    previewColor: '#C48793',
    description: 'Romantic rose corner accents',
  },
  {
    id: 'vine-border',
    name: 'Vine Border',
    category: 'floral',
    svgEdge: `<svg viewBox="0 0 100 20"><path d="M0,10 Q25,0 50,10 Q75,20 100,10" fill="none" stroke="currentColor" stroke-width="1.5"/><ellipse cx="25" cy="5" rx="4" ry="3" fill="currentColor" opacity="0.7"/><ellipse cx="75" cy="15" rx="4" ry="3" fill="currentColor" opacity="0.7"/></svg>`,
    foilCompatible: true,
    previewColor: '#6B8E6B',
    description: 'Flowing vine pattern with leaves',
  },
  {
    id: 'botanical',
    name: 'Botanical',
    category: 'floral',
    svgCorner: `<svg viewBox="0 0 80 80"><path d="M0,80 L0,0 L80,0" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M15,65 Q15,45 25,35 Q35,25 55,15" fill="none" stroke="currentColor" stroke-width="1"/><ellipse cx="20" cy="55" rx="8" ry="5" fill="currentColor" opacity="0.5" transform="rotate(-30 20 55)"/><ellipse cx="30" cy="40" rx="6" ry="4" fill="currentColor" opacity="0.5" transform="rotate(-45 30 40)"/><ellipse cx="45" cy="25" rx="5" ry="3" fill="currentColor" opacity="0.5" transform="rotate(-60 45 25)"/></svg>`,
    foilCompatible: true,
    previewColor: '#6B8E6B',
    description: 'Elegant botanical leaf arrangement',
  },
];

// Geometric borders
export const GEOMETRIC_BORDERS: BorderDesign[] = [
  {
    id: 'greek-key',
    name: 'Greek Key',
    category: 'geometric',
    svgEdge: `<svg viewBox="0 0 40 20"><path d="M0,10 L5,10 L5,5 L15,5 L15,15 L25,15 L25,5 L35,5 L35,10 L40,10" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    foilCompatible: true,
    previewColor: '#333333',
    description: 'Classical Greek key meander pattern',
  },
  {
    id: 'diamond-chain',
    name: 'Diamond Chain',
    category: 'geometric',
    svgEdge: `<svg viewBox="0 0 40 20"><path d="M0,10 L10,0 L20,10 L30,0 L40,10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M0,10 L10,20 L20,10 L30,20 L40,10" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
    foilCompatible: true,
    previewColor: '#333333',
    description: 'Interlocking diamond pattern',
  },
  {
    id: 'hexagon-lattice',
    name: 'Hexagon Lattice',
    category: 'geometric',
    svgCorner: `<svg viewBox="0 0 60 60"><polygon points="30,5 50,15 50,35 30,45 10,35 10,15" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M0,60 L0,0 L60,0" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    foilCompatible: true,
    previewColor: '#555555',
    description: 'Modern hexagonal corner accent',
  },
];

// Art Deco borders
export const ART_DECO_BORDERS: BorderDesign[] = [
  {
    id: 'deco-fan',
    name: 'Deco Fan',
    category: 'art-deco',
    svgCorner: `<svg viewBox="0 0 60 60"><path d="M0,60 L0,0 L60,0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5,55 Q5,30 30,30 Q55,30 55,5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10,50 Q10,35 30,35 Q50,35 50,10" fill="none" stroke="currentColor" stroke-width="1"/><path d="M15,45 Q15,38 30,38 Q45,38 45,15" fill="none" stroke="currentColor" stroke-width="0.75"/></svg>`,
    foilCompatible: true,
    previewColor: '#D4AF37',
    description: 'Radiating fan motif from the 1920s',
  },
  {
    id: 'deco-chevron',
    name: 'Deco Chevron',
    category: 'art-deco',
    svgCorner: `<svg viewBox="0 0 60 60"><path d="M0,60 L0,0 L60,0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5,55 L5,5 L55,5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M15,45 L15,15 L45,15" fill="none" stroke="currentColor" stroke-width="1"/></svg>`,
    foilCompatible: true,
    previewColor: '#333333',
    description: 'Bold stepped chevron corners',
  },
  {
    id: 'gatsby',
    name: 'Gatsby',
    category: 'art-deco',
    svgCorner: `<svg viewBox="0 0 70 70"><path d="M0,70 L0,0 L70,0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10,60 L10,10 L60,10" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="5" y="5" width="10" height="10" fill="currentColor"/><line x1="20" y1="10" x2="60" y2="10" stroke="currentColor" stroke-width="3"/><line x1="10" y1="20" x2="10" y2="60" stroke="currentColor" stroke-width="3"/></svg>`,
    foilCompatible: true,
    previewColor: '#D4AF37',
    description: 'Glamorous Gatsby-era styling',
  },
];

// All borders combined for easy access
export const ALL_BORDER_DESIGNS: BorderDesign[] = [
  ...SIMPLE_BORDERS,
  ...CLASSIC_BORDERS,
  ...ORNATE_BORDERS,
  ...FLORAL_BORDERS,
  ...GEOMETRIC_BORDERS,
  ...ART_DECO_BORDERS,
];

// Get borders by category
export function getBordersByCategory(category: BorderDesign['category']): BorderDesign[] {
  return ALL_BORDER_DESIGNS.filter(b => b.category === category);
}

// Get a specific border by ID
export function getBorderById(id: string): BorderDesign | undefined {
  return ALL_BORDER_DESIGNS.find(b => b.id === id);
}

// Category display names
export const BORDER_CATEGORIES = [
  { id: 'simple', name: 'Simple', icon: '▢' },
  { id: 'classic', name: 'Classic', icon: '✦' },
  { id: 'ornate', name: 'Ornate', icon: '❧' },
  { id: 'floral', name: 'Floral', icon: '❀' },
  { id: 'geometric', name: 'Geometric', icon: '◇' },
  { id: 'art-deco', name: 'Art Deco', icon: '◆' },
] as const;

