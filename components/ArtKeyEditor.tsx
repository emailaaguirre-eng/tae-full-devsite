"use client";
// @ts-nocheck
// Note: TypeScript checking disabled temporarily for faster iteration

/**
 * ArtKey Editor - Full UI (Converted from WordPress to Next.js)
 * Palette:
 *   Primary: #FFFFFF
 *   Alt: #ECECE9
 *   Accent: #353535
 */
import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { ARTKEY_ADMIN_DASHBOARD_PATH } from '@/lib/routes';
import { 
  TEMPLATE_CATEGORIES, 
  getTemplatesByCategory, 
  findTemplate,
  BUTTON_SHAPES,
  BUTTON_STYLES,
  getButtonBorderRadius,
  type TemplateCategory,
  type ButtonShape,
  type ButtonStyle,
  type ArtKeyTemplate,
} from './artkey/templates';
import { 
  ElegantIcon, 
  ELEGANT_ICONS, 
  type ElegantIconKey 
} from './artkey/ElegantIcons';
import { AdvancedColorPickerPopover } from './artkey/AdvancedColorPickerPopover';
import { CustomIcon } from './CustomIcons';
import { GuestbookModerationPanel } from './GuestbookModerationPanel';
import { normalizeFavoriteBodyFromRaw } from '@/app/art-key/[token]/_shared';

function isElegantIconKey(value: string): value is ElegantIconKey {
  return Object.prototype.hasOwnProperty.call(ELEGANT_ICONS, value);
}

// Palette
const COLOR_PRIMARY = '#FFFFFF';
const COLOR_ALT = '#ECECE9';
const COLOR_ACCENT = '#353535';

const MAX_PORTAL_FAVORITES = 6;

/** Portals saved before Favorites was a featureDef row still get a reorderable Favorites action. */
function mergeFavoritesFeatureDef(defs: unknown[]) {
  const arr = Array.isArray(defs) ? defs : [];
  if (arr.some((f: any) => f?.key === 'favorites')) return arr.map((f: any) => ({ ...f }));
  return [
    ...arr,
    {
      key: 'favorites',
      label: '⭐ Favorites',
      field: 'enable_favorites',
      type: 'feature' as const,
      enabled: true,
    },
  ];
}

const CONTINUING_STORY_FEATURE_DEF = {
  key: 'continuing_story',
  label: '📜 Continuing Story',
  type: 'coming_soon' as const,
  enabled: false,
};

/** Ensures Continuing Story appears in the button list (non-toggleable); dedupes legacy rows. */
function ensureContinuingStoryFeatureDef(defs: unknown[]) {
  const arr = (Array.isArray(defs) ? defs : []).map((f: any) => ({ ...f }));
  const dupIdxs = arr.map((f: any, i: number) => (f?.key === 'continuing_story' ? i : -1)).filter((i) => i >= 0);
  if (dupIdxs.length > 1) {
    dupIdxs
      .slice(1)
      .sort((a, b) => b - a)
      .forEach((i) => arr.splice(i, 1));
  }
  let idx = arr.findIndex((f: any) => f?.key === 'continuing_story');
  if (idx >= 0) {
    arr[idx] = { ...CONTINUING_STORY_FEATURE_DEF };
    return arr;
  }
  const favIdx = arr.findIndex((f: any) => f?.key === 'favorites');
  if (favIdx >= 0) {
    arr.splice(favIdx + 1, 0, { ...CONTINUING_STORY_FEATURE_DEF });
    return arr;
  }
  const firstLinkIdx = arr.findIndex((f: any) => f?.type === 'custom_link');
  if (firstLinkIdx >= 0) {
    arr.splice(firstLinkIdx, 0, { ...CONTINUING_STORY_FEATURE_DEF });
    return arr;
  }
  arr.push({ ...CONTINUING_STORY_FEATURE_DEF });
  return arr;
}

function normalizePortalFeatureDefs(defs: unknown[]) {
  return ensureContinuingStoryFeatureDef(mergeFavoritesFeatureDef(defs));
}

interface ArtKeyEditorProps {
  artkeyId?: string | null;
}

interface Link {
  label: string;
  url: string;
}

type PortalAccordionId =
  | 'choosePath'
  | 'chooseTemplate'
  | 'selectBackground'
  | 'branding'
  | 'buttonStyle'
  | 'addButtons'
  | 'configureButtons';

