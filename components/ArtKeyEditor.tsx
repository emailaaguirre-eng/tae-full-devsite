"use client";

/**
 * ArtKey Editor - Full UI (Converted from WordPress to Next.js)
 * Palette:
 *   Primary: #FFFFFF
 *   Alt: #ECECE9
 *   Accent: #353535
 */
import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Palette
const COLOR_PRIMARY = '#FFFFFF';
const COLOR_ALT = '#ECECE9';
const COLOR_ACCENT = '#353535';

interface ArtKeyEditorProps {
  artkeyId?: string | null;
}

interface Link {
  label: string;
  url: string;
}

interface ArtKeyData {
  title: string;
  theme: {
    template: string;
    bg_color: string;
    bg_image_id: number;
    bg_image_url: string;
    font: string;
    text_color: string;
    title_color: string;
    title_style: string;
    button_color: string;
    button_gradient: string;
    color_scope: string;
  };
  links: Link[];
  spotify: { url: string; autoplay: boolean };
  featured_video: { video_id: number; button_label: string };
  features: {
    enable_gallery: boolean;
    enable_video: boolean;
    show_guestbook: boolean;
    enable_featured_video: boolean;
    allow_img_uploads: boolean;
    allow_vid_uploads: boolean;
    gb_btn_view: boolean;
    gb_signing_status: string;
    gb_signing_start: string;
    gb_signing_end: string;
    gb_require_approval: boolean;
    img_require_approval: boolean;
    vid_require_approval: boolean;
    order: string[];
  };
  uploadedImages: string[];
  uploadedVideos: string[];
  customizations: Record<string, any>;
}

