"use client";

import { useState, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import AIEffectsPanel from './AIEffectsPanel';
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
  productType: 'canvas' | 'print' | 'card' | 'poster' | 'photobook';
  productSize: { width: number; height: number; name: string };
  onComplete: (designData: DesignOutput) => void;
  onClose?: () => void;
  initialImages?: string[];
  initialMessage?: string;
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
  { id: 'rounded', name: 'Rounded', icon: <CircleDot className="w-5 h-5" />, style: 'rounded' },
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

export default function PersonalizationStudio({
  productType = 'canvas',
  productSize = { width: 8, height: 10, name: '8x10' },
  onComplete,
  onClose,
  initialImages = [],
  initialMessage = ''
}: StudioProps) {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  
  // State
const [activeTab, setActiveTab] = useState<'templates' | 'images' | 'text' | 'stickers' | 'frames' | 'filters' | 'magic'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<CollageTemplate>(collageTemplates[0]);
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialImages);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [zoom, setZoom] = useState(1);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>(frames[0]);
  const [selectedFilter, setSelectedFilter] = useState(advancedFilters[0]);
  const [selectedMood, setSelectedMood] = useState<MoodTheme | null>(null);
  const [selectedStickerCategory, setSelectedStickerCategory] = useState('love');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  
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
  
  // Calculate canvas dimensions (300 DPI for print quality)
  const DPI = 300;
  const canvasWidth = productSize.width * DPI;
  const canvasHeight = productSize.height * DPI;
  const displayScale = 0.15;
  
  // =============================================================================
  // INITIALIZE CANVAS
  // =============================================================================
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
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
    
    return () => { canvas.dispose(); };
  }, [canvasWidth, canvasHeight, backgroundColor]);
  
  // =============================================================================
  // IMAGE HANDLING
  // =============================================================================
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setUploadedImages(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  const addImageToCanvas = async (imageUrl: string) => {
    if (!fabricRef.current) return;
    
    try {
      const img = await fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' });
      const canvas = fabricRef.current!;
      const scale = Math.min(
        (canvas.width! * 0.5) / (img.width || 100),
        (canvas.height! * 0.5) / (img.height || 100)
      );
      
      img.set({
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
      });
      
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };
  
  // Load initial images when component mounts and canvas is ready
  useEffect(() => {
    if (initialImages.length > 0 && fabricRef.current && uploadedImages.length === 0) {
      // Auto-add first image to canvas if provided
      addImageToCanvas(initialImages[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImages.length, uploadedImages.length]);
  
  // =============================================================================
  // TEXT HANDLING
  // =============================================================================
  
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
  };
  
  // =============================================================================
  // AI FEATURES
  // =============================================================================
  
  const applyAIEffect = async (effectId: string, imageDataUrl: string): Promise<string | null> => {
    setIsProcessingAI(true);
    setAiStatus(`Processing AI effect...`);
    
    try {
      const response = await fetch('/api/ai-effects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          effectId,
          imageDataUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process effect');
      }

      if (data.success && data.imageUrl) {
        // Load the processed image onto canvas
        const canvas = fabricRef.current;
        if (canvas) {
          const activeObj = canvas.getActiveObject();
          
          // Create new image from result
          const img = await fabric.FabricImage.fromURL(data.imageUrl, { crossOrigin: 'anonymous' });
          
          if (activeObj) {
            // Replace the active object with the new image
            img.set({
              left: activeObj.left,
              top: activeObj.top,
              scaleX: activeObj.scaleX,
              scaleY: activeObj.scaleY,
              angle: activeObj.angle,
            });
            canvas.remove(activeObj);
          }
          
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        }

        setAiStatus('Effect applied successfully!');
        setTimeout(() => setAiStatus(''), 2000);
        return data.imageUrl;
      }

      throw new Error('No image returned from API');
    } catch (error) {
      console.error('AI Effect error:', error);
      setAiStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setAiStatus(''), 3000);
      return null;
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Legacy effect handler for backward compatibility
  const applyLegacyAIEffect = async (effectName: string) => {
    // Map old effect names to new effect IDs
    const effectMap: Record<string, string> = {
      'Van Gogh': 'vangogh',
      'Monet': 'monet',
      'Picasso': 'picasso',
      'Warhol': 'warhol',
      'Pencil Sketch': 'pencil',
      'Watercolor': 'watercolor',
      'Cartoonify': 'cartoon',
      'Rotoscope': 'rotoscope',
      'Background Removal': 'removebg',
      'Face Detection': 'facefix',
      'Magic Enhancement': 'upscale',
    };

    const effectId = effectMap[effectName];
    if (!effectId) {
      setAiStatus(`Unknown effect: ${effectName}`);
      return;
    }

    // Get current image from canvas
    const canvas = fabricRef.current;
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'image') {
      setAiStatus('Please select an image first');
      setTimeout(() => setAiStatus(''), 2000);
      return;
    }

    const imageDataUrl = (activeObj as fabric.FabricImage).toDataURL({ format: 'png' });
    await applyAIEffect(effectId, imageDataUrl);
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
    { id: 'stickers', label: 'Elements', icon: <Star className="w-5 h-5" /> },
    { id: 'frames', label: 'Frames', icon: <Frame className="w-5 h-5" /> },
    { id: 'filters', label: 'Filters', icon: <Palette className="w-5 h-5" /> },
    { id: 'magic', label: 'Themes', icon: <Sparkles className="w-5 h-5" /> },
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
          <h2 className="text-xl font-bold text-white font-playfair tracking-wide">Design Editor</h2>
          <p className="text-brand-light text-sm mt-1">{productSize.name}&quot; {productType}</p>
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
                      onClick={() => setSelectedTemplate(template)}
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
                <span className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
              
              {uploadedImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Images</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((img, i) => (
                      <button 
                        key={i} 
                        onClick={() => addImageToCanvas(img)} 
                        className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all hover:shadow-md"
                      >
                        <img src={img} alt={`Uploaded ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
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
          
          {/* FILTERS TAB */}
          {activeTab === 'filters' && (
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
          )}
          
          {/* THEMES/MAGIC TAB */}
          {activeTab === 'magic' && (
            <div className="space-y-5">
              {/* One-Click Magic */}
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
              
              {/* Mood Themes */}
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
          )}
        </div>
      </div>
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Toolbar */}
        <div className="bg-brand-dark px-4 py-3 flex items-center gap-4 border-b border-brand-medium">
          <div className="flex gap-1">
            <button className="p-2.5 text-brand-light hover:text-white hover:bg-brand-medium rounded-lg transition-all" title="Undo">
              <Undo2 className="w-5 h-5" />
            </button>
            <button className="p-2.5 text-brand-light hover:text-white hover:bg-brand-medium rounded-lg transition-all" title="Redo">
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
        
        {/* Canvas Container */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-white">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', filter: selectedFilter.css }}>
            <canvas ref={canvasRef} className="shadow-2xl rounded-lg bg-white" />
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-brand-dark px-4 py-3 flex items-center justify-between text-sm border-t border-brand-medium">
          <div className="flex items-center gap-4 text-brand-light">
            <span>{productSize.width}&quot; × {productSize.height}&quot;</span>
            <span className="w-px h-4 bg-brand-medium" />
            <span>{canvasWidth} × {canvasHeight}px</span>
            <span className="w-px h-4 bg-brand-medium" />
            <span>300 DPI</span>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <Check className="w-4 h-4" />
            <span className="font-medium">Gelato Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