type PortalSaveIssue = {
  message: string;
  accordion: PortalAccordionId;
  featureIndex?: number;
};

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
    button_shape?: string;
    button_style?: string;
    header_icon?: string;
    button_border?: string;
  };
  links: Link[];
  spotify: { url: string; autoplay: boolean };
  featured_video: { video_url: string; button_label: string } | null;
  features: {
    enable_gallery: boolean;
    enable_video: boolean;
    show_guestbook: boolean;
    enable_custom_links: boolean;
    enable_spotify: boolean;
    enable_favorites: boolean;
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

function isValidHttpUrl(s: string): boolean {
  const t = (s || '').trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isLikelySpotifyPlaylistUrl(s: string): boolean {
  const t = (s || '').trim().toLowerCase();
  if (t.length < 12) return false;
  return t.includes('spotify.com') || t.includes('open.spotify.com');
}

function isVideoFeatureComplete(data: ArtKeyData): boolean {
  const fv = data.featured_video;
  if (fv?.video_url && String(fv.video_url).trim()) return true;
  if (Array.isArray(data.uploadedVideos) && data.uploadedVideos.length > 0) return true;
  return false;
}

function ArtKeyEditorContent({ artkeyId = null }: ArtKeyEditorProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { addToCart } = useCart();
  const productId = searchParams.get('product_id');
  const fromShop = searchParams.get('from_shop') === 'true' || searchParams.get('from_customize') === 'true';
  const fromStudio = searchParams.get('from_studio') === 'true';
  const productNameParam = searchParams.get('product_name');
  const productSlugParam = searchParams.get('slug');
  const portalToken = searchParams.get('portal_token');
  const ownerTokenParam = searchParams.get('owner_token');
  const fromAdmin = !!portalToken;
  const [isAdmin, setIsAdmin] = useState(false);
  const [studioExport, setStudioExport] = useState<any>(null);
  const [portalLoaded, setPortalLoaded] = useState(false);
  const editorMode = useMemo<'customer' | 'host' | 'demo'>(() => {
    const isDemoRoute = pathname.startsWith('/artkey-editor');
    if (fromAdmin && ownerTokenParam && isDemoRoute) return 'demo';
    if (ownerTokenParam || fromAdmin) return 'host';
    return 'customer';
  }, [fromAdmin, ownerTokenParam, pathname]);
  const modeHeading = {
    customer: 'Build Your ArtKey Portal',
    host: 'Edit Your ArtKey Portal',
    demo: 'ArtKey Demo Builder',
  }[editorMode];

  // Check if user is logged in as admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('admin_token');
      const adminCookie = document.cookie.includes('tae_admin_session');
      setIsAdmin(!!adminToken || adminCookie);
    }
  }, []);

  // Core state
  const [designMode, setDesignMode] = useState<'template' | 'custom' | null>(null);
  const [templatePage, setTemplatePage] = useState(0);
  const [bgColorPage, setBgColorPage] = useState(0);
  const [buttonColorPage, setButtonColorPage] = useState(0);
  const [titleColorPage, setTitleColorPage] = useState(0);
  const [bgTab, setBgTab] = useState('solid');
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('classic');
  const [buttonShape, setButtonShape] = useState<ButtonShape>('pill');
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>('solid');
  const [headerIcon, setHeaderIcon] = useState<ElegantIconKey>('none');
  const [iconCategoryTab, setIconCategoryTab] = useState<'weddings' | 'birthdays' | 'graduations'>('weddings');
  // Default to desktop on PC, mobile on mobile devices
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? 'desktop' : 'mobile';
    }
    return 'desktop';
  });
  const [customLinks, setCustomLinks] = useState<Link[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('https://www.');
  const [customizationData, setCustomizationData] = useState<any>(null);
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [editLinkLabel, setEditLinkLabel] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<{ type: 'button' | 'title' | 'background' | null }>({ type: null });
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [colorAlpha, setColorAlpha] = useState<{ background: number; title: number; button: number }>({
    background: 1,
    title: 1,
    button: 1,
  });
  const [openedGallery, setOpenedGallery] = useState<'images' | 'videos' | null>(null); // Track which gallery is opened

  const [openPortalAccordion, setOpenPortalAccordion] = useState<PortalAccordionId | null>('choosePath');
  const [expandedFeatureIndex, setExpandedFeatureIndex] = useState<number | null>(null);
  const accordionRefChoosePath = useRef<HTMLDivElement>(null);
  const accordionRefChooseTemplate = useRef<HTMLDivElement>(null);
  const accordionRefSelectBackground = useRef<HTMLDivElement>(null);
  const accordionRefBranding = useRef<HTMLDivElement>(null);
  const accordionRefButtonStyle = useRef<HTMLDivElement>(null);
  const accordionRefAddButtons = useRef<HTMLDivElement>(null);
  const accordionRefConfigureButtons = useRef<HTMLDivElement>(null);
  const accordionScrollRefs: Record<PortalAccordionId, React.RefObject<HTMLDivElement | null>> = {
    choosePath: accordionRefChoosePath,
    chooseTemplate: accordionRefChooseTemplate,
    selectBackground: accordionRefSelectBackground,
    branding: accordionRefBranding,
    buttonStyle: accordionRefButtonStyle,
    addButtons: accordionRefAddButtons,
    configureButtons: accordionRefConfigureButtons,
  };

  useEffect(() => {
    if (designMode === null) {
      setOpenPortalAccordion('choosePath');
      setExpandedFeatureIndex(null);
    }
  }, [designMode]);

  // QR Code & Skeleton Key state (only for cards/invitations/postcards)
  const [productInfo, setProductInfo] = useState<any>(null);
  const [skeletonKey, setSkeletonKey] = useState<string>('template-1');
  const [qrPosition, setQrPosition] = useState<string>('bottom-right');

  // Save state: prevent duplicate saves and show result modal
  const [isSaving, setIsSaving] = useState(false);
  const [savedPortalToken, setSavedPortalToken] = useState<string | null>(null);
  const [saveModal, setSaveModal] = useState<{ show: boolean; url: string; message: string } | null>(null);
  const [videoUploadStatus, setVideoUploadStatus] = useState<{
    state: 'idle' | 'uploading' | 'complete' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });
  const [imageUploadStatus, setImageUploadStatus] = useState<{
    state: 'idle' | 'uploading' | 'complete' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });

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
      button_shape: 'pill',
      button_style: 'solid',
      header_icon: 'none',
      button_border: '',
    },
    links: [],
    spotify: { url: 'https://', autoplay: false },
    featured_video: null,
    features: {
      enable_gallery: false,
      enable_video: false,
      show_guestbook: false,
      allow_img_uploads: false,
      allow_vid_uploads: false,
      gb_btn_view: true,
      gb_signing_status: 'open',
      gb_signing_start: '',
      gb_signing_end: '',
      gb_require_approval: true,
      img_require_approval: true,
      vid_require_approval: true,
      enable_custom_links: false,
      enable_spotify: false,
      enable_favorites: false,
      order: ['gallery', 'guestbook', 'video'],
    },
    uploadedImages: [],
    uploadedVideos: [],
    customizations: {},
  });

  // Load customization data if coming from design editor (legacy)
  useEffect(() => {
    if (fromShop && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('productCustomization');
      if (stored) setCustomizationData(JSON.parse(stored));
    }
  }, [fromShop]);

  // Load studio export data if coming from the Customization Studio
  useEffect(() => {
    if (fromStudio && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('tae-studio-export');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setStudioExport(parsed);
          // Set productInfo based on studio export
          if (parsed.productSpec) {
            setProductInfo({
              requiresQR: parsed.productSpec.requiresQrCode,
              requiresSkeletonKey: parsed.productSpec.requiresQrCode,
              productName: parsed.productSpec.name,
              basePrice: parsed.productSpec.basePrice || 0,
            });
          }
        } catch (e) {
          console.error('[ARTKEY EDITOR] Failed to parse studio export:', e);
        }
      }
    }
  }, [fromStudio]);

  // Load existing ArtKey if provided
  useEffect(() => {
    if (artkeyId) loadArtKey(artkeyId);
  }, [artkeyId]);

  // Keep local style/icon controls synced with loaded portal/theme data
  useEffect(() => {
    const shape = artKeyData.theme.button_shape as ButtonShape | undefined;
    const style = artKeyData.theme.button_style as ButtonStyle | undefined;
    const icon = artKeyData.theme.header_icon;

    if (shape && BUTTON_SHAPES.some((s) => s.id === shape)) {
      setButtonShape(shape);
    }
    if (style && BUTTON_STYLES.some((s) => s.id === style)) {
      setButtonStyle(style);
    }
    if (typeof icon === 'string' && isElegantIconKey(icon)) {
      setHeaderIcon(icon);
    } else {
      setHeaderIcon('none');
    }
  }, [artKeyData.theme.button_shape, artKeyData.theme.button_style, artKeyData.theme.header_icon]);

  // Load portal data when coming from admin demo builder
  useEffect(() => {
    if (!portalToken || portalLoaded) return;
    
    fetch(`/api/portal/${portalToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const d = data.data;
          const theme = typeof d.theme === 'string' ? JSON.parse(d.theme) : (d.theme || {});
          const features = typeof d.features === 'string' ? JSON.parse(d.features) : (d.features || {});
          const links = typeof d.links === 'string' ? JSON.parse(d.links) : (d.links || []);
          const spotify = typeof d.spotify === 'string' ? JSON.parse(d.spotify) : (d.spotify || { url: '', autoplay: false });
          const featuredVideo = typeof d.featuredVideo === 'string' ? JSON.parse(d.featuredVideo) : d.featuredVideo;
          const customizations = typeof d.customizations === 'string' ? JSON.parse(d.customizations) : (d.customizations || {});
          const uploadedImages = typeof d.uploadedImages === 'string' ? JSON.parse(d.uploadedImages) : (d.uploadedImages || []);
          const uploadedVideos = typeof d.uploadedVideos === 'string' ? JSON.parse(d.uploadedVideos) : (d.uploadedVideos || []);

          const legacyFavoritesActive =
            Array.isArray(customizations?.favorites) &&
            customizations.favorites.some((item: any) => normalizeFavoriteBodyFromRaw(item) !== null);

          setArtKeyData(prev => ({
            ...prev,
            title: d.title || prev.title,
            theme: { ...prev.theme, ...theme },
            features: {
              ...prev.features,
              ...features,
              ...(!('enable_favorites' in features) && legacyFavoritesActive
                ? { enable_favorites: true }
                : {}),
            },
            links: links,
            spotify: spotify,
            featured_video: featuredVideo,
            customizations: { ...prev.customizations, ...customizations },
            uploadedImages: uploadedImages,
            uploadedVideos: uploadedVideos,
          }));
          if (links.length > 0) setCustomLinks(links);
          if (Array.isArray(customizations?.featureDefs) && customizations.featureDefs.length > 0) {
            setFeatureDefs(
              normalizePortalFeatureDefs(
                customizations.featureDefs.map((f: any) => ({ ...f, enabled: f?.enabled !== false }))
              )
            );
          } else {
            const baseFeatures = defaultFeatureDefsWithFeaturesOn();
            const linkFeatures = links.map((link: Link, idx: number) => ({
              key: `custom_link_${idx}_${Date.now()}`,
              label: link.label,
              field: `custom_link_${idx}`,
              type: 'custom_link' as const,
              linkData: link,
              enabled: true,
            }));
            setFeatureDefs(normalizePortalFeatureDefs([...baseFeatures, ...linkFeatures]));
          }
          setPortalLoaded(true);
        }
      })
      .catch(err => console.error('[ARTKEY EDITOR] Failed to load portal:', err));
  }, [portalToken, portalLoaded]);

  const loadArtKey = async (id: string) => {
    try {
      // Try localStorage first (for demo mode)
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`artkey_${id}`);
        if (stored) {
          const savedData = JSON.parse(stored);
          console.log('[ARTKEY EDITOR] Loaded from localStorage:', id);
          const feats = savedData.features || {};
          const favLegacy =
            Array.isArray(savedData.customizations?.favorites) &&
            savedData.customizations.favorites.some((item: any) => normalizeFavoriteBodyFromRaw(item) !== null);
          setArtKeyData({
            ...savedData,
            features: {
              ...feats,
              ...(!('enable_favorites' in feats) ? { enable_favorites: !!favLegacy } : {}),
            },
          });
          setCustomLinks(savedData.links || []);
          if (savedData.featureDefs) {
            setFeatureDefs(
              normalizePortalFeatureDefs(
                savedData.featureDefs.map((f: any) => ({ ...f, enabled: f?.enabled !== false }))
              )
            );
          } else {
            // Rebuild featureDefs from customLinks if not saved
            const baseFeatures = defaultFeatureDefsWithFeaturesOn();
            const linkFeatures = (savedData.links || []).map((link: Link, idx: number) => ({
              key: `custom_link_${idx}_${Date.now()}`,
              label: link.label,
              field: `custom_link_${idx}`,
              type: 'custom_link' as const,
              linkData: link,
              enabled: true,
            }));
            setFeatureDefs(normalizePortalFeatureDefs([...baseFeatures, ...linkFeatures]));
          }
          if (savedData.customizations?.skeleton_key) {
            setSkeletonKey(savedData.customizations.skeleton_key);
          }
          if (savedData.customizations?.qr_position) {
            setQrPosition(savedData.customizations.qr_position);
          }
          return;
        }
      }
      
      // Fallback to API (won't work without WordPress, but that's OK)
      const res = await fetch(`/api/artkey/get/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.data) {
        const raw = data.data;
        const fd = raw.features || {};
        const apiCustomizations = raw.customizations || {};
        const favLegacy =
          Array.isArray(apiCustomizations?.favorites) &&
          apiCustomizations.favorites.some((item: any) => normalizeFavoriteBodyFromRaw(item) !== null);
        setArtKeyData({
          ...raw,
          features: {
            ...fd,
            ...(!('enable_favorites' in fd) && favLegacy ? { enable_favorites: true } : {}),
          },
        });
        setCustomLinks(raw.links || []);
        if (Array.isArray(apiCustomizations?.featureDefs) && apiCustomizations.featureDefs.length > 0) {
          setFeatureDefs(
            normalizePortalFeatureDefs(
              apiCustomizations.featureDefs.map((f: any) => ({ ...f, enabled: f?.enabled !== false }))
            )
          );
        } else {
          // Rebuild featureDefs from customLinks
          const baseFeatures = defaultFeatureDefsWithFeaturesOn();
          const linkFeatures = (raw.links || []).map((link: Link, idx: number) => ({
            key: `custom_link_${idx}_${Date.now()}`,
            label: link.label,
            field: `custom_link_${idx}`,
            type: 'custom_link' as const,
            linkData: link,
            enabled: true,
          }));
          setFeatureDefs(normalizePortalFeatureDefs([...baseFeatures, ...linkFeatures]));
        }
        if (raw.customizations?.skeleton_key) {
          setSkeletonKey(raw.customizations.skeleton_key);
        }
        if (raw.customizations?.qr_position) {
          setQrPosition(raw.customizations.qr_position);
        }
      }
    } catch (e) {
      console.error('Failed to load ArtKey', e);
    }
  };

  // Templates - now using categorized system
  const templatesPerPage = 8;

  // Colors - Primary colors only for solid, gradients separate
  const buttonColors = useMemo(() => ([
    // Page 1: Primary solid colors (12 colors)
    { bg: '#ffffff', color: '#ffffff', label: 'White', type: 'solid' },
    { bg: '#000000', color: '#000000', label: 'Black', type: 'solid' },
    { bg: '#ef4444', color: '#ef4444', label: 'Red', type: 'solid' },
    { bg: '#f97316', color: '#f97316', label: 'Orange', type: 'solid' },
    { bg: '#fde047', color: '#fde047', label: 'Yellow', type: 'solid' },
    { bg: '#10b981', color: '#10b981', label: 'Green', type: 'solid' },
    { bg: '#3b82f6', color: '#3b82f6', label: 'Blue', type: 'solid' },
    { bg: '#8b5cf6', color: '#8b5cf6', label: 'Purple', type: 'solid' },
    { bg: '#ec4899', color: '#ec4899', label: 'Pink', type: 'solid' },
    { bg: '#64748b', color: '#64748b', label: 'Gray', type: 'solid' },
    { bg: '#f59e0b', color: '#f59e0b', label: 'Amber', type: 'solid' },
    { bg: '#06b6d4', color: '#06b6d4', label: 'Cyan', type: 'solid' },
    // Page 2: Additional solid colors (12 colors)
    { bg: '#dc2626', color: '#dc2626', label: 'Dark Red', type: 'solid' },
    { bg: '#ea580c', color: '#ea580c', label: 'Dark Orange', type: 'solid' },
    { bg: '#ca8a04', color: '#ca8a04', label: 'Dark Yellow', type: 'solid' },
    { bg: '#059669', color: '#059669', label: 'Dark Green', type: 'solid' },
    { bg: '#2563eb', color: '#2563eb', label: 'Dark Blue', type: 'solid' },
    { bg: '#7c3aed', color: '#7c3aed', label: 'Dark Purple', type: 'solid' },
    { bg: '#db2777', color: '#db2777', label: 'Dark Pink', type: 'solid' },
    { bg: '#475569', color: '#475569', label: 'Dark Gray', type: 'solid' },
    { bg: '#d97706', color: '#d97706', label: 'Dark Amber', type: 'solid' },
    { bg: '#0891b2', color: '#0891b2', label: 'Dark Cyan', type: 'solid' },
    { bg: '#991b1b', color: '#991b1b', label: 'Maroon', type: 'solid' },
    // Page 3: Gradients (12 colors)
    { bg: 'linear-gradient(135deg,#ffecd2,#fcb69f)', color: 'gradient', label: 'Peachy', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#ff9a9e,#fecfef)', color: 'gradient', label: 'Pink Blush', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#a8edea,#fed6e3)', color: 'gradient', label: 'Cotton Candy', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#4facfe,#00f2fe)', color: 'gradient', label: 'Electric Blue', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#ff6b6b,#feca57)', color: 'gradient', label: 'Fire Glow', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#434343,#666666)', color: 'gradient', label: 'Steel Gray', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'gradient', label: 'Purple Dream', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#f093fb,#f5576c)', color: 'gradient', label: 'Rose Gold', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#4facfe,#00f2fe)', color: 'gradient', label: 'Ocean Breeze', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#43e97b,#38f9d7)', color: 'gradient', label: 'Mint Fresh', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#fa709a,#fee140)', color: 'gradient', label: 'Sunset', type: 'gradient' },
    { bg: 'linear-gradient(135deg,#30cfd0,#330867)', color: 'gradient', label: 'Deep Space', type: 'gradient' },
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
    { key: 'spotify', label: '🎵 Playlist (Spotify)', field: 'enable_spotify', type: 'feature', enabled: true },
    { key: 'gallery', label: '📸 Image Gallery', field: 'enable_gallery', type: 'feature', enabled: true },
    { key: 'guestbook', label: '📖 Guestbook', field: 'show_guestbook', type: 'feature', enabled: true },
    { key: 'video', label: '🎥 Featured Video · Video Gallery', field: 'enable_video', type: 'feature', enabled: true },
    { key: 'favorites', label: '⭐ Favorites', field: 'enable_favorites', type: 'feature', enabled: true },
    { ...CONTINUING_STORY_FEATURE_DEF },
  ];
  const defaultFeatureDefsWithFeaturesOn = () =>
    featureDefsDefault.map((f) =>
      f.type === 'coming_soon' ? { ...f, enabled: false } : { ...f, enabled: true }
    );
  const [featureDefs, setFeatureDefs] = useState<
    Array<
      (typeof featureDefsDefault)[0] & {
        type?: 'feature' | 'custom_link' | 'coming_soon';
        linkData?: Link;
      }
    >
  >(() => normalizePortalFeatureDefs(featureDefsDefault));
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
  const [editFeatureLabel, setEditFeatureLabel] = useState('');
  const [draggedFeature, setDraggedFeature] = useState<number | null>(null);
  const [draggedLink, setDraggedLink] = useState<number | null>(null);

  const getIconEventGroup = (category: string): 'weddings' | 'birthdays' | 'graduations' => {
    if (category === 'graduation') return 'graduations';
    if (category === 'celebration') return 'birthdays';
    // wedding/love/botanical/formal/luxury all grouped as weddings for now
    return 'weddings';
  };
  const hiddenWeddingIconKeys = new Set(['wreath', 'monogram', 'dove', 'crown']);

  // Helpers
  const handleTemplateSelect = (tpl: ArtKeyTemplate) => {
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
        button_shape: tpl.buttonShape || 'pill',
        button_style: tpl.buttonStyle || 'solid',
        header_icon: tpl.headerIcon || 'none',
        button_border: tpl.buttonBorder || tpl.button,
        font: tpl.titleFont || prev.theme.font,
      },
    }));
    if (tpl.buttonShape) setButtonShape(tpl.buttonShape);
    if (tpl.buttonStyle) setButtonStyle(tpl.buttonStyle);
    setHeaderIcon(tpl.headerIcon || 'none');
    setOpenPortalAccordion('configureButtons');
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

  const pushRecentColor = (value: string) => {
    setRecentColors((prev) => [value, ...prev.filter((c) => c !== value)].slice(0, 10));
  };

  const getColorTargetValue = (target: 'button' | 'title' | 'background') => {
    if (target === 'button') return artKeyData.theme.button_color || '#4f46e5';
    if (target === 'title') return artKeyData.theme.title_color || '#4f46e5';
    return artKeyData.theme.bg_color || '#F6F7FB';
  };

  const handleAdvancedColorChange = (
    target: 'button' | 'title' | 'background',
    value: string,
    alpha: number
  ) => {
    setColorAlpha((prev) => ({ ...prev, [target]: alpha }));
    pushRecentColor(value);
    if (target === 'button') {
      setArtKeyData((prev) => ({ ...prev, theme: { ...prev.theme, button_color: value, button_gradient: '' } }));
      return;
    }
    if (target === 'title') {
      setArtKeyData((prev) => ({ ...prev, theme: { ...prev.theme, title_color: value } }));
      return;
    }
    setArtKeyData((prev) => ({ ...prev, theme: { ...prev.theme, bg_color: value, bg_image_url: '' } }));
  };

  const resolveUploadAuth = () => {
    const publicToken = (portalToken || savedPortalToken || artkeyId || '').trim();
    if (!publicToken) return { publicToken: '', ownerToken: '' };
    const sessionOwnerToken =
      typeof window !== 'undefined'
        ? sessionStorage.getItem(`portal_owner_${publicToken}`) || ''
        : '';
    return {
      publicToken,
      ownerToken: (ownerTokenParam || sessionOwnerToken || '').trim(),
    };
  };

  const notifyUploadError = (message: string) => {
    setSaveModal({ show: true, url: '', message });
  };

  const buildPortalDataForPersistence = () => {
    const favoritesRaw = Array.isArray(artKeyData.customizations?.favorites)
      ? artKeyData.customizations.favorites
      : [];
    const favoritesSanitized = favoritesRaw
      .map((item: any, index: number) => {
        const body = normalizeFavoriteBodyFromRaw(item);
        if (!body) return null;
        let id = String(item?.id || '').trim();
        if (!id && typeof crypto !== 'undefined' && crypto.randomUUID) id = crypto.randomUUID();
        if (!id) {
          id = `fav-${index}-${(body.linkUrl || body.title || body.thumbnailUrl || body.description || 'x').slice(0, 48)}`;
        }
        const out: Record<string, any> = { id };
        if (body.title) out.title = body.title;
        if (body.description) out.description = body.description;
        if (body.linkUrl) out.linkUrl = body.linkUrl;
        if (body.thumbnailUrl) out.thumbnailUrl = body.thumbnailUrl;
        return out;
      })
      .filter(Boolean)
      .slice(0, MAX_PORTAL_FAVORITES);

    const featureDefsForSave = featureDefs.map((f) => ({
      ...f,
      enabled: f.type === 'coming_soon' ? false : (f as any).enabled !== false,
    }));

    const customizations = {
      ...artKeyData.customizations,
      favorites: favoritesSanitized,
      ...(productInfo?.requiresQR || productInfo?.requiresSkeletonKey
        ? {
            skeleton_key: skeletonKey,
            qr_position: qrPosition,
          }
        : {}),
      featureDefs: featureDefsForSave,
    };

    const customLinkEntries = featureDefs.filter(
      (f) => f.type === 'custom_link' && (f as any).enabled && f.linkData
    );
    const rebuiltCustomLinks = customLinkEntries.map((f) => f.linkData!);

    const resolvedPortalToken = (
      portalToken ||
      savedPortalToken ||
      (artKeyData as any)?.portal_token ||
      ''
    ).trim();

    const nextFeatures =
      rebuiltCustomLinks.length > 0
        ? { ...artKeyData.features, enable_custom_links: true }
        : artKeyData.features;

    const dataToSave = {
      ...artKeyData,
      features: nextFeatures,
      links: rebuiltCustomLinks.length > 0 ? rebuiltCustomLinks : customLinks,
      customizations,
      featureDefs: featureDefsForSave,
      token: artkeyId,
    };

    return { resolvedPortalToken, dataToSave };
  };

  const buildPortalPayloadFromData = (data: Record<string, any>) => ({
    title: data.title,
    theme: data.theme,
    features: data.features,
    links: data.links || customLinks,
    spotify: data.spotify,
    featuredVideo: data.featured_video,
    customizations: data.customizations,
    uploadedImages: data.uploadedImages || [],
    uploadedVideos: data.uploadedVideos || [],
  });

  const ensurePortalUploadAuth = async () => {
    const existing = resolveUploadAuth();
    if (existing.publicToken) return existing;

    const { resolvedPortalToken, dataToSave } = buildPortalDataForPersistence();

    const savePayload = {
      data: { ...dataToSave, token: resolvedPortalToken || undefined },
      product_id: productId,
    };

    const res = await fetch('/api/artkey/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savePayload),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok || !result?.token) {
      notifyUploadError(result?.error || result?.message || 'Unable to create the portal before upload.');
      return null;
    }

    setSavedPortalToken(result.token);

    if (typeof window !== 'undefined' && result.owner_token) {
      try {
        sessionStorage.setItem(`portal_owner_${result.token}`, result.owner_token);
      } catch {}
    }

    return {
      publicToken: String(result.token),
      ownerToken: String(result.owner_token || '').trim(),
    };
  };

  const syncPortalAfterUpload = async (
    auth: { publicToken: string; ownerToken: string },
    overrides: Record<string, any>
  ) => {
    const { dataToSave } = buildPortalDataForPersistence();

    const merged = {
      ...dataToSave,
      ...overrides,
      theme: overrides.theme || dataToSave.theme,
      customizations: overrides.customizations || dataToSave.customizations,
      uploadedImages: overrides.uploadedImages || dataToSave.uploadedImages || [],
      uploadedVideos: overrides.uploadedVideos || dataToSave.uploadedVideos || [],
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth.ownerToken) {
      headers['X-Owner-Token'] = auth.ownerToken;
    }

    const portalRes = await fetch(`/api/portal/${auth.publicToken}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(buildPortalPayloadFromData(merged)),
    });

    const portalData = await portalRes.json().catch(() => ({}));
    if (!portalRes.ok || !portalData?.success) {
      throw new Error(portalData?.error || 'Failed to sync upload to portal.');
    }
  };

  const uploadPortalAssetFile = async (
    auth: { publicToken: string; ownerToken: string },
    file: File
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('publicToken', auth.publicToken);
    if (auth.ownerToken) formData.append('ownerToken', auth.ownerToken);

    const res = await fetch('/api/artkey/upload', { method: 'POST', body: formData });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result?.error || 'Upload failed');
    }

    const url = result.url || result.fileUrl;
    if (!url) {
      throw new Error('Upload returned no file URL');
    }

    return url;
  };

  const generateThumbnailFromVideoUrl = async (videoUrl: string, sourceName = 'video') => {
    if (typeof document === 'undefined') {
      throw new Error('Document not available for thumbnail generation.');
    }

    return await new Promise<File>((resolve, reject) => {
      const video = document.createElement('video');
      let settled = false;

      const done = (fn: (value: any) => void, value: any) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn(value);
      };

      const cleanup = () => {
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.onloadedmetadata = null;
        video.onloadeddata = null;
        video.onseeked = null;
        video.onerror = null;
      };

      const captureFrame = () => {
        try {
          const width = video.videoWidth || 0;
          const height = video.videoHeight || 0;
          if (!width || !height) {
            return done(reject, new Error('Uploaded video did not expose frame dimensions.'));
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return done(reject, new Error('Could not create thumbnail canvas context.'));
          }

          ctx.drawImage(video, 0, 0, width, height);

          const baseName = String(sourceName || 'video')
            .replace(/\.[^.]+$/, '')
            .replace(/[^a-z0-9_-]+/gi, '-')
            .replace(/^-+|-+$/g, '') || 'video-thumbnail';

          canvas.toBlob((blob) => {
            if (!blob) {
              return done(reject, new Error('Could not encode video thumbnail image.'));
            }

            done(
              resolve,
              new File([blob], `${baseName}-thumbnail.jpg`, {
                type: 'image/jpeg',
              })
            );
          }, 'image/jpeg', 0.85);
        } catch (err: any) {
          done(reject, err instanceof Error ? err : new Error('Thumbnail capture failed.'));
        }
      };

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      video.onerror = () => {
        done(reject, new Error('Could not load uploaded video to generate thumbnail.'));
      };

      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const targetTime = duration > 1 ? Math.min(1, Math.max(0.1, duration * 0.25)) : 0;

        if (targetTime > 0) {
          try {
            video.currentTime = targetTime;
            return;
          } catch {}
        }

        if (video.readyState >= 2) {
          captureFrame();
        }
      };

      video.onloadeddata = () => {
        if (video.currentTime === 0) {
          captureFrame();
        }
      };

      video.onseeked = () => {
        captureFrame();
      };

      video.src = videoUrl;
      video.load();
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const auth = await ensurePortalUploadAuth();
    if (!auth?.publicToken) return;

    setImageUploadStatus({
      state: 'uploading',
      message: `Uploading ${files.length} image${files.length > 1 ? 's' : ''}...`,
    });

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('publicToken', auth.publicToken);
      if (auth.ownerToken) formData.append('ownerToken', auth.ownerToken);

      try {
        const res = await fetch('/api/artkey/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const result = await res.json();
          if (result?.url) uploadedUrls.push(result.url);
        } else {
          const err = await res.json().catch(() => ({}));
          setImageUploadStatus({ state: 'error', message: err?.error || 'Image upload failed' });
          notifyUploadError(err?.error || 'Image upload failed');
        }
      } catch (err) {
        setImageUploadStatus({ state: 'error', message: 'Image upload failed' });
        notifyUploadError('Image upload failed');
      }
    }

    if (uploadedUrls.length > 0) {
      const nextUploadedImages = [...(artKeyData.uploadedImages || []), ...uploadedUrls];
      setArtKeyData((prev) => ({ ...prev, uploadedImages: nextUploadedImages }));
      try {
        await syncPortalAfterUpload(auth, { uploadedImages: nextUploadedImages });
        setImageUploadStatus({
          state: 'complete',
          message: `${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} uploaded and saved.`,
        });
      } catch (err: any) {
        setImageUploadStatus({
          state: 'error',
          message: err?.message || 'Image upload saved locally but failed to sync the portal.',
        });
        notifyUploadError(err?.message || 'Image upload saved locally but failed to sync the portal.');
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selectedFiles = Array.from(files);
    if (selectedFiles.length === 0) return;

    const auth = await ensurePortalUploadAuth();
    if (!auth?.publicToken) return;

    setVideoUploadStatus({
      state: 'uploading',
      message: `Uploading ${selectedFiles.length} video${selectedFiles.length > 1 ? 's' : ''}...`,
    });

    let nextUploadedVideos = [...(artKeyData.uploadedVideos || [])];
    const failures: string[] = [];
    let successCount = 0;

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('publicToken', auth.publicToken);
      if (auth.ownerToken) formData.append('ownerToken', auth.ownerToken);

      try {
        const res = await fetch('/api/artkey/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          failures.push(`${file.name}: ${err?.error || 'Video upload failed'}`);
          continue;
        }

        const result = await res.json();
        const videoUrl = result.url || result.fileUrl;
        if (!videoUrl) {
          failures.push(`${file.name}: upload returned no file URL`);
          continue;
        }

        let uploadedVideoEntry: any = { url: videoUrl };

        try {
          const generatedThumbFile = await generateThumbnailFromVideoUrl(videoUrl, file.name);
          const generatedThumbUrl = await uploadPortalAssetFile(auth, generatedThumbFile);
          if (generatedThumbUrl) {
            uploadedVideoEntry = { ...uploadedVideoEntry, thumbnailUrl: generatedThumbUrl };
          }
        } catch (thumbErr) {
          console.warn('Auto video thumbnail generation failed:', thumbErr);
        }

        nextUploadedVideos = [...nextUploadedVideos, uploadedVideoEntry];
        setArtKeyData((prev) => ({ ...prev, uploadedVideos: nextUploadedVideos }));

        try {
          await syncPortalAfterUpload(auth, { uploadedVideos: nextUploadedVideos });
          successCount += 1;
        } catch (syncErr: any) {
          failures.push(`${file.name}: ${syncErr?.message || 'Uploaded file could not be synced to the portal'}`);
        }
      } catch (err: any) {
        failures.push(`${file.name}: ${err?.message || 'Video upload failed'}`);
      }
    }

    if (successCount > 0 && failures.length === 0) {
      setVideoUploadStatus({
        state: 'complete',
        message: `${successCount} video${successCount > 1 ? 's' : ''} uploaded.`,
      });
    } else if (successCount > 0) {
      setVideoUploadStatus({
        state: 'error',
        message: `${successCount} video${successCount > 1 ? 's' : ''} uploaded, but ${failures.length} failed.`,
      });
      notifyUploadError(failures.slice(0, 3).join('\n'));
    } else {
      setVideoUploadStatus({
        state: 'error',
        message: failures[0] || 'Video upload failed',
      });
      notifyUploadError(failures.slice(0, 3).join('\n') || 'Video upload failed');
    }

    e.target.value = '';
  };

  const handleSetFeaturedVideo = (videoUrl: string, isFeatured: boolean) => {
    if (isFeatured) {
      // Set this video as featured (only one can be featured)
      setArtKeyData((prev) => ({
        ...prev,
        featured_video: {
          video_url: videoUrl,
          button_label: prev.featured_video?.button_label || 'Watch Video',
        },
      }));
    } else {
      // Remove featured status
      setArtKeyData((prev) => ({
        ...prev,
        featured_video: null,
      }));
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const auth = await ensurePortalUploadAuth();
    if (!auth?.publicToken) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('publicToken', auth.publicToken);
    if (auth.ownerToken) formData.append('ownerToken', auth.ownerToken);

    try {
      const res = await fetch('/api/artkey/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const result = await res.json();
        const nextTheme = {
          ...artKeyData.theme,
          bg_image_url: result.url,
          bg_image_id: result.id || 0,
        };
        setArtKeyData((prev) => ({ ...prev, theme: nextTheme }));
        await syncPortalAfterUpload(auth, { theme: nextTheme });
      } else {
        const err = await res.json().catch(() => ({}));
        notifyUploadError(err?.error || 'Background upload failed');
      }
    } catch (err: any) {
      notifyUploadError(err?.message || 'Background upload failed');
    }
  };

  const getFavoritesFromState = () => {
    const raw = artKeyData.customizations?.favorites;
    return Array.isArray(raw) ? raw : [];
  };

  const updatePortalFavorites = (next: any[]) => {
    const capped = next.slice(0, MAX_PORTAL_FAVORITES);
    setArtKeyData((prev) => ({
      ...prev,
      customizations: { ...prev.customizations, favorites: capped },
    }));
  };

  const handleFavoriteImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.[0]) return;

    const auth = await ensurePortalUploadAuth();
    if (!auth?.publicToken) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('publicToken', auth.publicToken);
    if (auth.ownerToken) formData.append('ownerToken', auth.ownerToken);

    try {
      const res = await fetch('/api/artkey/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const result = await res.json();
        const url = result.url || result.fileUrl;
        const list = [...getFavoritesFromState()];
        const cur = { ...(list[index] || {}) };
        cur.thumbnailUrl = url;
        list[index] = cur;
        updatePortalFavorites(list);
        await syncPortalAfterUpload(auth, {
          customizations: { ...artKeyData.customizations, favorites: list },
        });
      } else {
        const err = await res.json().catch(() => ({}));
        notifyUploadError(err?.error || 'Favorite image upload failed');
      }
    } catch (err: any) {
      notifyUploadError(err?.message || 'Favorite image upload failed');
    }
    e.target.value = '';
  };

  const handleSave = async (redirectToShop = false) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const artKeyDomain = (process.env.NEXT_PUBLIC_ARTKEY_DOMAIN || 'artkey.theartfulexperience.com').replace(/^https?:\/\//, '');
      const buildArtKeyPortalUrl = (publicToken: string) => `https://${artKeyDomain}/${publicToken}`;
      // QR placement is handled in the Customization Studio canvas, not here

      const favoritesRaw = Array.isArray(artKeyData.customizations?.favorites)
        ? artKeyData.customizations.favorites
        : [];
      const favoritesSanitized = favoritesRaw
        .map((item: any, index: number) => {
          const body = normalizeFavoriteBodyFromRaw(item);
          if (!body) return null;
          let id = String(item?.id || '').trim();
          if (!id && typeof crypto !== 'undefined' && crypto.randomUUID) id = crypto.randomUUID();
          if (!id) {
            id = `fav-${index}-${(body.linkUrl || body.title || body.thumbnailUrl || body.description || 'x').slice(0, 48)}`;
          }
          const out: Record<string, any> = { id };
          if (body.title) out.title = body.title;
          if (body.description) out.description = body.description;
          if (body.linkUrl) out.linkUrl = body.linkUrl;
          if (body.thumbnailUrl) out.thumbnailUrl = body.thumbnailUrl;
          return out;
        })
        .filter(Boolean)
        .slice(0, MAX_PORTAL_FAVORITES);

      const featureDefsForSave = featureDefs.map((f) => ({
        ...f,
        enabled: f.type === 'coming_soon' ? false : (f as any).enabled !== false,
      }));

      // Include skeleton key and QR position in customizations if product requires QR
      const customizations = {
        ...artKeyData.customizations,
        favorites: favoritesSanitized,
        ...(productInfo?.requiresQR || productInfo?.requiresSkeletonKey ? {
          skeleton_key: skeletonKey,
          qr_position: qrPosition,
        } : {}),
        featureDefs: featureDefsForSave,
      };

      // Rebuild customLinks from enabled featureDefs custom_link entries
      const customLinkEntries = featureDefs.filter(f => f.type === 'custom_link' && (f as any).enabled && f.linkData);
      const rebuiltCustomLinks = customLinkEntries.map(f => f.linkData!);
      // Also keep enable_custom_links in sync
      if (rebuiltCustomLinks.length > 0) {
        artKeyData.features.enable_custom_links = true;
      }
      
      const resolvedPortalToken = (
        portalToken ||
        savedPortalToken ||
        (artKeyData as any)?.portal_token ||
        ''
      ).trim();

      const dataToSave = {
        ...artKeyData,
        links: rebuiltCustomLinks.length > 0 ? rebuiltCustomLinks : customLinks,
        customizations,
        featureDefs: featureDefsForSave,
        token: artkeyId,
      };

      // Save to localStorage for immediate persistence (demo mode)
      if (typeof window !== 'undefined' && artkeyId) {
        localStorage.setItem(`artkey_${artkeyId}`, JSON.stringify({
          ...dataToSave,
          savedAt: new Date().toISOString(),
        }));
        console.log('[ARTKEY EDITOR] Saved to localStorage:', artkeyId);
      }

      // If coming from admin demo builder, save directly to portal API
      if (fromAdmin && resolvedPortalToken && ownerTokenParam) {
        const portalPayload = {
          title: artKeyData.title,
          theme: artKeyData.theme,
          features: artKeyData.features,
          links: dataToSave.links || customLinks,
          spotify: artKeyData.spotify,
          featuredVideo: artKeyData.featured_video,
          customizations,
          uploadedImages: artKeyData.uploadedImages,
          uploadedVideos: artKeyData.uploadedVideos,
        };
        const portalRes = await fetch(`/api/portal/${resolvedPortalToken}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Owner-Token': ownerTokenParam,
          },
          body: JSON.stringify(portalPayload),
        });
        const portalData = await portalRes.json();
        if (portalData.success) {
          const portalUrl = buildArtKeyPortalUrl(resolvedPortalToken);
          if (redirectToShop) {
            router.push('/b_d_admn_tae/artkey-demos');
          } else {
            setSaveModal({ show: true, url: portalUrl, message: 'ArtKey Portal saved successfully!' });
          }
        } else {
          setSaveModal({ show: true, url: '', message: portalData.error || 'Failed to save portal' });
        }
        return;
      }

      // For existing portals, always use protected portal update API.
      if (resolvedPortalToken) {
        const sessionOwnerToken =
          typeof window !== 'undefined'
            ? sessionStorage.getItem(`portal_owner_${resolvedPortalToken}`) || ''
            : '';
        const effectiveOwnerToken = (ownerTokenParam || sessionOwnerToken || '').trim();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (effectiveOwnerToken) {
          headers['X-Owner-Token'] = effectiveOwnerToken;
        }

        const portalPayload = {
          title: artKeyData.title,
          theme: artKeyData.theme,
          features: artKeyData.features,
          links: dataToSave.links || customLinks,
          spotify: artKeyData.spotify,
          featuredVideo: artKeyData.featured_video,
          customizations,
          uploadedImages: artKeyData.uploadedImages,
          uploadedVideos: artKeyData.uploadedVideos,
        };

        const portalRes = await fetch(`/api/portal/${resolvedPortalToken}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(portalPayload),
        });
        const portalData = await portalRes.json().catch(() => ({}));
        if (!portalRes.ok || !portalData.success) {
          setSaveModal({
            show: true,
            url: '',
            message: portalData?.error || 'Failed to save portal. Re-open your owner edit link and try again.',
          });
          return;
        }

        const portalUrl = buildArtKeyPortalUrl(resolvedPortalToken);

        if (redirectToShop && fromStudio && studioExport?.productSpec) {
          const spec = studioExport.productSpec;
          const frontDesign = studioExport.designFiles?.find((f: any) => f.placement === 'front');
          const cartItem: Record<string, any> = {
            id: `${spec.id}-${artkeyId || Date.now()}`,
            name: spec.name || productNameParam || 'Custom Product',
            price: spec.basePrice || 0,
            quantity: 1,
            imageUrl: frontDesign?.dataUrl,
            source: 'shop' as const,
            assignmentId: spec.assignmentId || undefined,
            productSlug: spec.productSlug || productSlugParam,
            printfulProductId: spec.printfulProductId,
            printfulVariantId: spec.printfulVariantId,
            designFiles: studioExport.designFiles,
            studioRenderSignature: studioExport.studioRenderSignature,
            requiresQrCode: spec.requiresQrCode,
            artKeyData: {
              ...artKeyData,
              links: customLinks,
              customizations: {
                ...artKeyData.customizations,
                skeleton_key: skeletonKey,
                qr_position: qrPosition,
              },
            },
          };
          if (studioExport.artKeyTemplatePosition) {
            cartItem.artKeyTemplatePosition = studioExport.artKeyTemplatePosition;
          }
          addToCart(cartItem);
          sessionStorage.removeItem('tae-studio-export');
          router.push('/cart');
          return;
        }

        if (redirectToShop && customizationData && productId) {
          const cartItem = {
            id: `${productId}-${artkeyId || Date.now()}`,
            name: customizationData.productName || 'Custom Product',
            price: customizationData.totalPrice || customizationData.basePrice || 0,
            quantity: customizationData.customizations?.quantity || 1,
            imageUrl: customizationData.designData?.imageDataUrl,
            customization: {
              size: customizationData.customizations?.size,
              material: customizationData.customizations?.material,
              frame: customizationData.customizations?.frame,
              frameColor: customizationData.customizations?.frameColor,
              uploadedImage: customizationData.designData?.imageDataUrl,
              artkeyId: artkeyId || resolvedPortalToken,
              artkeyUrl: portalUrl,
            },
          };
          addToCart(cartItem);
        }

        if (redirectToShop) router.push('/cart');
        else setSaveModal({ show: true, url: portalUrl, message: 'ArtKey saved!' });
        return;
      }

      const savePayload = {
        data: { ...dataToSave, token: resolvedPortalToken || undefined },
        product_id: productId,
      };
      const res = await fetch('/api/artkey/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayload),
      });
      
      if (!res.ok) {
        const err = await res.json();
        if (err.message?.includes('demo mode')) {
          if (redirectToShop) {
            router.push('/customize');
          } else {
            setSaveModal({ show: true, url: '', message: 'Demo saved successfully!' });
          }
          return;
        }
        setSaveModal({ show: true, url: '', message: err.error || err.message || 'Save failed' });
        return;
      }
      
      const result = await res.json();
      if (result.token) {
        setSavedPortalToken(result.token);
        if (typeof window !== 'undefined' && result.owner_token) {
          try {
            sessionStorage.setItem(`portal_owner_${result.token}`, result.owner_token);
          } catch {}
        }
      }
      const portalUrl = result.share_url || (result.token ? buildArtKeyPortalUrl(result.token) : '');
      
      // If coming from studio, build cart item with design files + ArtKey data
      if (redirectToShop && fromStudio && studioExport?.productSpec) {
        const spec = studioExport.productSpec;
        const frontDesign = studioExport.designFiles?.find((f: any) => f.placement === 'front');
        const cartItem: Record<string, any> = {
          id: `${spec.id}-${artkeyId || Date.now()}`,
          name: spec.name || productNameParam || 'Custom Product',
          price: spec.basePrice || 0,
          quantity: 1,
          imageUrl: frontDesign?.dataUrl,
          source: 'shop' as const,
          assignmentId: spec.assignmentId || undefined,
          productSlug: spec.productSlug || productSlugParam,
          printfulProductId: spec.printfulProductId,
          printfulVariantId: spec.printfulVariantId,
          designFiles: studioExport.designFiles,
          studioRenderSignature: studioExport.studioRenderSignature,
          requiresQrCode: spec.requiresQrCode,
          artKeyData: {
            ...artKeyData,
            links: customLinks,
            customizations: {
              ...artKeyData.customizations,
              skeleton_key: skeletonKey,
              qr_position: qrPosition,
            },
          },
        };
        if (studioExport.artKeyTemplatePosition) {
          cartItem.artKeyTemplatePosition = studioExport.artKeyTemplatePosition;
        }
        addToCart(cartItem);
        // Clean up sessionStorage
        sessionStorage.removeItem('tae-studio-export');
        router.push('/cart');
        return;
      }

      // Legacy: coming from customize page
      if (redirectToShop && customizationData && productId) {
        const cartItem = {
          id: `${productId}-${artkeyId || Date.now()}`,
          name: customizationData.productName || 'Custom Product',
          price: customizationData.totalPrice || customizationData.basePrice || 0,
          quantity: customizationData.customizations?.quantity || 1,
          imageUrl: customizationData.designData?.imageDataUrl,
          customization: {
            size: customizationData.customizations?.size,
            material: customizationData.customizations?.material,
            frame: customizationData.customizations?.frame,
            frameColor: customizationData.customizations?.frameColor,
            uploadedImage: customizationData.designData?.imageDataUrl,
            artkeyId: artkeyId || result.token,
            artkeyUrl: result.share_url,
          },
        };
        addToCart(cartItem);
      }
      
      if (redirectToShop) {
        router.push('/cart');
      } else {
        setSaveModal({ show: true, url: portalUrl, message: 'ArtKey saved!' });
      }
    } catch (err) {
      console.error('Save failed', err);
      setSaveModal({ show: true, url: '', message: 'Failed to save ArtKey. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeature = (field: keyof ArtKeyData['features']) => {
    setArtKeyData((prev) => ({
      ...prev,
      features: { ...prev.features, [field]: !prev.features[field] },
    }));
  };

  const previewPortalToken = (portalToken || savedPortalToken || '').trim();

  const previewButtons = useMemo(() => {
    const items: Array<{ label: string; href?: string }> = [];
    for (const f of featureDefs) {
      if (f.type === 'coming_soon') continue;
      if ((f as any).enabled === false) continue;
      if (f.type === 'custom_link') {
        if (artKeyData.features.enable_custom_links && f.linkData) {
          const linkIndex = customLinks.findIndex(
            (link) => link.url === f.linkData?.url && link.label === f.linkData?.label
          );
          const href = linkIndex >= 0 && previewPortalToken ? `/art-key/${previewPortalToken}/link/${linkIndex}` : undefined;
          items.push({ label: f.label || f.linkData.label || 'Link', href });
        }
        continue;
      }
      if (f.key === 'gallery' && artKeyData.features.enable_gallery) {
        items.push({ label: f.label || 'Gallery', href: previewPortalToken ? `/art-key/${previewPortalToken}/gallery` : undefined });
      } else if (f.key === 'video' && artKeyData.features.enable_video) {
        items.push({
          label: artKeyData.featured_video?.button_label || f.label || 'Featured Video',
          href: previewPortalToken ? `/art-key/${previewPortalToken}/video` : undefined,
        });
      } else if (f.key === 'guestbook' && artKeyData.features.show_guestbook) {
        items.push({ label: f.label || 'Guestbook', href: previewPortalToken ? `/art-key/${previewPortalToken}/guestbook` : undefined });
      } else if (f.key === 'spotify' && artKeyData.features.enable_spotify) {
        items.push({ label: f.label || 'Listen', href: previewPortalToken ? `/art-key/${previewPortalToken}/spotify` : undefined });
      } else if (f.key === 'favorites' && artKeyData.features.enable_favorites) {
        items.push({
          label: f.label || 'Favorites',
          href: previewPortalToken ? `/art-key/${previewPortalToken}/favorites` : undefined,
        });
      }
    }
    return items;
  }, [featureDefs, artKeyData.features, artKeyData.featured_video, customLinks, previewPortalToken]);

  const portalSaveValidation = useMemo(() => {
    const issues: PortalSaveIssue[] = [];
    if (designMode === null) {
      issues.push({
        message: 'Choose how to start: Use a Template or Build Manually.',
        accordion: 'choosePath',
      });
    }
    if (designMode !== null && !String(artKeyData.title || '').trim()) {
      issues.push({
        message: 'Add a portal title in Portal Design.',
        accordion: 'branding',
      });
    }
    featureDefs.forEach((f, idx) => {
      if (f.type === 'coming_soon') return;
      const isCustom = f.type === 'custom_link';
      const on = isCustom ? (f as any).enabled !== false : !!(f.field && artKeyData.features[f.field]);
      if (!on) return;
      if (isCustom) {
        const link = f.linkData;
        const labelOk = link?.label?.trim();
        const urlOk = link?.url && isValidHttpUrl(link.url);
        if (!labelOk || !urlOk) {
          issues.push({
            message: `Link "${String(f.label || 'button')}": add a label and valid URL (https).`,
            accordion: designMode === 'custom' ? 'addButtons' : 'configureButtons',
            featureIndex: idx,
          });
        }
        return;
      }
      if (f.key === 'spotify' && artKeyData.features.enable_spotify) {
        if (!isLikelySpotifyPlaylistUrl(artKeyData.spotify?.url || '')) {
          issues.push({
            message: 'Spotify: add a playlist or show URL from Spotify.',
            accordion: 'configureButtons',
            featureIndex: idx,
          });
        }
      }
      if (f.key === 'gallery' && artKeyData.features.enable_gallery) {
        if (!artKeyData.uploadedImages?.length) {
          issues.push({
            message: 'Image gallery: add at least one image.',
            accordion: 'configureButtons',
            featureIndex: idx,
          });
        }
      }
      if (f.key === 'video' && artKeyData.features.enable_video) {
        if (!isVideoFeatureComplete(artKeyData)) {
          issues.push({
            message: 'Featured / video gallery: set a featured video or upload at least one video.',
            accordion: 'configureButtons',
            featureIndex: idx,
          });
        }
      }
      if (f.key === 'guestbook' && artKeyData.features.show_guestbook) {
        if (artKeyData.features.gb_signing_status === 'scheduled') {
          const start = String(artKeyData.features.gb_signing_start || '').trim();
          const end = String(artKeyData.features.gb_signing_end || '').trim();
          if (!start || !end) {
            issues.push({
              message: 'Guestbook: set start and end date/time for scheduled signing.',
              accordion: 'configureButtons',
              featureIndex: idx,
            });
          }
        }
      }
      if (f.key === 'favorites' && artKeyData.features.enable_favorites) {
        const raw = artKeyData.customizations?.favorites;
        const list = Array.isArray(raw) ? raw : [];
        const hasOne = list.some((item: any) => normalizeFavoriteBodyFromRaw(item) !== null);
        if (!hasOne) {
          issues.push({
            message: 'Favorites: add at least one favorite (title, link, image, or description).',
            accordion: 'configureButtons',
            featureIndex: idx,
          });
        }
      }
    });
    return {
      blocked: issues.length > 0,
      issues,
      summary: issues.map((i) => i.message).join(' · '),
    };
  }, [designMode, artKeyData, featureDefs]);

  const portalAccordionStatuses = useMemo(() => {
    const choosePathIssue = portalSaveValidation.issues.some((i) => i.accordion === 'choosePath');
    const brandingIssue = portalSaveValidation.issues.some((i) => i.accordion === 'branding');
    const addButtonsIssue = portalSaveValidation.issues.some((i) => i.accordion === 'addButtons');
    const configureButtonsIssue = portalSaveValidation.issues.some((i) => i.accordion === 'configureButtons');
    return {
      choosePath: choosePathIssue ? 'needs-setup' : 'complete',
      chooseTemplate: 'complete' as const,
      selectBackground: 'complete' as const,
      branding: brandingIssue ? 'needs-setup' : 'complete',
      buttonStyle: 'complete' as const,
      addButtons: addButtonsIssue ? 'needs-setup' : 'complete',
      configureButtons: configureButtonsIssue ? 'needs-setup' : 'complete',
    };
  }, [designMode, portalSaveValidation.issues]);

  const customerPortalBlocked = editorMode === 'customer' && portalSaveValidation.blocked;

  const focusFirstPortalIssue = () => {
    const first = portalSaveValidation.issues[0];
    if (!first) return;
    setOpenPortalAccordion(first.accordion);
    if (first.featureIndex != null) setExpandedFeatureIndex(first.featureIndex);
    requestAnimationFrame(() => {
      accordionScrollRefs[first.accordion]?.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const promptPortalIncompleteThenFocus = () => {
    focusFirstPortalIssue();
    const detail =
      portalSaveValidation.issues.length > 0
        ? portalSaveValidation.summary
        : 'Complete the required items in the sections below.';
    setSaveModal({
      show: true,
      url: '',
      message: `Finish your portal before continuing. Still needed: ${detail}`,
    });
  };

  const handleSaveAndContinue = () => {
    if (isSaving) return;
    if (editorMode === 'customer' && portalSaveValidation.blocked) {
      promptPortalIncompleteThenFocus();
      return;
    }
    handleSave(true);
  };

  const handleSaveAndCheckout = () => {
    if (isSaving) return;
    if (editorMode === 'customer' && portalSaveValidation.blocked) {
      promptPortalIncompleteThenFocus();
      return;
    }
    handleSave(true);
  };

  const featureTypeLabel = (f: (typeof featureDefs)[0]) => {
    if (f.type === 'coming_soon' || f.key === 'continuing_story') return 'Continuing Story';
    if (f.type === 'custom_link') return 'Link';
    if (f.key === 'spotify') return 'Playlist (Spotify)';
    if (f.key === 'gallery') return 'Image Gallery';
    if (f.key === 'video') return 'Featured Video / Video Gallery';
    if (f.key === 'guestbook') return 'Guestbook';
    if (f.key === 'favorites') return 'Favorites';
    return 'Feature';
  };

  const featureRowGateStatus = (idx: number): 'ready' | 'needs-setup' | 'off' => {
    const f = featureDefs[idx];
    if (f.type === 'coming_soon') return 'off';
    const isCustom = f.type === 'custom_link';
    const on = isCustom ? (f as any).enabled !== false : !!(f.field && artKeyData.features[f.field]);
    if (!on) return 'off';
    const hit = portalSaveValidation.issues.find((i) => i.featureIndex === idx);
    if (hit) return 'needs-setup';
    return 'ready';
  };

  const handleAddLink = () => {
    if (!newLinkLabel || !newLinkUrl) return;
    const newLink: Link = { label: newLinkLabel, url: newLinkUrl };
    const updated = [...customLinks, newLink];
    setCustomLinks(updated);
    setArtKeyData((prev) => ({ ...prev, links: updated, features: { ...prev.features, enable_custom_links: true } }));
    
    // Add as a featureDef entry so it can be edited, rearranged, and toggled
    const linkId = `custom_link_${Date.now()}`;
    const newFeatureDef = {
      key: linkId,
      label: `🔗 ${newLinkLabel}`,
      field: linkId,
      type: 'custom_link' as const,
      linkData: newLink,
      enabled: true,
    };
    setFeatureDefs((prev) => [...prev, newFeatureDef]);
    
    setNewLinkLabel('');
    setNewLinkUrl('https://www.');
  };

  const handleRemoveLink = (idx: number) => {
    const updated = customLinks.filter((_, i) => i !== idx);
    setCustomLinks(updated);
    setArtKeyData((prev) => ({ ...prev, links: updated }));
    setEditingLinkIndex(null);
  };

  const handleEditLink = (idx: number) => {
    const link = customLinks[idx];
    setEditingLinkIndex(idx);
    setEditLinkLabel(link.label);
    setEditLinkUrl(link.url);
  };

  const handleSaveEditLink = () => {
    if (editingLinkIndex === null || !editLinkLabel || !editLinkUrl) return;
    const updated = [...customLinks];
    updated[editingLinkIndex] = { label: editLinkLabel, url: editLinkUrl };
    setCustomLinks(updated);
    setArtKeyData((prev) => ({ ...prev, links: updated }));
    setEditingLinkIndex(null);
    setEditLinkLabel('');
    setEditLinkUrl('');
  };

  const handleCancelEditLink = () => {
    setEditingLinkIndex(null);
    setEditLinkLabel('');
    setEditLinkUrl('');
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
    if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return '#ffffff';
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.6 ? '#111111' : '#ffffff';
  };

  const getButtonPreviewStyles = (
    buttonColor: string,
    style: ButtonStyle,
    shape: ButtonShape
  ): React.CSSProperties => {
    const borderRadius = getButtonBorderRadius(shape);
    
    switch (style) {
      case 'solid':
        return {
          background: buttonColor,
          color: getButtonTextColor(buttonColor),
          borderRadius,
          border: 'none',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: buttonColor,
          borderRadius,
          border: `2px solid ${buttonColor}`,
        };
      case 'glass':
        return {
          background: `${buttonColor}26`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: buttonColor,
          borderRadius,
          border: `1.5px solid ${buttonColor}99`,
          boxShadow: `0 6px 14px -10px rgba(15, 23, 42, 0.55), inset 0 0 0 1px ${buttonColor}44`,
        };
      default:
        return {
          background: buttonColor,
          color: getButtonTextColor(buttonColor),
          borderRadius,
        };
    }
  };

  // Load Google Font when font changes
  useEffect(() => {
    if (artKeyData?.theme?.font && artKeyData.theme.font.startsWith('g:')) {
      const fontName = artKeyData.theme.font.replace('g:', '').replace(/\s+/g, '+');
      const linkId = `google-font-${fontName}`;
      if (typeof window !== 'undefined' && !document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [artKeyData?.theme?.font]);

  // Parse font value and return font-family CSS
  const getFontFamily = (fontValue: string) => {
    if (!fontValue) return 'inherit';
    
    if (fontValue.startsWith('g:')) {
      // Google Font - extract font name
      const fontName = fontValue.replace('g:', '').replace(/\s+/g, '+');
      // Load Google Font dynamically (fallback if useEffect didn't catch it)
      if (typeof window !== 'undefined') {
        const linkId = `google-font-${fontName}`;
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;600;700&display=swap`;
          document.head.appendChild(link);
        }
      }
      return `"${fontValue.replace('g:', '')}", sans-serif`;
    }
    
    switch (fontValue) {
      case 'system':
        return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      case 'serif':
        return 'Georgia, "Times New Roman", Times, serif';
      case 'mono':
        return '"Courier New", Courier, monospace';
      default:
        return 'inherit';
    }
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

  // Drag reorder for links (including featured video)
  const handleLinkDragStart = (index: number) => setDraggedLink(index);
  const handleLinkDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedLink === null || draggedLink === index) return;
    
    // Create combined list for reordering
    const combinedList = [...customLinks];
    const hasFeatured = artKeyData.featured_video !== null;
    const featuredIndex = hasFeatured ? combinedList.length : -1;
    
    // Determine if we're dragging featured video or a regular link
    const isDraggingFeatured = hasFeatured && draggedLink === featuredIndex;
    const isDroppingOnFeatured = hasFeatured && index === featuredIndex;
    
    if (isDraggingFeatured) {
      // Can't reorder featured video within links - it stays at the end
      return;
    }
    
    // Reorder regular links
    if (draggedLink < combinedList.length && index < combinedList.length) {
      const newLinks = [...customLinks];
      const draggedItem = newLinks[draggedLink];
      newLinks.splice(draggedLink, 1);
      newLinks.splice(index, 0, draggedItem);
      setCustomLinks(newLinks);
      setArtKeyData((prev) => ({ ...prev, links: newLinks }));
      setDraggedLink(index);
    }
  };
  const handleLinkDragEnd = () => setDraggedLink(null);

  function AddButtonsPanel() {
    return (
      <>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">⋮⋮</span>
                    <span className="text-[11px] text-slate-500">
                      Choose which actions appear on your portal: <strong>Link</strong> (add below), <strong>Guestbook</strong>, <strong>Featured Video · Video Gallery</strong>, <strong>Image Gallery</strong>, <strong>Playlist</strong>, <strong>Favorites</strong>. Drag to reorder. Use <strong>Configure Buttons</strong> for uploads and settings.
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {featureDefs.map((f, idx) => {
                    const isCustomLink = f.type === 'custom_link';
                    const isComingSoon = f.type === 'coming_soon';
                    const rowStatus = featureRowGateStatus(idx);
                    const rowStatusLabel = rowStatus === 'off' ? 'Off' : rowStatus === 'needs-setup' ? 'Needs setup' : 'Ready';
                    const rowActive =
                      !isComingSoon &&
                      (isCustomLink ? (f as any).enabled : !!(f.field && artKeyData.features[f.field]));
                    return (
                      <div key={f.key} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                        {editingFeatureIndex === idx ? (
                          // Edit mode
                          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editFeatureLabel}
                                onChange={(e) => setEditFeatureLabel(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                                autoFocus
                                placeholder="Enter button name"
                              />
                              {isCustomLink && (
                                <input
                                  type="url"
                                  value={editLinkUrl}
                                  onChange={(e) => setEditLinkUrl(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                                  placeholder="https://..."
                                />
                              )}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (editFeatureLabel.trim()) {
                                      const updated = [...featureDefs];
                                      if (isCustomLink) {
                                        // Update custom link
                                        const linkData = { label: editFeatureLabel, url: editLinkUrl };
                                        updated[idx] = { ...updated[idx], label: editFeatureLabel, linkData };
                                        // Update customLinks array - find by matching the old linkData
                                        const oldLinkData = f.linkData;
                                        if (oldLinkData) {
                                          const linkIndex = customLinks.findIndex(l => l.url === oldLinkData.url && l.label === oldLinkData.label);
                                          if (linkIndex >= 0) {
                                            const newCustomLinks = [...customLinks];
                                            newCustomLinks[linkIndex] = linkData;
                                            setCustomLinks(newCustomLinks);
                                            setArtKeyData((prev) => ({ ...prev, links: newCustomLinks }));
                                          }
                                        }
                                      } else {
                                        updated[idx] = { ...updated[idx], label: editFeatureLabel };
                                      }
                                      setFeatureDefs(updated);
                                    }
                                    setEditingFeatureIndex(null);
                                    setEditFeatureLabel('');
                                    setEditLinkUrl('');
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                                  style={{ background: '#1a1a2e', color: '#fff' }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingFeatureIndex(null);
                                    setEditFeatureLabel('');
                                    setEditLinkUrl('');
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-all"
                                >
                                  Cancel
                                </button>
                                {isCustomLink && (
                                  <button
                                    onClick={() => {
                                      const updated = featureDefs.filter((_, i) => i !== idx);
                                      setFeatureDefs(updated);
                                      const linkData = f.linkData;
                                      if (linkData) {
                                        const newCustomLinks = customLinks.filter(l => l.url !== linkData.url);
                                        setCustomLinks(newCustomLinks);
                                        setArtKeyData((prev) => ({ ...prev, links: newCustomLinks }));
                                      }
                                      setEditingFeatureIndex(null);
                                      setEditFeatureLabel('');
                                      setEditLinkUrl('');
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-red-600 ml-auto"
                                    style={{ background: '#ef4444', color: '#fff' }}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                          <div
                            onDragOver={(e) => handleFeatureDragOver(e, idx)}
                            onDragEnd={handleFeatureDragEnd}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all group/row"
                            style={{
                              borderColor: rowActive ? '#c7d2fe' : '#f0f0f0',
                              background: rowActive ? '#f8f9ff' : '#fafafa',
                              opacity: draggedFeature === idx ? 0.5 : 1,
                            }}
                          >
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', String(idx));
                                handleFeatureDragStart(idx);
                              }}
                              className="text-gray-300 group-hover/row:text-gray-400 transition-colors text-xs cursor-grab active:cursor-grabbing"
                              title="Drag to reorder"
                              aria-label="Drag to reorder"
                            >
                              ⋮⋮
                            </div>
                            {!isCustomLink && !isComingSoon && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFeature(f.field);
                                }}
                                className="w-9 h-5 rounded-full relative cursor-pointer transition-all"
                                style={{ background: artKeyData.features[f.field] ? '#1a1a2e' : '#d1d5db' }}
                              >
                                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all" style={{ left: artKeyData.features[f.field] ? '18px' : '2px' }} />
                              </div>
                            )}
                            {isComingSoon && (
                              <div
                                className="w-9 h-5 rounded-full relative shrink-0 cursor-not-allowed opacity-60"
                                style={{ background: '#d1d5db' }}
                                title="Coming soon"
                                aria-hidden
                              >
                                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" style={{ left: '2px' }} />
                              </div>
                            )}
                            {isCustomLink && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = [...featureDefs];
                                  updated[idx] = { ...updated[idx], enabled: !(f as any).enabled };
                                  setFeatureDefs(updated);
                                }}
                                className="w-9 h-5 rounded-full relative cursor-pointer transition-all"
                                style={{ background: (f as any).enabled ? '#1a1a2e' : '#d1d5db' }}
                              >
                                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all" style={{ left: (f as any).enabled ? '18px' : '2px' }} />
                              </div>
                            )}
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isComingSoon) return;
                                if (isCustomLink) {
                                  const updated = [...featureDefs];
                                  updated[idx] = { ...updated[idx], enabled: !(f as any).enabled };
                                  setFeatureDefs(updated);
                                } else if (f.field) {
                                  toggleFeature(f.field);
                                }
                              }}
                              className={`flex-1 text-xs font-medium ${isComingSoon ? 'cursor-default text-gray-500' : 'cursor-pointer'}`}
                              style={{ color: isComingSoon ? undefined : '#333' }}
                            >
                              {f.label}
                            </span>
                            {isCustomLink && f.linkData && (
                              <span
                                className="text-[10px] text-gray-400 max-w-[80px] truncate hidden sm:block"
                                title={f.linkData.url}
                              >
                                {f.linkData.url.replace('https://', '').replace('http://', '').substring(0, 20)}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500 hidden lg:inline max-w-[100px] truncate shrink-0">
                              {featureTypeLabel(f)}
                            </span>
                            <span
                              className={
                                isComingSoon
                                  ? 'text-[10px] px-2 py-0.5 rounded-full border border-amber-300 bg-white text-amber-900 font-medium shrink-0'
                                  : `text-[10px] px-1.5 py-0.5 rounded border shrink-0 font-medium ${
                                      rowStatus === 'ready'
                                        ? 'border-emerald-200 text-emerald-800 bg-emerald-50'
                                        : rowStatus === 'needs-setup'
                                          ? 'border-amber-200 text-amber-900 bg-amber-50'
                                          : 'border-gray-200 text-gray-500 bg-gray-50'
                                    }`
                              }
                            >
                              {isComingSoon ? 'Coming soon' : rowStatusLabel}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedFeatureIndex((prev) => (prev === idx ? null : idx));
                                if (f.key === 'gallery') setOpenedGallery('images');
                                if (f.key === 'video') setOpenedGallery('videos');
                              }}
                              className="text-gray-500 hover:text-gray-700 px-1.5 py-0.5 text-xs rounded border border-transparent hover:border-gray-200 shrink-0"
                              aria-expanded={expandedFeatureIndex === idx}
                              aria-label={expandedFeatureIndex === idx ? 'Collapse row details' : 'Expand row details'}
                            >
                              {expandedFeatureIndex === idx ? '▼' : '▶'}
                            </button>
                            {!isComingSoon && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFeatureIndex(idx);
                                  setEditFeatureLabel(f.label);
                                  if (isCustomLink && f.linkData) {
                                    setEditLinkUrl(f.linkData.url);
                                  }
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1.5 text-xs rounded-md hover:bg-gray-100 transition-all"
                                title="Edit"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        {expandedFeatureIndex === idx ? (
                          <div className="border-t border-gray-100 bg-slate-50/80 px-3 py-3 text-xs text-gray-600 space-y-2">
                            <p className="font-medium text-gray-700">{featureTypeLabel(f)}</p>
                            {isComingSoon ? (
                              <p>Continuing Story isn&apos;t available yet. It will show here when released.</p>
                            ) : isCustomLink ? (
                              <p>Edit the label and URL with the pencil icon, or use the toggle to disable this link.</p>
                            ) : !(f.field && artKeyData.features[f.field]) ? (
                              <p>Turn this row on to configure it. Use the <strong>Configure Buttons</strong> accordion for uploads and settings.</p>
                            ) : f.key === 'spotify' ? (
                              <p>Open <strong>Configure Buttons</strong> and set your Spotify playlist URL (and autoplay) there.</p>
                            ) : f.key === 'gallery' ? (
                              <p>In <strong>Configure Buttons</strong>, use <strong>Upload images</strong> (image gallery column).</p>
                            ) : f.key === 'video' ? (
                              <p>In <strong>Configure Buttons</strong>, set featured video and uploads in the video gallery column.</p>
                            ) : f.key === 'guestbook' ? (
                              <p>Guestbook signing and moderation are in <strong>Configure Buttons</strong> under Review / Actions.</p>
                            ) : f.key === 'favorites' ? (
                              <p>Edit favorite cards in <strong>Configure Buttons</strong>.</p>
                            ) : (
                              <p>Finish setup in <strong>Configure Buttons</strong> when this action is on.</p>
                            )}
                          </div>
                        ) : null}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

            {/* Add New Link Button - Simplified */}
              <Card title="Add Content">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: '#888' }}>Button Name</label>
                    <input
                      type="text"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                      placeholder="e.g., Instagram, Website, Portfolio"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: '#888' }}>URL</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">🔗</span>
                      <input
                        type="url"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-lg text-sm border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddLink}
                    className="w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: '#fff' }}
                  >
                    + Add Link Button
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">
                    Adds a <strong>Link</strong> row above that you can toggle, edit, and reorder with other buttons.
                  </p>
                </div>
              </Card>
      </>
    );
  }

  return (
    <div style={{ background: '#f5f5f7' }} className="min-h-screen">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 shadow-lg border-b border-white/10" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {editorMode === 'demo' && (
                <button
                  onClick={() => {
                    if (process.env.NODE_ENV !== 'production') {
                      console.log('[ArtKeyEditor] Back to Dashboard target:', ARTKEY_ADMIN_DASHBOARD_PATH);
                    }
                    router.push(ARTKEY_ADMIN_DASHBOARD_PATH);
                  }}
                  className="px-3 py-1.5 rounded-lg font-medium transition-all text-xs hover:bg-white/20"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)' }}
                  title="Back to Admin Dashboard"
                >
                  ← Dashboard
                </button>
              )}
              <div>
                <h1 className="text-lg sm:text-xl font-normal font-playfair text-white flex items-center gap-2">
                  <span className="text-amber-400">✦</span>
                  {modeHeading}
                </h1>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {editorMode === 'customer'
                    ? 'Design your ArtKey Portal, then continue your purchase flow.'
                    : editorMode === 'host'
                    ? 'Update your live ArtKey Portal experience for guests.'
                    : 'Create and polish demo portal experiences for review.'}
                </p>
                {customizationData && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customizing: {customizationData.productName} - ${customizationData.totalPrice}
                  </p>
                )}
                {editorMode === 'customer' && customerPortalBlocked && (
                  <p className="text-[11px] text-amber-200 max-w-xl mt-1.5 leading-snug">
                    Finish setup before continuing: {portalSaveValidation.summary}
                    <button
                      type="button"
                      onClick={focusFirstPortalIssue}
                      className="ml-2 underline font-medium text-white hover:text-amber-100"
                    >
                      Go to first issue
                    </button>
                  </p>
                )}
              </div>
            </div>
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:bg-white/20 disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  {isSaving ? 'Saving...' : editorMode === 'customer' ? 'Save Draft' : 'Save'}
                </button>
                {editorMode === 'customer' && (
                  <>
                    <button
                      onClick={handleSaveAndContinue}
                      disabled={isSaving}
                      title={
                        customerPortalBlocked
                          ? `${portalSaveValidation.summary} — click for details and jump to the first item`
                          : undefined
                      }
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${customerPortalBlocked && !isSaving ? 'ring-2 ring-amber-300/80 ring-offset-2 ring-offset-[#1a1a2e]' : ''}`}
                      style={{ background: 'rgba(255,255,255,0.95)', color: '#1a1a2e' }}
                    >
                      {isSaving ? 'Saving...' : 'Save & Continue →'}
                    </button>
                    <button
                      onClick={handleSaveAndCheckout}
                      disabled={isSaving}
                      title={
                        customerPortalBlocked
                          ? `${portalSaveValidation.summary} — click for details and jump to the first item`
                          : undefined
                      }
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${customerPortalBlocked && !isSaving ? 'ring-2 ring-amber-300/80 ring-offset-2 ring-offset-[#1a1a2e]' : ''}`}
                      style={{ background: 'linear-gradient(135deg, #C9A962, #D4AF37)', color: '#1a1a2e' }}
                    >
                      {isSaving ? 'Saving...' : 'Save & Checkout'}
                    </button>
                  </>
                )}
              </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Preview — stacked on small screens; fixed ~5/12 width from lg so controls stay primary */}
          <div className="space-y-4 min-w-0 lg:col-span-5">
            <div
              id="artkey-live-preview"
              className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 border border-[#e2e2e0] max-w-md mx-auto w-full lg:max-w-none lg:mx-0 lg:sticky lg:top-24"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-normal font-playfair" style={{ color: COLOR_ACCENT }}>Live Preview</h3>
                <div className="flex gap-2 p-1 rounded-lg" style={{ background: COLOR_ALT }}>
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
                // Mobile preview: contained width so it does not dominate the column
                <div
                  className="w-full max-w-[380px] mx-auto rounded-xl overflow-hidden border-2"
                  style={{ borderColor: '#e2e2e0', ...getPreviewBackground(), minHeight: '520px' }}
                >
                  <div className="h-full w-full pt-6 pb-6 px-5 flex flex-col items-center text-center min-h-[520px]">
                    {(artKeyData.theme.header_icon && artKeyData.theme.header_icon !== 'none') && (
                      <div className="mb-2 mt-16">
                        <ElegantIcon 
                          icon={artKeyData.theme.header_icon as ElegantIconKey} 
                          size={48} 
                          color={artKeyData.theme.title_color}
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                    <h1
                      className="text-2xl md:text-3xl font-normal mb-3 break-words"
                      style={{
                        fontFamily: getFontFamily(artKeyData.theme.font),
                        color: artKeyData.theme.title_style === 'gradient' ? 'transparent' : artKeyData.theme.title_color,
                        background: artKeyData.theme.title_style === 'gradient' ? `linear-gradient(135deg, ${artKeyData.theme.title_color}, ${artKeyData.theme.button_color})` : 'none',
                        backgroundClip: artKeyData.theme.title_style === 'gradient' ? 'text' : 'unset',
                        WebkitBackgroundClip: artKeyData.theme.title_style === 'gradient' ? 'text' : 'unset',
                        marginTop: (artKeyData.theme.header_icon && artKeyData.theme.header_icon !== 'none') ? '0' : '4rem',
                      }}
                    >
                      {artKeyData.title || 'Your Title Here'}
                    </h1>

                        {/* Buttons Preview - respects featureDefs drag order */}
                        {(() => {
                          const useTwoColumns = previewButtons.length > 6;
                          const maxChars = 40;
                          const fontSize = useTwoColumns ? 'text-xs' : 'text-sm';
                          
                          return (
                            <div className={`mt-3 w-full max-w-sm ${useTwoColumns ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}`}>
                              {previewButtons.map((btn, idx) => {
                                const displayText = (btn.label || `Link ${idx + 1}`).length > maxChars 
                                  ? (btn.label || `Link ${idx + 1}`).substring(0, maxChars - 3) + '...'
                                  : (btn.label || `Link ${idx + 1}`);
                                return (
                                  <a
                                    key={idx}
                                    href={btn.href || '#'}
                                    target={btn.href ? '_blank' : undefined}
                                    rel={btn.href ? 'noopener noreferrer' : undefined}
                                    onClick={(e) => {
                                      if (!btn.href) e.preventDefault();
                                    }}
                                    className={`block w-full py-2.5 px-3 ${fontSize} font-semibold transition-all shadow-md ${btn.href ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                                    style={getButtonPreviewStyles(
                                      artKeyData.theme.button_color,
                                      (artKeyData.theme.button_style as ButtonStyle) || buttonStyle,
                                      (artKeyData.theme.button_shape as ButtonShape) || buttonShape
                                    )}
                                    title={btn.href ? 'Open portal page in new tab' : 'Save portal first to enable live links'}
                                  >
                                    {displayText}
                                  </a>
                                );
                              })}
                            </div>
                          );
                        })()}
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
                    {(artKeyData.theme.header_icon && artKeyData.theme.header_icon !== 'none') && (
                      <div className="mb-2 mt-16">
                        <ElegantIcon 
                          icon={artKeyData.theme.header_icon as ElegantIconKey} 
                          size={48} 
                          color={artKeyData.theme.title_color}
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                    <h1
                      className="text-2xl md:text-3xl font-normal mb-3 break-words"
                      style={{
                        fontFamily: getFontFamily(artKeyData.theme.font),
                        color: artKeyData.theme.title_style === 'gradient' ? 'transparent' : artKeyData.theme.title_color,
                        background: artKeyData.theme.title_style === 'gradient' ? `linear-gradient(135deg, ${artKeyData.theme.title_color}, ${artKeyData.theme.button_color})` : 'none',
                        backgroundClip: artKeyData.theme.title_style === 'gradient' ? 'text' : 'unset',
                        WebkitBackgroundClip: artKeyData.theme.title_style === 'gradient' ? 'text' : 'unset',
                        marginTop: (artKeyData.theme.header_icon && artKeyData.theme.header_icon !== 'none') ? '0' : '4rem',
                      }}
                    >
                      {artKeyData.title || 'Your Title Here'}
                    </h1>

                        {/* Buttons Preview - respects featureDefs drag order */}
                        {(() => {
                          const useTwoColumns = previewButtons.length > 6;
                          const maxChars = 40;
                          const fontSize = useTwoColumns ? 'text-xs' : 'text-sm';
                          
                          return (
                            <div className={`mt-3 w-full max-w-sm ${useTwoColumns ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}`}>
                              {previewButtons.map((btn, idx) => {
                                const displayText = (btn.label || `Link ${idx + 1}`).length > maxChars 
                                  ? (btn.label || `Link ${idx + 1}`).substring(0, maxChars - 3) + '...'
                                  : (btn.label || `Link ${idx + 1}`);
                                return (
                                  <a
                                    key={idx}
                                    href={btn.href || '#'}
                                    target={btn.href ? '_blank' : undefined}
                                    rel={btn.href ? 'noopener noreferrer' : undefined}
                                    onClick={(e) => {
                                      if (!btn.href) e.preventDefault();
                                    }}
                                    className={`block ${useTwoColumns ? 'w-full' : 'w-full'} py-2.5 px-3 ${fontSize} font-semibold transition-all shadow-md ${btn.href ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                                    style={getButtonPreviewStyles(
                                      artKeyData.theme.button_color,
                                      (artKeyData.theme.button_style as ButtonStyle) || buttonStyle,
                                      (artKeyData.theme.button_shape as ButtonShape) || buttonShape
                                    )}
                                    title={btn.href ? 'Open portal page in new tab' : 'Save portal first to enable live links'}
                                  >
                                    {displayText}
                                  </a>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Editor — same shell feel as preview: single panel, accordions nested inside */}
          <div className="min-w-0 lg:col-span-7">
            <div className="rounded-2xl border border-[#e2e2e0] bg-white shadow-lg p-5 sm:p-6 min-w-0 lg:sticky lg:top-24 space-y-4">
            {designMode === null && (
              <PortalAccordionSection
                sectionId="choosePath"
                title="Choose a Starting Point"
                status={portalAccordionStatuses.choosePath}
                openSection={openPortalAccordion}
                setOpenSection={setOpenPortalAccordion}
                innerRef={accordionScrollRefs.choosePath}
              >
                <Card title="Choose a Starting Point" step="1">
                  <p className="text-xs text-gray-500 mb-4">
                    Pick <strong>Use a Template</strong> for a styled starting layout (background included), or <strong>Build Manually</strong> to start from a blank canvas and choose your background first.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <PrimaryButton
                      onClick={() => {
                        setDesignMode('template');
                        setOpenPortalAccordion('chooseTemplate');
                      }}
                      icon={<CustomIcon name="art" size={40} color={COLOR_ACCENT} />}
                      accent
                    >
                      Use a Template
                      <div className="text-sm text-[#444] mt-1">Pick a mini portal preview, then personalize it</div>
                    </PrimaryButton>
                    <PrimaryButton
                      onClick={() => {
                        setDesignMode('custom');
                        setOpenPortalAccordion('selectBackground');
                      }}
                      icon={<CustomIcon name="sparkle" size={40} color={COLOR_ACCENT} />}
                    >
                      Build Manually
                      <div className="text-sm text-[#444] mt-1">Begin with a clean ArtKey Portal canvas</div>
                    </PrimaryButton>
                  </div>
                </Card>
              </PortalAccordionSection>
            )}

            {designMode !== null && (
            <div className="flex flex-col gap-4 min-w-0">
              <div className="order-1">
                <PortalAccordionSection
                  sectionId="choosePath"
                  title="Choose a Starting Point"
                  status={portalAccordionStatuses.choosePath}
                  openSection={openPortalAccordion}
                  setOpenSection={setOpenPortalAccordion}
                  innerRef={accordionScrollRefs.choosePath}
                >
                  <Card title="Choose a Starting Point" step="1">
                    <p className="text-sm mb-3" style={{ color: COLOR_ACCENT }}>
                      Current path:{' '}
                      <strong>{designMode === 'template' ? 'Use a Template' : 'Build Manually'}</strong>
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all hover:opacity-95 cursor-pointer shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          borderColor: '#1a1a2e',
                          color: '#fff',
                          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        }}
                        onClick={() => {
                          if (designMode === 'template') {
                            setDesignMode('custom');
                            setOpenPortalAccordion('selectBackground');
                          } else {
                            setDesignMode('template');
                            setOpenPortalAccordion('chooseTemplate');
                          }
                        }}
                      >
                        {designMode === 'template' ? 'Switch to Build Manually' : 'Switch to Use a Template'}
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all hover:bg-gray-50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          background: COLOR_PRIMARY,
                          color: COLOR_ACCENT,
                          borderColor: '#d8d8d6',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                        }}
                        onClick={() => {
                          setDesignMode(null);
                          setOpenPortalAccordion('choosePath');
                        }}
                      >
                        Change starting choice…
                      </button>
                    </div>
                  </Card>
                </PortalAccordionSection>
              </div>

              {designMode === 'template' && (
              <div className="order-2">
                <PortalAccordionSection
                  sectionId="chooseTemplate"
                  title="Choose a Template"
                  status={portalAccordionStatuses.chooseTemplate}
                  openSection={openPortalAccordion}
                  setOpenSection={setOpenPortalAccordion}
                  innerRef={accordionScrollRefs.chooseTemplate}
                >
                  <Card
                    title="Choose a Template"
                    step="2"
                    onBack={() => {
                      setDesignMode(null);
                      setOpenPortalAccordion('choosePath');
                    }}
                  >
                {/* Category Tabs */}
                <div className="flex gap-1.5 mb-5 p-1 rounded-xl bg-gray-100">
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setTemplateCategory(cat.id);
                        setTemplatePage(0);
                      }}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        templateCategory === cat.id ? 'shadow-sm' : 'hover:bg-gray-200/50'
                      }`}
                      style={templateCategory === cat.id ? {
                        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                        color: '#fff',
                      } : {
                        color: '#666',
                      }}
                    >
                      <CustomIcon name={cat.icon as any} size={14} color="currentColor" />
                      {cat.label}
                    </button>
                  ))}
                </div>

                <Carousel
                  page={templatePage}
                  setPage={setTemplatePage}
                  total={Math.ceil(getTemplatesByCategory(templateCategory).length / templatesPerPage)}
                  labelPrefix={`${templateCategory} Templates`}
                >
                  <div className="grid grid-cols-4 gap-3">
                    {getTemplatesByCategory(templateCategory)
                      .slice(templatePage * templatesPerPage, (templatePage + 1) * templatesPerPage)
                      .map((tpl) => {
                        const isSelected = artKeyData.theme.template === tpl.value;
                        const buttonPreviewColor =
                          tpl.buttonStyle === 'solid' ? getButtonTextColor(tpl.button) : tpl.button;
                        return (
                          <button
                            key={tpl.value}
                            onClick={() => handleTemplateSelect(tpl)}
                            className={`group rounded-xl border-2 overflow-hidden ${isSelected ? 'shadow-lg ring-2 ring-offset-2' : 'hover:shadow-md hover:-translate-y-0.5'}`}
                            style={{
                              borderColor: isSelected ? tpl.button : 'transparent',
                              ringColor: isSelected ? tpl.button : undefined,
                            }}
                          >
                            <div className="p-2.5" style={{ background: tpl.bg, minHeight: '128px' }}>
                              <div
                                className="h-full w-full rounded-lg p-2.5 flex flex-col"
                                style={{
                                  background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.08))',
                                  border: `1px solid ${tpl.buttonBorder || tpl.button}66`,
                                  backdropFilter: 'blur(1.5px)',
                                }}
                              >
                                <div className="w-full flex items-center justify-between mb-1.5">
                                  <div className="text-[9px] font-semibold tracking-[0.06em] uppercase" style={{ color: tpl.text }}>
                                    Portal Style
                                  </div>
                                  {(tpl.headerIcon && tpl.headerIcon !== 'none') && (
                                    <ElegantIcon icon={tpl.headerIcon as ElegantIconKey} size={13} color={tpl.title} />
                                  )}
                                </div>
                                <div className="text-[13px] font-bold leading-tight line-clamp-2 min-h-[2.2em]" style={{ color: tpl.title, fontFamily: tpl.titleFont?.replace('g:', '') || 'inherit' }}>
                                  {tpl.name}
                                </div>
                                <div className="text-[8px] mt-1.5 mb-2 line-clamp-2" style={{ color: tpl.text }}>
                                  {tpl.description || 'Distinct visual starting point with editable style controls.'}
                                </div>
                                <div className="mt-auto space-y-1">
                                  <div
                                    className="w-full py-1 px-2 text-[8px] font-semibold text-center truncate"
                                    style={{
                                      background: tpl.buttonStyle === 'outline' ? 'transparent' : (tpl.buttonStyle === 'glass' ? `${tpl.button}26` : tpl.button),
                                      color: tpl.buttonStyle === 'solid' ? buttonPreviewColor : tpl.button,
                                      border: tpl.buttonStyle !== 'solid' ? `1.5px solid ${tpl.buttonBorder || tpl.button}` : 'none',
                                      borderRadius: tpl.buttonShape === 'square' ? '0' : tpl.buttonShape === 'rounded' ? '4px' : '9999px',
                                    }}
                                  >
                                    Open Guestbook
                                  </div>
                                  <div
                                    className="w-full py-1 px-2 text-[8px] font-semibold text-center truncate"
                                    style={{
                                      background: tpl.buttonStyle === 'glass' ? `${tpl.button}20` : `${tpl.button}15`,
                                      color: tpl.buttonStyle === 'solid' ? buttonPreviewColor : tpl.button,
                                      border: `1px solid ${tpl.buttonBorder || tpl.button}`,
                                      borderRadius: tpl.buttonShape === 'square' ? '0' : tpl.buttonShape === 'rounded' ? '4px' : '9999px',
                                    }}
                                  >
                                    View Gallery
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="px-2 py-2 text-center" style={{ background: '#ffffff' }}>
                              <div className="text-[11px] font-semibold leading-tight" style={{ color: '#353535' }}>{tpl.name}</div>
                              <div className="text-[10px] mt-1 leading-tight text-gray-500 min-h-[26px]">
                                {tpl.description || 'A polished starting point you can fully customize.'}
                              </div>
                              {isSelected && <div className="text-[8px] mt-0.5 font-medium" style={{ color: tpl.button }}>Selected</div>}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </Carousel>
              </Card>
                </PortalAccordionSection>
              </div>
              )}

              {designMode === 'custom' && (
              <div className="order-2">
                <PortalAccordionSection
                  sectionId="selectBackground"
                  title="Select a Background"
                  status={portalAccordionStatuses.selectBackground}
                  openSection={openPortalAccordion}
                  setOpenSection={setOpenPortalAccordion}
                  innerRef={accordionScrollRefs.selectBackground}
                >
              <Card title="Select a Background" step="2" onBack={() => { setDesignMode(null); setOpenPortalAccordion('choosePath'); }}>
                <Tabs value={bgTab} onChange={setBgTab} tabs={[
                  { id: 'solid', label: 'Solid Color' },
                  { id: 'stock', label: 'Stock Photos' },
                  { id: 'upload', label: 'Upload' },
                ]} />

                {bgTab === 'solid' && (
                  <>
                    <ColorPicker
                      page={bgColorPage}
                      setPage={setBgColorPage}
                      pages={3}
                      label={(page) => (page === 0 ? 'Page 1' : page === 1 ? 'Page 2' : 'Page 3')}
                      colors={buttonColors}
                      selected={artKeyData.theme.bg_color}
                      onSelect={(c) => handleColorSelect(c, 'background')}
                      onCustomColor={() => {
                        setShowColorPicker({ type: 'background' });
                      }}
                    />
                    {showColorPicker.type === 'background' && (
                      <AdvancedColorPickerPopover
                        title="Background Color"
                        value={getColorTargetValue('background')}
                        alpha={colorAlpha.background}
                        recentColors={recentColors}
                        onChange={(value, alpha) => handleAdvancedColorChange('background', value, alpha)}
                        onSelectRecent={(value) => handleAdvancedColorChange('background', value, 1)}
                        onClose={() => setShowColorPicker({ type: null })}
                        palette={{ primary: COLOR_PRIMARY, alt: COLOR_ALT, accent: COLOR_ACCENT }}
                      />
                    )}
                  </>
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
                </PortalAccordionSection>
              </div>
              )}

              <div className={designMode === 'template' ? 'order-3' : 'order-6'}>
            <PortalAccordionSection
              sectionId="configureButtons"
              title="Configure Buttons"
              status={portalAccordionStatuses.configureButtons}
              openSection={openPortalAccordion}
              setOpenSection={setOpenPortalAccordion}
              innerRef={accordionScrollRefs.configureButtons}
            >
            {designMode === 'template' && <AddButtonsPanel />}
            {!(
              artKeyData.features.enable_spotify ||
              artKeyData.features.enable_gallery ||
              artKeyData.features.enable_video ||
              artKeyData.features.enable_favorites ||
              artKeyData.features.show_guestbook
            ) ? (
              <p className="text-sm text-gray-500 px-1 py-2">
                {designMode === 'template' ? (
                  <>When you turn on actions in the list above, their setup (uploads, playlist URL, guestbook, favorites) will appear below.</>
                ) : (
                  <>When you turn on actions in <strong>Add Buttons</strong>, their setup (uploads, playlist URL, guestbook, favorites) will show up in this section.</>
                )}
              </p>
            ) : null}

            {(artKeyData.features.enable_spotify || artKeyData.features.enable_gallery || artKeyData.features.enable_video) && (
            <div className="space-y-6 pt-2">
            {/* Step 5 Spotify */}
            {artKeyData.features.enable_spotify && (
              <Card title="Playlist (Spotify)">
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
            {(artKeyData.features.enable_gallery || artKeyData.features.enable_video) && (
              <Card title="Upload images · Featured video & video gallery">
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !artKeyData.features.enable_gallery 
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200' 
                        : openedGallery === 'videos'
                        ? 'opacity-50 cursor-pointer bg-gray-100 border-gray-300'
                        : openedGallery === 'images'
                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                        : 'border-gray-300 bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (artKeyData.features.enable_gallery) {
                        setOpenedGallery(openedGallery === 'images' ? null : 'images');
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold text-sm ${!artKeyData.features.enable_gallery ? 'text-gray-400' : ''}`}>
                        📸 Image Gallery
                      </h4>
                      {openedGallery === 'images' && <span className="text-xs text-blue-600">▼ Open</span>}
                      {openedGallery !== 'images' && artKeyData.features.enable_gallery && <span className="text-xs text-gray-500">▶ Closed</span>}
                      {!artKeyData.features.enable_gallery && <span className="text-xs text-gray-400">Disabled</span>}
                    </div>
                    {openedGallery === 'images' && artKeyData.features.enable_gallery && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <MediaColumn
                          title="Images"
                          items={artKeyData.uploadedImages}
                          onRemove={(idx) => setArtKeyData((prev) => ({ ...prev, uploadedImages: prev.uploadedImages.filter((_, i) => i !== idx) }))}
                          onUpload={handleImageUpload}
                          accept="image/*"
                          inputId="image-upload"
                          buttonLabel="+ Upload"
                          uploadStatus={imageUploadStatus}
                        />
                      </div>
                    )}
                  </div>
                  <div 
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !artKeyData.features.enable_video 
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200' 
                        : openedGallery === 'images'
                        ? 'opacity-50 cursor-pointer bg-gray-100 border-gray-300'
                        : openedGallery === 'videos'
                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                        : 'border-gray-300 bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (artKeyData.features.enable_video) {
                        setOpenedGallery(openedGallery === 'videos' ? null : 'videos');
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold text-sm ${!artKeyData.features.enable_video ? 'text-gray-400' : ''}`}>
                        🎥 Video Gallery
                      </h4>
                      {openedGallery === 'videos' && <span className="text-xs text-blue-600">▼ Open</span>}
                      {openedGallery !== 'videos' && artKeyData.features.enable_video && <span className="text-xs text-gray-500">▶ Closed</span>}
                      {!artKeyData.features.enable_video && <span className="text-xs text-gray-400">Disabled</span>}
                    </div>
                    {openedGallery === 'videos' && artKeyData.features.enable_video && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <MediaColumn
                          title="Videos"
                          items={artKeyData.uploadedVideos}
                          onRemove={(idx) => {
                            const removedUrl = artKeyData.uploadedVideos[idx];
                            setArtKeyData((prev) => {
                              const newVideos = prev.uploadedVideos.filter((_, i) => i !== idx);
                              const newFeatured = prev.featured_video?.video_url === removedUrl ? null : prev.featured_video;
                              return { ...prev, uploadedVideos: newVideos, featured_video: newFeatured };
                            });
                          }}
                          onUpload={handleVideoUpload}
                          accept="video/*"
                          inputId="video-upload"
                          buttonLabel="+ Upload"
                          isVideo
                          featuredVideoUrl={artKeyData.featured_video?.video_url || null}
                          onSetFeatured={handleSetFeaturedVideo}
                          featuredVideoLabel={artKeyData.featured_video?.button_label}
                          uploadStatus={videoUploadStatus}
                          onUpdateVideoThumbnail={(idx, thumbnailUrl) => {
                            setArtKeyData((prev) => {
                              const nextVideos = [...(prev.uploadedVideos || [])];
                              const current = nextVideos[idx];
                              if (!current) return prev;
                              const normalized = typeof current === 'string' ? { url: current } : current;
                              nextVideos[idx] = { ...normalized, thumbnailUrl };
                              return { ...prev, uploadedVideos: nextVideos };
                            });
                          }}
                          onUpdateFeaturedLabel={(label) => {
                            if (artKeyData.featured_video) {
                              setArtKeyData((prev) => ({
                                ...prev,
                                featured_video: prev.featured_video ? { ...prev.featured_video, button_label: label } : null,
                              }));
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
            </div>
            )}

            {artKeyData.features.enable_favorites && (
            <div className="space-y-6 pt-4 mt-4 border-t border-gray-100">
              <Card title="Favorites">
              <p className="text-xs text-gray-500 mb-3">
                Add up to {MAX_PORTAL_FAVORITES} favorites. Turn <strong>Favorites</strong> on in{' '}
                {designMode === 'template' ? (
                  <>the button list above</>
                ) : (
                  <><strong>Add Buttons</strong></>
                )}{' '}
                and drag it to reorder. Each card can mix title, description, image, and link — a row is saved only if at least one field is filled after trimming; http(s) URLs are validated and invalid URLs are dropped. Thumbnail: paste an image URL or upload (upload replaces the URL field). All text is trimmed on save.
              </p>
              <div className="space-y-4">
                {getFavoritesFromState().map((raw: any, index: number) => {
                  const item = raw || {};
                  const linkUrlVal = String(item.linkUrl || item.url || '');
                  const thumbDisplay = String(item.thumbnailUrl || item.thumbnail || item.image || '');
                  return (
                    <div
                      key={String(item.id || index)}
                      className="rounded-xl border border-gray-200 p-4 space-y-3"
                      style={{ background: COLOR_ALT }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLOR_ACCENT }}>
                          Favorite {index + 1}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => {
                              const list = [...getFavoritesFromState()];
                              if (index <= 0) return;
                              [list[index - 1], list[index]] = [list[index], list[index - 1]];
                              updatePortalFavorites(list);
                            }}
                            className="px-2 py-1 text-xs rounded-lg border border-gray-300 bg-white disabled:opacity-40"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            disabled={index >= getFavoritesFromState().length - 1}
                            onClick={() => {
                              const list = [...getFavoritesFromState()];
                              if (index >= list.length - 1) return;
                              [list[index + 1], list[index]] = [list[index], list[index + 1]];
                              updatePortalFavorites(list);
                            }}
                            className="px-2 py-1 text-xs rounded-lg border border-gray-300 bg-white disabled:opacity-40"
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const list = getFavoritesFromState().filter((_: any, i: number) => i !== index);
                              updatePortalFavorites(list);
                            }}
                            className="px-2 py-1 text-xs rounded-lg border border-red-200 text-red-700 bg-white"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium mb-1 uppercase tracking-wide text-gray-500">Title (optional)</label>
                        <input
                          type="text"
                          value={String(item.title || '')}
                          onChange={(e) => {
                            const list = [...getFavoritesFromState()];
                            list[index] = { ...list[index], title: e.target.value };
                            updatePortalFavorites(list);
                          }}
                          className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200"
                          placeholder="Short title"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium mb-1 uppercase tracking-wide text-gray-500">Link URL (optional)</label>
                        <input
                          type="url"
                          value={linkUrlVal}
                          onChange={(e) => {
                            const list = [...getFavoritesFromState()];
                            list[index] = { ...list[index], linkUrl: e.target.value };
                            updatePortalFavorites(list);
                          }}
                          className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium mb-1 uppercase tracking-wide text-gray-500">Description (optional)</label>
                        <textarea
                          value={String(item.description || item.writeup || '')}
                          onChange={(e) => {
                            const list = [...getFavoritesFromState()];
                            list[index] = { ...list[index], description: e.target.value, writeup: e.target.value };
                            updatePortalFavorites(list);
                          }}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium mb-2 uppercase tracking-wide text-gray-500">Thumbnail (optional)</span>
                        <p className="text-[10px] text-gray-500 mb-2">Paste a direct image URL and/or upload; uploading replaces the URL with your hosted image.</p>
                        {thumbDisplay.trim() ? (
                          <div className="flex items-center gap-2 mb-2">
                            <img src={thumbDisplay.trim()} alt="" className="h-14 w-14 object-cover rounded-lg border border-gray-200" />
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...getFavoritesFromState()];
                                list[index] = { ...list[index], thumbnailUrl: '', thumbnail: '', image: '' };
                                updatePortalFavorites(list);
                              }}
                              className="text-xs text-red-600 underline"
                            >
                              Clear thumbnail
                            </button>
                          </div>
                        ) : null}
                        <input
                          type="url"
                          value={thumbDisplay}
                          onChange={(e) => {
                            const list = [...getFavoritesFromState()];
                            list[index] = { ...list[index], thumbnailUrl: e.target.value };
                            updatePortalFavorites(list);
                          }}
                          className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 mb-2"
                          placeholder="https://…/image.jpg"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`fav-upload-${index}`}
                          onChange={(e) => handleFavoriteImageUpload(index, e)}
                        />
                        <label
                          htmlFor={`fav-upload-${index}`}
                          className="inline-block px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border border-gray-300 bg-white"
                        >
                          Upload image…
                        </label>
                      </div>
                    </div>
                  );
                })}
                {getFavoritesFromState().length < MAX_PORTAL_FAVORITES && (
                  <button
                    type="button"
                    onClick={() => {
                      const nid =
                        typeof crypto !== 'undefined' && crypto.randomUUID
                          ? crypto.randomUUID()
                          : `fav-${Date.now()}`;
                      const list = [
                        ...getFavoritesFromState(),
                        { id: nid, linkUrl: '', title: '', description: '', thumbnailUrl: '' },
                      ];
                      updatePortalFavorites(list);
                    }}
                    className="w-full px-4 py-3 rounded-xl text-sm font-semibold border-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    + Add favorite ({getFavoritesFromState().length}/{MAX_PORTAL_FAVORITES})
                  </button>
                )}
              </div>
              </Card>
            </div>
            )}

            {(artKeyData.features.show_guestbook || artKeyData.features.enable_gallery || artKeyData.features.enable_video) && (
            <div className="space-y-6 pt-4 mt-4 border-t border-gray-100">
              <Card title="Guestbook settings & guest uploads">
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
                    {(() => {
                      const gbAuth = resolveUploadAuth();
                      return (
                        <GuestbookModerationPanel
                          publicToken={gbAuth.publicToken}
                          ownerToken={gbAuth.ownerToken}
                        />
                      );
                    })()}
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

              </Card>
            </div>
            )}

            </PortalAccordionSection>
              </div>

              <div className={designMode === 'template' ? 'order-4' : 'order-3'}>
            <PortalAccordionSection
              sectionId="branding"
              title="Portal Design"
              status={portalAccordionStatuses.branding}
              openSection={openPortalAccordion}
              setOpenSection={setOpenPortalAccordion}
              innerRef={accordionScrollRefs.branding}
            >
            {/* Step 2 Title */}
              <Card title="Portal Design" step="2">
                <p className="text-xs text-gray-500 mb-3">
                  {designMode === 'template' ? (
                    <>Your template includes a preset background and layout. Adjust title, colors, and fonts here.</>
                  ) : (
                    <>Set your page background in <strong>Select a Background</strong>, then refine title and colors here.</>
                  )}
                </p>
                <input
                  type="text"
                  value={artKeyData.title}
                  onChange={(e) => setArtKeyData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{ border: '2px solid #e2e2e0' }}
                  placeholder="Enter your title..."
                />
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2" style={{ color: COLOR_ACCENT }}>Title Color</h4>
                  <ColorPicker
                    page={titleColorPage}
                    setPage={setTitleColorPage}
                    pages={3}
                    label={(page) => (page === 0 ? 'Page 1' : page === 1 ? 'Page 2' : 'Page 3')}
                    colors={buttonColors}
                    selected={artKeyData.theme.title_color}
                    onSelect={(c) => handleColorSelect(c, 'title')}
                    onCustomColor={() => {
                      setShowColorPicker({ type: 'title' });
                    }}
                  />
                  {showColorPicker.type === 'title' && (
                    <AdvancedColorPickerPopover
                      title="Title Color"
                      value={getColorTargetValue('title')}
                      alpha={colorAlpha.title}
                      recentColors={recentColors}
                      onChange={(value, alpha) => handleAdvancedColorChange('title', value, alpha)}
                      onSelectRecent={(value) => handleAdvancedColorChange('title', value, 1)}
                      onClose={() => setShowColorPicker({ type: null })}
                      palette={{ primary: COLOR_PRIMARY, alt: COLOR_ALT, accent: COLOR_ACCENT }}
                    />
                  )}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2" style={{ color: COLOR_ACCENT }}>Title Font</label>
                  <select
                    value={artKeyData.theme.font}
                    onChange={(e) => setArtKeyData((prev) => ({ ...prev, theme: { ...prev.theme, font: e.target.value } }))}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{ border: '2px solid #e2e2e0' }}
                  >
                    {fonts.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2" style={{ color: COLOR_ACCENT }}>Body text color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(artKeyData.theme.text_color) ? artKeyData.theme.text_color : '#111111'}
                      onChange={(e) =>
                        setArtKeyData((prev) => ({ ...prev, theme: { ...prev.theme, text_color: e.target.value } }))
                      }
                      className="h-10 w-14 rounded cursor-pointer border border-gray-200 bg-white"
                      aria-label="Body text color"
                    />
                    <span className="text-xs text-gray-500">Applies to supporting text on the portal.</span>
                  </div>
                </div>
              </Card>
            </PortalAccordionSection>
            </div>

              <div className={designMode === 'template' ? 'order-5' : 'order-4'}>
            <PortalAccordionSection
              sectionId="buttonStyle"
              title="Button Styling"
              status={portalAccordionStatuses.buttonStyle}
              openSection={openPortalAccordion}
              setOpenSection={setOpenPortalAccordion}
              innerRef={accordionScrollRefs.buttonStyle}
            >
            {/* Step 3 Features & Colors */}
              <Card title="Button Styling" step="3">
                <div className="mb-4 p-4 rounded-lg" style={{ background: '#f5f5f3' }}>
                  <h4 className="text-sm font-semibold mb-3">Button Color</h4>
                  <ColorPicker
                    page={buttonColorPage}
                    setPage={setButtonColorPage}
                    pages={3}
                    label={(page) => (page === 0 ? 'Page 1' : page === 1 ? 'Page 2' : 'Page 3')}
                    colors={buttonColors}
                    selected={artKeyData.theme.button_color}
                    onSelect={(c) => handleColorSelect(c, 'button')}
                    onCustomColor={() => {
                      setShowColorPicker({ type: 'button' });
                    }}
                  />
                  {showColorPicker.type === 'button' && (
                    <AdvancedColorPickerPopover
                      title="Button Color"
                      value={getColorTargetValue('button')}
                      alpha={colorAlpha.button}
                      recentColors={recentColors}
                      onChange={(value, alpha) => handleAdvancedColorChange('button', value, alpha)}
                      onSelectRecent={(value) => handleAdvancedColorChange('button', value, 1)}
                      onClose={() => setShowColorPicker({ type: null })}
                      palette={{ primary: COLOR_PRIMARY, alt: COLOR_ALT, accent: COLOR_ACCENT }}
                    />
                  )}
                </div>

                {/* Button Style Customization */}
                <div className="mb-4 p-4 rounded-lg" style={{ background: '#f5f5f3' }}>
                  <h4 className="text-sm font-semibold mb-3">Button Shape</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {BUTTON_SHAPES.map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => {
                          setButtonShape(shape.id);
                          setArtKeyData((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, button_shape: shape.id },
                          }));
                        }}
                        className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                          buttonShape === shape.id ? 'shadow-md' : ''
                        }`}
                        style={{
                          background: buttonShape === shape.id ? COLOR_ACCENT : COLOR_ALT,
                          color: buttonShape === shape.id ? COLOR_PRIMARY : COLOR_ACCENT,
                          borderRadius: shape.borderRadius,
                        }}
                      >
                        {shape.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4 p-4 rounded-lg" style={{ background: '#f5f5f3' }}>
                  <h4 className="text-sm font-semibold mb-3">Button Style</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {BUTTON_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setButtonStyle(style.id);
                          setArtKeyData((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, button_style: style.id },
                          }));
                        }}
                        className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                          buttonStyle === style.id ? 'shadow-md' : ''
                        }`}
                        style={{
                          background: buttonStyle === style.id ? COLOR_ACCENT : COLOR_ALT,
                          color: buttonStyle === style.id ? COLOR_PRIMARY : COLOR_ACCENT,
                        }}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4 p-4 rounded-lg" style={{ background: '#f5f5f3' }}>
                  <h4 className="text-sm font-semibold mb-3">Header Icon</h4>
                  <div className="mb-3">
                    <button
                      onClick={() => {
                        setHeaderIcon('none');
                        setArtKeyData((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, header_icon: 'none' },
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        headerIcon === 'none' ? 'shadow-md' : ''
                      }`}
                      style={{
                        background: headerIcon === 'none' ? COLOR_ACCENT : COLOR_PRIMARY,
                        color: headerIcon === 'none' ? COLOR_PRIMARY : COLOR_ACCENT,
                        borderColor: '#d8d8d6',
                      }}
                    >
                      No Icon
                    </button>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {[
                      { id: 'weddings' as const, label: 'Weddings' },
                      { id: 'birthdays' as const, label: 'Birthdays' },
                      { id: 'graduations' as const, label: 'Graduations' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setIconCategoryTab(tab.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: iconCategoryTab === tab.id ? COLOR_ACCENT : COLOR_PRIMARY,
                          color: iconCategoryTab === tab.id ? COLOR_PRIMARY : COLOR_ACCENT,
                          border: '1px solid #d8d8d6',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(ELEGANT_ICONS)
                      .filter(([key]) => key !== 'none')
                      .filter(([, iconData]) => getIconEventGroup(iconData.category) === iconCategoryTab)
                      .filter(([key]) => iconCategoryTab !== 'weddings' || !hiddenWeddingIconKeys.has(key))
                      .map(([key, iconData]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setHeaderIcon(key as ElegantIconKey);
                          setArtKeyData((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, header_icon: key },
                          }));
                        }}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                          headerIcon === key ? 'shadow-md' : ''
                        }`}
                        style={{
                          borderColor: headerIcon === key ? COLOR_ACCENT : '#e2e2e0',
                          background: headerIcon === key ? COLOR_ALT : COLOR_PRIMARY,
                        }}
                        title={iconData.label}
                      >
                        <ElegantIcon 
                          icon={key as ElegantIconKey} 
                          size={32} 
                          color={headerIcon === key ? COLOR_ACCENT : '#999'}
                          strokeWidth={1.5}
                        />
                        <span className="text-xs mt-1" style={{ color: COLOR_ACCENT }}>
                          {iconData.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </PortalAccordionSection>
            </div>

            {designMode === 'custom' && (
              <div className="order-5">
            <PortalAccordionSection
              sectionId="addButtons"
              title="Add Buttons"
              status={portalAccordionStatuses.addButtons}
              openSection={openPortalAccordion}
              setOpenSection={setOpenPortalAccordion}
              innerRef={accordionScrollRefs.addButtons}
            >
              <AddButtonsPanel />
            </PortalAccordionSection>
              </div>
            )}
            </div>
            )}
            </div>

            {/* Step 8: QR Code & Skeleton Key — REMOVED: QR placement is handled in the Customization Studio canvas */}
            {false && (
              <Card title="QR Code Placement" data-section="qr-placement">
                {(productInfo?.requiresQR || productInfo?.requiresSkeletonKey) && !skeletonKey && (
                  <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-800">
                      ⚠️ Required: Please select a skeleton key template and QR code position
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This product requires a skeleton key template and QR code placement.</p>
                  </div>
                )}
                <div className="space-y-6">
                  {/* Skeleton Key Selection */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ color: COLOR_ACCENT }}>
                      🔑 Choose Skeleton Key Template
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      Select a template layout for your card/invitation/postcard where the QR code will be placed.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { 
                          id: 'template-1', 
                          name: 'Classic Corner', 
                          description: 'QR code in bottom-right corner',
                          qrArea: 'bottom-right',
                          preview: (
                            <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden">
                              <div className="absolute bottom-2 right-2 w-16 h-16 bg-white rounded border-2 border-gray-400 flex flex-col items-center justify-center">
                                <div className="text-xs font-bold text-gray-600">QR</div>
                                <div className="text-[8px] text-gray-500 mt-0.5">Scan</div>
                              </div>
                            </div>
                          )
                        },
                        { 
                          id: 'template-2', 
                          name: 'Top Header', 
                          description: 'QR code in top-right with text',
                          qrArea: 'top-right',
                          preview: (
                            <div className="w-full h-32 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden">
                              <div className="absolute top-2 right-2 w-16 h-16 bg-white rounded border-2 border-gray-400 flex flex-col items-center justify-center">
                                <div className="text-xs font-bold text-gray-600">QR</div>
                                <div className="text-[8px] text-gray-500 mt-0.5">Scan</div>
                              </div>
                              <div className="absolute top-2 left-2 text-xs font-semibold text-gray-700">Scan QR Code</div>
                            </div>
                          )
                        },
                        { 
                          id: 'template-3', 
                          name: 'Center Bottom', 
                          description: 'QR code centered at bottom',
                          qrArea: 'bottom-center',
                          preview: (
                            <div className="w-full h-32 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden">
                              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded border-2 border-gray-400 flex flex-col items-center justify-center">
                                <div className="text-xs font-bold text-gray-600">QR</div>
                                <div className="text-[8px] text-gray-500 mt-0.5">Scan</div>
                              </div>
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-6 text-xs font-semibold text-gray-700">Scan QR Code</div>
                            </div>
                          )
                        },
                        { 
                          id: 'template-4', 
                          name: 'Side Panel', 
                          description: 'QR code on left side',
                          qrArea: 'center-left',
                          preview: (
                            <div className="w-full h-32 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden">
                              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-16 h-16 bg-white rounded border-2 border-gray-400 flex flex-col items-center justify-center">
                                <div className="text-xs font-bold text-gray-600">QR</div>
                                <div className="text-[8px] text-gray-500 mt-0.5">Scan</div>
                              </div>
                              <div className="absolute left-20 top-1/2 transform -translate-y-1/2 text-xs font-semibold text-gray-700">Scan QR Code</div>
                            </div>
                          )
                        },
                        { 
                          id: 'template-5', 
                          name: 'Back Cover', 
                          description: 'QR code centered on back',
                          qrArea: 'center',
                          preview: (
                            <div className="w-full h-32 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden">
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded border-2 border-gray-400 flex flex-col items-center justify-center">
                                <div className="text-xs font-bold text-gray-600">QR</div>
                                <div className="text-[8px] text-gray-500 mt-0.5">Scan</div>
                              </div>
                              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">Scan QR Code</div>
                            </div>
                          )
                        },
                      ].map((template) => (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSkeletonKey(template.id);
                            // Auto-set QR position based on template default
                            if (template.qrArea) {
                              setQrPosition(template.qrArea);
                            }
                          }}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            skeletonKey === template.id ? 'shadow-lg scale-105' : ''
                          }`}
                          style={{
                            borderColor: skeletonKey === template.id ? COLOR_ACCENT : '#e2e2e0',
                            background: skeletonKey === template.id ? '#f0f9ff' : COLOR_PRIMARY,
                          }}
                        >
                          {template.preview}
                          <div className="mt-2 text-center">
                            <div className="text-xs font-semibold" style={{ color: COLOR_ACCENT }}>
                              {template.name}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {template.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* QR Code Position */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ color: COLOR_ACCENT }}>
                      📍 QR Code Position
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      Choose where on the skeleton key template the QR code should be placed.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'top-left', label: 'Top Left', icon: '↖️' },
                        { id: 'top-center', label: 'Top Center', icon: '⬆️' },
                        { id: 'top-right', label: 'Top Right', icon: '↗️' },
                        { id: 'center-left', label: 'Center Left', icon: '⬅️' },
                        { id: 'center', label: 'Center', icon: '🎯' },
                        { id: 'center-right', label: 'Center Right', icon: '➡️' },
                        { id: 'bottom-left', label: 'Bottom Left', icon: '↙️' },
                        { id: 'bottom-center', label: 'Bottom Center', icon: '⬇️' },
                        { id: 'bottom-right', label: 'Bottom Right', icon: '↘️' },
                      ].map((position) => (
                        <button
                          key={position.id}
                          onClick={() => setQrPosition(position.id)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            qrPosition === position.id ? 'shadow-md' : ''
                          }`}
                          style={{
                            borderColor: qrPosition === position.id ? COLOR_ACCENT : '#e2e2e0',
                            background: qrPosition === position.id ? '#f0f9ff' : COLOR_PRIMARY,
                          }}
                        >
                          <div className="text-xl mb-1">{position.icon}</div>
                          <div className="text-xs font-medium" style={{ color: COLOR_ACCENT }}>
                            {position.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Validation Status */}
                  {(!skeletonKey || !qrPosition) && (
                    <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                      <p className="text-sm font-semibold text-red-800">
                        ⚠️ Required Fields Missing
                      </p>
                      <ul className="text-xs text-red-700 mt-2 list-disc list-inside space-y-1">
                        {!skeletonKey && <li>Please select a skeleton key template</li>}
                        {!qrPosition && <li>Please select a QR code position</li>}
                      </ul>
                    </div>
                  )}

                  {/* Validation Status */}
                  {(!skeletonKey || !qrPosition) && (
                    <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg mb-4">
                      <p className="text-sm font-semibold text-red-800 mb-2">
                        ⚠️ Required: Complete QR Code Setup
                      </p>
                      <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                        {!skeletonKey && <li>Select a skeleton key template above</li>}
                        {!qrPosition && <li>Select a QR code position above</li>}
                      </ul>
                      <p className="text-xs text-red-600 mt-2">
                        You cannot save until both are selected.
                      </p>
                    </div>
                  )}

                  {/* Preview of Selected Template */}
                  {skeletonKey && (
                    <div>
                      <label className="block text-sm font-semibold mb-3" style={{ color: COLOR_ACCENT }}>
                        📋 Template Preview
                      </label>
                      <div className="p-4 rounded-lg border-2" style={{ borderColor: '#e2e2e0', background: COLOR_ALT }}>
                        <div className="bg-white rounded-lg p-6 relative" style={{ minHeight: '200px', aspectRatio: '5/7' }}>
                          {/* Template-specific layout preview */}
                          {skeletonKey === 'template-1' && (
                            <div className="absolute bottom-4 right-4">
                              <div className="w-20 h-20 bg-gray-100 rounded border-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
                                <div className="text-xs font-bold text-gray-600">QR Code</div>
                                <div className="text-[10px] text-gray-500 mt-1">Scan QR Code</div>
                              </div>
                            </div>
                          )}
                          {skeletonKey === 'template-2' && (
                            <>
                              <div className="absolute top-4 right-4">
                                <div className="w-20 h-20 bg-gray-100 rounded border-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
                                  <div className="text-xs font-bold text-gray-600">QR Code</div>
                                  <div className="text-[10px] text-gray-500 mt-1">Scan</div>
                                </div>
                              </div>
                              <div className="absolute top-4 left-4 text-sm font-semibold text-gray-700">Scan QR Code</div>
                            </>
                          )}
                          {skeletonKey === 'template-3' && (
                            <>
                              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                <div className="w-20 h-20 bg-gray-100 rounded border-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
                                  <div className="text-xs font-bold text-gray-600">QR Code</div>
                                  <div className="text-[10px] text-gray-500 mt-1">Scan</div>
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-8 text-sm font-semibold text-gray-700">Scan QR Code</div>
                            </>
                          )}
                          {skeletonKey === 'template-4' && (
                            <>
                              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                <div className="w-20 h-20 bg-gray-100 rounded border-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
                                  <div className="text-xs font-bold text-gray-600">QR Code</div>
                                  <div className="text-[10px] text-gray-500 mt-1">Scan</div>
                                </div>
                              </div>
                              <div className="absolute left-28 top-1/2 transform -translate-y-1/2 text-sm font-semibold text-gray-700">Scan QR Code</div>
                            </>
                          )}
                          {skeletonKey === 'template-5' && (
                            <>
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="w-20 h-20 bg-gray-100 rounded border-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
                                  <div className="text-xs font-bold text-gray-600">QR Code</div>
                                  <div className="text-[10px] text-gray-500 mt-1">Scan</div>
                                </div>
                              </div>
                              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm font-semibold text-gray-700">Scan QR Code</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="p-4 rounded-lg" style={{ background: '#fef3c7', border: '1px solid #fcd34d' }}>
                    <div className="text-sm font-semibold mb-1" style={{ color: '#92400e' }}>
                      💡 QR Code Information
                    </div>
                    <p className="text-xs" style={{ color: '#78350f' }}>
                      A unique QR code will be generated for this ArtKey and placed on your selected template at the chosen position. 
                      The QR code will include "Scan QR Code" text and will link directly to your ArtKey portal.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Save Result Modal */}
      {saveModal?.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in">
            <h3 className="text-lg font-normal mb-3" style={{ color: COLOR_ACCENT }}>
              {saveModal.url ? 'ArtKey Saved' : saveModal.message.startsWith('Finish your portal') ? 'Finish setup' : 'Notice'}
            </h3>
            <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap break-words">{saveModal.message}</p>
            {saveModal.url && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Portal URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={saveModal.url}
                    className="flex-1 px-3 py-2 rounded-lg border text-sm bg-gray-50 select-all"
                    style={{ borderColor: '#d8d8d6' }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(saveModal.url);
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                    style={{ background: COLOR_ACCENT, color: '#fff' }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              {saveModal.url && (
                <a
                  href={saveModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: COLOR_ALT, color: COLOR_ACCENT, border: '1px solid #d8d8d6' }}
                >
                  View Portal
                </a>
              )}
              <button
                onClick={() => setSaveModal(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #C9A962, #D4AF37)', color: '#1a1a2e' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function PortalAccordionSection({
  sectionId,
  title,
  status,
  openSection,
  setOpenSection,
  children,
  innerRef,
}: {
  sectionId: PortalAccordionId;
  title: string;
  status: 'complete' | 'needs-setup' | 'coming-soon';
  openSection: PortalAccordionId | null;
  setOpenSection: React.Dispatch<React.SetStateAction<PortalAccordionId | null>>;
  children: React.ReactNode;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const open = openSection === sectionId;
  const showStatusChip = status === 'needs-setup' || status === 'coming-soon';
  const statusClass =
    status === 'needs-setup'
      ? 'bg-amber-50 text-amber-900 border-amber-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  const statusLabel = status === 'needs-setup' ? 'Needs setup' : 'Coming Soon';
  return (
    <div
      ref={innerRef}
      className="rounded-xl border border-[#e8e8e6] bg-[#fafaf9] shadow-sm overflow-hidden ring-1 ring-black/[0.03]"
    >
      <button
        type="button"
        onClick={() => {
          setOpenSection((prev) => (prev === sectionId ? null : sectionId));
        }}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 text-left hover:bg-white/80 transition-colors gap-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a1a2e]/25"
        aria-expanded={open}
      >
        <h3 className="text-base font-normal font-playfair" style={{ color: COLOR_ACCENT }}>
          {title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {showStatusChip ? (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusClass}`}>{statusLabel}</span>
          ) : null}
          <span className="text-gray-400 text-sm" aria-hidden>
            {open ? '▼' : '▶'}
          </span>
        </div>
      </button>
      {open ? (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-gray-200/80 bg-white space-y-4">{children}</div>
      ) : null}
    </div>
  );
}

function Card({ title, step, children, onBack }: { title: string; step?: string; children: React.ReactNode; onBack?: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-5">
        {step && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>{step}</div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-normal font-playfair" style={{ color: COLOR_ACCENT }}>{title}</h3>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-3 py-1.5 text-xs rounded-lg transition-all hover:bg-gray-100 font-medium"
            style={{ border: '1px solid #e5e5e5', color: '#555' }}
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
    <div className="flex gap-1 mb-4 p-1 rounded-xl bg-gray-100">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${value === t.id ? 'shadow-sm' : 'hover:bg-gray-200/50'}`}
          style={value === t.id ? { background: '#fff', color: COLOR_ACCENT } : { color: '#888' }}
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
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="w-9 h-9 rounded-lg border transition-all disabled:opacity-30 hover:bg-gray-100 flex items-center justify-center text-sm font-medium"
          style={{ borderColor: '#e5e7eb', color: '#555' }}
        >
          ‹
        </button>
        <div className="flex-1">{children}</div>
        <button
          onClick={() => setPage(Math.min(total - 1, page + 1))}
          disabled={page >= total - 1}
          className="w-9 h-9 rounded-lg border transition-all disabled:opacity-30 hover:bg-gray-100 flex items-center justify-center text-sm font-medium"
          style={{ borderColor: '#e5e7eb', color: '#555' }}
        >
          ›
        </button>
      </div>
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{ background: page === i ? '#1a1a2e' : '#d1d5db' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type ColorOption = { bg: string; color: string; label: string; type: string };

function ColorPicker({ page, setPage, pages, label, colors, selected, onSelect, onCustomColor }: {
  page: number;
  setPage: (p: number) => void;
  pages: number;
  label: string | ((page: number) => string);
  colors: ColorOption[];
  selected: string;
  onSelect: (color: ColorOption) => void;
  onCustomColor?: () => void;
}) {
  const maxPage = pages - 1;
  const getColorsForPage = (page: number, arr: ColorOption[]) => arr.slice(page * 12, page * 12 + 12);
  
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
      <div className="grid grid-cols-6 gap-2 mb-2" style={{ gridTemplateRows: 'repeat(2, minmax(0, 1fr))' }}>
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
      {onCustomColor && (
        <button
          onClick={onCustomColor}
          className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
          style={{ border: '2px solid #d8d8d6', background: COLOR_PRIMARY, color: COLOR_ACCENT }}
        >
          🎨 More Colors
        </button>
      )}
    </div>
  );
}

function MediaColumn({ title, items, onRemove, onUpload, accept, inputId, buttonLabel, isVideo, featuredVideoUrl, onSetFeatured, featuredVideoLabel, onUpdateFeaturedLabel, onUpdateVideoThumbnail, uploadStatus }: {
  title: string;
  items: any[];
  onRemove: (idx: number) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept: string;
  inputId: string;
  buttonLabel: string;
  isVideo?: boolean;
  featuredVideoUrl?: string | null;
  onSetFeatured?: (url: string, isFeatured: boolean) => void;
  featuredVideoLabel?: string;
  onUpdateFeaturedLabel?: (label: string) => void;
  onUpdateVideoThumbnail?: (idx: number, thumbnailUrl: string) => void;
  uploadStatus?: {
    state: 'idle' | 'uploading' | 'complete' | 'error';
    message: string;
  };
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2" style={{ color: COLOR_ACCENT }}>{title}</h4>
      {items.length > 0 && (
        <div className={isVideo ? 'space-y-2 mb-2' : 'grid grid-cols-3 gap-2 mb-2'}>
          {items.map((it, idx) => {
            const videoItem = typeof it === 'string' ? { url: it } : it;
            const videoUrl = videoItem?.url || '';
            const videoThumb = videoItem?.thumbnailUrl || '';
            return (
            <div key={idx} className="group rounded-lg border border-gray-200 p-2 bg-white space-y-2">
              <div className="relative">
                {isVideo ? (
                  videoThumb ? (
                    <img src={videoThumb} alt="" className="w-full h-20 object-cover rounded-lg" />
                  ) : (
                    <video src={videoUrl} className="w-full h-20 object-cover rounded-lg" controls />
                  )
                ) : (
                  <img src={it as string} alt="" className="w-full h-20 object-cover rounded-lg" />
                )}
                <button
                  onClick={() => onRemove(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs z-10"
                >
                  ×
                </button>
              </div>
              {isVideo && (
                <div className="mt-2 space-y-2">
                  {onSetFeatured && (
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={featuredVideoUrl === videoUrl}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSetFeatured(videoUrl, e.target.checked);
                        }}
                        className="w-3 h-3 cursor-pointer"
                        title="Mark as Featured Video"
                      />
                      <span className="text-[11px]" style={{ color: COLOR_ACCENT }}>Featured video</span>
                    </label>
                  )}
                  {onUpdateVideoThumbnail && (
                    <div>
                      <label
                        htmlFor={`${inputId}-thumb-${idx}`}
                        className="inline-flex px-2 py-1 rounded text-xs cursor-pointer"
                        style={{ border: '1px solid #d8d8d6', background: '#fff', color: COLOR_ACCENT }}
                      >
                        Upload Thumbnail
                      </label>
                      <input
                        id={`${inputId}-thumb-${idx}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const auth = await ensurePortalUploadAuth();
                          if (!auth?.publicToken) return;
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('publicToken', auth.publicToken);
                          if (auth.ownerToken) formData.append('ownerToken', auth.ownerToken);
                          try {
                            const res = await fetch('/api/artkey/upload', { method: 'POST', body: formData });
                            const result = await res.json().catch(() => ({}));
                            if (!res.ok) throw new Error(result?.error || 'Thumbnail upload failed');
                            const thumbUrl = result.url || result.fileUrl;
                            if (!thumbUrl) throw new Error('Thumbnail upload returned no file URL');
                            onUpdateVideoThumbnail(idx, thumbUrl);
                          } catch (err: any) {
                            notifyUploadError(err?.message || 'Thumbnail upload failed');
                          } finally {
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
      {isVideo && featuredVideoUrl && onUpdateFeaturedLabel && (
        <div className="mb-2 p-2 rounded-lg" style={{ background: COLOR_ALT, border: '1px solid #e2e2e0' }}>
          <label className="block text-xs font-medium mb-1" style={{ color: COLOR_ACCENT }}>Featured Video Button Label:</label>
          <input
            type="text"
            value={featuredVideoLabel || 'Watch Video'}
            onChange={(e) => onUpdateFeaturedLabel(e.target.value)}
            className="w-full px-2 py-1 rounded text-xs"
            style={{ border: '1px solid #d8d8d6' }}
            placeholder="Watch Video"
          />
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
      {uploadStatus && uploadStatus.state !== 'idle' && (
        <div
          className="mt-2 text-xs px-2 py-1.5 rounded-lg"
          style={{
            background:
              uploadStatus.state === 'uploading'
                ? '#eff6ff'
                : uploadStatus.state === 'complete'
                ? '#ecfdf5'
                : '#fef2f2',
            color:
              uploadStatus.state === 'uploading'
                ? '#1d4ed8'
                : uploadStatus.state === 'complete'
                ? '#166534'
                : '#b91c1c',
            border: `1px solid ${
              uploadStatus.state === 'uploading'
                ? '#bfdbfe'
                : uploadStatus.state === 'complete'
                ? '#bbf7d0'
                : '#fecaca'
            }`,
          }}
        >
          {uploadStatus.state === 'uploading' ? '⏳ ' : uploadStatus.state === 'complete' ? '✅ ' : '⚠️ '}
          {uploadStatus.message}
        </div>
      )}
    </div>
  );
}

function SettingsBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100">
      <h4 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: '#888' }}>{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function PrimaryButton({ onClick, children, icon, accent }: { onClick: () => void; children: React.ReactNode; icon: string | React.ReactNode; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="group relative p-6 rounded-2xl text-left transition-all border hover:shadow-lg hover:-translate-y-1"
      style={{
        background: accent ? 'linear-gradient(135deg, #1a1a2e, #16213e)' : '#ffffff',
        borderColor: accent ? 'transparent' : '#e5e7eb',
      }}
    >
      <div className="mb-3" style={{ fontSize: '2rem', lineHeight: 1 }}>
        {typeof icon === 'string' ? (
          <span className="text-3xl">{icon}</span>
        ) : (
          <div style={{ display: 'inline-block', transform: 'scale(1.25)' }}>{icon}</div>
        )}
      </div>
      <div className="text-lg font-bold font-playfair" style={{ color: accent ? '#ffffff' : COLOR_ACCENT }}>{children}</div>
      <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all group-hover:translate-x-1" style={{ background: accent ? 'rgba(255,255,255,0.15)' : '#f3f4f6', color: accent ? '#fff' : '#666' }}>→</div>
    </button>
  );
}

// Export with Suspense wrapper for useSearchParams
export default function ArtKeyEditor({ artkeyId = null }: ArtKeyEditorProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f7' }}>
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-3 border-gray-300 border-t-gray-800 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading editor...</p>
        </div>
      </div>
    }>
      <ArtKeyEditorContent artkeyId={artkeyId} />
    </Suspense>
  );
}
