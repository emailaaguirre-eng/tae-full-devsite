// Editor Fonts Library
// Curated Google Fonts for Project Editor labels

export interface EditorFont {
  family: string;
  displayName: string;
  category: 'serif' | 'sans' | 'script';
  weights: number[];
}

export const EDITOR_FONTS: EditorFont[] = [
  // Elegant Serif fonts (perfect for formal invitations)
  { family: 'Playfair Display', displayName: 'Playfair Display', category: 'serif', weights: [400, 600, 700] },
  { family: 'Cormorant Garamond', displayName: 'Cormorant Garamond', category: 'serif', weights: [400, 600] },
  { family: 'Libre Baskerville', displayName: 'Libre Baskerville', category: 'serif', weights: [400, 700] },
  { family: 'Lora', displayName: 'Lora', category: 'serif', weights: [400, 600] },
  { family: 'Cinzel', displayName: 'Cinzel', category: 'serif', weights: [400, 600] },
  { family: 'EB Garamond', displayName: 'EB Garamond', category: 'serif', weights: [400, 600] },
  
  // Clean Sans-serif fonts
  { family: 'Montserrat', displayName: 'Montserrat', category: 'sans', weights: [400, 600, 700] },
  { family: 'Raleway', displayName: 'Raleway', category: 'sans', weights: [400, 600] },
  { family: 'Josefin Sans', displayName: 'Josefin Sans', category: 'sans', weights: [400, 600] },
  
  // Elegant Script/Calligraphy fonts (for wedding invitations)
  { family: 'Great Vibes', displayName: 'Great Vibes', category: 'script', weights: [400] },
  { family: 'Alex Brush', displayName: 'Alex Brush', category: 'script', weights: [400] },
  { family: 'Allura', displayName: 'Allura', category: 'script', weights: [400] },
  { family: 'Tangerine', displayName: 'Tangerine', category: 'script', weights: [400, 700] },
  { family: 'Pinyon Script', displayName: 'Pinyon Script', category: 'script', weights: [400] },
  { family: 'Sacramento', displayName: 'Sacramento', category: 'script', weights: [400] },
  { family: 'Satisfy', displayName: 'Satisfy', category: 'script', weights: [400] },
];

export const DEFAULT_FONT = 'Montserrat';
export const DEFAULT_FONT_WEIGHT = 600;

// Script font families (for guardrails - these work best for short phrases)
const SCRIPT_FONTS = [
  'Great Vibes', 'Alex Brush', 'Allura', 'Tangerine', 
  'Pinyon Script', 'Sacramento', 'Satisfy'
];

export function isScriptFont(fontFamily: string): boolean {
  return SCRIPT_FONTS.includes(fontFamily);
}

export function getFontByFamily(family: string): EditorFont | undefined {
  return EDITOR_FONTS.find(font => font.family === family);
}

