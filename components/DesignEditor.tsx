"use client";
// @ts-nocheck
// Note: TypeScript checking disabled due to Fabric.js v6 API compatibility issues

import { useState, useRef, useEffect } from 'react';

// Fabric.js v6 import - v6 exports everything directly
import * as fabric from 'fabric';
// import AIEffectsPanel from './AIEffectsPanel'; // COMMENTED OUT: Requires API backend
import {
  LayoutGrid,
  Image as ImageIcon,
  Type,
  Sparkles,
  Frame,
  Palette,
  Wand2,
  Stars,
  Heart,
  PartyPopper,
  Leaf,
  Plane,
  PawPrint,
  Music,
  Sun,
  ArrowRight,
  Star,
  Smile,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  X,
  Check,
  Upload,
  Search,
  Brush,
  CircleDot,
  Square,
  Circle,
  Triangle,
  Minus,
  Bold,
  Italic,
  Eraser,
  ScanFace,
  ImagePlus,
  Layers,
  Paintbrush,
  Focus,
  Aperture,
  Contrast,
  Droplets,
  CloudSun,
  Sunrise,
  Moon,
  Zap,
  Film,
  Camera,
  Pencil,
  PenTool,
  Grid3X3,
  LayoutTemplate,
  Rows3,
  Columns3,
  GalleryHorizontal,
  GalleryVertical,
  Move,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  Save,
} from 'lucide-react';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface StudioProps {
  productType: 'canvas' | 'print' | 'card' | 'poster' | 'photobook' | 'invitation' | 'announcement' | 'postcard';
  productSize: { width: number; height: number; name: string };
  onComplete: (designData: DesignOutput) => void;
  onClose?: () => void;
  initialImages?: string[];
  initialMessage?: string;
  frameColor?: string; // Frame color if product is framed (e.g., 'Black', 'White', 'Silver')
}

interface DesignOutput {
  imageDataUrl: string;
  imageBlob: Blob;
  dimensions: { width: number; height: number };
  dpi: number;
  productType: string;
  productSize: string;
}

interface CollageTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  slots: { x: number; y: number; width: number; height: number }[];
}

interface CollageSlot {
  id: string;
  x: number;        // Percentage (0-100)
  y: number;        // Percentage (0-100)
  width: number;    // Percentage (0-100)
  height: number;   // Percentage (0-100)
  imageId?: string; // ID of image placed in this slot
  locked?: boolean; // Prevent accidental changes
  fabricObjectId?: string; // Reference to Fabric.js object
}

interface StickerCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface Sticker {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
}

interface FrameOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  style: string;
}

interface FilterOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  css: string;
}

interface MoodTheme {
  id: string;
  name: string;
  icon: React.ReactNode;
  colors: { bg: string; accent: string; text: string };
  fonts: string[];
}

