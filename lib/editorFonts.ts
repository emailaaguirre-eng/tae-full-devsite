// Editor Fonts Library
// Curated Google Fonts for Project Editor labels

export interface EditorFont {
  family: string;
  displayName: string;
  category: 'serif' | 'sans' | 'script';
  weights: number[];
}

export const EDITOR_FONTS: EditorFont[] = [
  // Serif fonts
  { family: 'Playfair Display', displayName: 'Playfair Display', category: 'serif', weights: [400, 600, 700] },
  { family: 'Cormorant Garamond', displayName: 'Cormorant Garamond', category: 'serif', weights: [400, 600] },
  { family: 'Libre Baskerville', displayName: 'Libre Baskerville', category: 'serif', weights: [400, 600] },
  { family: 'Lora', displayName: 'Lora', category: 'serif', weights: [400, 600] },
  { family: 'Cinzel', displayName: 'Cinzel', category: 'serif', weights: [400, 600] },
  
  // Sans-serif fonts
  { family: 'Montserrat', displayName: 'Montserrat', category: 'sans', weights: [400, 600, 700] },
  { family: 'Inter', displayName: 'Inter', category: 'sans', weights: [400, 600] },
  { family: 'Poppins', displayName: 'Poppins', category: 'sans', weights: [400, 600] },
  { family: 'Raleway', displayName: 'Raleway', category: 'sans', weights: [400, 600] },
  
  // Script fonts
  { family: 'Dancing Script', displayName: 'Dancing Script', category: 'script', weights: [400] },
  { family: 'Great Vibes', displayName: 'Great Vibes', category: 'script', weights: [400] },
  { family: 'Pacifico', displayName: 'Pacifico', category: 'script', weights: [400] },
];

export const DEFAULT_FONT = 'Montserrat';
export const DEFAULT_FONT_WEIGHT = 600;

// Script font families (for guardrails)
const SCRIPT_FONTS = ['Dancing Script', 'Great Vibes', 'Pacifico'];

export function isScriptFont(fontFamily: string): boolean {
  return SCRIPT_FONTS.includes(fontFamily);
}

export function getFontByFamily(family: string): EditorFont | undefined {
  return EDITOR_FONTS.find(font => font.family === family);
}