function ArtKeyEditorContent({ artkeyId = null }: ArtKeyEditorProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('product_id');
  const fromCustomize = searchParams.get('from_customize') === 'true';

  // Core state
  const [designMode, setDesignMode] = useState<'template' | 'custom' | null>(null);
  const [templatePage, setTemplatePage] = useState(0);
  const [bgColorPage, setBgColorPage] = useState(0);
  const [buttonColorPage, setButtonColorPage] = useState(0);
  const [titleColorPage, setTitleColorPage] = useState(0);
  const [bgTab, setBgTab] = useState('solid');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [customLinks, setCustomLinks] = useState<Link[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('https://www.');
  const [customizationData, setCustomizationData] = useState<any>(null);

  // ArtKey data
  const [artKeyData, setArtKeyData] = useState<ArtKeyData>({
    title: 'Your Personalized Design',
    theme: {
      template: 'classic',
      bg_color: '#F6F7FB',
      bg_image_id: 0,
      bg_image_url: '',
      font: 'g:Playfair Display',
      text_color: '#111111',
      title_color: '#4f46e5',
      title_style: 'solid',
      button_color: '#4f46e5',
      button_gradient: '',
      color_scope: 'content',
    },
    links: [],
    spotify: { url: 'https://', autoplay: false },
    featured_video: { video_id: 0, button_label: 'Video Greeting' },
    features: {
      enable_gallery: false,
      enable_video: false,
      show_guestbook: false,
      enable_featured_video: false,
      allow_img_uploads: false,
      allow_vid_uploads: false,
      gb_btn_view: true,
      gb_signing_status: 'open',
      gb_signing_start: '',
      gb_signing_end: '',
      gb_require_approval: true,
      img_require_approval: true,
      vid_require_approval: true,
      order: ['gallery', 'guestbook', 'featured_video', 'video'],
    },
    uploadedImages: [],
    uploadedVideos: [],
    customizations: {},
  });

  // Load customization data if coming from design editor
  useEffect(() => {
    if (fromCustomize && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('productCustomization');
      if (stored) setCustomizationData(JSON.parse(stored));
    }
  }, [fromCustomize]);

  // Load existing ArtKey if provided
  useEffect(() => {
    if (artkeyId) loadArtKey(artkeyId);
  }, [artkeyId]);

  const loadArtKey = async (id: string) => {
    try {
      const res = await fetch(`/api/artkey/get/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.data) {
        setArtKeyData(data.data);
        setCustomLinks(data.data.links || []);
      }
    } catch (e) {
      console.error('Failed to load ArtKey', e);
    }
  };

  // Templates (full set incl. sports)
  const templates = useMemo(() => [
    // Page 1
    { value: 'classic', name: 'Classic', bg: '#F6F7FB', button: '#4f46e5', text: '#1d1d1f', title: '#4f46e5' },
    { value: 'paper', name: 'Paper', bg: '#fbf8f1', button: '#8b4513', text: '#2d3436', title: '#8b4513' },
    { value: 'snow', name: 'Snow', bg: '#ffffff', button: '#3b82f6', text: '#1d1d1f', title: '#3b82f6' },
    { value: 'cloud', name: 'Cloud', bg: '#f8fafc', button: '#10b981', text: '#1d1d1f', title: '#10b981' },
    { value: 'pearl', name: 'Pearl', bg: '#fefefe', button: '#ec4899', text: '#1d1d1f', title: '#ec4899' },
    { value: 'ivory', name: 'Ivory', bg: '#fffff0', button: '#f59e0b', text: '#2d3436', title: '#f59e0b' },
    { value: 'mist', name: 'Mist', bg: '#f1f5f9', button: '#8b5cf6', text: '#1d1d1f', title: '#8b5cf6' },
    { value: 'cream', name: 'Cream', bg: '#fef3c7', button: '#d97706', text: '#2d3436', title: '#d97706' },
    // Page 2
    { value: 'aurora', name: 'Aurora', bg: 'linear-gradient(135deg,#667eea,#764ba2)', button: '#ffffff', text: '#ffffff', title: '#ffffff' },
    { value: 'sunset', name: 'Sunset', bg: 'linear-gradient(135deg,#ff6b6b,#feca57)', button: '#ffffff', text: '#ffffff', title: '#ffd700' },
    { value: 'ocean', name: 'Ocean', bg: 'linear-gradient(135deg,#667eea,#74ebd5)', button: '#ffffff', text: '#ffffff', title: '#74ebd5' },
    { value: 'rose_gold', name: 'Rose Gold', bg: 'linear-gradient(135deg,#f7971e,#ffd200)', button: '#d946ef', text: '#1d1d1f', title: '#d946ef' },
    { value: 'fire', name: 'Fire', bg: 'linear-gradient(135deg,#ff6b6b,#ee5a6f)', button: '#ffffff', text: '#ffffff', title: '#fef3c7' },
    { value: 'sky', name: 'Sky', bg: 'linear-gradient(135deg,#4facfe,#00f2fe)', button: '#ffffff', text: '#ffffff', title: '#fde047' },
    { value: 'forest', name: 'Forest', bg: 'linear-gradient(135deg,#134e5e,#71b280)', button: '#ffffff', text: '#ffffff', title: '#d4fc79' },
    { value: 'berry', name: 'Berry', bg: 'linear-gradient(135deg,#c026d3,#e879f9)', button: '#ffffff', text: '#ffffff', title: '#fde047' },
    // Page 3
    { value: 'lavender', name: 'Lavender', bg: 'linear-gradient(135deg,#e0c3fc,#8ec5fc)', button: '#8b5cf6', text: '#1d1d1f', title: '#7c3aed' },
    { value: 'mint', name: 'Mint', bg: 'linear-gradient(135deg,#d4fc79,#96e6a1)', button: '#10b981', text: '#1d1d1f', title: '#047857' },
    { value: 'peach', name: 'Peach', bg: 'linear-gradient(135deg,#ffecd2,#fcb69f)', button: '#f97316', text: '#1d1d1f', title: '#ea580c' },
    { value: 'cotton', name: 'Cotton Candy', bg: 'linear-gradient(135deg,#a8edea,#fed6e3)', button: '#ec4899', text: '#1d1d1f', title: '#db2777' },
    { value: 'lemon', name: 'Lemon Fresh', bg: 'linear-gradient(135deg,#fddb92,#d1fdff)', button: '#06b6d4', text: '#1d1d1f', title: '#0891b2' },
    { value: 'pastel', name: 'Pastel Sky', bg: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)', button: '#8b5cf6', text: '#1d1d1f', title: '#7c3aed' },
    { value: 'aqua', name: 'Aqua Teal', bg: 'linear-gradient(135deg,#00d2ff,#3a7bd5)', button: '#0ea5e9', text: '#ffffff', title: '#ffffff' },
    { value: 'blush', name: 'Pink Blush', bg: 'linear-gradient(135deg,#ff9a9e,#fecfef)', button: '#ec4899', text: '#1d1d1f', title: '#db2777' },
    // Page 4
    { value: 'dark', name: 'Dark Mode', bg: '#0f1218', button: '#667eea', text: '#ffffff', title: '#667eea' },
    { value: 'bold', name: 'Bold', bg: '#111111', button: '#ffffff', text: '#ffffff', title: '#ffffff' },
    { value: 'cosmic', name: 'Cosmic', bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', button: '#ef4444', text: '#ffffff', title: '#fbbf24' },
    { value: 'midnight', name: 'Midnight', bg: 'linear-gradient(135deg,#000428,#004e92)', button: '#60a5fa', text: '#ffffff', title: '#60a5fa' },
    { value: 'vintage', name: 'Vintage', bg: 'linear-gradient(135deg,#8b4513,#daa520)', button: '#ffffff', text: '#ffffff', title: '#ffd700' },
    { value: 'electric', name: 'Electric', bg: 'linear-gradient(135deg,#06b6d4,#3b82f6)', button: '#fde047', text: '#ffffff', title: '#fde047' },
    { value: 'neon', name: 'Neon', bg: 'linear-gradient(135deg,#ec4899,#8b5cf6)', button: '#fde047', text: '#ffffff', title: '#fde047' },
    { value: 'steel', name: 'Steel', bg: 'linear-gradient(135deg,#434343,#666666)', button: '#ffffff', text: '#ffffff', title: '#fde047' },
    // Page 5 sports
    { value: 'uofa', name: 'UofA Wildcats', bg: 'linear-gradient(135deg,#003366,#CC0033)', button: '#ffffff', text: '#ffffff', title: '#ffffff' },
    { value: 'asu', name: 'ASU Sun Devils', bg: 'linear-gradient(135deg,#8C1D40,#FFC627)', button: '#ffffff', text: '#ffffff', title: '#FFC627' },
    { value: 'nau', name: 'NAU Lumberjacks', bg: 'linear-gradient(135deg,#003466,#FFC82E)', button: '#ffffff', text: '#ffffff', title: '#FFC82E' },
    { value: 'cardinals', name: 'AZ Cardinals', bg: 'linear-gradient(135deg,#97233F,#000000)', button: '#ffffff', text: '#ffffff', title: '#ffffff' },
    { value: 'suns', name: 'Suns/Mercury', bg: 'linear-gradient(135deg,#1D1160,#E56020)', button: '#ffffff', text: '#ffffff', title: '#E56020' },
    { value: 'dbacks', name: 'Diamondbacks', bg: 'linear-gradient(135deg,#A71930,#E3D4AD)', button: '#000000', text: '#000000', title: '#A71930' },
    { value: 'rattlers', name: 'AZ Rattlers', bg: 'linear-gradient(135deg,#000000,#8B0000)', button: '#D4AF37', text: '#ffffff', title: '#D4AF37' },
    { value: 'rising', name: 'PHX Rising FC', bg: 'linear-gradient(135deg,#000000,#B4975A)', button: '#E84C88', text: '#ffffff', title: '#B4975A' },
  ], []);

  const templatesPerPage = 8;
  const totalTemplatePages = Math.ceil(templates.length / templatesPerPage);
  const getCurrentPageTemplates = () => templates.slice(templatePage * templatesPerPage, (templatePage + 1) * templatesPerPage);

  // Colors
  const buttonColors = useMemo(() => ([
    { bg: '#ffffff', color: '#ffffff', label: 'White', type: 'solid' },
    { bg: '#fef3c7', color: '#fef3c7', label: 'Cream', type: 'solid' },
    { bg: '#fde047', color: '#fde047', label: 'Yellow', type: 'solid' },
    { bg: '#f59e0b', color: '#f59e0b', label: 'Amber', type: 'solid' },
    { bg: '#f97316', color: '#f97316', label: 'Orange', type: 'solid' },
    { bg: '#ef4444', color: '#ef4444', label: 'Red', type: 'solid' },
    { bg: '#ec4899', color: '#ec4899', label: 'Pink', type: 'solid' },
    { bg: '#a855f7', color: '#a855f7', label: 'Purple', type: 'solid' },
    { bg: '#8b5cf6', color: '#8b5cf6', label: 'Violet', type: 'solid' },
    { bg: '#3b82f6', color: '#3b82f6', label: 'Blue', type: 'solid' },
    { bg: '#10b981', color: '#10b981', label: 'Green', type: 'solid' },
    { bg: '#000000', color: '#000000', label: 'Black', type: 'solid' },
    // Gradients
    { bg: 'linear-gradient(135deg,#ffecd2,#fcb69f)', color: 'gradient', label: 'Peachy', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#ff9a9e,#fecfef)', color: 'gradient', label: 'Pink Blush', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#a8edea,#fed6e3)', color: 'gradient', label: 'Cotton Candy', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#4facfe,#00f2fe)', color: 'gradient', label: 'Electric Blue', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#ff6b6b,#feca57)', color: 'gradient', label: 'Fire Glow', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#434343,#666666)', color: 'gradient', label: 'Steel Gray', type: 'gradient' },
  ]), []);

  const stockBackgrounds = useMemo(() => [
    { label: 'Cloudy Sky', url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Golden Sunset', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Mountain Lake', url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Aurora Borealis', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Starry Night', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Pink Clouds', url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Ocean Waves', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Tropical Beach', url: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Sunset Beach', url: 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Crystal Water', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Palm Trees', url: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Coastal Cliffs', url: 'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Forest Mist', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Autumn Forest', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Cherry Blossoms', url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Lavender Field', url: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Sunflowers', url: 'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Bamboo Grove', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80&auto=format&fit=crop' },
    { label: 'City Nightline', url: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Desert Dunes', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Marble Texture', url: 'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Rose Gold', url: 'https://images.unsplash.com/photo-1557683316-973673bdar2?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Geometric Pattern', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1600&q=80&auto=format&fit=crop' },
    { label: 'Watercolor', url: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=1600&q=80&auto=format&fit=crop' },
  ], []);

  const stockBgPerPage = 6;
  const [stockBgPage, setStockBgPage] = useState(0);
  const totalStockPages = Math.ceil(stockBackgrounds.length / stockBgPerPage);
  const getCurrentStockBackgrounds = () => stockBackgrounds.slice(stockBgPage * stockBgPerPage, stockBgPage * stockBgPerPage + stockBgPerPage);

  const fonts = [
    { value: 'system', label: 'System' },
    { value: 'serif', label: 'Serif' },
    { value: 'mono', label: 'Monospace' },
    { value: 'g:Inter', label: 'Inter' },
    { value: 'g:Poppins', label: 'Poppins' },
    { value: 'g:Lato', label: 'Lato' },
    { value: 'g:Montserrat', label: 'Montserrat' },
    { value: 'g:Roboto', label: 'Roboto' },
    { value: 'g:Playfair Display', label: 'Playfair Display' },
    { value: 'g:Open Sans', label: 'Open Sans' },
  ];

  const featureDefsDefault = [
    { key: 'gallery', label: '📸 Image Gallery', field: 'enable_gallery' },
    { key: 'guestbook', label: '📖 Guestbook', field: 'show_guestbook' },
    { key: 'featured_video', label: '▶️ Featured Video', field: 'enable_featured_video' },
    { key: 'video', label: '🎥 Video Gallery', field: 'enable_video' },
  ];
  const [featureDefs, setFeatureDefs] = useState(featureDefsDefault);
  const [draggedFeature, setDraggedFeature] = useState<number | null>(null);

  // Helpers
  const handleTemplateSelect = (tpl: typeof templates[0]) => {
    setArtKeyData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        template: tpl.value,
        bg_color: typeof tpl.bg === 'string' && !tpl.bg.startsWith('linear-gradient') ? tpl.bg : tpl.bg,
        button_color: tpl.button,
        title_color: tpl.title,
        text_color: tpl.text || prev.theme.text_color,
        bg_image_url: '',
      },
    }));
  };

  const handleColorSelect = (color: typeof buttonColors[0], type: 'button' | 'title' | 'background') => {
    const isGradient = color.type === 'gradient' || (typeof color.bg === 'string' && color.bg.startsWith('linear-gradient'));
    if (type === 'button') {
      setArtKeyData((prev) => ({
        ...prev,
        theme: { ...prev.theme, button_color: isGradient ? (color.bg.match(/#[0-9a-fA-F]{6}/)?.[0] || '#667eea') : color.color, button_gradient: isGradient ? color.bg : '' },
      }));
    } else if (type === 'title') {
      setArtKeyData((prev) => ({
        ...prev,
        theme: { ...prev.theme, title_color: isGradient ? (color.bg.match(/#[0-9a-fA-F]{6}/)?.[0] || '#4f46e5') : color.color },
      }));
    } else if (type === 'background') {
      setArtKeyData((prev) => ({
        ...prev,
        theme: { ...prev.theme, bg_color: color.bg || color.color, bg_image_url: '' },
      }));
    }
  };

  const getColorsForPage = (page: number, arr: typeof buttonColors) => arr.slice(page * 12, page * 12 + 12);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/artkey/upload', { method: 'POST', body: formData });
        if (!res.ok) continue;
        const result = await res.json();
        setArtKeyData((prev) => ({ ...prev, uploadedImages: [...prev.uploadedImages, result.url] }));
      } catch (err) {
        console.error('Upload failed', err);
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('file', f));
    try {
      const res = await fetch('/api/artkey/upload', { method: 'POST', body: formData });
      if (!res.ok) return;
      const result = await res.json();
      setArtKeyData((prev) => ({ ...prev, uploadedVideos: [...prev.uploadedVideos, result.url || result.fileUrl] }));
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/artkey/upload', { method: 'POST', body: formData });
      if (!res.ok) return;
      const result = await res.json();
      setArtKeyData((prev) => ({ ...prev, theme: { ...prev.theme, bg_image_url: result.url, bg_image_id: result.id || 0 } }));
    } catch (err) {
      console.error('Background upload failed', err);
    }
  };

  const handleSave = async (redirectToShop = false) => {
    try {
      const res = await fetch('/api/artkey/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...artKeyData, links: customLinks },
          product_id: productId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || err.message || 'Save failed');
        return;
      }
      const result = await res.json();
      alert(`ArtKey saved! ${result.share_url ? `Share URL: ${result.share_url}` : ''}`);
      if (redirectToShop) {
        router.push('/shop');
      }
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save ArtKey');
    }
  };

  const handleSaveAndContinue = () => handleSave(false);
  const handleSaveAndCheckout = () => handleSave(true);

  const toggleFeature = (field: keyof ArtKeyData['features']) => {
    setArtKeyData((prev) => ({
      ...prev,
      features: { ...prev.features, [field]: !prev.features[field] },
    }));
  };

  const handleAddLink = () => {
    if (!newLinkLabel || !newLinkUrl) return;
    const updated = [...customLinks, { label: newLinkLabel, url: newLinkUrl }];
    setCustomLinks(updated);
    setArtKeyData((prev) => ({ ...prev, links: updated }));
    setNewLinkLabel('');
    setNewLinkUrl('https://www.');
  };

  const handleRemoveLink = (idx: number) => {
    const updated = customLinks.filter((_, i) => i !== idx);
    setCustomLinks(updated);
    setArtKeyData((prev) => ({ ...prev, links: updated }));
  };

  const getPreviewBackground = () => {
    if (artKeyData.theme.bg_image_url) {
      return { backgroundImage: `url(${artKeyData.theme.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: COLOR_ALT };
    }
    if (artKeyData.theme.bg_color?.startsWith('linear-gradient')) {
      return { background: artKeyData.theme.bg_color, backgroundColor: COLOR_ALT };
    }
    return { backgroundColor: artKeyData.theme.bg_color || COLOR_ALT };
  };

  const getButtonTextColor = (color: string) => {
    if (!color) return '#fff';
    const c = color.toLowerCase();
    if (c === '#ffffff' || c === '#fefefe' || c === '#fef3c7' || c === '#fde047' || c === '#fffff0') return '#000000';
    return '#ffffff';
  };

  // Drag reorder
  const handleFeatureDragStart = (index: number) => setDraggedFeature(index);
  const handleFeatureDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedFeature === null || draggedFeature === index) return;
    const newFeatures = [...featureDefs];
    const draggedItem = newFeatures[draggedFeature];
    newFeatures.splice(draggedFeature, 1);
    newFeatures.splice(index, 0, draggedItem);
    setFeatureDefs(newFeatures);
    setDraggedFeature(index);
  };
  const handleFeatureDragEnd = () => setDraggedFeature(null);

  return (
    <div style={{ background: COLOR_ALT }} className="min-h-screen">
      {/* Top Bar */}
      <div style={{ background: COLOR_ACCENT }} className="text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-2xl font-bold font-playfair">✨ Edit Your ArtKey Page</h1>
            <div className="flex gap-3">
              <button
                onClick={handleSaveAndContinue}
                className="px-6 py-2 rounded-lg font-semibold transition-all"
                style={{ background: COLOR_PRIMARY, color: COLOR_ACCENT, border: '1px solid rgba(255,255,255,0.2)' }}
              >
                💾 Save & Continue
              </button>
              <button
                onClick={handleSaveAndCheckout}
                className="px-6 py-2 rounded-lg font-semibold transition-all"
                style={{ background: COLOR_PRIMARY, color: COLOR_ACCENT, border: '1px solid rgba(255,255,255,0.2)' }}
              >
                ✅ Save & Checkout
              </button>
            </div>
          </div>
          {customizationData && (
            <p className="text-sm text-white/80 mt-2">
              Customizing: {customizationData.productName} - ${customizationData.totalPrice}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 border border-[#e2e2e0]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold font-playfair" style={{ color: COLOR_ACCENT }}>Live Preview</h3>
                <div className="flex gap-2" style={{ background: COLOR_ALT }} className="p-1 rounded-lg">
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${previewDevice === 'mobile' ? 'shadow' : ''}`}
                    style={previewDevice === 'mobile' ? { background: COLOR_PRIMARY, color: COLOR_ACCENT } : { color: '#666' }}
                  >
                    📱 Mobile
                  </button>
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${previewDevice === 'desktop' ? 'shadow' : ''}`}
                    style={previewDevice === 'desktop' ? { background: COLOR_PRIMARY, color: COLOR_ACCENT } : { color: '#666' }}
                  >
                    🖥️ Desktop
                  </button>
                </div>
              </div>

              {previewDevice === 'mobile' && (
                // Mobile preview: Fullscreen, no phone container
                <div className="w-full rounded-xl overflow-hidden border-2" style={{ borderColor: '#e2e2e0', ...getPreviewBackground(), minHeight: '600px' }}>
                  <div className="h-full w-full pt-6 pb-6 px-6 flex flex-col items-center text-center min-h-[600px]">
                    <h1
                      className="text-2xl md:text-3xl font-bold mb-3 font-playfair break-words mt-16"
                      style={{
                        color: artKeyData.theme.title_style === 'gradient' ? 'transparent' : artKeyData.theme.title_color,
                        background: artKeyData.theme.title_style === 'gradient' ? `linear-gradient(135deg, ${artKeyData.theme.title_color}, ${artKeyData.theme.button_color})` : 'none',
                        backgroundClip: artKeyData.theme.title_style === 'gradient' ? 'text' : 'unset',
                        WebkitBackgroundClip: artKeyData.theme.title_style === 'gradient' ? 'text' : 'unset',
                      }}
                    >
                      {artKeyData.title || 'Your Title Here'}
                    </h1>

                        {/* Buttons Preview */}
                        <div className="flex flex-col gap-2 mt-3 w-full max-w-sm">
                          {customLinks.slice(0, 3).map((link, idx) => (
                            <button
                              key={idx}
                              className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md"
                              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
                            >
                              {link.label || `Link ${idx + 1}`}
                            </button>
                          ))}
                          {artKeyData.spotify.url?.length > 10 && (
                            <button className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}>
                              🎵 Playlist
                            </button>
                          )}
                          {artKeyData.features.show_guestbook && (
                            <button className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md"
                              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}>
                              📝 {artKeyData.features.gb_signing_status === 'closed' ? 'Guestbook' : 'Sign Guestbook'}
                            </button>
                          )}
                          {artKeyData.features.enable_featured_video && (
                            <button className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md"
                              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}>
                              🎬 {artKeyData.featured_video.button_label || 'Watch Video'}
                            </button>
                          )}
                          {artKeyData.features.enable_gallery && (
                            <button className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md"
                              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}>
                              🖼️ Image Gallery {artKeyData.uploadedImages.length > 0 && `(${artKeyData.uploadedImages.length})`}
                            </button>
                          )}
                          {artKeyData.features.enable_video && (
                            <button className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md"
                              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}>
                              🎥 Video Gallery {artKeyData.uploadedVideos.length > 0 && `(${artKeyData.uploadedVideos.length})`}
                            </button>
                          )}
                        </div>

                        {artKeyData.uploadedImages.length > 0 && (
                          <div className="grid grid-cols-4 gap-1 mt-3 w-full max-w-sm">
                            {artKeyData.uploadedImages.slice(0, 4).map((img, idx) => (
                              <img key={idx} src={img} alt="" className="w-full h-12 object-cover rounded-md border border-white/50 shadow-sm" />
                            ))}
                          </div>
                        )}
                  </div>
                </div>
              )}

              {previewDevice === 'desktop' && (
                // Desktop preview: Phone container frame
                <div className="flex justify-center">
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-[32px] p-2 shadow-2xl relative" style={{ width: 'min(380px, 100%)' }}>
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-black rounded-full w-24 h-7 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-800 ring-1 ring-gray-700"></div>
                        <div className="w-3 h-3 rounded-full bg-gray-800 ring-1 ring-gray-700"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-[28px] overflow-hidden relative" style={{ height: 'min(700px, 75vh)', width: '100%' }}>
                      <div
                        className="h-full w-full pt-6 pb-6 px-6 flex flex-col items-center text-center"
                        style={getPreviewBackground()}
                      >
                        <h1
                          className="text-2xl md:text-3xl font-bold mb-3 font-playfair break-words mt-16"
                          style={{
                            color: artKeyData.theme.title_style === 'gradient' ? 'transparent' : artKeyData.theme.title_color,
                            background: artKeyData.theme.title_style === 'gradient' ? `linear-gradient(135deg, ${artKeyData.theme.title_color}, ${artKeyData.theme.button_color})` : 'none',
                            backgroundClip: artKeyData.theme.title_style === 'gradient' ? 'text' : 'unset',
                            WebkitBackgroundClip: artKeyData.theme.title_style === 'gradient' ? 'text' : 'unset',
                          }}
                        >
                          {artKeyData.title || 'Your Title Here'}
                        </h1>

                        {/* Buttons Preview */}
                        <div className="flex flex-col gap-2 mt-3 w-full max-w-sm">
                          {customLinks.slice(0, 3).map((link, idx) => (
                            <button
                              key={idx}
                              className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md"
                              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
                            >
                              {link.label || `Link ${idx + 1}`}
                            </button>
                          ))}
                          {artKeyData.spotify.url?.length > 10 && (
                            <button className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}>
                              🎵 Playlist
                            </button>
                          )}
                          {artKeyData.features.show_guestbook && (
                            <button className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md"
                              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}>
                              📝 {artKeyData.features.gb_signing_status === 'closed' ? 'Guestbook' : 'Sign Guestbook'}
                            </button>
                          )}
                          {artKeyData.features.enable_featured_video && (
                            <button className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md"
                              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}>
                              🎬 {artKeyData.featured_video.button_label || 'Watch Video'}
                            </button>
                          )}
                          {artKeyData.features.enable_gallery && (
                            <button className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md"
                              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}>
                              🖼️ Image Gallery {artKeyData.uploadedImages.length > 0 && `(${artKeyData.uploadedImages.length})`}
                            </button>
                          )}
                          {artKeyData.features.enable_video && (
                            <button className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md"
                              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}>
                              🎥 Video Gallery {artKeyData.uploadedVideos.length > 0 && `(${artKeyData.uploadedVideos.length})`}
                            </button>
                          )}
                        </div>

                        {artKeyData.uploadedImages.length > 0 && (
                          <div className="grid grid-cols-4 gap-1 mt-3 w-full max-w-sm">
                            {artKeyData.uploadedImages.slice(0, 4).map((img, idx) => (
                              <img key={idx} src={img} alt="" className="w-full h-12 object-cover rounded-md border border-white/50 shadow-sm" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

                    {artKeyData.uploadedImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-4 w-full max-w-md">
                        {artKeyData.uploadedImages.slice(0, 4).map((img, idx) => (
                          <img key={idx} src={img} alt="" className="w-full h-16 object-cover rounded-lg border border-white/50 shadow-sm" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Editor */}
          <div className="space-y-6">
            {/* Step 1 chooser */}
            {designMode === null && (
              <Card title="Choose a Template or Design Your Own ArtKey" step="1">
                <div className="grid md:grid-cols-2 gap-4">
                  <PrimaryButton onClick={() => setDesignMode('template')} icon="🎨" accent>
                    Choose a Template
                    <div className="text-sm text-[#444] mt-1">Pick from 40 templates</div>
                  </PrimaryButton>
                  <PrimaryButton onClick={() => setDesignMode('custom')} icon="✨">
                    Design Your Own
                    <div className="text-sm text-[#444] mt-1">Start from scratch</div>
                  </PrimaryButton>
                </div>
              </Card>
            )}

            {/* Template selection */}
            {designMode === 'template' && (
              <Card title="Choose Template" step="1" onBack={() => setDesignMode(null)}>
                <Carousel
                  page={templatePage}
                  setPage={setTemplatePage}
                  total={totalTemplatePages}
                  labelPrefix="Templates"
                >
                  <div className="grid grid-cols-4 gap-2">
                    {getCurrentPageTemplates().map((tpl) => (
                      <button
                        key={tpl.value}
                        onClick={() => handleTemplateSelect(tpl)}
                        className={`p-2 rounded-xl border-2 transition-all ${artKeyData.theme.template === tpl.value ? 'shadow-lg' : ''}`}
                        style={{
                          borderColor: artKeyData.theme.template === tpl.value ? COLOR_ACCENT : '#e2e2e0',
                          background: tpl.bg?.startsWith('linear-gradient') ? tpl.bg : tpl.bg,
                        }}
                      >
                        <div className="w-full h-16 rounded-lg mb-2 relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-xs font-bold" style={{ color: tpl.title }}>Aa</div>
                          </div>
                          <div className="absolute bottom-1 right-1">
                            <div className="w-4 h-4 rounded" style={{ background: tpl.button }}></div>
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-center" style={{ color: COLOR_ACCENT }}>{tpl.name}</div>
                      </button>
                    ))}
                  </div>
                </Carousel>
              </Card>
            )}

            {/* Custom background */}
            {designMode === 'custom' && (
              <Card title="Design Your Own - Choose Background" step="1" onBack={() => setDesignMode(null)}>
                <Tabs value={bgTab} onChange={setBgTab} tabs={[
                  { id: 'solid', label: 'Solid Color' },
                  { id: 'stock', label: 'Stock Photos' },
                  { id: 'upload', label: 'Upload' },
                ]} />

                {bgTab === 'solid' && (
                  <ColorPicker
                    page={bgColorPage}
                    setPage={setBgColorPage}
                    pages={3}
                    label={(page) => (page === 0 ? 'Solid Colors' : page === 1 ? 'Gradients: Cool' : 'Gradients: Warm')}
                    colors={buttonColors}
                    selected={artKeyData.theme.bg_color}
                    onSelect={(c) => handleColorSelect(c, 'background')}
                  />
                )}

                {bgTab === 'stock' && (
                  <div>
                    <Carousel page={stockBgPage} setPage={setStockBgPage} total={totalStockPages} labelPrefix="Backgrounds">
                      <div className="grid grid-cols-3 gap-3">
                        {getCurrentStockBackgrounds().map((stock, idx) => (
                          <button
                            key={idx}
                            onClick={() => setArtKeyData((prev) => ({ ...prev, theme: { ...prev.theme, bg_image_url: stock.url, bg_image_id: idx + 1 } }))}
                            className="aspect-square rounded-lg overflow-hidden border-2 transition-all"
                            style={{
                              borderColor: artKeyData.theme.bg_image_url === stock.url ? COLOR_ACCENT : '#e2e2e0',
                              backgroundImage: `url(${stock.url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                            title={stock.label}
                          />
                        ))}
                      </div>
                    </Carousel>
                  </div>
                )}

                {bgTab === 'upload' && (
                  <div className="border-2 border-dashed rounded-xl p-8 text-center" style={{ borderColor: '#d8d8d6', background: COLOR_ALT }}>
                    <div className="text-5xl mb-4">📤</div>
                    <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" id="bg-upload" />
                    <label
                      htmlFor="bg-upload"
                      className="inline-block px-6 py-3 rounded-full font-semibold cursor-pointer transition-all"
                      style={{ background: COLOR_ACCENT, color: '#fff' }}
                    >
                      Upload Background
                    </label>
                    <p className="text-xs mt-2" style={{ color: '#666' }}>JPG, PNG up to 10MB</p>
                  </div>
                )}

                {artKeyData.theme.bg_image_url && (
                  <button
                    onClick={() => setArtKeyData((prev) => ({ ...prev, theme: { ...prev.theme, bg_image_url: '', bg_image_id: 0 } }))}
                    className="w-full mt-3 px-4 py-2 rounded-lg transition-all"
                    style={{ border: '1px solid #d8d8d6', background: COLOR_PRIMARY, color: COLOR_ACCENT }}
                  >
                    Clear Background Image
                  </button>
                )}
              </Card>
            )}

            {/* Step 2 Title */}
            {designMode !== null && (
              <Card title={designMode === 'template' ? 'Add Your Title' : 'Add Your Title and Title Color'} step="2">
                <input
                  type="text"
                  value={artKeyData.title}
                  onChange={(e) => setArtKeyData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{ border: '2px solid #e2e2e0' }}
                  placeholder="Enter your title..."
                />
                {designMode === 'custom' && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2" style={{ color: COLOR_ACCENT }}>Title Color</h4>
                    <ColorPicker
                      page={titleColorPage}
                      setPage={setTitleColorPage}
                      pages={4}
                      label={(page) =>
                        page === 0 ? 'Solid Colors' : page === 1 ? 'Light & Pastel Gradients' : page === 2 ? 'Vibrant Gradients' : 'Dark Gradients'
                      }
                      colors={buttonColors}
                      selected={artKeyData.theme.title_color}
                      onSelect={(c) => handleColorSelect(c, 'title')}
                    />
                  </div>
                )}
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2" style={{ color: COLOR_ACCENT }}>Font</label>
                  <select
                    value={artKeyData.theme.font}
                    onChange={(e) => setArtKeyData((prev) => ({ ...prev, theme: { ...prev.theme, font: e.target.value } }))}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{ border: '2px solid #e2e2e0' }}
                  >
                    {fonts.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </Card>
            )}

            {/* Step 3 Features & Colors */}
            {designMode !== null && (
              <Card title="Choose ArtKey Features and Colors" step="3">
                <div className="mb-4 p-4 rounded-lg" style={{ background: '#f5f5f3' }}>
                  <h4 className="text-sm font-semibold mb-3">🎨 Button Color</h4>
                  <ColorPicker
                    page={buttonColorPage}
                    setPage={setButtonColorPage}
                    pages={4}
                    label={(page) =>
                      page === 0 ? 'Solid Colors' : page === 1 ? 'Gradients: Cool' : page === 2 ? 'Gradients: Warm' : 'Gradients: Dark'
                    }
                    colors={buttonColors}
                    selected={artKeyData.theme.button_color}
                    onSelect={(c) => handleColorSelect(c, 'button')}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <span className="text-xs text-blue-800">Click to toggle; drag to reorder.</span>
                </div>

                <div className="space-y-2">
                  {featureDefs.map((f, idx) => (
                    <div
                      key={f.key}
                      draggable
                      onDragStart={() => handleFeatureDragStart(idx)}
                      onDragOver={(e) => handleFeatureDragOver(e, idx)}
                      onDragEnd={handleFeatureDragEnd}
                      className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-grab transition-all"
                      style={{
                        borderColor: artKeyData.features[f.field] ? COLOR_ACCENT : '#e2e2e0',
                        background: artKeyData.features[f.field] ? COLOR_ALT : COLOR_PRIMARY,
                        opacity: draggedFeature === idx ? 0.5 : 1,
                      }}
                      onClick={() => toggleFeature(f.field)}
                    >
                      <div className="text-gray-400">⋮⋮</div>
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: artKeyData.features[f.field] ? COLOR_ACCENT : '#d0d0ce', background: artKeyData.features[f.field] ? COLOR_ACCENT : 'transparent' }}
                      >
                        {artKeyData.features[f.field] && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className="flex-1 text-sm font-medium" style={{ color: COLOR_ACCENT }}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Step 4 Links */}
            {designMode !== null && (
              <Card title="Share Your Interests" step="4">
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Button Name</label>
                    <input
                      type="text"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ border: '1px solid #d8d8d6' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>URL</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔗</span>
                      <input
                        type="url"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg text-sm"
                        style={{ border: '1px solid #d8d8d6' }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddLink}
                    className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ border: '2px solid #d8d8d6', background: COLOR_PRIMARY, color: COLOR_ACCENT }}
                  >
                    + Add Button
                  </button>
                </div>
                {customLinks.length > 0 && (
                  <div className="space-y-2">
                    {customLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: COLOR_ALT }}>
                        <span className="text-sm flex-1" style={{ color: COLOR_ACCENT }}>{link.label}</span>
                        <button onClick={() => handleRemoveLink(idx)} className="text-red-500 text-sm">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Step 5 Spotify */}
            {designMode !== null && (
              <Card title="Share Your Playlist" step="5">
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Playlist URL</label>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔗</span>
                  <input
                    type="url"
                    value={artKeyData.spotify.url}
                    onChange={(e) => setArtKeyData((prev) => ({ ...prev, spotify: { ...prev.spotify, url: e.target.value } }))}
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                    style={{ border: '1px solid #d8d8d6' }}
                    placeholder="https://open.spotify.com/playlist/..."
                  />
                </div>
                <label className="flex items-center gap-2 mt-3 text-sm">
                  <input
                    type="checkbox"
                    checked={artKeyData.spotify.autoplay}
                    onChange={(e) => setArtKeyData((prev) => ({ ...prev, spotify: { ...prev.spotify, autoplay: e.target.checked } }))}
                  />
                  <span>Auto-play when page loads</span>
                </label>
              </Card>
            )}

            {/* Step 6 Media */}
            {designMode !== null && (
              <Card title="Media Gallery" step="6">
                <div className="grid grid-cols-2 gap-4">
                  <MediaColumn
                    title="Images"
                    items={artKeyData.uploadedImages}
                    onRemove={(idx) => setArtKeyData((prev) => ({ ...prev, uploadedImages: prev.uploadedImages.filter((_, i) => i !== idx) }))}
                    onUpload={handleImageUpload}
                    accept="image/*"
                    inputId="image-upload"
                    buttonLabel="+ Upload"
                  />
                  <MediaColumn
                    title="Videos"
                    items={artKeyData.uploadedVideos}
                    onRemove={(idx) => setArtKeyData((prev) => ({ ...prev, uploadedVideos: prev.uploadedVideos.filter((_, i) => i !== idx) }))}
                    onUpload={handleVideoUpload}
                    accept="video/*"
                    inputId="video-upload"
                    buttonLabel="+ Upload"
                    isVideo
                  />
                </div>
              </Card>
            )}

            {/* Step 7 Settings */}
            {designMode !== null && (artKeyData.features.show_guestbook || artKeyData.features.enable_gallery || artKeyData.features.enable_video || artKeyData.features.enable_featured_video) && (
              <Card title="ArtKey Settings" step="7">
                {artKeyData.features.show_guestbook && (
                  <SettingsBlock title="📖 Guestbook Settings">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={artKeyData.features.gb_btn_view}
                        onChange={(e) => setArtKeyData((prev) => ({ ...prev, features: { ...prev.features, gb_btn_view: e.target.checked } }))}
                      />
                      <span>Allow guests to view the Guestbook</span>
                    </label>
                    <div className="flex gap-2 mt-2">
                      {['open', 'closed', 'scheduled'].map((v) => (
                        <button
                          key={v}
                          onClick={() => setArtKeyData((prev) => ({ ...prev, features: { ...prev.features, gb_signing_status: v } }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            background: artKeyData.features.gb_signing_status === v ? (v === 'open' ? '#22c55e' : v === 'closed' ? '#ef4444' : '#3b82f6') : '#e5e7eb',
                            color: artKeyData.features.gb_signing_status === v ? '#fff' : '#444',
                          }}
                        >
                          {v === 'open' ? '✅ Open' : v === 'closed' ? '🚫 Closed' : '📅 Scheduled'}
                        </button>
                      ))}
                    </div>
                    {artKeyData.features.gb_signing_status === 'scheduled' && (
                      <div className="grid grid-cols-2 gap-3 mt-3 p-3 rounded-lg" style={{ background: '#e0f2fe' }}>
                        <div>
                          <label className="block text-xs font-medium mb-1">Start Date</label>
                          <input
                            type="datetime-local"
                            value={artKeyData.features.gb_signing_start}
                            onChange={(e) => setArtKeyData((prev) => ({ ...prev, features: { ...prev.features, gb_signing_start: e.target.value } }))}
                            className="w-full px-2 py-1.5 rounded-lg text-sm"
                            style={{ border: '1px solid #d8d8d6' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">End Date</label>
                          <input
                            type="datetime-local"
                            value={artKeyData.features.gb_signing_end}
                            onChange={(e) => setArtKeyData((prev) => ({ ...prev, features: { ...prev.features, gb_signing_end: e.target.value } }))}
                            className="w-full px-2 py-1.5 rounded-lg text-sm"
                            style={{ border: '1px solid #d8d8d6' }}
                          />
                        </div>
                      </div>
                    )}
                    <label className="flex items-center gap-2 text-sm mt-3">
                      <input
                        type="checkbox"
                        checked={artKeyData.features.gb_require_approval}
                        onChange={(e) => setArtKeyData((prev) => ({ ...prev, features: { ...prev.features, gb_require_approval: e.target.checked } }))}
                      />
                      <span>🛡️ Require approval before entries appear</span>
                    </label>
                  </SettingsBlock>
                )}

                {artKeyData.features.enable_gallery && (
                  <SettingsBlock title="📸 Image Gallery Settings">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={artKeyData.features.allow_img_uploads}
                        onChange={(e) => setArtKeyData((prev) => ({ ...prev, features: { ...prev.features, allow_img_uploads: e.target.checked } }))}
                      />
                      <span>Allow guests to upload images</span>
                    </label>
                    {artKeyData.features.allow_img_uploads && (
                      <div className="mt-2 p-3 rounded-lg" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                        <div className="text-sm font-medium" style={{ color: '#b45309' }}>🛡️ Moderation enabled</div>
                        <p className="text-xs mt-1" style={{ color: '#92400e' }}>Guest uploads require approval.</p>
                      </div>
                    )}
                  </SettingsBlock>
                )}

                {artKeyData.features.enable_video && (
                  <SettingsBlock title="🎥 Video Gallery Settings">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={artKeyData.features.allow_vid_uploads}
                        onChange={(e) => setArtKeyData((prev) => ({ ...prev, features: { ...prev.features, allow_vid_uploads: e.target.checked } }))}
                      />
                      <span>Allow guests to upload videos</span>
                    </label>
                    {artKeyData.features.allow_vid_uploads && (
                      <div className="mt-2 p-3 rounded-lg" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                        <div className="text-sm font-medium" style={{ color: '#b45309' }}>🛡️ Moderation enabled</div>
                        <p className="text-xs mt-1" style={{ color: '#92400e' }}>Guest uploads require approval.</p>
                      </div>
                    )}
                  </SettingsBlock>
                )}

                {artKeyData.features.enable_featured_video && (
                  <SettingsBlock title="▶️ Featured Video Settings">
                    <label className="block text-xs font-medium mb-1">Button Label</label>
                    <input
                      type="text"
                      value={artKeyData.featured_video.button_label}
                      onChange={(e) => setArtKeyData((prev) => ({ ...prev, featured_video: { ...prev.featured_video, button_label: e.target.value } }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ border: '1px solid #d8d8d6' }}
                      placeholder="e.g., Watch Video Greeting"
                    />
                    <div className="mt-3">
                      <label className="block text-xs font-medium mb-1">Upload Featured Video</label>
                      <div className="border-2 border-dashed rounded-xl p-6 text-center" style={{ borderColor: '#d8d8d6', background: COLOR_ALT }}>
                        <div className="text-4xl mb-2">🎬</div>
                        <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" id="featured-video-upload" />
                        <label
                          htmlFor="featured-video-upload"
                          className="inline-block px-4 py-2 rounded-full font-semibold cursor-pointer transition-all"
                          style={{ background: COLOR_ACCENT, color: '#fff' }}
                        >
                          + Upload Video
                        </label>
                        <p className="text-xs mt-2" style={{ color: '#666' }}>MP4, MOV, WebM up to 100MB</p>
                      </div>
                    </div>
                  </SettingsBlock>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function Card({ title, step, children, onBack }: { title: string; step?: string; children: React.ReactNode; onBack?: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#e2e2e0]">
      <div className="flex items-center gap-3 mb-4">
        {step && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white" style={{ background: COLOR_ACCENT }}>{step}</div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold font-playfair" style={{ color: COLOR_ACCENT }}>{title}</h3>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm rounded-lg transition-all"
            style={{ border: '1px solid #d8d8d6', background: COLOR_PRIMARY, color: COLOR_ACCENT }}
          >
            ← Back
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Tabs({ value, onChange, tabs }: { value: string; onChange: (id: string) => void; tabs: { id: string; label: string }[] }) {
  return (
    <div className="flex gap-2 mb-4 p-1 rounded-lg" style={{ background: COLOR_ALT }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={value === t.id ? { background: COLOR_PRIMARY, boxShadow: '0 2px 6px rgba(0,0,0,0.08)', color: COLOR_ACCENT } : { color: '#666' }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Carousel({ page, setPage, total, children, labelPrefix }: { page: number; setPage: (p: number) => void; total: number; children: React.ReactNode; labelPrefix?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="w-10 h-10 rounded-lg border transition-all disabled:opacity-50"
          style={{ borderColor: '#d8d8d6' }}
        >
          ‹
        </button>
        <div className="flex-1">{children}</div>
        <button
          onClick={() => setPage(Math.min(total - 1, page + 1))}
          disabled={page >= total - 1}
          className="w-10 h-10 rounded-lg border transition-all disabled:opacity-50"
          style={{ borderColor: '#d8d8d6' }}
        >
          ›
        </button>
      </div>
      <div className="text-center text-sm text-gray-500">
        Page {page + 1} of {total} {labelPrefix || ''}
      </div>
    </div>
  );
}

function ColorPicker({ page, setPage, pages, label, colors, selected, onSelect }: {
  page: number;
  setPage: (p: number) => void;
  pages: number;
  label: string | ((page: number) => string);
  colors: typeof buttonColors;
  selected: string;
  onSelect: (color: typeof buttonColors[0]) => void;
}) {
  const maxPage = pages - 1;
  const getColorsForPage = (page: number, arr: typeof buttonColors) => arr.slice(page * 12, page * 12 + 12);
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="w-8 h-8 rounded border disabled:opacity-50"
          style={{ borderColor: '#d8d8d6' }}
        >
          ‹
        </button>
        <span className="text-xs text-gray-500 flex-1 text-center">{typeof label === 'function' ? label(page) : label}</span>
        <button
          onClick={() => setPage(Math.min(maxPage, page + 1))}
          disabled={page >= maxPage}
          className="w-8 h-8 rounded border disabled:opacity-50"
          style={{ borderColor: '#d8d8d6' }}
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-6 gap-2 mb-2">
        {getColorsForPage(page, colors).map((color, idx) => {
          const isSelected =
            selected === color.color ||
            selected === color.bg ||
            (color.type === 'gradient' && typeof selected === 'string' && selected.includes(color.bg?.match(/#[0-9a-fA-F]{6}/)?.[0] || ''));
          return (
            <button
              key={idx}
              onClick={() => onSelect(color)}
              className="aspect-square rounded-lg border-2 transition-all"
              style={{
                background: color.bg || color.color,
                borderColor: isSelected ? COLOR_ACCENT : '#e2e2e0',
              }}
              title={color.label}
            />
          );
        })}
      </div>
    </div>
  );
}

function MediaColumn({ title, items, onRemove, onUpload, accept, inputId, buttonLabel, isVideo }: {
  title: string;
  items: string[];
  onRemove: (idx: number) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept: string;
  inputId: string;
  buttonLabel: string;
  isVideo?: boolean;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2" style={{ color: COLOR_ACCENT }}>{title}</h4>
      {items.length > 0 && (
        <div className={isVideo ? 'space-y-2 mb-2' : 'grid grid-cols-3 gap-2 mb-2'}>
          {items.map((it, idx) => (
            <div key={idx} className="relative group">
              {isVideo ? (
                <video src={it} className="w-full h-20 object-cover rounded-lg" controls />
              ) : (
                <img src={it} alt="" className="w-full h-20 object-cover rounded-lg" />
              )}
              <button
                onClick={() => onRemove(idx)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input type="file" accept={accept} multiple onChange={onUpload} className="hidden" id={inputId} />
        <label
          htmlFor={inputId}
          className="flex-1 px-3 py-2 rounded-lg text-sm text-center cursor-pointer transition-all"
          style={{ border: '1px solid #d8d8d6', background: COLOR_PRIMARY, color: COLOR_ACCENT }}
        >
          {buttonLabel}
        </label>
      </div>
    </div>
  );
}

function SettingsBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 p-4 rounded-lg" style={{ background: '#f5f5f3' }}>
      <h4 className="text-sm font-semibold mb-3" style={{ color: COLOR_ACCENT }}>{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function PrimaryButton({ onClick, children, icon, accent }: { onClick: () => void; children: React.ReactNode; icon: string; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="group relative p-6 rounded-xl text-left transition-all border-2"
      style={{
        background: accent ? 'linear-gradient(135deg,#e2e2e0,#cfcfcf)' : 'linear-gradient(135deg,#f7f7f7,#ececec)',
        borderColor: '#e2e2e0',
      }}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-xl font-bold font-playfair" style={{ color: COLOR_ACCENT }}>{children}</div>
      <div className="absolute top-2 right-2 text-2xl opacity-20 group-hover:opacity-40 transition-opacity">→</div>
    </button>
  );
}

// Export with Suspense wrapper for useSearchParams
export default function ArtKeyEditor({ artkeyId = null }: ArtKeyEditorProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLOR_ALT }}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-brand-dark border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-brand-dark text-lg">Loading editor...</p>
        </div>
      </div>
    }>
      <ArtKeyEditorContent artkeyId={artkeyId} />
    </Suspense>
  );
}
