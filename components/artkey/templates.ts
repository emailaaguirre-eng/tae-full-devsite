import { ElegantIconKey } from './ElegantIcons';

export interface ArtKeyTemplate {
  value: string;
  name: string;
  bg: string;
  button: string;
  text: string;
  title: string;
  category: 'classic' | 'elegant' | 'sports';
  buttonStyle?: 'solid' | 'outline' | 'glass';
  buttonShape?: 'pill' | 'rounded' | 'square';
  headerIcon?: ElegantIconKey;
  titleFont?: string;
  buttonBorder?: string;
}

// CLASSIC TEMPLATES (16)
export const CLASSIC_TEMPLATES: ArtKeyTemplate[] = [
  { value: 'classic', name: 'Classic', bg: '#F6F7FB', button: '#4f46e5', text: '#1d1d1f', title: '#4f46e5', category: 'classic' },
  { value: 'paper', name: 'Paper', bg: '#fbf8f1', button: '#8b4513', text: '#2d3436', title: '#8b4513', category: 'classic' },
  { value: 'snow', name: 'Snow', bg: '#ffffff', button: '#3b82f6', text: '#1d1d1f', title: '#3b82f6', category: 'classic' },
  { value: 'cloud', name: 'Cloud', bg: '#f8fafc', button: '#10b981', text: '#1d1d1f', title: '#10b981', category: 'classic' },
  { value: 'pearl', name: 'Pearl', bg: '#fefefe', button: '#ec4899', text: '#1d1d1f', title: '#ec4899', category: 'classic' },
  { value: 'ivory', name: 'Ivory', bg: '#fffff0', button: '#f59e0b', text: '#2d3436', title: '#f59e0b', category: 'classic' },
  { value: 'mist', name: 'Mist', bg: '#f1f5f9', button: '#8b5cf6', text: '#1d1d1f', title: '#8b5cf6', category: 'classic' },
  { value: 'cream', name: 'Cream', bg: '#fef3c7', button: '#d97706', text: '#2d3436', title: '#d97706', category: 'classic' },
  { value: 'aurora', name: 'Aurora', bg: 'linear-gradient(135deg,#667eea,#764ba2)', button: '#ffffff', text: '#ffffff', title: '#ffffff', category: 'classic' },
  { value: 'sunset', name: 'Sunset', bg: 'linear-gradient(135deg,#ff6b6b,#feca57)', button: '#ffffff', text: '#ffffff', title: '#ffd700', category: 'classic' },
  { value: 'ocean', name: 'Ocean', bg: 'linear-gradient(135deg,#667eea,#74ebd5)', button: '#ffffff', text: '#ffffff', title: '#74ebd5', category: 'classic' },
  { value: 'fire', name: 'Fire', bg: 'linear-gradient(135deg,#ff6b6b,#ee5a6f)', button: '#ffffff', text: '#ffffff', title: '#fef3c7', category: 'classic' },
  { value: 'dark', name: 'Dark Mode', bg: '#0f1218', button: '#667eea', text: '#ffffff', title: '#667eea', category: 'classic' },
  { value: 'bold', name: 'Bold', bg: '#111111', button: '#ffffff', text: '#ffffff', title: '#ffffff', category: 'classic' },
  { value: 'cosmic', name: 'Cosmic', bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', button: '#ef4444', text: '#ffffff', title: '#fbbf24', category: 'classic' },
  { value: 'midnight', name: 'Midnight', bg: 'linear-gradient(135deg,#000428,#004e92)', button: '#60a5fa', text: '#ffffff', title: '#60a5fa', category: 'classic' },
];

// ELEGANT TEMPLATES (16) - Wedding/Formal/Modern Luxury
export const ELEGANT_TEMPLATES: ArtKeyTemplate[] = [
  {
    value: 'classic-elegance',
    name: 'Classic Elegance',
    bg: 'linear-gradient(180deg, #FAF8F5 0%, #F5F0E8 100%)',
    button: '#C9A962',
    text: '#3D3D3D',
    title: '#C9A962',
    category: 'elegant',
    buttonStyle: 'outline',
    buttonShape: 'rounded',
    headerIcon: 'rings',
    titleFont: 'g:Cormorant Garamond',
    buttonBorder: '#C9A962',
  },
  {
    value: 'modern-romance',
    name: 'Modern Romance',
    bg: 'linear-gradient(180deg, #FFF5F5 0%, #FEE2E2 100%)',
    button: '#E8A4A4',
    text: '#4A4A4A',
    title: '#B76E79',
    category: 'elegant',
    buttonStyle: 'outline',
    buttonShape: 'rounded',
    headerIcon: 'heart',
    titleFont: 'g:Playfair Display',
    buttonBorder: '#E8A4A4',
  },
  {
    value: 'garden-party',
    name: 'Garden Party',
    bg: 'linear-gradient(180deg, #F8FAF5 0%, #E8F0E0 100%)',
    button: '#7B9E6B',
    text: '#3D4A3D',
    title: '#5C7A4D',
    category: 'elegant',
    buttonStyle: 'outline',
    buttonShape: 'rounded',
    headerIcon: 'wreath',
    titleFont: 'g:Lora',
    buttonBorder: '#7B9E6B',
  },
  {
    value: 'midnight-glam',
    name: 'Midnight Glam',
    bg: 'linear-gradient(180deg, #1A1F3C 0%, #0D1025 100%)',
    button: '#D4AF37',
    text: '#E8E8E8',
    title: '#D4AF37',
    category: 'elegant',
    buttonStyle: 'outline',
    buttonShape: 'rounded',
    headerIcon: 'diamond',
    titleFont: 'g:Cinzel',
    buttonBorder: '#D4AF37',
  },
  {
    value: 'vintage-charm',
    name: 'Vintage Charm',
    bg: 'linear-gradient(180deg, #FDF8F3 0%, #F5E6D8 100%)',
    button: '#C4A484',
    text: '#5C4A3D',
    title: '#8B6F5C',
    category: 'elegant',
    buttonStyle: 'outline',
    buttonShape: 'rounded',
    headerIcon: 'rose',
    titleFont: 'g:Playfair Display',
    buttonBorder: '#C4A484',
  },
  {
    value: 'black-tie',
    name: 'Black Tie',
    bg: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
    button: '#1A1A1A',
    text: '#1A1A1A',
    title: '#1A1A1A',
    category: 'elegant',
    buttonStyle: 'outline',
    buttonShape: 'square',
    headerIcon: 'monogram',
    titleFont: 'g:Cinzel',
    buttonBorder: '#1A1A1A',
  },
  {
    value: 'coastal-breeze',
    name: 'Coastal Breeze',
    bg: 'linear-gradient(180deg, #F0F7FA 0%, #D4E9F2 100%)',
    button: '#5B8FA8',
    text: '#3D5A6B',
    title: '#3D5A6B',
    category: 'elegant',
    buttonStyle: 'outline',
    buttonShape: 'rounded',
    headerIcon: 'infinity',
    titleFont: 'g:Lora',
    buttonBorder: '#5B8FA8',
  },
  {
    value: 'rustic-romance',
    name: 'Rustic Romance',
    bg: 'linear-gradient(180deg, #FAF6F0 0%, #F0E6D8 100%)',
    button: '#B8755D',
    text: '#5C4A42',
    title: '#8B5E4D',
    category: 'elegant',
    buttonStyle: 'outline',
    buttonShape: 'rounded',
    headerIcon: 'bell',
    titleFont: 'g:Cormorant Garamond',
    buttonBorder: '#B8755D',
  },
  {
    value: 'rose-gold-luxe',
    name: 'Rose Gold Luxe',
    bg: 'linear-gradient(180deg, #2C2023 0%, #1A1214 100%)',
    button: '#E8B4B8',
    text: '#F0D4D7',
    title: '#E8B4B8',
    category: 'elegant',
    buttonStyle: 'glass',
    buttonShape: 'pill',
    headerIcon: 'crown',
    titleFont: 'g:Playfair Display',
    buttonBorder: '#E8B4B8',
  },
  {
    value: 'champagne-toast',
    name: 'Champagne Toast',
    bg: 'linear-gradient(180deg, #FBF7EF 0%, #F2E8D5 100%)',
    button: '#B8963E',
    text: '#5A4A30',
    title: '#8B7230',
    category: 'elegant',
    buttonStyle: 'solid',
    buttonShape: 'pill',
    headerIcon: 'champagne',
    titleFont: 'g:Cormorant Garamond',
    buttonBorder: '#B8963E',
  },
  {
    value: 'velvet-noir',
    name: 'Velvet Noir',
    bg: 'linear-gradient(180deg, #1C1C1C 0%, #0A0A0A 100%)',
    button: '#FFFFFF',
    text: '#CCCCCC',
    title: '#FFFFFF',
    category: 'elegant',
    buttonStyle: 'outline',
    buttonShape: 'square',
    headerIcon: 'monogram',
    titleFont: 'g:Cinzel',
    buttonBorder: '#FFFFFF',
  },
  {
    value: 'lavender-dream',
    name: 'Lavender Dream',
    bg: 'linear-gradient(180deg, #F5F0FF 0%, #E8DEFF 100%)',
    button: '#8B6FB0',
    text: '#4A3D5C',
    title: '#7B5FA0',
    category: 'elegant',
    buttonStyle: 'glass',
    buttonShape: 'pill',
    headerIcon: 'sparkle',
    titleFont: 'g:Playfair Display',
    buttonBorder: '#8B6FB0',
  },
  {
    value: 'emerald-gala',
    name: 'Emerald Gala',
    bg: 'linear-gradient(180deg, #0D2818 0%, #061A0F 100%)',
    button: '#C9A962',
    text: '#D8E8D0',
    title: '#C9A962',
    category: 'elegant',
    buttonStyle: 'outline',
    buttonShape: 'rounded',
    headerIcon: 'diamond',
    titleFont: 'g:Cinzel',
    buttonBorder: '#C9A962',
  },
  {
    value: 'blush-marble',
    name: 'Blush Marble',
    bg: 'linear-gradient(135deg, #FEFCFB 0%, #F8ECE4 50%, #F5E6DC 100%)',
    button: '#C4856C',
    text: '#5C4A42',
    title: '#B07058',
    category: 'elegant',
    buttonStyle: 'solid',
    buttonShape: 'pill',
    headerIcon: 'dove',
    titleFont: 'g:Lora',
    buttonBorder: '#C4856C',
  },
  {
    value: 'royal-sapphire',
    name: 'Royal Sapphire',
    bg: 'linear-gradient(180deg, #0C1445 0%, #060B2A 100%)',
    button: '#A8C4E0',
    text: '#C8D8E8',
    title: '#A8C4E0',
    category: 'elegant',
    buttonStyle: 'glass',
    buttonShape: 'rounded',
    headerIcon: 'crown',
    titleFont: 'g:Cinzel',
    buttonBorder: '#A8C4E0',
  },
  {
    value: 'pearl-whisper',
    name: 'Pearl Whisper',
    bg: 'linear-gradient(180deg, #FFFFFF 0%, #F8F4EF 100%)',
    button: '#B8A088',
    text: '#6B5C50',
    title: '#9C8B78',
    category: 'elegant',
    buttonStyle: 'outline',
    buttonShape: 'pill',
    headerIcon: 'infinity',
    titleFont: 'g:Cormorant Garamond',
    buttonBorder: '#B8A088',
  },
];

// SPORTS TEMPLATES (8) - Arizona Teams
export const SPORTS_TEMPLATES: ArtKeyTemplate[] = [
  { value: 'uofa', name: 'UofA Wildcats', bg: 'linear-gradient(135deg,#003366,#CC0033)', button: '#ffffff', text: '#ffffff', title: '#ffffff', category: 'sports' },
  { value: 'asu', name: 'ASU Sun Devils', bg: 'linear-gradient(135deg,#8C1D40,#FFC627)', button: '#ffffff', text: '#ffffff', title: '#FFC627', category: 'sports' },
  { value: 'nau', name: 'NAU Lumberjacks', bg: 'linear-gradient(135deg,#003466,#FFC82E)', button: '#ffffff', text: '#ffffff', title: '#FFC82E', category: 'sports' },
  { value: 'cardinals', name: 'AZ Cardinals', bg: 'linear-gradient(135deg,#97233F,#000000)', button: '#ffffff', text: '#ffffff', title: '#ffffff', category: 'sports' },
  { value: 'suns', name: 'Suns/Mercury', bg: 'linear-gradient(135deg,#1D1160,#E56020)', button: '#ffffff', text: '#ffffff', title: '#E56020', category: 'sports' },
  { value: 'dbacks', name: 'Diamondbacks', bg: 'linear-gradient(135deg,#A71930,#E3D4AD)', button: '#000000', text: '#000000', title: '#A71930', category: 'sports' },
  { value: 'rattlers', name: 'AZ Rattlers', bg: 'linear-gradient(135deg,#000000,#8B0000)', button: '#D4AF37', text: '#ffffff', title: '#D4AF37', category: 'sports' },
  { value: 'rising', name: 'PHX Rising FC', bg: 'linear-gradient(135deg,#000000,#B4975A)', button: '#E84C88', text: '#ffffff', title: '#B4975A', category: 'sports' },
];

// ALL TEMPLATES COMBINED
export const ALL_TEMPLATES: ArtKeyTemplate[] = [
  ...CLASSIC_TEMPLATES,
  ...ELEGANT_TEMPLATES,
  ...SPORTS_TEMPLATES,
];

// TEMPLATE CATEGORIES
// Note: Icons are now handled via CustomIcons component in the UI
// These are kept as strings for backward compatibility but should be replaced with CustomIcon components
export const TEMPLATE_CATEGORIES = [
  { id: 'classic', label: 'Classic', icon: 'art' }, // Use CustomIcon with name="art"
  { id: 'elegant', label: 'Elegant', icon: 'sparkle' }, // Use CustomIcon with name="sparkle"
  { id: 'sports', label: 'Sports', icon: 'sports' }, // Use CustomIcon with name="sports"
] as const;

export type TemplateCategory = 'classic' | 'elegant' | 'sports';

// Get templates by category
export function getTemplatesByCategory(category: TemplateCategory): ArtKeyTemplate[] {
  switch (category) {
    case 'classic': return CLASSIC_TEMPLATES;
    case 'elegant': return ELEGANT_TEMPLATES;
    case 'sports': return SPORTS_TEMPLATES;
    default: return ALL_TEMPLATES;
  }
}

// Find template by value
export function findTemplate(value: string): ArtKeyTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.value === value);
}

// BUTTON SHAPES
export const BUTTON_SHAPES = [
  { id: 'pill', label: 'Pill', borderRadius: '9999px' },
  { id: 'rounded', label: 'Rounded', borderRadius: '8px' },
  { id: 'square', label: 'Square', borderRadius: '0px' },
] as const;

export type ButtonShape = 'pill' | 'rounded' | 'square';

export function getButtonBorderRadius(shape: ButtonShape): string {
  const config = BUTTON_SHAPES.find(s => s.id === shape);
  return config?.borderRadius || '9999px';
}

// BUTTON STYLES
export const BUTTON_STYLES = [
  { id: 'solid', label: 'Solid' },
  { id: 'outline', label: 'Outline' },
  { id: 'glass', label: 'Glass' },
] as const;

export type ButtonStyle = 'solid' | 'outline' | 'glass';
