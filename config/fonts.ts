// Font configuration for the design editor
export interface FontConfig {
  name: string;
  family: string;
  category: 'sans-serif' | 'serif' | 'script' | 'display' | 'monospace';
}

export const availableFonts: FontConfig[] = [
  { name: 'Inter', family: 'Inter, sans-serif', category: 'sans-serif' },
  { name: 'Open Sans', family: 'Open Sans, sans-serif', category: 'sans-serif' },
  { name: 'Playfair Display', family: 'Playfair Display, serif', category: 'serif' },
  { name: 'Dancing Script', family: 'Dancing Script, cursive', category: 'script' },
  { name: 'Bebas Neue', family: 'Bebas Neue, sans-serif', category: 'display' },
];

export const defaultFont = availableFonts[0];

export const googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Open+Sans:wght@400;600;700&family=Playfair+Display:wght@400;600;700&family=Dancing+Script:wght@400;700&family=Bebas+Neue&display=swap';
