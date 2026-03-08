import { ElegantIconKey } from './ElegantIcons';

export interface ArtKeyTemplate {
  value: string;
  name: string;
  description?: string;
  bg: string;
  button: string;
  buttonGradient?: string;
  text: string;
  title: string;
  category: 'classic' | 'elegant' | 'sports';
  buttonStyle?: 'solid' | 'outline' | 'glass';
  buttonShape?: 'pill' | 'rounded' | 'square';
  headerIcon?: ElegantIconKey;
  titleFont?: string;
  buttonBorder?: string;
}

// CLASSIC TEMPLATES (4)
export const CLASSIC_TEMPLATES: ArtKeyTemplate[] = [
  { value: 'start-blank', name: 'Start Blank', description: 'Clean neutral canvas with balanced defaults for full customization.', bg: '#F6F7FB', button: '#4f46e5', text: '#1f2937', title: '#374151', category: 'classic', buttonStyle: 'solid', buttonShape: 'pill', headerIcon: 'none', buttonBorder: '#4f46e5' },
  { value: 'classic', name: 'Elegant Minimal', description: 'Soft chalk neutrals with crisp typography and refined contrast.', bg: 'linear-gradient(180deg,#FCFCFA 0%,#F2F0EA 100%)', button: '#1F2937', text: '#374151', title: '#111827', category: 'classic', buttonStyle: 'outline', buttonShape: 'rounded', headerIcon: 'sparkle', titleFont: 'g:Inter', buttonBorder: '#1F2937' },
  { value: 'sunset', name: 'Bold Celebration', description: 'Vibrant festive gradient with confident, high-visibility call-to-actions.', bg: 'linear-gradient(135deg,#FF6B6B 0%,#F97316 45%,#FACC15 100%)', button: '#111827', text: '#1f2937', title: '#7C2D12', category: 'classic', buttonStyle: 'solid', buttonShape: 'pill', headerIcon: 'sparkle', titleFont: 'g:Playfair Display', buttonBorder: '#111827' },
  { value: 'dark', name: 'Photo-Forward', description: 'Rich dark layering built to let media, links, and overlays stand out.', bg: 'linear-gradient(160deg,#0B1220 0%,#111827 55%,#1E293B 100%)', button: '#E2E8F0', text: '#E5E7EB', title: '#F8FAFC', category: 'classic', buttonStyle: 'glass', buttonShape: 'rounded', headerIcon: 'sparkle', titleFont: 'g:Montserrat', buttonBorder: '#E2E8F0' },
];

// ELEGANT TEMPLATES (4) - Wedding/Formal/Modern Luxury
export const ELEGANT_TEMPLATES: ArtKeyTemplate[] = [
  {
    value: 'modern-romance',
    name: 'Editorial Ivory',
    description: 'Modern editorial ivory base with warm luxury accents for weddings and keepsakes.',
    bg: '#F9F6F0',
    button: '#D4A373',
    text: '#2C3E50',
    title: '#2C3E50',
    category: 'elegant',
    buttonStyle: 'solid',
    buttonShape: 'pill',
    headerIcon: 'rings',
    titleFont: 'g:Playfair Display',
    buttonBorder: '#D4A373',
  },
  {
    value: 'vintage-charm',
    name: 'Champagne Minimal',
    description: 'Clean champagne palette with restrained editorial contrast and modern ceremony polish.',
    bg: '#FFFDF9',
    button: '#FF7E5F',
    buttonGradient: 'linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)',
    text: '#27272A',
    title: '#27272A',
    category: 'elegant',
    buttonStyle: 'solid',
    buttonShape: 'rounded',
    headerIcon: 'monogram',
    titleFont: 'g:Cormorant Garamond',
    buttonBorder: '#FF7E5F',
  },
  {
    value: 'aurora',
    name: 'Black Tie Evening',
    description: 'Dark formal evening palette tuned for modern luxury and high-contrast readability.',
    bg: '#22223B',
    button: '#9A8C98',
    text: '#F2E9E4',
    title: '#F2E9E4',
    category: 'elegant',
    buttonStyle: 'solid',
    buttonShape: 'pill',
    headerIcon: 'diamond',
    titleFont: 'g:Cinzel',
    buttonBorder: '#9A8C98',
  },
  {
    value: 'cloud',
    name: 'Modern Keepsake',
    description: 'Soft neutral editorial canvas with a contemporary keepsake-forward luxury finish.',
    bg: '#F4F1EA',
    button: '#ED4264',
    buttonGradient: 'linear-gradient(135deg, #ED4264 0%, #FFEDBC 100%)',
    text: '#3F3E3B',
    title: '#3F3E3B',
    category: 'elegant',
    buttonStyle: 'solid',
    buttonShape: 'rounded',
    headerIcon: 'sparkle',
    titleFont: 'g:Playfair Display',
    buttonBorder: '#ED4264',
  },
];