interface ArtStyle {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface OverlayOption {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  type: 'texture' | 'pattern' | 'border' | 'decorative' | 'background';
  // For programmatic overlays (patterns, textures)
  pattern?: string; // CSS pattern or SVG pattern
  opacity?: number;
  // For image-based overlays
  imageUrl?: string;
  // For borders
  borderStyle?: string;
  borderWidth?: number;
  borderColor?: string;
}

// =============================================================================
// STICKER CATEGORIES (Professional Icons)
// =============================================================================

const stickerCategories: StickerCategory[] = [
  { id: 'love', name: 'Love', icon: <Heart className="w-4 h-4" /> },
  { id: 'celebration', name: 'Celebration', icon: <PartyPopper className="w-4 h-4" /> },
  { id: 'nature', name: 'Nature', icon: <Leaf className="w-4 h-4" /> },
  { id: 'travel', name: 'Travel', icon: <Plane className="w-4 h-4" /> },
  { id: 'animals', name: 'Animals', icon: <PawPrint className="w-4 h-4" /> },
  { id: 'music', name: 'Music', icon: <Music className="w-4 h-4" /> },
  { id: 'weather', name: 'Weather', icon: <Sun className="w-4 h-4" /> },
  { id: 'arrows', name: 'Arrows', icon: <ArrowRight className="w-4 h-4" /> },
  { id: 'stars', name: 'Stars', icon: <Star className="w-4 h-4" /> },
  { id: 'shapes', name: 'Shapes', icon: <Circle className="w-4 h-4" /> },
];

// Generate stickers with Lucide icons
const generateStickers = (): Sticker[] => [
  // Love
  { id: 'love-1', name: 'Heart', category: 'love', icon: <Heart className="w-6 h-6" /> },
  { id: 'love-2', name: 'Heart Filled', category: 'love', icon: <Heart className="w-6 h-6 fill-current" /> },
  { id: 'love-3', name: 'Sparkle Heart', category: 'love', icon: <Sparkles className="w-6 h-6" /> },
  
  // Celebration
  { id: 'cel-1', name: 'Party', category: 'celebration', icon: <PartyPopper className="w-6 h-6" /> },
  { id: 'cel-2', name: 'Stars', category: 'celebration', icon: <Stars className="w-6 h-6" /> },
  { id: 'cel-3', name: 'Sparkles', category: 'celebration', icon: <Sparkles className="w-6 h-6" /> },
  { id: 'cel-4', name: 'Star', category: 'celebration', icon: <Star className="w-6 h-6" /> },
  { id: 'cel-5', name: 'Zap', category: 'celebration', icon: <Zap className="w-6 h-6" /> },
  
  // Nature
  { id: 'nat-1', name: 'Sun', category: 'nature', icon: <Sun className="w-6 h-6" /> },
  { id: 'nat-2', name: 'Moon', category: 'nature', icon: <Moon className="w-6 h-6" /> },
  { id: 'nat-3', name: 'Sunrise', category: 'nature', icon: <Sunrise className="w-6 h-6" /> },
  { id: 'nat-4', name: 'Cloud Sun', category: 'nature', icon: <CloudSun className="w-6 h-6" /> },
  { id: 'nat-5', name: 'Leaf', category: 'nature', icon: <Leaf className="w-6 h-6" /> },
  { id: 'nat-6', name: 'Droplet', category: 'nature', icon: <Droplets className="w-6 h-6" /> },
  
  // Travel
  { id: 'trv-1', name: 'Plane', category: 'travel', icon: <Plane className="w-6 h-6" /> },
  { id: 'trv-2', name: 'Camera', category: 'travel', icon: <Camera className="w-6 h-6" /> },
  
  // Shapes
  { id: 'shp-1', name: 'Circle', category: 'shapes', icon: <Circle className="w-6 h-6" /> },
  { id: 'shp-2', name: 'Square', category: 'shapes', icon: <Square className="w-6 h-6" /> },
  { id: 'shp-3', name: 'Triangle', category: 'shapes', icon: <Triangle className="w-6 h-6" /> },
  { id: 'shp-4', name: 'Star', category: 'shapes', icon: <Star className="w-6 h-6" /> },
  
  // Stars
  { id: 'str-1', name: 'Star', category: 'stars', icon: <Star className="w-6 h-6" /> },
  { id: 'str-2', name: 'Stars', category: 'stars', icon: <Stars className="w-6 h-6" /> },
  { id: 'str-3', name: 'Sparkles', category: 'stars', icon: <Sparkles className="w-6 h-6" /> },
  { id: 'str-4', name: 'Zap', category: 'stars', icon: <Zap className="w-6 h-6" /> },
];

const stickers = generateStickers();

// =============================================================================
// DECORATIVE FRAMES (Professional)
// =============================================================================

const frames: FrameOption[] = [
  { id: 'none', name: 'No Frame', icon: <X className="w-5 h-5" />, style: 'none' },
  { id: 'simple-black', name: 'Classic Black', icon: <Square className="w-5 h-5" />, style: '8px solid #000000' },
  { id: 'simple-white', name: 'Classic White', icon: <Square className="w-5 h-5 text-gray-300" />, style: '8px solid #ffffff' },
  { id: 'simple-gold', name: 'Elegant Gold', icon: <Square className="w-5 h-5 text-amber-500" />, style: '8px solid #d4af37' },
  { id: 'thin-black', name: 'Thin Black', icon: <Minus className="w-5 h-5" />, style: '2px solid #000000' },
  { id: 'double-black', name: 'Double Line', icon: <Rows3 className="w-5 h-5" />, style: '4px double #000000' },
  { id: 'rounded', name: 'Rounded Corners', icon: <CircleDot className="w-5 h-5" />, style: 'rounded' },
  { id: 'rounded-square', name: 'Rounded Square', icon: <Square className="w-5 h-5" />, style: 'rounded-square' },
  { id: 'rounded-rect', name: 'Rounded Rectangle', icon: <Square className="w-5 h-5" />, style: 'rounded-rect' },
  { id: 'film-strip', name: 'Film Strip', icon: <Film className="w-5 h-5" />, style: 'film-strip' },
  { id: 'decorative', name: 'Decorative', icon: <Sparkles className="w-5 h-5" />, style: 'decorative' },
  { id: 'tabbed', name: 'Tabbed', icon: <Square className="w-5 h-5" />, style: 'tabbed' },
  { id: 'shadow', name: 'Shadow', icon: <Layers className="w-5 h-5" />, style: 'shadow' },
  { id: 'polaroid', name: 'Polaroid', icon: <Camera className="w-5 h-5" />, style: 'polaroid' },
  { id: 'vintage', name: 'Vintage', icon: <Film className="w-5 h-5" />, style: 'vintage' },
];

// =============================================================================
// FILTERS (Professional Icons)
// =============================================================================

const advancedFilters: FilterOption[] = [
  { id: 'none', name: 'Original', icon: <Camera className="w-5 h-5" />, css: '' },
  { id: 'clarendon', name: 'Clarendon', icon: <Sunrise className="w-5 h-5" />, css: 'contrast(1.2) saturate(1.35)' },
  { id: 'gingham', name: 'Gingham', icon: <Aperture className="w-5 h-5" />, css: 'brightness(1.05) hue-rotate(-10deg)' },
  { id: 'moon', name: 'Moon', icon: <Moon className="w-5 h-5" />, css: 'grayscale(1) contrast(1.1) brightness(1.1)' },
  { id: 'lark', name: 'Lark', icon: <Sun className="w-5 h-5" />, css: 'contrast(0.9) saturate(1.5) brightness(1.1)' },
  { id: 'reyes', name: 'Reyes', icon: <CloudSun className="w-5 h-5" />, css: 'sepia(0.22) brightness(1.1) contrast(0.85)' },
  { id: 'juno', name: 'Juno', icon: <Zap className="w-5 h-5" />, css: 'sepia(0.35) contrast(1.15) brightness(1.15) saturate(1.8)' },
  { id: 'slumber', name: 'Slumber', icon: <Moon className="w-5 h-5" />, css: 'saturate(0.66) brightness(1.05)' },
  { id: 'ludwig', name: 'Ludwig', icon: <Contrast className="w-5 h-5" />, css: 'brightness(1.05) saturate(0.9) contrast(1.15)' },
  { id: 'perpetua', name: 'Perpetua', icon: <Sparkles className="w-5 h-5" />, css: 'brightness(1.1) saturate(1.1)' },
  { id: 'inkwell', name: 'Inkwell', icon: <Pencil className="w-5 h-5" />, css: 'grayscale(1) brightness(1.1) contrast(1.1)' },
  { id: 'nashville', name: 'Nashville', icon: <Music className="w-5 h-5" />, css: 'sepia(0.4) saturate(1.5) contrast(1.1)' },
];

// =============================================================================
// MOOD THEMES (Professional)
// =============================================================================

const moodThemes: MoodTheme[] = [
  { id: 'romantic', name: 'Romantic', icon: <Heart className="w-5 h-5" />, colors: { bg: '#fff0f5', accent: '#ff69b4', text: '#8b008b' }, fonts: ['Playfair Display', 'Georgia'] },
  { id: 'vintage', name: 'Vintage', icon: <Film className="w-5 h-5" />, colors: { bg: '#f5f5dc', accent: '#8b4513', text: '#2f1810' }, fonts: ['Playfair Display', 'Courier New'] },
  { id: 'modern', name: 'Modern', icon: <Zap className="w-5 h-5" />, colors: { bg: '#1a1a2e', accent: '#e94560', text: '#ffffff' }, fonts: ['Helvetica', 'Arial'] },
  { id: 'playful', name: 'Playful', icon: <PartyPopper className="w-5 h-5" />, colors: { bg: '#fff9c4', accent: '#ff6f00', text: '#1565c0' }, fonts: ['Comic Sans MS', 'Arial'] },
  { id: 'elegant', name: 'Elegant', icon: <Star className="w-5 h-5" />, colors: { bg: '#0d0d0d', accent: '#d4af37', text: '#ffffff' }, fonts: ['Playfair Display', 'Georgia'] },
  { id: 'nature', name: 'Nature', icon: <Leaf className="w-5 h-5" />, colors: { bg: '#e8f5e9', accent: '#2e7d32', text: '#1b5e20' }, fonts: ['Georgia', 'Verdana'] },
  { id: 'ocean', name: 'Ocean', icon: <Droplets className="w-5 h-5" />, colors: { bg: '#e3f2fd', accent: '#0277bd', text: '#01579b' }, fonts: ['Helvetica', 'Arial'] },
  { id: 'sunset', name: 'Sunset', icon: <Sunrise className="w-5 h-5" />, colors: { bg: '#fff3e0', accent: '#ff5722', text: '#bf360c' }, fonts: ['Georgia', 'Palatino'] },
  { id: 'minimalist', name: 'Minimalist', icon: <Minus className="w-5 h-5" />, colors: { bg: '#ffffff', accent: '#000000', text: '#333333' }, fonts: ['Helvetica', 'Arial'] },
  { id: 'dreamy', name: 'Dreamy', icon: <Stars className="w-5 h-5" />, colors: { bg: '#e8eaf6', accent: '#7c4dff', text: '#311b92' }, fonts: ['Playfair Display', 'Georgia'] },
];

// =============================================================================
// OVERLAYS (For Cards, Invitations, Announcements, Postcards)
// =============================================================================

const overlayCategories = [
  { id: 'textures', name: 'Textures', icon: <Paintbrush className="w-4 h-4" /> },
  { id: 'patterns', name: 'Patterns', icon: <Grid3X3 className="w-4 h-4" /> },
  { id: 'borders', name: 'Borders', icon: <Square className="w-4 h-4" /> },
  { id: 'decorative', name: 'Decorative', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'backgrounds', name: 'Backgrounds', icon: <Layers className="w-4 h-4" /> },
];

const overlays: OverlayOption[] = [
  // TEXTURES
  { id: 'paper-texture', name: 'Paper', category: 'textures', type: 'texture', icon: <Square className="w-4 h-4" />, pattern: 'paper', opacity: 0.3 },
  { id: 'canvas-texture', name: 'Canvas', category: 'textures', type: 'texture', icon: <Square className="w-4 h-4" />, pattern: 'canvas', opacity: 0.2 },
  { id: 'linen-texture', name: 'Linen', category: 'textures', type: 'texture', icon: <Square className="w-4 h-4" />, pattern: 'linen', opacity: 0.25 },
  { id: 'fabric-texture', name: 'Fabric', category: 'textures', type: 'texture', icon: <Square className="w-4 h-4" />, pattern: 'fabric', opacity: 0.2 },
  { id: 'parchment-texture', name: 'Parchment', category: 'textures', type: 'texture', icon: <Square className="w-4 h-4" />, pattern: 'parchment', opacity: 0.3 },
  
  // PATTERNS
  { id: 'dots-pattern', name: 'Dots', category: 'patterns', type: 'pattern', icon: <CircleDot className="w-4 h-4" />, pattern: 'dots', opacity: 0.15 },
  { id: 'stripes-pattern', name: 'Stripes', category: 'patterns', type: 'pattern', icon: <Minus className="w-4 h-4" />, pattern: 'stripes', opacity: 0.2 },
  { id: 'grid-pattern', name: 'Grid', category: 'patterns', type: 'pattern', icon: <Grid3X3 className="w-4 h-4" />, pattern: 'grid', opacity: 0.1 },
  { id: 'diagonal-pattern', name: 'Diagonal', category: 'patterns', type: 'pattern', icon: <Zap className="w-4 h-4" />, pattern: 'diagonal', opacity: 0.15 },
  { id: 'polka-dot-pattern', name: 'Polka Dot', category: 'patterns', type: 'pattern', icon: <Circle className="w-4 h-4" />, pattern: 'polka', opacity: 0.2 },
  { id: 'chevron-pattern', name: 'Chevron', category: 'patterns', type: 'pattern', icon: <Triangle className="w-4 h-4" />, pattern: 'chevron', opacity: 0.15 },
  
  // BORDERS
  { id: 'border-classic', name: 'Classic Border', category: 'borders', type: 'border', icon: <Square className="w-4 h-4" />, borderStyle: 'solid', borderWidth: 3, borderColor: '#000000' },
  { id: 'border-elegant', name: 'Elegant Border', category: 'borders', type: 'border', icon: <Star className="w-4 h-4" />, borderStyle: 'double', borderWidth: 5, borderColor: '#d4af37' },
  { id: 'border-dashed', name: 'Dashed Border', category: 'borders', type: 'border', icon: <Minus className="w-4 h-4" />, borderStyle: 'dashed', borderWidth: 2, borderColor: '#333333' },
  { id: 'border-dotted', name: 'Dotted Border', category: 'borders', type: 'border', icon: <CircleDot className="w-4 h-4" />, borderStyle: 'dotted', borderWidth: 2, borderColor: '#666666' },
  { id: 'border-ornate', name: 'Ornate Border', category: 'borders', type: 'border', icon: <Sparkles className="w-4 h-4" />, borderStyle: 'ornate', borderWidth: 4, borderColor: '#8b4513' },
  { id: 'border-vintage', name: 'Vintage Border', category: 'borders', type: 'border', icon: <Film className="w-4 h-4" />, borderStyle: 'vintage', borderWidth: 3, borderColor: '#8b4513' },
  
  // DECORATIVE
  { id: 'corner-flourish', name: 'Corner Flourish', category: 'decorative', type: 'decorative', icon: <Sparkles className="w-4 h-4" />, pattern: 'corner-flourish', opacity: 0.4 },
  { id: 'edge-decoration', name: 'Edge Decoration', category: 'decorative', type: 'decorative', icon: <Layers className="w-4 h-4" />, pattern: 'edge', opacity: 0.3 },
  { id: 'floral-corner', name: 'Floral Corner', category: 'decorative', type: 'decorative', icon: <Leaf className="w-4 h-4" />, pattern: 'floral-corner', opacity: 0.35 },
  { id: 'geometric-corner', name: 'Geometric Corner', category: 'decorative', type: 'decorative', icon: <Triangle className="w-4 h-4" />, pattern: 'geometric', opacity: 0.3 },
  
  // BACKGROUNDS
  { id: 'watermark-subtle', name: 'Subtle Watermark', category: 'backgrounds', type: 'background', icon: <Droplets className="w-4 h-4" />, pattern: 'watermark', opacity: 0.05 },
  { id: 'gradient-overlay', name: 'Gradient Overlay', category: 'backgrounds', type: 'background', icon: <Sunrise className="w-4 h-4" />, pattern: 'gradient', opacity: 0.2 },
  { id: 'vignette', name: 'Vignette', category: 'backgrounds', type: 'background', icon: <Circle className="w-4 h-4" />, pattern: 'vignette', opacity: 0.3 },
];

// =============================================================================
// AI ART STYLES (Professional)
// =============================================================================

const artStyles: ArtStyle[] = [
  { id: 'vangogh', name: 'Van Gogh', icon: <Paintbrush className="w-5 h-5" />, description: 'Swirling brushstrokes' },
  { id: 'monet', name: 'Monet', icon: <Droplets className="w-5 h-5" />, description: 'Impressionist' },
  { id: 'picasso', name: 'Picasso', icon: <Layers className="w-5 h-5" />, description: 'Cubist' },
  { id: 'warhol', name: 'Warhol', icon: <Palette className="w-5 h-5" />, description: 'Pop art' },
  { id: 'sketch', name: 'Pencil Sketch', icon: <Pencil className="w-5 h-5" />, description: 'Hand-drawn' },
  { id: 'watercolor', name: 'Watercolor', icon: <Droplets className="w-5 h-5" />, description: 'Soft paint' },
  { id: 'cartoon', name: 'Cartoonify', icon: <Smile className="w-5 h-5" />, description: 'Cartoon style' },
  { id: 'rotoscope', name: 'Rotoscope', icon: <Film className="w-5 h-5" />, description: 'Animation style' },
];

// =============================================================================
// COLLAGE TEMPLATES
// =============================================================================

const collageTemplates: CollageTemplate[] = [
  { id: 'single', name: 'Single', icon: <Square className="w-4 h-4" />, slots: [{ x: 0, y: 0, width: 100, height: 100 }] },
  { id: '2-horizontal', name: '2 Horizontal', icon: <Columns3 className="w-4 h-4" />, slots: [{ x: 0, y: 0, width: 50, height: 100 }, { x: 50, y: 0, width: 50, height: 100 }] },
  { id: '2-vertical', name: '2 Vertical', icon: <Rows3 className="w-4 h-4" />, slots: [{ x: 0, y: 0, width: 100, height: 50 }, { x: 0, y: 50, width: 100, height: 50 }] },
  { id: '3-left', name: '3 Left Focus', icon: <GalleryHorizontal className="w-4 h-4" />, slots: [{ x: 0, y: 0, width: 60, height: 100 }, { x: 60, y: 0, width: 40, height: 50 }, { x: 60, y: 50, width: 40, height: 50 }] },
  { id: '4-grid', name: '4 Grid', icon: <Grid3X3 className="w-4 h-4" />, slots: [{ x: 0, y: 0, width: 50, height: 50 }, { x: 50, y: 0, width: 50, height: 50 }, { x: 0, y: 50, width: 50, height: 50 }, { x: 50, y: 50, width: 50, height: 50 }] },
  { id: '6-grid', name: '6 Grid', icon: <LayoutGrid className="w-4 h-4" />, slots: Array.from({ length: 6 }, (_, i) => ({ x: (i % 3) * 33.33, y: Math.floor(i / 3) * 50, width: 33.33, height: 50 })) },
  { id: '9-grid', name: '9 Grid', icon: <LayoutTemplate className="w-4 h-4" />, slots: Array.from({ length: 9 }, (_, i) => ({ x: (i % 3) * 33.33, y: Math.floor(i / 3) * 33.33, width: 33.33, height: 33.33 })) },
];

// =============================================================================
// FONTS
// =============================================================================

const availableFonts = [
  'Playfair Display', 'Arial', 'Georgia', 'Times New Roman', 'Helvetica',
  'Verdana', 'Trebuchet MS', 'Palatino', 'Garamond', 'Bookman',
  'Impact', 'Lucida Sans', 'Tahoma', 'Century Gothic', 'Courier New',
  'Futura', 'Rockwell', 'Didot', 'Baskerville', 'Bodoni', 'Optima',
  'Avenir', 'Gill Sans', 'Franklin Gothic', 'Segoe UI'
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DesignEditor({
  productType = 'canvas',
  productSize = { width: 8, height: 10, name: '8x10' },
  onComplete,
  onClose,
  initialImages = [],
  initialMessage = '',
  frameColor
}: StudioProps) {
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  
  // State
const [activeTab, setActiveTab] = useState<'templates' | 'images' | 'text' | 'labels' | 'shapes' | 'stickers' | 'frames' | 'filters' | 'magic' | 'overlays'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<CollageTemplate>(collageTemplates[0]);
  const [collageSlots, setCollageSlots] = useState<CollageSlot[]>([]);
  const [isCollageMode, setIsCollageMode] = useState(false);
  const [showSlotGuides, setShowSlotGuides] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialImages);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [zoom, setZoom] = useState(1);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  // Initialize orientation based on product dimensions
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    productSize.width > productSize.height ? 'landscape' : 'portrait'
  );
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>(frames[0]);
  const [selectedFilter, setSelectedFilter] = useState(advancedFilters[0]);
  const [selectedMood, setSelectedMood] = useState<MoodTheme | null>(null);
  const [selectedStickerCategory, setSelectedStickerCategory] = useState('love');
  const [selectedOverlayCategory, setSelectedOverlayCategory] = useState('textures');
  const [appliedOverlays, setAppliedOverlays] = useState<string[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  
  // Undo/Redo history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef<{ history: string[]; index: number }>({ history: [], index: -1 });
  
  // Shape settings
  const [shapeSettings, setShapeSettings] = useState({
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    rx: 0, // border radius for rectangles
    ry: 0,
  });
  
  // Text settings
  const [textSettings, setTextSettings] = useState({
    fontFamily: 'Playfair Display',
    fontSize: 40,
    fill: '#000000',
    fontWeight: 'normal',
    fontStyle: 'normal',
    shadow: false,
    outline: false,
  });
  
  // Folded product check (cards, invitations, announcements, postcards)
  const isFoldedProduct = productType === 'card' || productType === 'invitation' || productType === 'announcement' || productType === 'postcard';
  
  // Foil settings (for cards, invitations, announcements)
  const isFoilProduct = productType === 'card' || productType === 'invitation' || productType === 'announcement';
  const [foilSettings, setFoilSettings] = useState({
    color: 'gold' as 'gold' | 'silver' | 'rose-gold' | 'copper',
  });
  const [foilElements, setFoilElements] = useState<Set<string>>(new Set());
  
  // Apply foil to selected object
  const applyFoilToSelected = () => {
    if (!fabricRef.current || !selectedObject) return;
    
    const objId = (selectedObject as any).__fabricObjectId || Math.random().toString(36);
    (selectedObject as any).__fabricObjectId = objId;
    (selectedObject as any).foil = {
      enabled: true,
      color: foilSettings.color,
    };
    
    // Add visual foil preview (overlay)
    const foilColorMap = {
      'gold': '#FFD700',
      'silver': '#C0C0C0',
      'rose-gold': '#E8B4B8',
      'copper': '#B87333',
    };
    
    // Update object appearance to show foil preview
    selectedObject.set({
      fill: foilColorMap[foilSettings.color],
      opacity: 0.8,
    });
    
    const newFoilElements = new Set(foilElements);
    newFoilElements.add(objId);
    setFoilElements(newFoilElements);
    
    fabricRef.current.renderAll();
    saveState();
  };
  
  // Calculate canvas dimensions (300 DPI for print quality)
  const DPI = 300;
  
  // Determine actual dimensions based on orientation
  const actualWidth = orientation === 'landscape' ? Math.max(productSize.width, productSize.height) : Math.min(productSize.width, productSize.height);
  const actualHeight = orientation === 'landscape' ? Math.min(productSize.width, productSize.height) : Math.max(productSize.width, productSize.height);
  
  // For cards/invitations/announcements, calculate unfolded dimensions (folded size * 2 width for front+back)
  // Canvas represents the full unfolded/flat design area
  const canvasWidth = isFoldedProduct 
    ? (actualWidth * 2 * DPI) // Unfolded width (front + back side by side)
    : (actualWidth * DPI);
  const canvasHeight = actualHeight * DPI;
  const displayScale = 0.15;
  
  // Multi-surface state for cards (front, back, inside)
  const [activeSurface, setActiveSurface] = useState<'front' | 'back' | 'inside'>('front');
  const [surfaceDesigns, setSurfaceDesigns] = useState<{
    front: fabric.Object[];
    back: fabric.Object[];
    inside: fabric.Object[];
  }>({ front: [], back: [], inside: [] });
  
  // =============================================================================
  // INITIALIZE CANVAS
  // =============================================================================
  
  // Draw printable area guides
  const drawPrintableArea = (canvas: fabric.Canvas) => {
    // Remove existing printable area guides
    const existingGuides = canvas.getObjects().filter((obj: any) => obj.data?.type === 'printable-area');
    existingGuides.forEach((obj) => canvas.remove(obj));
    
    const bleed = 0.125 * DPI * displayScale; // 1/8 inch bleed in display scale
    const safeArea = 0.25 * DPI * displayScale; // 1/4 inch safe area in display scale
    
    if (isFoldedProduct) {
      // Cards have 4 regions: Front, Back, Inside Left, Inside Right
      const regionWidth = (canvas.width! / 2);
      const regionHeight = canvas.height! / 2;
      
      // Front (top left)
      const frontRect = new fabric.Rect({
        left: bleed,
        top: bleed,
        width: regionWidth - (bleed * 2),
        height: regionHeight - (bleed * 2),
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        name: 'printable-front',
        data: { type: 'printable-area', region: 'front' }
      });
      
      // Safe area for front
      const frontSafe = new fabric.Rect({
        left: safeArea,
        top: safeArea,
        width: regionWidth - (safeArea * 2),
        height: regionHeight - (safeArea * 2),
        fill: 'transparent',
        stroke: '#10b981',
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        selectable: false,
        evented: false,
        name: 'safe-front',
        data: { type: 'printable-area', region: 'front-safe' }
      });
      
      // Back (top right)
      const backRect = new fabric.Rect({
        left: regionWidth + bleed,
        top: bleed,
        width: regionWidth - (bleed * 2),
        height: regionHeight - (bleed * 2),
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        name: 'printable-back',
        data: { type: 'printable-area', region: 'back' }
      });
      
      // Safe area for back
      const backSafe = new fabric.Rect({
        left: regionWidth + safeArea,
        top: safeArea,
        width: regionWidth - (safeArea * 2),
        height: regionHeight - (safeArea * 2),
        fill: 'transparent',
        stroke: '#10b981',
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        selectable: false,
        evented: false,
        name: 'safe-back',
        data: { type: 'printable-area', region: 'back-safe' }
      });
      
      // Inside Left (bottom left)
      const insideLeftRect = new fabric.Rect({
        left: bleed,
        top: regionHeight + bleed,
        width: regionWidth - (bleed * 2),
        height: regionHeight - (bleed * 2),
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        name: 'printable-inside-left',
        data: { type: 'printable-area', region: 'inside-left' }
      });
      
      // Inside Right (bottom right)
      const insideRightRect = new fabric.Rect({
        left: regionWidth + bleed,
        top: regionHeight + bleed,
        width: regionWidth - (bleed * 2),
        height: regionHeight - (bleed * 2),
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        name: 'printable-inside-right',
        data: { type: 'printable-area', region: 'inside-right' }
      });
      
      // Labels
      const frontLabel = new fabric.Text('Front', {
        left: 10,
        top: 10,
        fontSize: 12,
        fill: '#3b82f6',
        fontFamily: 'Arial',
        fontWeight: 'bold',
        selectable: false,
        evented: false,
        name: 'label-front',
        data: { type: 'printable-area-label' }
      });
      
      const backLabel = new fabric.Text('Back', {
        left: regionWidth + 10,
        top: 10,
        fontSize: 12,
        fill: '#3b82f6',
        fontFamily: 'Arial',
        fontWeight: 'bold',
        selectable: false,
        evented: false,
        name: 'label-back',
        data: { type: 'printable-area-label' }
      });
      
      const insideLabel = new fabric.Text('Inside', {
        left: canvas.width! / 2 - 20,
        top: regionHeight + 10,
        fontSize: 12,
        fill: '#3b82f6',
        fontFamily: 'Arial',
        fontWeight: 'bold',
        selectable: false,
        evented: false,
        name: 'label-inside',
        data: { type: 'printable-area-label' }
      });
      
      canvas.add(frontRect);
      canvas.add(frontSafe);
      canvas.add(backRect);
      canvas.add(backSafe);
      canvas.add(insideLeftRect);
      canvas.add(insideRightRect);
      canvas.add(frontLabel);
      canvas.add(backLabel);
      canvas.add(insideLabel);
      
      // Send all guides to back
      [frontRect, frontSafe, backRect, backSafe, insideLeftRect, insideRightRect, frontLabel, backLabel, insideLabel].forEach(obj => {
        canvas.sendToBack(obj);
      });
    } else {
      // Regular prints - single printable area
      const printableRect = new fabric.Rect({
        left: bleed,
        top: bleed,
        width: canvas.width! - (bleed * 2),
        height: canvas.height! - (bleed * 2),
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        name: 'printable-area',
        data: { type: 'printable-area' }
      });
      
      // Safe area
      const safeRect = new fabric.Rect({
        left: safeArea,
        top: safeArea,
        width: canvas.width! - (safeArea * 2),
        height: canvas.height! - (safeArea * 2),
        fill: 'transparent',
        stroke: '#10b981',
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        selectable: false,
        evented: false,
        name: 'safe-area',
        data: { type: 'printable-area', subtype: 'safe' }
      });
      
      canvas.add(printableRect);
      canvas.add(safeRect);
      canvas.sendToBack(printableRect);
      canvas.sendToBack(safeRect);
      
      // Add frame visualization if frame is selected (only for prints)
      if (frameColor && productType === 'print') {
        const frameWidth = 20 * displayScale; // Frame width in display scale
        const frameColorMap: Record<string, string> = {
          'Black': '#1a1a1a',
          'White': '#f5f5f5',
          'Silver': '#c0c0c0'
        };
        const frameFillColor = frameColorMap[frameColor] || '#888888';
        const frameStrokeColor = frameColor === 'Black' ? '#000000' : frameColor === 'White' ? '#cccccc' : '#a0a0a0';
        
        // Outer frame (back layer)
        const outerFrame = new fabric.Rect({
          left: -frameWidth,
          top: -frameWidth,
          width: canvas.width! + (frameWidth * 2),
          height: canvas.height! + (frameWidth * 2),
          fill: frameFillColor,
          stroke: frameStrokeColor,
          strokeWidth: 2,
          selectable: false,
          evented: false,
          name: 'frame-outer',
          data: { type: 'frame', frameColor }
        });
        
        // Inner frame edge (to show depth)
        const innerFrame = new fabric.Rect({
          left: 0,
          top: 0,
          width: canvas.width!,
          height: canvas.height!,
          fill: 'transparent',
          stroke: frameColor === 'Black' ? '#000000' : frameColor === 'White' ? '#ffffff' : '#e0e0e0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          name: 'frame-inner',
          data: { type: 'frame', frameColor }
        });
        
        // Frame disclaimer text
        const disclaimerText = new fabric.Text('Frame shown is a placeholder representation', {
          left: canvas.width! / 2,
          top: canvas.height! + (frameWidth * 1.5),
          fontSize: 10 * displayScale,
          fill: '#666666',
          fontFamily: 'Arial',
          fontStyle: 'italic',
          textAlign: 'center',
          originX: 'center',
          originY: 'top',
          selectable: false,
          evented: false,
          name: 'frame-disclaimer',
          data: { type: 'frame-disclaimer' }
        });
        
        canvas.add(outerFrame);
        canvas.add(innerFrame);
        canvas.add(disclaimerText);
        canvas.sendToBack(outerFrame);
        canvas.sendToBack(innerFrame);
      }
    }
    
    canvas.renderAll();
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    
    try {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: canvasWidth * displayScale,
        height: canvasHeight * displayScale,
        backgroundColor: backgroundColor,
        preserveObjectStacking: true,
      });
      
      fabricRef.current = canvas;
      
      canvas.on('selection:created', (e) => setSelectedObject(e.selected?.[0] || null));
      canvas.on('selection:updated', (e) => setSelectedObject(e.selected?.[0] || null));
      canvas.on('selection:cleared', () => setSelectedObject(null));
      
      // Draw printable area guides
      drawPrintableArea(canvas);
      
      setError(null); // Clear any previous errors
      
      return () => { 
        try {
          canvas.dispose(); 
        } catch (e) {
          console.error('Error disposing canvas:', e);
        }
      };
    } catch (err: any) {
      console.error('Error initializing Design Editor canvas:', err);
      setError(`Failed to initialize canvas: ${err?.message || 'Unknown error'}`);
    }
  }, [canvasWidth, canvasHeight, backgroundColor, orientation, productType, productSize]);
  
  // Redraw printable area when frame color changes (without recreating canvas)
  useEffect(() => {
    if (fabricRef.current) {
      drawPrintableArea(fabricRef.current);
    }
  }, [frameColor]);
  
  // Load initial images to canvas when provided
  useEffect(() => {
    if (!fabricRef.current || initialImages.length === 0) return;
    
    // Add initial images to canvas
    initialImages.forEach((imageUrl, index) => {
      setTimeout(() => {
        addImageToCanvas(imageUrl);
      }, index * 100); // Stagger image loading
    });
  }, [initialImages.length]); // Only depend on initialImages.length, not fabricRef.current
  
  // =============================================================================
  // IMAGE HANDLING
  // =============================================================================
  
  // Convert image to JPG format
  const convertImageToJPG = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas to convert image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Convert to JPG (quality 0.92 for good balance)
          const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          resolve(jpgDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const fileArray = Array.from(files);
    
    try {
      // Convert all images to JPG
      const convertedImages = await Promise.all(
        fileArray.map(file => convertImageToJPG(file))
      );
      
      convertedImages.forEach(jpgDataUrl => {
        setUploadedImages(prev => [...prev, jpgDataUrl]);
      });
    } catch (error) {
      console.error('Error converting images:', error);
      alert('Failed to process some images. Please ensure they are in JPG, PNG, or BMP format.');
    }
  };
  
  const addImageToCanvas = async (imageUrl: string) => {
    if (!fabricRef.current) {
      console.error('Canvas not initialized');
      return;
    }
    
    try {
      const canvas = fabricRef.current!;
      
      // For folded products, position image based on active surface
      let imageLeft = canvas.width! / 2;
      if (isFoldedProduct) {
        const surfaceWidth = canvas.width! / 2; // Each surface is half the canvas width
        if (activeSurface === 'front') {
          imageLeft = surfaceWidth / 2; // Left half (front)
        } else if (activeSurface === 'back') {
          imageLeft = surfaceWidth + (surfaceWidth / 2); // Right half (back)
        } else {
          // Inside - can span both or be centered
          imageLeft = canvas.width! / 2;
        }
      }
      
      // Check if it's an SVG file
      const isSVG = imageUrl.startsWith('data:image/svg+xml') || imageUrl.endsWith('.svg') || imageUrl.includes('<svg');
      
      if (isSVG) {
        // Load SVG properly using Fabric.js SVG loader
        await new Promise<void>((resolve, reject) => {
          fabric.loadSVGFromURL(imageUrl, (objects, options) => {
            if (!objects || objects.length === 0) {
              // Fallback to image if SVG loading fails
              fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' })
                .then(img => {
                  const scale = Math.min(
                    (canvas.width! * 0.4) / (img.width || 100),
                    (canvas.height! * 0.4) / (img.height || 100)
                  );
                  
                  img.set({
                    left: imageLeft,
                    top: canvas.height! / 2,
                    originX: 'center',
                    originY: 'center',
                    scaleX: scale,
                    scaleY: scale,
                    data: { surface: activeSurface }, // Tag with surface for folded products
                  });
                  
                  canvas.add(img);
                  canvas.setActiveObject(img);
                  canvas.renderAll();
                  saveState();
                  resolve();
                })
                .catch(reject);
              return;
            }
            
            // Create a group from SVG objects
            const svgGroup = new fabric.Group(objects, {
              left: imageLeft,
              top: canvas.height! / 2,
              originX: 'center',
              originY: 'center',
              data: { surface: activeSurface },
            });
            
            // Scale to fit canvas
            const scale = Math.min(
              (canvas.width! * 0.4) / (svgGroup.width || 100),
              (canvas.height! * 0.4) / (svgGroup.height || 100)
            );
            
            svgGroup.scale(scale);
            canvas.add(svgGroup);
            canvas.setActiveObject(svgGroup);
            canvas.renderAll();
            saveState();
            resolve();
          }, (error) => {
            // Fallback to regular image loading
            fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' })
              .then(img => {
                const scale = Math.min(
                  (canvas.width! * 0.4) / (img.width || 100),
                  (canvas.height! * 0.4) / (img.height || 100)
                );
                
                img.set({
                  left: imageLeft,
                  top: canvas.height! / 2,
                  originX: 'center',
                  originY: 'center',
                  scaleX: scale,
                  scaleY: scale,
                  data: { surface: activeSurface },
                });
                
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
                saveState();
                resolve();
              })
              .catch(reject);
          });
        });
      } else {
        // Regular image (PNG, JPG, etc.)
        const img = await fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' });
        const scale = Math.min(
          (canvas.width! * 0.4) / (img.width || 100),
          (canvas.height! * 0.4) / (img.height || 100)
        );
        
        img.set({
          left: imageLeft,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          data: { surface: activeSurface }, // Tag with surface for folded products
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveState();
      }
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Failed to load image. Please try a different format.');
    }
  };
  
  // Load initial images when component mounts and canvas is ready
  useEffect(() => {
    if (initialImages.length > 0 && fabricRef.current) {
      // Sync uploadedImages with initialImages
      if (uploadedImages.length !== initialImages.length || 
          uploadedImages.some((img, idx) => img !== initialImages[idx])) {
        setUploadedImages([...initialImages]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImages]);
  
  // Load initial images to canvas when provided (after canvas is initialized)
  useEffect(() => {
    if (!fabricRef.current || initialImages.length === 0) return;
    
    // Small delay to ensure canvas is fully initialized
    const timer = setTimeout(() => {
      initialImages.forEach((imageUrl, index) => {
        setTimeout(() => {
          addImageToCanvas(imageUrl);
        }, index * 200); // Stagger image loading
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [initialImages.length]); // Only depend on initialImages.length
  
  // =============================================================================
  // TEXT HANDLING
  // =============================================================================
  
  // =============================================================================
  // UNDO/REDO FUNCTIONALITY
  // =============================================================================
  
  const saveState = () => {
    if (!fabricRef.current) return;
    const state = JSON.stringify(fabricRef.current.toJSON());
    const newHistory = historyRef.current.history.slice(0, historyRef.current.index + 1);
    newHistory.push(state);
    // Limit history to 50 states
    if (newHistory.length > 50) newHistory.shift();
    historyRef.current = { history: newHistory, index: newHistory.length - 1 };
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  const undo = () => {
    if (!fabricRef.current || historyRef.current.index <= 0) return;
    historyRef.current.index--;
    const state = historyRef.current.history[historyRef.current.index];
    fabricRef.current.loadFromJSON(state, () => {
      fabricRef.current?.renderAll();
      setHistoryIndex(historyRef.current.index);
    });
  };
  
  const redo = () => {
    if (!fabricRef.current || historyRef.current.index >= historyRef.current.history.length - 1) return;
    historyRef.current.index++;
    const state = historyRef.current.history[historyRef.current.index];
    fabricRef.current.loadFromJSON(state, () => {
      fabricRef.current?.renderAll();
      setHistoryIndex(historyRef.current.index);
    });
  };
  
  // Save state on canvas modifications
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    
    const handleModification = () => saveState();
    
    canvas.on('object:added', handleModification);
    canvas.on('object:removed', handleModification);
    canvas.on('object:modified', handleModification);
    canvas.on('path:created', handleModification);
    
    // Save initial state
    saveState();
    
    return () => {
      canvas.off('object:added', handleModification);
      canvas.off('object:removed', handleModification);
      canvas.off('object:modified', handleModification);
      canvas.off('path:created', handleModification);
    };
  }, [fabricRef.current]);
  
  // =============================================================================
  // SHAPE FUNCTIONS
  // =============================================================================
  
  const addShape = (type: 'rect' | 'circle' | 'triangle' | 'rounded-rect') => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;
    const size = Math.min(canvas.width!, canvas.height!) * 0.2;
    
    let shape: fabric.Object;
    
    if (type === 'rect') {
      shape = new fabric.Rect({
        left: centerX,
        top: centerY,
        width: size,
        height: size,
        originX: 'center',
        originY: 'center',
        fill: shapeSettings.fill,
        stroke: shapeSettings.stroke,
        strokeWidth: shapeSettings.strokeWidth,
      });
    } else if (type === 'circle') {
      shape = new fabric.Circle({
        left: centerX,
        top: centerY,
        radius: size / 2,
        originX: 'center',
        originY: 'center',
        fill: shapeSettings.fill,
        stroke: shapeSettings.stroke,
        strokeWidth: shapeSettings.strokeWidth,
      });
    } else if (type === 'triangle') {
      const points = [
        { x: 0, y: -size / 2 },
        { x: size / 2, y: size / 2 },
        { x: -size / 2, y: size / 2 },
      ];
      shape = new fabric.Polygon(points, {
        left: centerX,
        top: centerY,
        originX: 'center',
        originY: 'center',
        fill: shapeSettings.fill,
        stroke: shapeSettings.stroke,
        strokeWidth: shapeSettings.strokeWidth,
      });
    } else { // rounded-rect
      shape = new fabric.Rect({
        left: centerX,
        top: centerY,
        width: size,
        height: size,
        originX: 'center',
        originY: 'center',
        rx: shapeSettings.rx || 20,
        ry: shapeSettings.ry || 20,
        fill: shapeSettings.fill,
        stroke: shapeSettings.stroke,
        strokeWidth: shapeSettings.strokeWidth,
      });
    }
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    saveState();
  };
  
  const addTextToShape = () => {
    if (!fabricRef.current) return;
    const activeObj = fabricRef.current.getActiveObject();
    if (!activeObj) {
      // If no shape selected, just add text
      addText();
      return;
    }
    
    // Add text inside the selected shape
    const textObj = new fabric.IText('Your Text', {
      left: activeObj.left! + (activeObj.width! * activeObj.scaleX!) / 2,
      top: activeObj.top! + (activeObj.height! * activeObj.scaleY!) / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: textSettings.fontFamily,
      fontSize: textSettings.fontSize,
      fill: textSettings.fill,
      fontWeight: textSettings.fontWeight as any,
      fontStyle: textSettings.fontStyle as any,
    });
    
    if (textSettings.shadow) {
      textObj.set('shadow', new fabric.Shadow({
        color: 'rgba(0,0,0,0.5)',
        blur: 10,
        offsetX: 5,
        offsetY: 5,
      }));
    }
    
    if (textSettings.outline) {
      textObj.set({ stroke: '#000000', strokeWidth: 2 });
    }
    
    fabricRef.current.add(textObj);
    fabricRef.current.setActiveObject(textObj);
    fabricRef.current.renderAll();
    saveState();
  };
  
  const addText = () => {
    if (!fabricRef.current) return;
    
    const textObj = new fabric.IText('Your Text Here', {
      left: fabricRef.current.width! / 2,
      top: fabricRef.current.height! / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: textSettings.fontFamily,
      fontSize: textSettings.fontSize,
      fill: textSettings.fill,
      fontWeight: textSettings.fontWeight as any,
      fontStyle: textSettings.fontStyle as any,
    });
    
    if (textSettings.shadow) {
      textObj.set('shadow', new fabric.Shadow({
        color: 'rgba(0,0,0,0.5)',
        blur: 10,
        offsetX: 5,
        offsetY: 5,
      }));
    }
    
    if (textSettings.outline) {
      textObj.set({ stroke: '#000000', strokeWidth: 2 });
    }
    
    fabricRef.current.add(textObj);
    fabricRef.current.setActiveObject(textObj);
    fabricRef.current.renderAll();
    saveState();
  };
  
  // =============================================================================
  // COLLAGE CUSTOMIZATION
  // =============================================================================
  
  // Apply template and create slots
  const applyCollageTemplate = (template: CollageTemplate) => {
    if (!fabricRef.current) return;
    
    // Clear existing slots first
    clearCollage();
    
    const canvas = fabricRef.current;
    const aspectRatio = productSize.width / productSize.height;
    
    // Create slots from template
    const newSlots: CollageSlot[] = template.slots.map((slot, index) => {
      const slotId = `slot-${Date.now()}-${index}`;
      
      // Convert percentage to pixels
      const left = (slot.x / 100) * canvas.width!;
      const top = (slot.y / 100) * canvas.height!;
      const width = (slot.width / 100) * canvas.width!;
      const height = (slot.height / 100) * canvas.height!;
      
      // Create visual slot guide
      const slotRect = new fabric.Rect({
        left,
        top,
        width,
        height,
        fill: 'transparent',
        stroke: showSlotGuides ? '#3b82f6' : 'transparent',
        strokeWidth: 2,
        strokeDashArray: showSlotGuides ? [5, 5] : [],
        rx: 4,
        ry: 4,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockRotation: true,
        name: slotId,
        data: { type: 'collage-slot', slotId }
      });
      
      // Add slot number label
      const slotLabel = new fabric.Text(`${index + 1}`, {
        left: left + 5,
        top: top + 5,
        fontSize: 14,
        fill: showSlotGuides ? '#3b82f6' : 'transparent',
        fontFamily: 'Arial',
        fontWeight: 'bold',
        selectable: false,
        evented: false,
        name: `${slotId}-label`
      });
      
      canvas.add(slotRect);
      canvas.add(slotLabel);
      canvas.sendToBack(slotRect);
      canvas.sendToBack(slotLabel);
      
      return {
        id: slotId,
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
        fabricObjectId: slotId
      };
    });
    
    setCollageSlots(newSlots);
    setIsCollageMode(true);
    
    // Listen for slot modifications
    canvas.on('object:modified', handleSlotModified);
    canvas.on('object:selected', handleSlotSelected);
    
    canvas.renderAll();
  };
  
  // Handle slot resize/move
  const handleSlotModified = (e: fabric.IEvent) => {
    const obj = e.target;
    if (!obj || !obj.data || obj.data.type !== 'collage-slot') return;
    
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    const slotId = obj.data.slotId;
    const slot = collageSlots.find(s => s.id === slotId);
    if (!slot) return;
    
    // Convert pixels back to percentages
    const newX = (obj.left! / canvas.width!) * 100;
    const newY = (obj.top! / canvas.height!) * 100;
    const newWidth = (obj.width! * obj.scaleX! / canvas.width!) * 100;
    const newHeight = (obj.height! * obj.scaleY! / canvas.height!) * 100;
    
    // Update slot
    setCollageSlots(prev => prev.map(s => 
      s.id === slotId 
        ? { ...s, x: newX, y: newY, width: newWidth, height: newHeight }
        : s
    ));
    
    // Update image in slot if exists
    if (slot.imageId) {
      updateImageInSlot(slotId, slot.imageId);
    }
  };
  
  // Handle slot selection
  const handleSlotSelected = (e: fabric.IEvent) => {
    const obj = e.target;
    if (obj && obj.data && obj.data.type === 'collage-slot') {
      setSelectedSlot(obj.data.slotId);
    } else {
      setSelectedSlot(null);
    }
  };
  
  // Add image to specific slot
  const addImageToSlot = async (imageUrl: string, slotId: string) => {
    if (!fabricRef.current) return;
    
    const slot = collageSlots.find(s => s.id === slotId);
    if (!slot) return;
    
    const canvas = fabricRef.current;
    
    try {
      // Remove existing image in slot if any
      const existingImage = canvas.getObjects().find(obj => obj.name === `image-${slotId}`);
      if (existingImage) canvas.remove(existingImage);
      
      // Calculate slot dimensions in pixels
      const slotLeft = (slot.x / 100) * canvas.width!;
      const slotTop = (slot.y / 100) * canvas.height!;
      const slotWidth = (slot.width / 100) * canvas.width!;
      const slotHeight = (slot.height / 100) * canvas.height!;
      
      // Check if it's an SVG
      const isSVG = imageUrl.startsWith('data:image/svg+xml') || imageUrl.endsWith('.svg') || imageUrl.includes('<svg');
      
      if (isSVG) {
        // Load SVG for slot
        await new Promise<void>((resolve, reject) => {
          fabric.loadSVGFromURL(imageUrl, (objects, options) => {
            if (!objects || objects.length === 0) {
              // Fallback to image
              fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' })
                .then(img => {
                  const scaleX = slotWidth / (img.width || 100);
                  const scaleY = slotHeight / (img.height || 100);
                  const scale = Math.max(scaleX, scaleY);
                  
                  img.set({
                    left: slotLeft + slotWidth / 2,
                    top: slotTop + slotHeight / 2,
                    originX: 'center',
                    originY: 'center',
                    scaleX: scale,
                    scaleY: scale,
                    name: `image-${slotId}`,
                    data: { type: 'collage-image', slotId }
                  });
                  
                  canvas.add(img);
                  canvas.sendToBack(img);
                  canvas.renderAll();
                  resolve();
                })
                .catch(reject);
              return;
            }
            
            const svgGroup = new fabric.Group(objects, {
              left: slotLeft + slotWidth / 2,
              top: slotTop + slotHeight / 2,
              originX: 'center',
              originY: 'center',
            });
            
            const scaleX = slotWidth / (svgGroup.width || 100);
            const scaleY = slotHeight / (svgGroup.height || 100);
            const scale = Math.max(scaleX, scaleY);
            
            svgGroup.scale(scale);
            svgGroup.set({
              name: `image-${slotId}`,
              data: { type: 'collage-image', slotId }
            });
            
            canvas.add(svgGroup);
            canvas.sendToBack(svgGroup);
            canvas.renderAll();
            resolve();
          }, (error) => {
            // Fallback to regular image
            fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' })
              .then(img => {
                const scaleX = slotWidth / (img.width || 100);
                const scaleY = slotHeight / (img.height || 100);
                const scale = Math.max(scaleX, scaleY);
                
                img.set({
                  left: slotLeft + slotWidth / 2,
                  top: slotTop + slotHeight / 2,
                  originX: 'center',
                  originY: 'center',
                  scaleX: scale,
                  scaleY: scale,
                  name: `image-${slotId}`,
                  data: { type: 'collage-image', slotId }
                });
                
                canvas.add(img);
                canvas.sendToBack(img);
                canvas.renderAll();
                resolve();
              })
              .catch(reject);
          });
        });
      } else {
        // Regular image (PNG, JPG, etc.)
        const img = await fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' });
        
        // Fit image to slot (maintain aspect ratio or fill)
        const scaleX = slotWidth / (img.width || 100);
        const scaleY = slotHeight / (img.height || 100);
        const scale = Math.max(scaleX, scaleY); // Fill slot
        
        img.set({
          left: slotLeft + slotWidth / 2,
          top: slotTop + slotHeight / 2,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          name: `image-${slotId}`,
          data: { type: 'collage-image', slotId }
        });
        
        canvas.add(img);
        canvas.sendToBack(img);
      }
      
      // Update slot with image reference
      setCollageSlots(prev => prev.map(s => 
        s.id === slotId ? { ...s, imageId: imageUrl } : s
      ));
      
      canvas.renderAll();
    } catch (error) {
      console.error('Error adding image to slot:', error);
    }
  };
  
  // Update image when slot changes
  const updateImageInSlot = (slotId: string, imageUrl: string) => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    const slot = collageSlots.find(s => s.id === slotId);
    if (!slot) return;
    
    const imageObj = canvas.getObjects().find(obj => 
      obj.name === `image-${slotId}`
    ) as fabric.Image;
    
    if (!imageObj) return;
    
    // Recalculate position and scale
    const slotLeft = (slot.x / 100) * canvas.width!;
    const slotTop = (slot.y / 100) * canvas.height!;
    const slotWidth = (slot.width / 100) * canvas.width!;
    const slotHeight = (slot.height / 100) * canvas.height!;
    
    const scaleX = slotWidth / (imageObj.width || 100);
    const scaleY = slotHeight / (imageObj.height || 100);
    const scale = Math.max(scaleX, scaleY);
    
    imageObj.set({
      left: slotLeft + slotWidth / 2,
      top: slotTop + slotHeight / 2,
      scaleX: scale,
      scaleY: scale
    });
    
    canvas.renderAll();
  };
  
  // Add new custom slot
  const addCustomSlot = () => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    const newSlotId = `slot-custom-${Date.now()}`;
    
    // Default size: 30% x 30% in center
    const defaultSlot: CollageSlot = {
      id: newSlotId,
      x: 35,
      y: 35,
      width: 30,
      height: 30
    };
    
    const left = (defaultSlot.x / 100) * canvas.width!;
    const top = (defaultSlot.y / 100) * canvas.height!;
    const width = (defaultSlot.width / 100) * canvas.width!;
    const height = (defaultSlot.height / 100) * canvas.height!;
    
    const slotRect = new fabric.Rect({
      left,
      top,
      width,
      height,
      fill: 'transparent',
      stroke: showSlotGuides ? '#3b82f6' : 'transparent',
      strokeWidth: 2,
      strokeDashArray: showSlotGuides ? [5, 5] : [],
      rx: 4,
      ry: 4,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      name: newSlotId,
      data: { type: 'collage-slot', slotId: newSlotId }
    });
    
    const slotLabel = new fabric.Text(`${collageSlots.length + 1}`, {
      left: left + 5,
      top: top + 5,
      fontSize: 14,
      fill: showSlotGuides ? '#3b82f6' : 'transparent',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      selectable: false,
      evented: false,
      name: `${newSlotId}-label`
    });
    
    canvas.add(slotRect);
    canvas.add(slotLabel);
    canvas.sendToBack(slotRect);
    canvas.sendToBack(slotLabel);
    
    setCollageSlots(prev => [...prev, defaultSlot]);
    
    // Add event listeners
    canvas.on('object:modified', handleSlotModified);
    canvas.on('object:selected', handleSlotSelected);
    
    canvas.renderAll();
  };
  
  // Delete slot
  const deleteSlot = (slotId: string) => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    // Remove slot rectangle
    const slotObj = canvas.getObjects().find(obj => obj.name === slotId);
    if (slotObj) canvas.remove(slotObj);
    
    // Remove slot label
    const labelObj = canvas.getObjects().find(obj => obj.name === `${slotId}-label`);
    if (labelObj) canvas.remove(labelObj);
    
    // Remove image in slot
    const imageObj = canvas.getObjects().find(obj => obj.name === `image-${slotId}`);
    if (imageObj) canvas.remove(imageObj);
    
    setCollageSlots(prev => prev.filter(s => s.id !== slotId));
    setSelectedSlot(null);
    canvas.renderAll();
  };
  
  // Clear all slots
  const clearCollage = () => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    // Remove all slot-related objects
    const objectsToRemove = canvas.getObjects().filter(obj => 
      (obj.data && obj.data.type === 'collage-slot') ||
      (obj.data && obj.data.type === 'collage-image') ||
      (obj.name && (obj.name.startsWith('slot-') || obj.name.startsWith('image-slot-')))
    );
    
    objectsToRemove.forEach(obj => canvas.remove(obj));
    
    setCollageSlots([]);
    setIsCollageMode(false);
    setSelectedSlot(null);
    canvas.renderAll();
  };
  
  // Toggle slot guides visibility
  const toggleSlotGuides = () => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    const newShowGuides = !showSlotGuides;
    
    canvas.getObjects().forEach(obj => {
      if (obj.data && obj.data.type === 'collage-slot') {
        obj.set({
          stroke: newShowGuides ? '#3b82f6' : 'transparent',
          strokeDashArray: newShowGuides ? [5, 5] : []
        });
      }
      if (obj.name && obj.name.endsWith('-label')) {
        obj.set({ fill: newShowGuides ? '#3b82f6' : 'transparent' });
      }
    });
    
    setShowSlotGuides(newShowGuides);
    canvas.renderAll();
  };
  
  // =============================================================================
  // OVERLAY SYSTEM
  // =============================================================================
  
  // Apply overlay to canvas
  const applyOverlay = async (overlay: OverlayOption) => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    // Remove existing overlay of same type if any
    const existingOverlay = canvas.getObjects().find(obj => 
      obj.data && obj.data.type === 'overlay' && obj.data.overlayId === overlay.id
    );
    if (existingOverlay) {
      canvas.remove(existingOverlay);
      setAppliedOverlays(prev => prev.filter(id => id !== overlay.id));
    }
    
    // Create overlay based on type
    if (overlay.type === 'border') {
      // Create border overlay
      const borderRect = new fabric.Rect({
        left: 0,
        top: 0,
        width: canvas.width!,
        height: canvas.height!,
        fill: 'transparent',
        stroke: overlay.borderColor || '#000000',
        strokeWidth: overlay.borderWidth || 3,
        strokeDashArray: overlay.borderStyle === 'dashed' ? [10, 5] : 
                         overlay.borderStyle === 'dotted' ? [2, 2] : undefined,
        selectable: false,
        evented: false,
        name: `overlay-${overlay.id}`,
        data: { type: 'overlay', overlayId: overlay.id, overlayType: 'border' }
      });
      
      canvas.add(borderRect);
      canvas.sendToBack(borderRect);
    } 
    else if (overlay.type === 'texture' || overlay.type === 'pattern' || overlay.type === 'background') {
      // Create pattern/texture overlay using SVG pattern or canvas pattern
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = canvas.width!;
      patternCanvas.height = canvas.height!;
      const patternCtx = patternCanvas.getContext('2d');
      
      if (!patternCtx) return;
      
      // Fill with pattern based on overlay.pattern
      createPattern(patternCtx, overlay.pattern || '', patternCanvas.width, patternCanvas.height, overlay.opacity || 0.2);
      
      // Convert to image and add to canvas
      const patternDataUrl = patternCanvas.toDataURL('image/png');
      const patternImg = await fabric.Image.fromURL(patternDataUrl, { crossOrigin: 'anonymous' });
      
      patternImg.set({
        left: 0,
        top: 0,
        width: canvas.width!,
        height: canvas.height!,
        selectable: false,
        evented: false,
        name: `overlay-${overlay.id}`,
        data: { type: 'overlay', overlayId: overlay.id, overlayType: overlay.type }
      });
      
      canvas.add(patternImg);
      canvas.sendToBack(patternImg);
    }
    else if (overlay.type === 'decorative') {
      // For decorative overlays, create SVG-based decorative elements
      // This would typically be corner flourishes, edge decorations, etc.
      // For now, create a simple pattern-based decorative element
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = canvas.width!;
      patternCanvas.height = canvas.height!;
      const patternCtx = patternCanvas.getContext('2d');
      
      if (!patternCtx) return;
      
      createDecorativePattern(patternCtx, overlay.pattern || '', patternCanvas.width, patternCanvas.height, overlay.opacity || 0.3);
      
      const patternDataUrl = patternCanvas.toDataURL('image/png');
      const patternImg = await fabric.Image.fromURL(patternDataUrl, { crossOrigin: 'anonymous' });
      
      patternImg.set({
        left: 0,
        top: 0,
        width: canvas.width!,
        height: canvas.height!,
        selectable: false,
        evented: false,
        name: `overlay-${overlay.id}`,
        data: { type: 'overlay', overlayId: overlay.id, overlayType: 'decorative' }
      });
      
      canvas.add(patternImg);
      canvas.sendToBack(patternImg);
    }
    
    setAppliedOverlays(prev => [...prev, overlay.id]);
    canvas.renderAll();
  };
  
  // Create pattern for texture/pattern overlays
  const createPattern = (ctx: CanvasRenderingContext2D, patternType: string, width: number, height: number, opacity: number) => {
    ctx.globalAlpha = opacity;
    
    switch (patternType) {
      case 'paper':
        // Paper texture - subtle noise
        for (let i = 0; i < width * height * 0.01; i++) {
          ctx.fillStyle = `rgba(${Math.random() * 50}, ${Math.random() * 50}, ${Math.random() * 50}, 0.1)`;
          ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
        }
        break;
      case 'dots':
        // Dots pattern
        const dotSize = 2;
        const spacing = 20;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let x = 0; x < width; x += spacing) {
          for (let y = 0; y < height; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      case 'stripes':
        // Stripes pattern
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let y = 0; y < height; y += 10) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        break;
      case 'grid':
        // Grid pattern
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 20) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        break;
      case 'diagonal':
        // Diagonal lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1;
        for (let i = -height; i < width; i += 15) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + height, height);
          ctx.stroke();
        }
        break;
      case 'polka':
        // Polka dots
        const polkaSize = 4;
        const polkaSpacing = 15;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let x = 0; x < width; x += polkaSpacing) {
          for (let y = 0; y < height; y += polkaSpacing) {
            ctx.beginPath();
            ctx.arc(x, y, polkaSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      case 'chevron':
        // Chevron pattern
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 2;
        const chevronHeight = 20;
        for (let y = 0; y < height; y += chevronHeight) {
          for (let x = 0; x < width; x += chevronHeight * 2) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + chevronHeight, y + chevronHeight);
            ctx.lineTo(x + chevronHeight * 2, y);
            ctx.stroke();
          }
        }
        break;
      case 'watermark':
        // Subtle watermark effect
        ctx.fillStyle = 'rgba(200, 200, 200, 0.05)';
        ctx.fillRect(0, 0, width, height);
        break;
      case 'gradient':
        // Gradient overlay
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        break;
      case 'vignette':
        // Vignette effect
        const vignetteGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
        vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, width, height);
        break;
      default:
        // Default subtle texture
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, width, height);
    }
    
    ctx.globalAlpha = 1.0;
  };
  
  // Create decorative pattern
  const createDecorativePattern = (ctx: CanvasRenderingContext2D, patternType: string, width: number, height: number, opacity: number) => {
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    
    switch (patternType) {
      case 'corner-flourish':
        // Corner flourishes
        const cornerSize = Math.min(width, height) * 0.15;
        // Top-left corner
        drawCornerFlourish(ctx, 0, 0, cornerSize);
        // Top-right corner
        drawCornerFlourish(ctx, width, 0, cornerSize, true);
        // Bottom-left corner
        drawCornerFlourish(ctx, 0, height, cornerSize, false, true);
        // Bottom-right corner
        drawCornerFlourish(ctx, width, height, cornerSize, true, true);
        break;
      case 'edge':
        // Edge decoration
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < width; i += 10) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 5, 5);
          ctx.stroke();
        }
        break;
      case 'floral-corner':
        // Floral corner decoration
        const floralSize = Math.min(width, height) * 0.1;
        drawFloralCorner(ctx, 0, 0, floralSize);
        break;
      case 'geometric':
        // Geometric corner
        const geoSize = Math.min(width, height) * 0.12;
        drawGeometricCorner(ctx, 0, 0, geoSize);
        break;
      default:
        // Default decorative pattern
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);
    }
    
    ctx.globalAlpha = 1.0;
  };
  
  // Helper functions for decorative patterns
  const drawCornerFlourish = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, flipX = false, flipY = false) => {
    ctx.save();
    ctx.translate(x, y);
    if (flipX) ctx.scale(-1, 1);
    if (flipY) ctx.scale(1, -1);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.3, size * 0.2, size * 0.5, size * 0.5);
    ctx.quadraticCurveTo(size * 0.7, size * 0.3, size, 0);
    ctx.stroke();
    
    ctx.restore();
  };
  
  const drawFloralCorner = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);
    
    // Simple floral pattern
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const px = Math.cos(angle) * (size * 0.3) + size * 0.5;
      const py = Math.sin(angle) * (size * 0.3) + size * 0.5;
      ctx.beginPath();
      ctx.arc(px, py, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };
  
  const drawGeometricCorner = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);
    
    // Geometric pattern
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, 0);
    ctx.lineTo(size * 0.7, size * 0.3);
    ctx.lineTo(size * 0.3, size * 0.7);
    ctx.lineTo(0, size);
    ctx.closePath();
    ctx.stroke();
    
    ctx.restore();
  };
  
  // Remove overlay
  const removeOverlay = (overlayId: string) => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    const overlayObj = canvas.getObjects().find(obj => 
      obj.data && obj.data.type === 'overlay' && obj.data.overlayId === overlayId
    );
    
    if (overlayObj) {
      canvas.remove(overlayObj);
      setAppliedOverlays(prev => prev.filter(id => id !== overlayId));
      canvas.renderAll();
    }
  };
  
  // =============================================================================
  // AI FEATURES
  // =============================================================================
  
  // COMMENTED OUT: AI Effects require API backend
  // const applyAIEffect = async (effectId: string, imageDataUrl: string): Promise<string | null> => {
  //   setIsProcessingAI(true);
  //   setAiStatus(`Processing AI effect...`);
  //   
  //   try {
  //     const response = await fetch('/api/ai-effects', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         effectId,
  //         imageDataUrl,
  //       }),
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(data.error || 'Failed to process effect');
  //     }

  //     if (data.success && data.imageUrl) {
  //       // Load the processed image onto canvas
  //       const canvas = fabricRef.current;
  //       if (canvas) {
  //         const activeObj = canvas.getActiveObject();
  //         
  //         // Create new image from result
  //         const img = await fabric.FabricImage.fromURL(data.imageUrl, { crossOrigin: 'anonymous' });
  //         
  //         if (activeObj) {
  //           // Replace the active object with the new image
  //           img.set({
  //             left: activeObj.left,
  //             top: activeObj.top,
  //             scaleX: activeObj.scaleX,
  //             scaleY: activeObj.scaleY,
  //             angle: activeObj.angle,
  //           });
  //           canvas.remove(activeObj);
  //         }
  //         
  //         canvas.add(img);
  //         canvas.setActiveObject(img);
  //         canvas.renderAll();
  //       }

  //       setAiStatus('Effect applied successfully!');
  //       setTimeout(() => setAiStatus(''), 2000);
  //       return data.imageUrl;
  //     }

  //     throw new Error('No image returned from API');
  //   } catch (error) {
  //     console.error('AI Effect error:', error);
  //     setAiStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //     setTimeout(() => setAiStatus(''), 3000);
  //     return null;
  //   } finally {
  //     setIsProcessingAI(false);
  //   }
  // };

  // COMMENTED OUT: Legacy effect handler requires API backend
  // const applyLegacyAIEffect = async (effectName: string) => {
  //   // Map old effect names to new effect IDs
  //   const effectMap: Record<string, string> = {
  //     'Van Gogh': 'vangogh',
  //     'Monet': 'monet',
  //     'Picasso': 'picasso',
  //     'Warhol': 'warhol',
  //     'Pencil Sketch': 'pencil',
  //     'Watercolor': 'watercolor',
  //     'Cartoonify': 'cartoon',
  //     'Rotoscope': 'rotoscope',
  //     'Background Removal': 'removebg',
  //     'Face Detection': 'facefix',
  //     'Magic Enhancement': 'upscale',
  //   };

  //   const effectId = effectMap[effectName];
  //   if (!effectId) {
  //     setAiStatus(`Unknown effect: ${effectName}`);
  //     return;
  //   }

  //   // Get current image from canvas
  //   const canvas = fabricRef.current;
  //   if (!canvas) return;

  //   const activeObj = canvas.getActiveObject();
  //   if (!activeObj || activeObj.type !== 'image') {
  //     setAiStatus('Please select an image first');
  //     setTimeout(() => setAiStatus(''), 2000);
  //     return;
  //   }

  //   const imageDataUrl = (activeObj as fabric.FabricImage).toDataURL({ format: 'png' });
  //   await applyAIEffect(effectId, imageDataUrl);
  // };
  
  // Placeholder function to show message when AI features are clicked
  const applyLegacyAIEffect = async (effectName: string) => {
    setAiStatus('AI effects require API backend - currently disabled');
    setTimeout(() => setAiStatus(''), 3000);
  };

  // Get current image data URL for AI effects
  const getCurrentImageDataUrl = (): string | null => {
    const canvas = fabricRef.current;
    if (!canvas) return null;

    const activeObj = canvas.getActiveObject();
    if (activeObj && activeObj.type === 'image') {
      return (activeObj as fabric.FabricImage).toDataURL({ format: 'png' });
    }

    // If no active object, try to get any image on canvas
    const images = canvas.getObjects().filter(obj => obj.type === 'image');
    if (images.length > 0) {
      return (images[0] as fabric.FabricImage).toDataURL({ format: 'png' });
    }

    return null;
  };
  
  const applyMoodTheme = (mood: MoodTheme) => {
    setSelectedMood(mood);
    setBackgroundColor(mood.colors.bg);
    setTextSettings(prev => ({
      ...prev,
      fontFamily: mood.fonts[0],
      fill: mood.colors.text,
    }));
    
    if (fabricRef.current) {
      fabricRef.current.backgroundColor = mood.colors.bg;
      fabricRef.current.renderAll();
    }
  };
  
  // =============================================================================
  // OBJECT CONTROLS
  // =============================================================================
  
  const deleteSelected = () => {
    if (!selectedObject || !fabricRef.current) return;
    fabricRef.current.remove(selectedObject);
    setSelectedObject(null);
    fabricRef.current.renderAll();
  };
  
  const duplicateSelected = async () => {
    if (!selectedObject || !fabricRef.current) return;
    const cloned = await selectedObject.clone();
    cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
    fabricRef.current!.add(cloned);
    fabricRef.current!.setActiveObject(cloned);
    fabricRef.current!.renderAll();
  };
  
  // =============================================================================
  // EXPORT
  // =============================================================================
  
  const exportDesign = async () => {
    if (!fabricRef.current) return;
    
    const multiplier = 1 / displayScale;
    const dataUrl = fabricRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: multiplier,
    });
    
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    onComplete({
      imageDataUrl: dataUrl,
      imageBlob: blob,
      dimensions: { width: canvasWidth, height: canvasHeight },
      dpi: DPI,
      productType,
      productSize: productSize.name,
    });
  };
  
  // =============================================================================
  // TAB CONFIGURATION
  // =============================================================================
  
  const tabs = [
    { id: 'templates', label: 'Layout', icon: <LayoutGrid className="w-5 h-5" /> },
    { id: 'images', label: 'Images', icon: <ImageIcon className="w-5 h-5" /> },
    { id: 'text', label: 'Text', icon: <Type className="w-5 h-5" /> },
    { id: 'labels', label: 'Labels', icon: <Frame className="w-5 h-5" /> },
    { id: 'shapes', label: 'Shapes', icon: <Square className="w-5 h-5" /> },
    { id: 'stickers', label: 'Elements', icon: <Star className="w-5 h-5" /> },
    { id: 'overlays', label: 'Overlays', icon: <Layers className="w-5 h-5" /> },
    { id: 'frames', label: 'Borders', icon: <Aperture className="w-5 h-5" /> },
    // COMMENTED OUT: Filters and Magic tabs require API backend
    // { id: 'filters', label: 'Filters', icon: <Palette className="w-5 h-5" /> },
    // { id: 'magic', label: 'Themes', icon: <Sparkles className="w-5 h-5" /> },
  ];
  
  // =============================================================================
  // RENDER
  // =============================================================================
  
  return (
    <div className="fixed inset-0 bg-brand-dark/95 z-50 flex">
      {/* Left Sidebar - Tools */}
      <div className="w-80 bg-white border-r border-brand-light flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-brand-light bg-gradient-to-r from-brand-dark to-brand-darkest">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white font-playfair tracking-wide">Design Editor</h2>
              <p className="text-brand-light text-sm mt-1">
                {productSize.name}&quot; {productType} • {productSize.width}&quot; × {productSize.height}&quot; @ 300 DPI
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Close editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Tool Tabs - Professional Grid */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-brand-lightest border-b border-brand-light">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-brand-darkest shadow-md border border-brand-light' 
                  : 'text-brand-medium hover:bg-white hover:text-brand-darkest'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Tool Content */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-brand-darkest mb-3 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4" />
                  Collage Layouts
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {collageTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template);
                        applyCollageTemplate(template);
                      }}
                      className={`aspect-square border rounded-xl p-2 transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedTemplate.id === template.id 
                          ? 'border-brand-darkest bg-brand-lightest shadow-md' 
                          : 'border-brand-light hover:border-brand-medium hover:bg-brand-lightest'
                      }`}
                    >
                      <div className="text-brand-medium">{template.icon}</div>
                      <span className="text-[9px] text-brand-darkest font-medium">{template.name}</span>
                    </button>
                  ))}
                </div>
                
                {/* Collage Customization Controls */}
                {isCollageMode && (
                  <div className="pt-4 border-t border-brand-light space-y-3">
                    <h3 className="text-sm font-semibold text-brand-darkest mb-2 flex items-center gap-2">
                      <PenTool className="w-4 h-4" />
                      Customize Layout
                    </h3>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={addCustomSlot}
                        className="w-full py-2 px-3 bg-brand-lightest text-brand-darkest rounded-lg text-sm font-medium hover:bg-brand-light transition-all flex items-center justify-center gap-2"
                      >
                        <ImagePlus className="w-4 h-4" />
                        Add Slot
                      </button>
                      
                      <button
                        onClick={toggleSlotGuides}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          showSlotGuides
                            ? 'bg-brand-medium text-white hover:bg-brand-dark'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                        {showSlotGuides ? 'Hide' : 'Show'} Guides
                      </button>
                      
                      {selectedSlot && (
                        <button
                          onClick={() => deleteSlot(selectedSlot)}
                          className="w-full py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Selected Slot
                        </button>
                      )}
                      
                      <button
                        onClick={clearCollage}
                        className="w-full py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Clear All
                      </button>
                    </div>
                    
                    {collageSlots.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-gray-500 mb-2">
                          {collageSlots.length} slot{collageSlots.length !== 1 ? 's' : ''} • Drag to resize/move
                        </p>
                        <div className="space-y-1">
                          {collageSlots.map((slot, index) => (
                            <div
                              key={slot.id}
                              className={`text-xs p-2 rounded border ${
                                selectedSlot === slot.id
                                  ? 'border-brand-darkest bg-brand-lightest'
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Slot {index + 1}</span>
                                {slot.imageId && (
                                  <span className="text-green-600">✓ Image</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-brand-light">
                <h3 className="text-sm font-semibold text-brand-darkest mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Background
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {['#ffffff', '#f8f9fa', '#1a1a2e', '#2d3436', '#dfe6e9', '#ffeaa7', '#fab1a0', '#81ecec', '#a29bfe', '#fd79a8'].map(color => (
                    <button
                      key={color}
                      onClick={() => { setBackgroundColor(color); if (fabricRef.current) { fabricRef.current.backgroundColor = color; fabricRef.current.renderAll(); } }}
                      className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                        backgroundColor === color ? 'border-brand-darkest shadow-md scale-110' : 'border-brand-light'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* IMAGES TAB */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                <span className="text-sm font-medium text-gray-600">Upload Images</span>
                <span className="text-xs text-gray-400 mt-1">JPG/JPEG, PNG, BMP (converted to JPG)</span>
                <input type="file" accept=".jpg,.jpeg,.png,.bmp,image/jpeg,image/png,image/bmp" multiple onChange={handleImageUpload} className="hidden" />
              </label>
              
              {uploadedImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Images</h4>
                  <p className="text-xs text-gray-600 mb-3">
                    {isCollageMode && collageSlots.length > 0 
                      ? "Click a slot below, then click an image to add it to that slot"
                      : "Click an image to add it to the canvas"}
                  </p>
                  {isCollageMode && collageSlots.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedImages.map((img, i) => (
                          <button 
                            key={i} 
                            onClick={() => {
                              if (selectedSlot) {
                                addImageToSlot(img, selectedSlot);
                              } else {
                                // If no slot selected, add to canvas normally
                                addImageToCanvas(img);
                              }
                            }}
                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:shadow-md relative group ${
                              !selectedSlot 
                                ? 'border-gray-200 hover:border-blue-400'
                                : 'border-blue-300 hover:border-blue-500'
                            }`}
                            title="Click to add to canvas"
                          >
                            <img src={img} alt={`Uploaded ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Add to Canvas</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedImages.map((img, i) => (
                        <button 
                          key={i} 
                          onClick={() => addImageToCanvas(img)} 
                          className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all hover:shadow-md relative group cursor-pointer"
                          title="Click to add to canvas"
                        >
                          <img src={img} alt={`Uploaded ${i + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">Add to Canvas</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* TEXT TAB */}
          {activeTab === 'text' && (
            <div className="space-y-5">
              <button 
                onClick={addText} 
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Type className="w-5 h-5" />
                Add Text
              </button>
              
              {/* Foil Options (for cards, invitations, announcements) */}
              {isFoilProduct && (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Foil Accents
                  </h4>
                  <p className="text-xs text-gray-600">
                    Select text or an element, then apply foil
                  </p>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-2 block">Foil Color</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Gold', value: 'gold', color: '#FFD700' },
                        { name: 'Silver', value: 'silver', color: '#C0C0C0' },
                        { name: 'Rose Gold', value: 'rose-gold', color: '#E8B4B8' },
                        { name: 'Copper', value: 'copper', color: '#B87333' },
                      ].map(foil => (
                        <button
                          key={foil.value}
                          onClick={() => setFoilSettings({ ...foilSettings, color: foil.value as any })}
                          className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                            foilSettings.color === foil.value
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: foil.color }}
                          />
                          <span className="text-xs font-medium">{foil.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={applyFoilToSelected}
                    disabled={!selectedObject}
                    className={`w-full py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      selectedObject
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white hover:from-yellow-500 hover:to-yellow-700 shadow-md'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    title={selectedObject ? 'Apply foil to selected element' : 'Select an element first'}
                  >
                    <Sparkles className="w-4 h-4" />
                    Apply Foil to Selected
                  </button>
                  
                  {foilElements.size > 0 && (
                    <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                      {foilElements.size} element{foilElements.size !== 1 ? 's' : ''} with foil
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Font Family</label>
                <select 
                  value={textSettings.fontFamily} 
                  onChange={(e) => setTextSettings(p => ({ ...p, fontFamily: e.target.value }))} 
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white focus:border-gray-400 focus:outline-none"
                >
                  {availableFonts.map(font => (<option key={font} value={font} style={{ fontFamily: font }}>{font}</option>))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Size: {textSettings.fontSize}px</label>
                <input 
                  type="range" 
                  min="12" 
                  max="200" 
                  value={textSettings.fontSize} 
                  onChange={(e) => setTextSettings(p => ({ ...p, fontSize: parseInt(e.target.value) }))} 
                  className="w-full accent-gray-900" 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Color</label>
                <input 
                  type="color" 
                  value={textSettings.fill} 
                  onChange={(e) => setTextSettings(p => ({ ...p, fill: e.target.value }))} 
                  className="w-full h-12 rounded-xl cursor-pointer border border-gray-200" 
                />
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setTextSettings(p => ({ ...p, fontWeight: p.fontWeight === 'bold' ? 'normal' : 'bold' }))} 
                  className={`flex-1 py-3 border-2 rounded-xl font-bold transition-all flex items-center justify-center ${
                    textSettings.fontWeight === 'bold' ? 'border-gray-900 bg-gray-100' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Bold className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setTextSettings(p => ({ ...p, fontStyle: p.fontStyle === 'italic' ? 'normal' : 'italic' }))} 
                  className={`flex-1 py-3 border-2 rounded-xl transition-all flex items-center justify-center ${
                    textSettings.fontStyle === 'italic' ? 'border-gray-900 bg-gray-100' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Italic className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setTextSettings(p => ({ ...p, shadow: !p.shadow }))} 
                  className={`flex-1 py-3 border-2 rounded-xl transition-all flex items-center justify-center ${
                    textSettings.shadow ? 'border-gray-900 bg-gray-100' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
          {/* LABELS TAB */}
          {activeTab === 'labels' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Frame className="w-4 h-4" />
                Decorative Labels
              </h3>
              <p className="text-xs text-gray-500">Click to add a label frame to your design</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'label-01', name: 'Classic', path: 'M 5 10 L 15 2 L 85 2 L 95 10 L 95 40 L 85 48 L 15 48 L 5 40 Z' },
                  { id: 'label-02', name: 'Rounded', path: 'M 8 5 Q 5 5 5 8 L 5 42 Q 5 45 8 45 L 92 45 Q 95 45 95 42 L 95 8 Q 95 5 92 5 Z' },
                  { id: 'label-03', name: 'Scalloped', path: 'M 5 5 Q 10 10 15 5 Q 20 10 25 5 Q 30 10 35 5 Q 40 10 45 5 Q 50 10 55 5 Q 60 10 65 5 Q 70 10 75 5 Q 80 10 85 5 Q 90 10 95 5 L 95 45 Q 90 40 85 45 Q 80 40 75 45 Q 70 40 65 45 Q 60 40 55 45 Q 50 40 45 45 Q 40 40 35 45 Q 30 40 25 45 Q 20 40 15 45 Q 10 40 5 45 Z' },
                  { id: 'label-04', name: 'Bracket', path: 'M 5 3 L 20 3 L 20 10 L 10 10 L 10 40 L 20 40 L 20 47 L 5 47 Z M 95 3 L 80 3 L 80 10 L 90 10 L 90 40 L 80 40 L 80 47 L 95 47 Z' },
                  { id: 'label-05', name: 'Banner', path: 'M 0 12 L 12 12 L 18 3 L 82 3 L 88 12 L 100 12 L 94 25 L 100 38 L 88 38 L 82 47 L 18 47 L 12 38 L 0 38 L 6 25 Z' },
                  { id: 'label-06', name: 'Ribbon', path: 'M 0 15 L 10 15 L 10 5 L 90 5 L 90 15 L 100 15 L 100 35 L 90 35 L 90 45 L 10 45 L 10 35 L 0 35 Z' },
                  { id: 'label-07', name: 'Shield', path: 'M 50 5 L 95 15 L 95 35 Q 95 45 50 50 Q 5 45 5 35 L 5 15 Z' },
                  { id: 'label-08', name: 'Oval Frame', path: 'M 50 3 Q 95 3 95 25 Q 95 47 50 47 Q 5 47 5 25 Q 5 3 50 3 Z' },
                  { id: 'label-09', name: 'Ticket', path: 'M 5 5 L 95 5 L 95 18 Q 90 18 90 25 Q 90 32 95 32 L 95 45 L 5 45 L 5 32 Q 10 32 10 25 Q 10 18 5 18 Z' },
                  { id: 'label-10', name: 'Crest', path: 'M 50 3 L 90 8 L 95 20 L 85 35 L 50 48 L 15 35 L 5 20 L 10 8 Z' },
                ].map((label) => (
                  <button
                    key={label.id}
                    onClick={() => {
                      if (!fabricCanvasRef.current) return;
                      const path = new fabric.Path(label.path, {
                        left: 100,
                        top: 100,
                        fill: shapeSettings.fill === 'transparent' ? 'transparent' : shapeSettings.fill,
                        stroke: shapeSettings.stroke,
                        strokeWidth: shapeSettings.strokeWidth,
                        scaleX: 2,
                        scaleY: 2,
                      });
                      fabricCanvasRef.current.add(path);
                      fabricCanvasRef.current.setActiveObject(path);
                      fabricCanvasRef.current.renderAll();
                    }}
                    className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <svg viewBox="0 0 100 50" className="w-full h-10" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={label.path} />
                    </svg>
                    <span className="text-xs text-gray-600 block">{label.name}</span>
                  </button>
                ))}
              </div>
              
              {/* Label Color Controls */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700">Label Colors</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Fill</label>
                    <input
                      type="color"
                      value={shapeSettings.fill === 'transparent' ? '#ffffff' : shapeSettings.fill}
                      onChange={(e) => setShapeSettings(p => ({ ...p, fill: e.target.value }))}
                      className="w-full h-8 rounded cursor-pointer border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Stroke</label>
                    <input
                      type="color"
                      value={shapeSettings.stroke}
                      onChange={(e) => setShapeSettings(p => ({ ...p, stroke: e.target.value }))}
                      className="w-full h-8 rounded cursor-pointer border border-gray-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Stroke Width: {shapeSettings.strokeWidth}px</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={shapeSettings.strokeWidth}
                    onChange={(e) => setShapeSettings(p => ({ ...p, strokeWidth: parseInt(e.target.value) }))}
                    className="w-full accent-gray-900"
                  />
                </div>
                <button
                  onClick={() => setShapeSettings(p => ({ ...p, fill: 'transparent' }))}
                  className="w-full py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  No Fill (Outline Only)
                </button>
              </div>
            </div>
          )}
          
          {/* SHAPES TAB */}
          {activeTab === 'shapes' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Square className="w-4 h-4" />
                Basic Shapes
              </h3>
              <p className="text-xs text-gray-500">Click to add a shape to your design</p>
              <div className="grid grid-cols-4 gap-2">
                {/* Rectangle */}
                <button
                  onClick={() => {
                    if (!fabricCanvasRef.current) return;
                    const rect = new fabric.Rect({
                      left: 100, top: 100, width: 100, height: 80,
                      fill: shapeSettings.fill, stroke: shapeSettings.stroke, strokeWidth: shapeSettings.strokeWidth
                    });
                    fabricCanvasRef.current.add(rect);
                    fabricCanvasRef.current.setActiveObject(rect);
                    fabricCanvasRef.current.renderAll();
                  }}
                  className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 flex flex-col items-center"
                >
                  <Square className="w-6 h-6 text-gray-600" />
                  <span className="text-xs text-gray-600">Rect</span>
                </button>
                {/* Rounded Rectangle */}
                <button
                  onClick={() => {
                    if (!fabricCanvasRef.current) return;
                    const rect = new fabric.Rect({
                      left: 100, top: 100, width: 100, height: 80, rx: 15, ry: 15,
                      fill: shapeSettings.fill, stroke: shapeSettings.stroke, strokeWidth: shapeSettings.strokeWidth
                    });
                    fabricCanvasRef.current.add(rect);
                    fabricCanvasRef.current.setActiveObject(rect);
                    fabricCanvasRef.current.renderAll();
                  }}
                  className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 flex flex-col items-center"
                >
                  <div className="w-6 h-5 rounded-md border-2 border-gray-600" />
                  <span className="text-xs text-gray-600">Rounded</span>
                </button>
                {/* Circle */}
                <button
                  onClick={() => {
                    if (!fabricCanvasRef.current) return;
                    const circle = new fabric.Circle({
                      left: 100, top: 100, radius: 50,
                      fill: shapeSettings.fill, stroke: shapeSettings.stroke, strokeWidth: shapeSettings.strokeWidth
                    });
                    fabricCanvasRef.current.add(circle);
                    fabricCanvasRef.current.setActiveObject(circle);
                    fabricCanvasRef.current.renderAll();
                  }}
                  className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 flex flex-col items-center"
                >
                  <Circle className="w-6 h-6 text-gray-600" />
                  <span className="text-xs text-gray-600">Circle</span>
                </button>
                {/* Ellipse */}
                <button
                  onClick={() => {
                    if (!fabricCanvasRef.current) return;
                    const ellipse = new fabric.Ellipse({
                      left: 100, top: 100, rx: 60, ry: 35,
                      fill: shapeSettings.fill, stroke: shapeSettings.stroke, strokeWidth: shapeSettings.strokeWidth
                    });
                    fabricCanvasRef.current.add(ellipse);
                    fabricCanvasRef.current.setActiveObject(ellipse);
                    fabricCanvasRef.current.renderAll();
                  }}
                  className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 flex flex-col items-center"
                >
                  <div className="w-7 h-4 rounded-full border-2 border-gray-600" />
                  <span className="text-xs text-gray-600">Ellipse</span>
                </button>
                {/* Triangle */}
                <button
                  onClick={() => {
                    if (!fabricCanvasRef.current) return;
                    const triangle = new fabric.Triangle({
                      left: 100, top: 100, width: 80, height: 80,
                      fill: shapeSettings.fill, stroke: shapeSettings.stroke, strokeWidth: shapeSettings.strokeWidth
                    });
                    fabricCanvasRef.current.add(triangle);
                    fabricCanvasRef.current.setActiveObject(triangle);
                    fabricCanvasRef.current.renderAll();
                  }}
                  className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 flex flex-col items-center"
                >
                  <Triangle className="w-6 h-6 text-gray-600" />
                  <span className="text-xs text-gray-600">Triangle</span>
                </button>
                {/* Heart */}
                <button
                  onClick={() => {
                    if (!fabricCanvasRef.current) return;
                    const heart = new fabric.Path('M 50 85 C 20 55 0 35 0 20 C 0 5 15 0 25 0 C 35 0 45 10 50 20 C 55 10 65 0 75 0 C 85 0 100 5 100 20 C 100 35 80 55 50 85 Z', {
                      left: 100, top: 100,
                      fill: shapeSettings.fill, stroke: shapeSettings.stroke, strokeWidth: shapeSettings.strokeWidth,
                      scaleX: 1, scaleY: 1
                    });
                    fabricCanvasRef.current.add(heart);
                    fabricCanvasRef.current.setActiveObject(heart);
                    fabricCanvasRef.current.renderAll();
                  }}
                  className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 flex flex-col items-center"
                >
                  <Heart className="w-6 h-6 text-gray-600" />
                  <span className="text-xs text-gray-600">Heart</span>
                </button>
                {/* Star */}
                <button
                  onClick={() => {
                    if (!fabricCanvasRef.current) return;
                    const star = new fabric.Path('M 50 5 L 61 35 L 95 35 L 68 55 L 79 90 L 50 70 L 21 90 L 32 55 L 5 35 L 39 35 Z', {
                      left: 100, top: 100,
                      fill: shapeSettings.fill, stroke: shapeSettings.stroke, strokeWidth: shapeSettings.strokeWidth,
                      scaleX: 1, scaleY: 1
                    });
                    fabricCanvasRef.current.add(star);
                    fabricCanvasRef.current.setActiveObject(star);
                    fabricCanvasRef.current.renderAll();
                  }}
                  className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 flex flex-col items-center"
                >
                  <Star className="w-6 h-6 text-gray-600" />
                  <span className="text-xs text-gray-600">Star</span>
                </button>
                {/* Line */}
                <button
                  onClick={() => {
                    if (!fabricCanvasRef.current) return;
                    const line = new fabric.Line([50, 50, 200, 50], {
                      left: 100, top: 100,
                      stroke: shapeSettings.stroke, strokeWidth: shapeSettings.strokeWidth
                    });
                    fabricCanvasRef.current.add(line);
                    fabricCanvasRef.current.setActiveObject(line);
                    fabricCanvasRef.current.renderAll();
                  }}
                  className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 flex flex-col items-center"
                >
                  <Minus className="w-6 h-6 text-gray-600" />
                  <span className="text-xs text-gray-600">Line</span>
                </button>
              </div>
              
              {/* Shape Color Controls */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700">Shape Colors</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Fill</label>
                    <input
                      type="color"
                      value={shapeSettings.fill}
                      onChange={(e) => setShapeSettings(p => ({ ...p, fill: e.target.value }))}
                      className="w-full h-8 rounded cursor-pointer border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Stroke</label>
                    <input
                      type="color"
                      value={shapeSettings.stroke}
                      onChange={(e) => setShapeSettings(p => ({ ...p, stroke: e.target.value }))}
                      className="w-full h-8 rounded cursor-pointer border border-gray-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Stroke Width: {shapeSettings.strokeWidth}px</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={shapeSettings.strokeWidth}
                    onChange={(e) => setShapeSettings(p => ({ ...p, strokeWidth: parseInt(e.target.value) }))}
                    className="w-full accent-gray-900"
                  />
                </div>
                {/* No Fill Button */}
                <button
                  onClick={() => setShapeSettings(p => ({ ...p, fill: 'transparent' }))}
                  className="w-full py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  No Fill (Outline Only)
                </button>
              </div>
            </div>
          )}
          
          {/* STICKERS/ELEMENTS TAB */}
          {activeTab === 'stickers' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Elements
              </h3>
              
              <div className="flex flex-wrap gap-1">
                {stickerCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedStickerCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedStickerCategory === cat.id 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.icon}
                    {cat.name}
                  </button>
                ))}
              </div>
              
              {selectedStickerCategory === 'shapes' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addShape('rect')}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300"
                      title="Add Rectangle"
                    >
                      <Square className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => addShape('circle')}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300"
                      title="Add Circle"
                    >
                      <Circle className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => addShape('triangle')}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300"
                      title="Add Triangle"
                    >
                      <Triangle className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => addShape('rounded-rect')}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300"
                      title="Add Rounded Rectangle"
                    >
                      <CircleDot className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="space-y-3 pt-2 border-t border-gray-200">
                    <label className="text-xs font-medium text-gray-700">Shape Fill Color</label>
                    <input
                      type="color"
                      value={shapeSettings.fill}
                      onChange={(e) => setShapeSettings(p => ({ ...p, fill: e.target.value }))}
                      className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                    />
                    <label className="text-xs font-medium text-gray-700">Border Color</label>
                    <input
                      type="color"
                      value={shapeSettings.stroke}
                      onChange={(e) => setShapeSettings(p => ({ ...p, stroke: e.target.value }))}
                      className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                    />
                    <label className="text-xs font-medium text-gray-700">Border Width: {shapeSettings.strokeWidth}px</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={shapeSettings.strokeWidth}
                      onChange={(e) => setShapeSettings(p => ({ ...p, strokeWidth: parseInt(e.target.value) }))}
                      className="w-full accent-gray-900"
                    />
                    <button
                      onClick={addTextToShape}
                      className="w-full py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all text-sm"
                    >
                      Add Text to Selected Shape
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {stickers.filter(s => s.category === selectedStickerCategory).map(sticker => (
                    <button
                      key={sticker.id}
                      className="aspect-square bg-gray-50 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300"
                      title={sticker.name}
                    >
                      {sticker.icon}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* FRAMES TAB */}
          {activeTab === 'frames' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Frame className="w-4 h-4" />
                Decorative Frames
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {frames.map(frame => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame)}
                    className={`p-4 border rounded-xl text-center transition-all flex flex-col items-center gap-2 ${
                      selectedFrame.id === frame.id 
                        ? 'border-gray-900 bg-gray-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {frame.icon}
                    <span className="text-xs text-gray-600 font-medium">{frame.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* COMMENTED OUT: FILTERS TAB - Requires API backend */}
          {/* {activeTab === 'filters' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Photo Filters
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {advancedFilters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter)}
                    className={`p-3 border rounded-xl text-center transition-all flex flex-col items-center gap-1.5 ${
                      selectedFilter.id === filter.id 
                        ? 'border-gray-900 bg-gray-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {filter.icon}
                    <span className="text-[10px] text-gray-600 font-medium">{filter.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )} */}
          
          {/* OVERLAYS TAB */}
          {activeTab === 'overlays' && (
            <div className="space-y-6">
              {/* Category Selection */}
              <div>
                <h3 className="text-sm font-semibold text-brand-darkest mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Overlay Categories
                </h3>
                <div className="flex gap-2 flex-wrap mb-4">
                  {overlayCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedOverlayCategory(category.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedOverlayCategory === category.id
                          ? 'bg-brand-darkest text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.icon}
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Overlay Options */}
              <div>
                <h3 className="text-sm font-semibold text-brand-darkest mb-3">
                  {overlayCategories.find(c => c.id === selectedOverlayCategory)?.name} Overlays
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {overlays
                    .filter(overlay => overlay.category === selectedOverlayCategory)
                    .map(overlay => {
                      const isApplied = appliedOverlays.includes(overlay.id);
                      return (
                        <button
                          key={overlay.id}
                          onClick={() => {
                            if (isApplied) {
                              removeOverlay(overlay.id);
                            } else {
                              applyOverlay(overlay);
                            }
                          }}
                          className={`p-3 border rounded-xl text-center transition-all flex flex-col items-center gap-1.5 ${
                            isApplied
                              ? 'border-brand-darkest bg-brand-lightest shadow-md'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {overlay.icon}
                          <span className="text-[10px] text-gray-600 font-medium">{overlay.name}</span>
                          {isApplied && (
                            <span className="text-[8px] text-green-600 font-bold">✓ Applied</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
              
              {/* Applied Overlays List */}
              {appliedOverlays.length > 0 && (
                <div className="pt-4 border-t border-brand-light">
                  <h3 className="text-sm font-semibold text-brand-darkest mb-2">Applied Overlays</h3>
                  <div className="space-y-1">
                    {appliedOverlays.map(overlayId => {
                      const overlay = overlays.find(o => o.id === overlayId);
                      if (!overlay) return null;
                      return (
                        <div
                          key={overlayId}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            {overlay.icon}
                            <span className="text-xs font-medium text-gray-700">{overlay.name}</span>
                          </div>
                          <button
                            onClick={() => removeOverlay(overlayId)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* COMMENTED OUT: THEMES/MAGIC TAB - Requires API backend */}
          {/* {activeTab === 'magic' && (
            <div className="space-y-5">
              <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl text-center">
                <Sparkles className="w-10 h-10 text-white mx-auto mb-3" />
                <h4 className="font-bold text-white mb-2">One-Click Magic</h4>
                <p className="text-xs text-gray-400 mb-4">Auto-enhance your design</p>
                <button 
                  onClick={() => applyLegacyAIEffect('Magic Enhancement')} 
                  disabled={isProcessingAI} 
                  className="px-6 py-3 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 disabled:opacity-50 transition-all"
                >
                  Enhance Design
                </button>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Mood Themes
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {moodThemes.map(mood => (
                    <button
                      key={mood.id}
                      onClick={() => applyMoodTheme(mood)}
                      className={`p-3 rounded-xl text-left transition-all border ${
                        selectedMood?.id === mood.id 
                          ? 'border-gray-900 shadow-md' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: mood.colors.bg }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-600">{mood.icon}</span>
                        <span className="text-xs font-semibold" style={{ color: mood.colors.text }}>{mood.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: mood.colors.accent }} />
                        <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: mood.colors.text }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )} */}
        </div>
      </div>
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Toolbar */}
        <div className="bg-brand-dark px-4 py-3 flex items-center gap-4 border-b border-brand-medium">
          <div className="flex gap-1">
            <button 
              onClick={undo}
              disabled={historyRef.current.index <= 0}
              className={`p-2.5 text-brand-light hover:text-white hover:bg-brand-medium rounded-lg transition-all ${
                historyRef.current.index <= 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Undo"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button 
              onClick={redo}
              disabled={historyRef.current.index >= historyRef.current.history.length - 1}
              className={`p-2.5 text-brand-light hover:text-white hover:bg-brand-medium rounded-lg transition-all ${
                historyRef.current.index >= historyRef.current.history.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Redo"
            >
              <Redo2 className="w-5 h-5" />
            </button>
          </div>
          
          <div className="w-px h-6 bg-brand-medium" />
          
          <div className="flex gap-1">
            <button onClick={deleteSelected} className="p-2.5 text-brand-light hover:text-white hover:bg-brand-medium rounded-lg transition-all" title="Delete">
              <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={duplicateSelected} className="p-2.5 text-brand-light hover:text-white hover:bg-brand-medium rounded-lg transition-all" title="Duplicate">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          
          <div className="w-px h-6 bg-brand-medium" />
          
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 text-brand-light hover:text-white hover:bg-brand-medium rounded-lg transition-all">
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm text-brand-light w-14 text-center font-medium">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 text-brand-light hover:text-white hover:bg-brand-medium rounded-lg transition-all">
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
          
          {/* Frame Disclaimer */}
          {frameColor && productType === 'print' && (
            <>
              <div className="w-px h-6 bg-brand-medium" />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <span className="text-xs text-yellow-200 italic">
                  Frame shown is a placeholder representation. Actual frame may vary.
                </span>
              </div>
            </>
          )}
          
          <div className="w-px h-6 bg-brand-medium" />
          
          {/* Orientation Selector */}
          <div className="flex items-center gap-2 bg-brand-medium/30 rounded-lg p-1">
            <button
              onClick={() => {
                const newOrientation = 'portrait';
                setOrientation(newOrientation);
                // Reinitialize canvas with new dimensions
                if (fabricRef.current) {
                  const portraitWidth = Math.min(productSize.width, productSize.height) * DPI * displayScale;
                  const portraitHeight = Math.max(productSize.width, productSize.height) * DPI * displayScale;
                  const currentObjects = fabricRef.current.getObjects();
                  fabricRef.current.setDimensions({ width: portraitWidth, height: portraitHeight });
                  // Restore objects
                  currentObjects.forEach(obj => fabricRef.current?.add(obj));
                  fabricRef.current.renderAll();
                  saveState();
                }
              }}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                orientation === 'portrait'
                  ? 'bg-white text-brand-darkest shadow-md'
                  : 'text-brand-light hover:text-white'
              }`}
              title="Portrait"
            >
              Portrait
            </button>
            <button
              onClick={() => {
                const newOrientation = 'landscape';
                setOrientation(newOrientation);
                // Reinitialize canvas with new dimensions
                if (fabricRef.current) {
                  const landscapeWidth = Math.max(productSize.width, productSize.height) * DPI * displayScale;
                  const landscapeHeight = Math.min(productSize.width, productSize.height) * DPI * displayScale;
                  const currentObjects = fabricRef.current.getObjects();
                  fabricRef.current.setDimensions({ width: landscapeWidth, height: landscapeHeight });
                  // Restore objects
                  currentObjects.forEach(obj => fabricRef.current?.add(obj));
                  fabricRef.current.renderAll();
                  saveState();
                }
              }}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                orientation === 'landscape'
                  ? 'bg-white text-brand-darkest shadow-md'
                  : 'text-brand-light hover:text-white'
              }`}
              title="Landscape"
            >
              Landscape
            </button>
          </div>
          
          <div className="flex-1" />
          
          <button onClick={onClose} className="px-4 py-2 text-brand-light hover:text-white transition-all flex items-center gap-2">
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button onClick={exportDesign} className="px-5 py-2.5 bg-white text-brand-darkest rounded-lg font-semibold hover:bg-brand-lightest transition-all flex items-center gap-2 shadow-lg">
            <Check className="w-4 h-4" />
            Continue
          </button>
        </div>
        
        {/* Canvas Container - This is the workspace representing the print area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto bg-gray-100 relative">
          {/* Surface Tabs for Folded Products */}
          {isFoldedProduct && (
            <div className="mb-4 flex gap-2 bg-white rounded-lg p-1 shadow-md">
              <button
                onClick={() => setActiveSurface('front')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeSurface === 'front'
                    ? 'bg-brand-dark text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Front
              </button>
              <button
                onClick={() => setActiveSurface('back')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeSurface === 'back'
                    ? 'bg-brand-dark text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Back
              </button>
              <button
                onClick={() => setActiveSurface('inside')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeSurface === 'inside'
                    ? 'bg-brand-dark text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Inside
              </button>
            </div>
          )}
          
          {/* Canvas Workspace - Represents the print area */}
          <div className="bg-white p-4 rounded-lg shadow-2xl">
            <div className="text-xs text-gray-500 mb-2 text-center">
              {isFoldedProduct 
                ? `Unfolded design area (${actualWidth * 2}" × ${actualHeight}") - ${activeSurface} surface`
                : `Print area (${actualWidth}" × ${actualHeight}") - ${orientation}`}
            </div>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', filter: selectedFilter.css }}>
              {isFoldedProduct && (
                <div className="relative" style={{ width: canvasWidth * displayScale, height: canvasHeight * displayScale }}>
                  {/* Fold line indicator */}
                  <div 
                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-blue-400 opacity-50 pointer-events-none"
                    style={{ left: `${50}%` }}
                    title="Fold line"
                  />
                  {/* Surface labels */}
                  <div className="absolute top-2 left-2 text-xs text-gray-400 pointer-events-none">Front</div>
                  <div className="absolute top-2 right-2 text-xs text-gray-400 pointer-events-none">Back</div>
                </div>
              )}
              <canvas ref={canvasRef} className="shadow-lg rounded-lg bg-white" />
            </div>
          </div>
          
          {/* Properties Panel - Floating when object selected */}
          {selectedObject && (
            <div className="absolute top-4 right-4 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-20">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Paintbrush className="w-4 h-4" />
                Element Properties
              </h3>
              
              <div className="space-y-4">
                {/* Fill Color */}
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Fill Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={(selectedObject.get('fill') as string) || '#ffffff'}
                      onChange={(e) => {
                        selectedObject.set('fill', e.target.value);
                        fabricRef.current?.renderAll();
                      }}
                      className="w-full h-8 rounded cursor-pointer border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        selectedObject.set('fill', 'transparent');
                        fabricRef.current?.renderAll();
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                      title="No fill"
                    >
                      ∅
                    </button>
                  </div>
                </div>
                
                {/* Stroke Color */}
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Stroke Color</label>
                  <input
                    type="color"
                    value={(selectedObject.get('stroke') as string) || '#000000'}
                    onChange={(e) => {
                      selectedObject.set('stroke', e.target.value);
                      fabricRef.current?.renderAll();
                    }}
                    className="w-full h-8 rounded cursor-pointer border border-gray-200"
                  />
                </div>
                
                {/* Stroke Width */}
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Stroke Width: {(selectedObject.get('strokeWidth') as number) || 0}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={(selectedObject.get('strokeWidth') as number) || 0}
                    onChange={(e) => {
                      selectedObject.set('strokeWidth', parseInt(e.target.value));
                      fabricRef.current?.renderAll();
                    }}
                    className="w-full accent-gray-900"
                  />
                </div>
                
                {/* Opacity */}
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Opacity: {Math.round((selectedObject.get('opacity') as number || 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((selectedObject.get('opacity') as number || 1) * 100)}
                    onChange={(e) => {
                      selectedObject.set('opacity', parseInt(e.target.value) / 100);
                      fabricRef.current?.renderAll();
                    }}
                    className="w-full accent-gray-900"
                  />
                </div>
                
                {/* Text-specific properties */}
                {selectedObject.type === 'i-text' || selectedObject.type === 'textbox' ? (
                  <div className="pt-3 border-t border-gray-200 space-y-3">
                    <label className="text-xs font-medium text-gray-700 block">Font Family</label>
                    <select
                      value={(selectedObject as any).fontFamily || 'Arial'}
                      onChange={(e) => {
                        (selectedObject as any).set('fontFamily', e.target.value);
                        fabricRef.current?.renderAll();
                      }}
                      className="w-full p-2 text-sm border border-gray-200 rounded-lg"
                    >
                      {availableFonts.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                      ))}
                    </select>
                    
                    <label className="text-xs font-medium text-gray-700 block">
                      Font Size: {(selectedObject as any).fontSize || 24}px
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="200"
                      value={(selectedObject as any).fontSize || 24}
                      onChange={(e) => {
                        (selectedObject as any).set('fontSize', parseInt(e.target.value));
                        fabricRef.current?.renderAll();
                      }}
                      className="w-full accent-gray-900"
                    />
                  </div>
                ) : null}
                
                {/* Quick Actions */}
                <div className="pt-3 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={deleteSelected}
                    className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                  <button
                    onClick={duplicateSelected}
                    className="flex-1 py-2 px-3 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-all flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Duplicate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-brand-dark px-4 py-3 flex items-center justify-center text-sm border-t border-brand-medium">
          <div className="flex items-center gap-4 text-brand-light">
            <span>{actualWidth}&quot; × {actualHeight}&quot; ({orientation})</span>
            <span className="w-px h-4 bg-brand-medium" />
            <span>{canvasWidth} × {canvasHeight}px</span>
            <span className="w-px h-4 bg-brand-medium" />
            <span>300 DPI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