// SPORTS TEMPLATES (6) - Arizona Sports Pride
export const SPORTS_TEMPLATES: ArtKeyTemplate[] = [
  { value: 'uofa', name: 'Sports Pride: Wildcats', description: 'Navy and cardinal balance tuned for clean portal readability.', bg: 'linear-gradient(155deg,#0B2342 0%,#8B1538 100%)', button: '#F8FAFC', text: '#E5E7EB', title: '#F8FAFC', category: 'sports', buttonStyle: 'outline', buttonShape: 'rounded', headerIcon: 'graduation_cap', buttonBorder: '#F8FAFC' },
  { value: 'asu', name: 'Sports Pride: Sun Devils', description: 'Maroon-gold energy with restrained contrast-safe controls.', bg: 'linear-gradient(160deg,#5F1028 0%,#8C1D40 55%,#D6A300 100%)', button: '#111827', text: '#F9E6A6', title: '#FDE68A', category: 'sports', buttonStyle: 'solid', buttonShape: 'pill', headerIcon: 'graduation_cap', buttonBorder: '#111827' },
  { value: 'gcu', name: 'Sports Pride: GCU Lopes', description: 'Grand Canyon purple with elegant white action contrast.', bg: 'linear-gradient(160deg,#2B0F4F 0%,#522398 58%,#7C3AED 100%)', button: '#F8FAFC', text: '#F5F3FF', title: '#FFFFFF', category: 'sports', buttonStyle: 'outline', buttonShape: 'rounded', headerIcon: 'graduation_cap', buttonBorder: '#F8FAFC' },
  { value: 'suns', name: 'Sports Pride: Suns/Mercury', description: 'Deep violet and sunset orange layered for bold but polished portals.', bg: 'linear-gradient(155deg,#2A124D 0%,#4C1D95 45%,#EA580C 100%)', button: '#FFF7ED', text: '#F8FAFC', title: '#FDBA74', category: 'sports', buttonStyle: 'outline', buttonShape: 'pill', headerIcon: 'graduation_cap', buttonBorder: '#FDBA74' },
  { value: 'dbacks', name: 'Sports Pride: Diamondbacks', description: 'Desert sand, burgundy depth, and near-black typography for clarity.', bg: 'linear-gradient(155deg,#6E1027 0%,#A71930 35%,#D6C2A2 100%)', button: '#111111', text: '#111111', title: '#111111', category: 'sports', buttonStyle: 'solid', buttonShape: 'rounded', headerIcon: 'graduation_cap', buttonBorder: '#111111' },
  { value: 'rising', name: 'Sports Pride: PHX Rising', description: 'Desert-night black with modern pink-gold accents and readable controls.', bg: 'linear-gradient(160deg,#0B0B0B 0%,#2C2A2A 52%,#8B6B42 100%)', button: '#F9A8D4', text: '#F3F4F6', title: '#E5CDA3', category: 'sports', buttonStyle: 'outline', buttonShape: 'pill', headerIcon: 'graduation_cap', buttonBorder: '#F9A8D4' },
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
