'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Dynamic import for Project Editor (Konva-based)
const ProjectEditor = dynamic(() => import('@/components/ProjectEditor/ProjectEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-brand-dark border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-brand-dark">Loading Project Editor...</p>
      </div>
    </div>
  ),
  onError: (error) => {
    console.error('Failed to load Project Editor:', error);
  },
});

// Product information
const productInfo: Record<string, { title: string; description: string; icon: string; examples: string[] }> = {
  card: {
    title: 'Greeting Cards',
    description: 'Beautiful cards for birthdays, holidays, thank yous, and everyday moments.',
    icon: '💌',
    examples: [
      'Birthday celebrations',
      'Thank you notes',
      'Holiday greetings',
      'Get well wishes',
      'Congratulations',
    ],
  },
  postcard: {
    title: 'Postcards',
    description: 'Share memories and moments with custom postcards.',
    icon: '📮',
    examples: [
      'Travel memories',
      'Event announcements',
      'Save the dates',
      'Business promotions',
      'Art prints',
    ],
  },
  invitation: {
    title: 'Invitations',
    description: 'Elegant invitations for weddings, parties, and special events.',
    icon: '💒',
    examples: [
      'Wedding invitations',
      'Birthday parties',
      'Baby showers',
      'Graduation celebrations',
      'Corporate events',
    ],
  },
  announcement: {
    title: 'Announcements',
    description: 'Share your news with beautifully designed announcements.',
    icon: '📢',
    examples: [
      'Birth announcements',
      'Engagement news',
      'Moving announcements',
      'Business launches',
      'Graduation announcements',
    ],
  },
  print: {
    title: 'Wall Art',
    description: 'Transform your photos into stunning wall art with prints, canvas, and frames.',
    icon: '🖼️',
    examples: [
      'Family portraits',
      'Landscape photography',
      'Abstract art',
      'Pet photos',
      'Memory collages',
    ],
  },
};

// Frame color options with actual color values
const frameColors = [
  { name: 'Black', color: '#000000', border: '#333333' },
  { name: 'White', color: '#FFFFFF', border: '#CCCCCC' },
  { name: 'Silver', color: 'linear-gradient(135deg, #C0C0C0 0%, #E8E8E8 50%, #A0A0A0 100%)', border: '#888888' },
  { name: 'Gold', color: 'linear-gradient(135deg, #D4AF37 0%, #F5D76E 50%, #C5A028 100%)', border: '#B8960C' },
  { name: 'Natural Wood', color: 'linear-gradient(135deg, #DEB887 0%, #D2B48C 50%, #C4A575 100%)', border: '#A0825A' },
];

// Foil color options with actual color values
const foilColors = [
  { name: 'Gold', color: 'linear-gradient(135deg, #FFD700 0%, #FFF8DC 30%, #DAA520 70%, #B8860B 100%)', price: 5.00 },
  { name: 'Silver', color: 'linear-gradient(135deg, #C0C0C0 0%, #FFFFFF 30%, #A9A9A9 70%, #808080 100%)', price: 5.00 },
  { name: 'Rose Gold', color: 'linear-gradient(135deg, #E8B4B8 0%, #FFE4E1 30%, #DDA0A0 70%, #C48888 100%)', price: 6.00 },
  { name: 'Copper', color: 'linear-gradient(135deg, #B87333 0%, #DA8A47 30%, #CD7F32 70%, #A05A2C 100%)', price: 5.00 },
];

// Size options by product type
const sizeOptions: Record<string, { name: string; price: number }[]> = {
  card: [
    { name: '4x6', price: 12.99 },
    { name: '5x7', price: 15.99 },
    { name: '6x9', price: 19.99 },
  ],
  postcard: [
    { name: '4x6', price: 10.99 },
    { name: '5x7', price: 13.99 },
  ],
  invitation: [
    { name: '5x7', price: 18.99 },
    { name: '6x9', price: 24.99 },
  ],
  announcement: [
    { name: '4x6', price: 14.99 },
    { name: '5x7', price: 17.99 },
  ],
  print: [
    { name: '5x7', price: 9.99 },
    { name: '8x10', price: 14.99 },
    { name: '11x14', price: 24.99 },
    { name: '16x20', price: 39.99 },
    { name: '24x36', price: 89.99 },
  ],
};

// Paper types for cards
const paperTypes = [
  { name: 'Premium Cardstock', description: '350gsm coated silk', price: 0 },
  { name: 'Matte Cardstock', description: '350gsm matte finish', price: 0 },
  { name: 'Linen Cardstock', description: '350gsm textured linen', price: 2.00 },
  { name: 'Recycled', description: '350gsm eco-friendly', price: 0 },
];

// Materials for prints
const printMaterials = [
  { name: 'Glossy Paper', price: 0 },
  { name: 'Matte Paper', price: 2.00 },
  { name: 'Canvas', price: 15.00 },
  { name: 'Metal', price: 35.00 },
];

// Variant option types
interface VariantOption {
  name: string;
  description?: string;
}

interface NormalizedVariant {
  uid: string;
  name: string;
  price: number;
  size: string | null;
  material: string | null;
  paper: string | null;
  frame: string | null;
  foil: string | null;
  attributes: Record<string, any>;
}

interface VariantsData {
  sizes: VariantOption[];
  materials: VariantOption[];
  frames?: VariantOption[];
  foilColors?: VariantOption[];
  variants: NormalizedVariant[];
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productType = params.product as string;
  
  // Variants API state
  const [variantsData, setVariantsData] = useState<VariantsData | null>(null);
  const [variantsLoading, setVariantsLoading] = useState(true);
  const [variantsError, setVariantsError] = useState<string | null>(null);
  
  // State
  const [currentStep, setCurrentStep] = useState(0); // 0=options, 1=upload, 2=design, 3=artkey, 4=complete
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [isFramed, setIsFramed] = useState<boolean | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [hasFoil, setHasFoil] = useState<boolean | null>(null);
  const [selectedFoil, setSelectedFoil] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // Legacy, kept for compatibility
  const [artkeyId, setArtkeyId] = useState<string | null>(null);
  
  // Variant matching state
  const [selectedVariant, setSelectedVariant] = useState<NormalizedVariant | null>(null);
  const [gelatoVariantUid, setGelatoVariantUid] = useState<string | null>(null);

  const info = productInfo[productType] || productInfo.card;
  const isPrint = productType === 'print';
  const isCardType = ['card', 'postcard', 'invitation', 'announcement'].includes(productType);
  
  // Use variants data if available, otherwise fallback to hardcoded (for error state)
  const sizes = variantsData?.sizes || sizeOptions[productType] || sizeOptions.card;
  const paperTypesList = variantsData?.materials || paperTypes;
  const printMaterialsList = variantsData?.materials || printMaterials;
  const frameColorsList = variantsData?.frames || frameColors;
  const foilColorsList = variantsData?.foilColors || foilColors;

  // Fetch variants on mount
  useEffect(() => {
    const fetchVariants = async () => {
      setVariantsLoading(true);
      setVariantsError(null);
      
      try {
        const response = await fetch(`/api/gelato/variants?productType=${productType}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch variants: ${response.statusText}`);
        }
        
        const data = await response.json();
        setVariantsData(data);
      } catch (error: any) {
        console.error('Error fetching variants:', error);
        setVariantsError(error.message || 'Failed to load product options');
        // Keep hardcoded options as fallback
      } finally {
        setVariantsLoading(false);
      }
    };

    fetchVariants();
  }, [productType]);

  // Match variant based on current selections
  useEffect(() => {
    if (!variantsData?.variants || variantsData.variants.length === 0) {
      setSelectedVariant(null);
      setGelatoVariantUid(null);
      return;
    }

    // Build match criteria from selections
    const matchCriteria: Partial<NormalizedVariant> = {};
    
    if (selectedSize) matchCriteria.size = selectedSize;
    if (isPrint && selectedMaterial) matchCriteria.material = selectedMaterial;
    if (isCardType && selectedPaper) matchCriteria.paper = selectedPaper;
    if (isPrint && isFramed && selectedFrame) matchCriteria.frame = selectedFrame;
    if (isCardType && hasFoil && selectedFoil) matchCriteria.foil = selectedFoil;
    else if (isCardType && hasFoil === false) matchCriteria.foil = null;

    // Find matching variant
    const matchedVariant = variantsData.variants.find((variant) => {
      // Check all criteria match
      if (matchCriteria.size && variant.size !== matchCriteria.size) return false;
      if (matchCriteria.material && variant.material !== matchCriteria.material) return false;
      if (matchCriteria.paper && variant.paper !== matchCriteria.paper) return false;
      if (matchCriteria.frame !== undefined) {
        if (matchCriteria.frame === null && variant.frame !== null) return false;
        if (matchCriteria.frame !== null && variant.frame !== matchCriteria.frame) return false;
      }
      if (matchCriteria.foil !== undefined) {
        if (matchCriteria.foil === null && variant.foil !== null) return false;
        if (matchCriteria.foil !== null && variant.foil !== matchCriteria.foil) return false;
      }
      return true;
    });

    if (matchedVariant) {
      setSelectedVariant(matchedVariant);
      setGelatoVariantUid(matchedVariant.uid);
      
      // Log in dev mode
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProductPage] Matched variant:', {
          uid: matchedVariant.uid,
          name: matchedVariant.name,
          price: matchedVariant.price,
          selections: matchCriteria,
        });
      }
    } else {
      setSelectedVariant(null);
      setGelatoVariantUid(null);
    }
  }, [variantsData, selectedSize, selectedMaterial, selectedPaper, selectedFrame, selectedFoil, isFramed, hasFoil, isPrint, isCardType]);

  // Calculate total price
  const calculateTotal = () => {
    // If we have a matched variant, use its price
    if (selectedVariant) {
      return (selectedVariant.price * quantity).toFixed(2);
    }
    
    // Fallback to hardcoded pricing if no variant match
    let total = 0;
    
    const sizeOption = sizes.find((s: any) => s.name === selectedSize);
    if (sizeOption && 'price' in sizeOption) total += sizeOption.price;
    
    if (isPrint) {
      const material = printMaterials.find((m: any) => m.name === selectedMaterial);
      if (material && 'price' in material) total += material.price;
      
      if (isFramed && selectedFrame) {
        total += 25.00; // Frame base price
      }
    }
    
    if (isCardType) {
      const paper = paperTypes.find((p: any) => p.name === selectedPaper);
      if (paper && 'price' in paper) total += paper.price;
      
      if (hasFoil && selectedFoil) {
        const foil = foilColors.find((f: any) => f.name === selectedFoil);
        if (foil && 'price' in foil) total += foil.price;
      }
    }
    
    return (total * quantity).toFixed(2);
  };

  // Check if can proceed
  const canProceed = () => {
    // Basic selection checks
    if (!selectedSize) return false;
    if (isPrint && !selectedMaterial) return false;
    if (isPrint && isFramed === null) return false;
    if (isPrint && isFramed && !selectedFrame) return false;
    if (isCardType && !selectedPaper) return false;
    if (isCardType && hasFoil && !selectedFoil) return false;
    
    // If using variants API, must have a matched variant
    if (variantsData && !selectedVariant) {
      return false;
    }
    
    return true;
  };
  
  // Check if current selection combination is invalid
  const hasInvalidCombination = () => {
    if (!variantsData || variantsData.variants.length === 0) return false;
    // If we have selections but no matched variant, it's invalid
    return !selectedVariant && (
      selectedSize !== null ||
      selectedMaterial !== null ||
      selectedPaper !== null ||
      selectedFrame !== null ||
      selectedFoil !== null
    );
  };

  // Handle image upload - now uses shared asset store
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Import dynamically to avoid SSR issues
    const { useAssetStore } = await import('@/lib/assetStore');
    const { addAsset } = useAssetStore.getState();

    // Process each file
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file. Please upload an image.`);
        continue;
      }

      // Convert file to data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Calculate approximate bytes (use file.size if available, otherwise estimate from data URL)
      const bytesApprox = file.size || Math.round((dataUrl.length * 3) / 4);

      // Load image to get dimensions
      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = dataUrl;
      });

      const asset = {
        id: `asset-${Date.now()}-${Math.random()}`,
        name: file.name,
        mimeType: file.type,
        width: img.naturalWidth,
        height: img.naturalHeight,
        src: dataUrl, // Use data URL as src (not blob URL)
        origin: 'uploader' as const,
        dataUrl,
        bytesApprox,
        file, // Keep file reference for potential cleanup
      };

      addAsset(asset);

      // Also add to legacy state for backward compatibility
      setUploadedImages((prev) => [...prev, dataUrl]);
    }

    // Reset input
    e.target.value = '';
  };

  // Handle design complete from ProjectEditor - save design and navigate to ArtKey editor
  const handleProjectEditorComplete = async (exportData: { 
    productSlug?: string;
    printSpecId?: string;
    exports: Array<{ sideId: string; dataUrl: string; width: number; height: number }>;
  }) => {
    try {
      // Generate ArtKey ID
      const newArtkeyId = 'artkey-' + Date.now().toString(36);
      setArtkeyId(newArtkeyId);
      
      if (!exportData.exports || exportData.exports.length === 0) {
        throw new Error('No export data available');
      }
      
      // Use the first export (or front side if available) as main image
      const mainExport = exportData.exports.find(e => e.sideId === 'front') || exportData.exports[0];
      if (!mainExport) {
        throw new Error('No export data available');
      }
      
      let imageUrl = mainExport.dataUrl; // Base64 data URL
      
      // Optionally upload to WordPress media library for permanent storage
      try {
        // Convert dataUrl to blob
        const response = await fetch(mainExport.dataUrl);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('file', blob, `design-${newArtkeyId}.png`);
        formData.append('title', `Design for ${productType} - ${newArtkeyId}`);
        
        const uploadResponse = await fetch('/api/wordpress/media/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          if (uploadData.url) {
            imageUrl = uploadData.url;
            console.log('Design image uploaded to WordPress:', uploadData.url);
          }
        }
      } catch (uploadError) {
        console.log('WordPress upload not available, using dataUrl:', uploadError);
      }
      
      // Save design data to localStorage for persistence
      const designSaveData = {
        artkeyId: newArtkeyId,
        designData: {
          imageUrl,
          productType,
          productSlug: exportData.productSlug,
          printSpecId: exportData.printSpecId,
          exportedSides: exportData.exports,
        },
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem(`design-${newArtkeyId}`, JSON.stringify(designSaveData));
      
      // Store exported sides for Step 3 preview
      setExportedSides(exportData.exports);
      
      // Navigate to Step 3 (preview/confirmation)
      setCurrentStep(3);
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Failed to save design. Please try again.');
    }
  };

  // Handle design complete - save design and navigate to ArtKey editor (legacy, kept for compatibility)
  const handleDesignComplete = async (designData: any) => {
    try {
      // Generate ArtKey ID
      const newArtkeyId = 'artkey-' + Date.now().toString(36);
      setArtkeyId(newArtkeyId);
      
      // Upload design image to server/WordPress for Gelato (if needed later)
      // For now, we'll save the dataUrl which can be converted to a file when needed
      let imageUrl = designData.imageDataUrl; // Base64 data URL
      
      // Optionally upload to WordPress media library for permanent storage
      // This makes it ready for Gelato API later (Gelato needs a URL, not base64)
      try {
        const formData = new FormData();
        // Convert dataUrl to Blob for upload
        const response = await fetch(designData.imageDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `design-${newArtkeyId}.png`, { type: 'image/png' });
        formData.append('file', file);
        formData.append('title', `Design for ${productType} - ${newArtkeyId}`);
        
        // Try to upload to WordPress media library
        const uploadResponse = await fetch('/api/wordpress/media/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          if (uploadData.url) {
            imageUrl = uploadData.url; // Use WordPress URL instead of dataUrl
            console.log('Design image uploaded to WordPress:', uploadData.url);
          }
        }
      } catch (uploadError) {
        console.log('WordPress upload not available, using dataUrl:', uploadError);
        // Continue with dataUrl - can be converted to file when needed for Gelato
        // Note: For Gelato, you'll need to convert dataUrl to a file and upload it
      }
      
      // Save design data to localStorage for persistence
      const designSaveData = {
        artkeyId: newArtkeyId,
        designData: {
          imageDataUrl: designData.imageDataUrl, // Keep original for display
          imageUrl: imageUrl, // WordPress URL if uploaded, or dataUrl (ready for Gelato)
          dimensions: designData.dimensions,
          dpi: designData.dpi,
          productType: designData.productType,
          productSize: designData.productSize,
          // Store as base64 string for localStorage (Blob can't be stored)
          // This can be converted back to a file for Gelato when needed
          imageBase64: designData.imageDataUrl.split(',')[1], // Remove data:image/png;base64, prefix
          // Gelato-ready: If imageUrl is a WordPress URL, it's ready for Gelato API
          // If it's still a dataUrl, convert to file before sending to Gelato
        },
        productInfo: {
          productType,
          selectedSize,
          selectedPaper,
          selectedMaterial,
          selectedFrame,
          selectedFoil,
          isFramed,
          hasFoil,
          quantity,
        },
        timestamp: new Date().toISOString(),
      };
      
      // Save to localStorage
      localStorage.setItem(`design_${newArtkeyId}`, JSON.stringify(designSaveData));
      
      // Also save a reference for quick access
      const savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
      savedDesigns.push({
        artkeyId: newArtkeyId,
        productType,
        timestamp: designSaveData.timestamp,
      });
      localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns));
      
      // Navigate directly to ArtKey editor
      router.push(`/art-key/editor?product_type=${productType}&artkey_id=${newArtkeyId}`);
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Failed to save design. Please try again.');
    }
  };

  // Navigate to ArtKey editor
  const goToArtKeyEditor = () => {
    if (artkeyId) {
      router.push(`/art-key/editor?product_type=${productType}&artkey_id=${artkeyId}`);
    }
  };

  // Get canvas size for design editor
  const getCanvasSize = () => {
    if (!selectedSize) return { width: 800, height: 600, name: 'Default' };
    const [w, h] = selectedSize.split('x').map(Number);
    const scale = 100;
    return { width: w * scale, height: h * scale, name: selectedSize };
  };

  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      
      <div className="pt-24 pb-12">
        {/* Step 0: Product Options */}
        {currentStep === 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header with back button */}
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/shop"
                className="flex items-center gap-2 text-brand-dark hover:text-brand-darkest transition-colors"
              >
                <span className="text-xl">&#8592;</span>
                <span>Back to Products</span>
              </Link>
              <Link
                href="/shop"
                className="text-2xl text-brand-dark hover:text-brand-darkest"
                title="Close"
              >
                &#10005;
              </Link>
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-start gap-6">
                <div className="text-6xl">{info.icon}</div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-brand-darkest mb-4 font-playfair">
                    {info.title}
                  </h1>
                  <p className="text-lg text-brand-dark mb-6">{info.description}</p>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-darkest mb-3 font-playfair">
                      Perfect For:
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-brand-dark">
                      {info.examples.map((example, idx) => (
                        <li key={idx}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Options Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-brand-darkest mb-8 font-playfair">
                Choose Your Options
              </h2>

              {/* Loading State */}
              {variantsLoading && (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-brand-dark border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-brand-dark">Loading options...</p>
                </div>
              )}

              {/* Error State */}
              {variantsError && !variantsLoading && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-800 mb-2">Unable to load product options</h3>
                      <p className="text-yellow-700 text-sm mb-4">{variantsError}</p>
                      <button
                        onClick={() => {
                          setVariantsLoading(true);
                          setVariantsError(null);
                          fetch(`/api/gelato/variants?productType=${productType}`)
                            .then(res => res.json())
                            .then(data => {
                              setVariantsData(data);
                              setVariantsLoading(false);
                            })
                            .catch(err => {
                              setVariantsError(err.message);
                              setVariantsLoading(false);
                            });
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                  <p className="text-yellow-600 text-xs mt-4">Using default options. Some features may be limited.</p>
                </div>
              )}

              {/* Invalid Combination Message */}
              {hasInvalidCombination() && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-red-800 font-semibold">⚠️ This combination isn't available.</p>
                  <p className="text-red-700 text-sm mt-1">Please select different options.</p>
                </div>
              )}

              {!variantsLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Options Column */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Size Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-brand-darkest mb-4">Select Size</h3>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {sizes.map((size: any) => (
                        <button
                          key={size.name}
                          onClick={() => setSelectedSize(size.name)}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            selectedSize === size.name
                              ? 'border-brand-darkest bg-brand-lightest shadow-md'
                              : 'border-brand-light hover:border-brand-medium'
                          }`}
                        >
                          <div className="font-bold text-brand-darkest">{size.name}"</div>
                          <div className="text-sm text-brand-dark">${size.price.toFixed(2)}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paper Type (for cards) */}
                  {isCardType && (
                    <div>
                      <h3 className="text-lg font-semibold text-brand-darkest mb-4">Paper Type</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {paperTypesList.map((paper: any) => (
                          <button
                            key={paper.name}
                            onClick={() => setSelectedPaper(paper.name)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              selectedPaper === paper.name
                                ? 'border-brand-darkest bg-brand-lightest shadow-md'
                                : 'border-brand-light hover:border-brand-medium'
                            }`}
                          >
                            <div className="font-bold text-brand-darkest text-sm">{paper.name}</div>
                            {paper.description && (
                              <div className="text-xs text-brand-dark">{paper.description}</div>
                            )}
                            {paper.price !== undefined && (
                              <div className="text-sm text-brand-dark mt-1">
                                {paper.price === 0 ? 'Included' : `+$${paper.price.toFixed(2)}`}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Material (for prints) */}
                  {isPrint && (
                    <div>
                      <h3 className="text-lg font-semibold text-brand-darkest mb-4">Material</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {printMaterialsList.map((material: any) => (
                          <button
                            key={material.name}
                            onClick={() => setSelectedMaterial(material.name)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              selectedMaterial === material.name
                                ? 'border-brand-darkest bg-brand-lightest shadow-md'
                                : 'border-brand-light hover:border-brand-medium'
                            }`}
                          >
                            <div className="font-bold text-brand-darkest">{material.name}</div>
                            {material.price !== undefined && (
                              <div className="text-sm text-brand-dark">
                                {material.price === 0 ? 'Included' : `+$${material.price.toFixed(2)}`}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Foil Options (for cards) */}
                  {isCardType && (
                    <div>
                      <h3 className="text-lg font-semibold text-brand-darkest mb-4">Add Foil Accent?</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <button
                          onClick={() => { setHasFoil(false); setSelectedFoil(null); }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            hasFoil === false
                              ? 'border-brand-darkest bg-brand-lightest shadow-md'
                              : 'border-brand-light hover:border-brand-medium'
                          }`}
                        >
                          <div className="font-bold text-brand-darkest">No Foil</div>
                          <div className="text-sm text-brand-dark">Standard printing</div>
                        </button>
                        <button
                          onClick={() => setHasFoil(true)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            hasFoil === true
                              ? 'border-brand-darkest bg-brand-lightest shadow-md'
                              : 'border-brand-light hover:border-brand-medium'
                          }`}
                        >
                          <div className="font-bold text-brand-darkest">Add Foil</div>
                          <div className="text-sm text-brand-dark">Metallic accent</div>
                        </button>
                      </div>

                      {/* FOIL COLOR SAMPLES */}
                      {hasFoil && (
                        <div className="grid grid-cols-4 gap-4">
                          {foilColorsList.map((foil: any) => (
                            <button
                              key={foil.name}
                              onClick={() => setSelectedFoil(foil.name)}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                selectedFoil === foil.name
                                  ? 'border-brand-darkest bg-brand-lightest shadow-md'
                                  : 'border-brand-light hover:border-brand-medium'
                              }`}
                            >
                              {/* COLOR SAMPLE CIRCLE */}
                              {foil.color && (
                                <div
                                  className="w-12 h-12 rounded-full mx-auto mb-2 shadow-inner"
                                  style={{ background: foil.color }}
                                />
                              )}
                              <div className="font-bold text-brand-darkest text-sm text-center">
                                {foil.name}
                              </div>
                              {foil.price !== undefined && (
                                <div className="text-xs text-brand-dark text-center">
                                  +${foil.price.toFixed(2)}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Frame Options (for prints) */}
                  {isPrint && (
                    <div>
                      <h3 className="text-lg font-semibold text-brand-darkest mb-4">Framing</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <button
                          onClick={() => { setIsFramed(false); setSelectedFrame(null); }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isFramed === false
                              ? 'border-brand-darkest bg-brand-lightest shadow-md'
                              : 'border-brand-light hover:border-brand-medium'
                          }`}
                        >
                          <div className="font-bold text-brand-darkest">Unframed</div>
                          <div className="text-sm text-brand-dark">Print only</div>
                        </button>
                        <button
                          onClick={() => setIsFramed(true)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isFramed === true
                              ? 'border-brand-darkest bg-brand-lightest shadow-md'
                              : 'border-brand-light hover:border-brand-medium'
                          }`}
                        >
                          <div className="font-bold text-brand-darkest">Framed</div>
                          <div className="text-sm text-brand-dark">+$25.00</div>
                        </button>
                      </div>

                      {/* FRAME COLOR SAMPLES */}
                      {isFramed && (
                        <div className="grid grid-cols-5 gap-4">
                          {frameColorsList.map((frame: any) => (
                            <button
                              key={frame.name}
                              onClick={() => setSelectedFrame(frame.name)}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                selectedFrame === frame.name
                                  ? 'border-brand-darkest bg-brand-lightest shadow-md'
                                  : 'border-brand-light hover:border-brand-medium'
                              }`}
                            >
                              {/* COLOR SAMPLE SQUARE (like a frame) */}
                              {frame.color && (
                                <div
                                  className="w-12 h-12 rounded mx-auto mb-2 shadow-md"
                                  style={{
                                    background: frame.color,
                                    border: frame.border ? `3px solid ${frame.border}` : undefined,
                                  }}
                                />
                              )}
                              <div className="font-bold text-brand-darkest text-xs text-center">
                                {frame.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <h3 className="text-lg font-semibold text-brand-darkest mb-4">Quantity</h3>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 rounded-lg border-2 border-brand-light hover:border-brand-medium font-bold text-xl"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center text-lg font-semibold border-2 border-brand-light rounded-lg py-2"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-12 h-12 rounded-lg border-2 border-brand-light hover:border-brand-medium font-bold text-xl"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 bg-brand-darkest text-white rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4">Order Summary</h3>
                    <div className="space-y-2 text-sm mb-4">
                      {selectedSize && <div>Size: {selectedSize}"</div>}
                      {selectedPaper && <div>Paper: {selectedPaper}</div>}
                      {selectedMaterial && <div>Material: {selectedMaterial}</div>}
                      {isFramed !== null && (
                        <div>Frame: {isFramed ? (selectedFrame || 'Select color') : 'Unframed'}</div>
                      )}
                      {hasFoil !== null && (
                        <div>Foil: {hasFoil ? (selectedFoil || 'Select color') : 'None'}</div>
                      )}
                      <div>Quantity: {quantity}</div>
                      {process.env.NODE_ENV === 'development' && gelatoVariantUid && (
                        <div className="text-xs text-white/60 mt-2 pt-2 border-t border-white/20">
                          Gelato UID: <code className="text-xs break-all">{gelatoVariantUid}</code>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-white/20 pt-4 mb-6">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total:</span>
                        <span>${calculateTotal()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      disabled={!canProceed()}
                      className="w-full py-4 bg-white text-brand-darkest rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={!canProceed() ? (hasInvalidCombination() ? 'This combination isn\'t available' : 'Please complete all required options') : ''}
                    >
                      Continue to Upload Image
                    </button>
                    {hasInvalidCombination() && (
                      <p className="text-red-300 text-xs mt-2 text-center">⚠️ This combination isn't available</p>
                    )}
                    {hasInvalidCombination() && (
                      <p className="text-red-300 text-xs mt-2 text-center">⚠️ This combination isn't available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Upload Images */}
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-brand-darkest font-playfair">
                  Upload Your Images
                </h2>
                <button
                  onClick={() => setCurrentStep(0)}
                  className="text-brand-dark hover:text-brand-darkest"
                >
                  &#8592; Back to Options
                </button>
              </div>

              <div className="border-2 border-dashed border-brand-light rounded-xl p-12 text-center mb-6">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  <div className="text-5xl mb-4">📷</div>
                  <p className="text-lg text-brand-dark mb-2">Click to upload images</p>
                  <p className="text-sm text-brand-dark">JPG, PNG, or BMP format</p>
                </label>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-brand-darkest mb-4">
                    Uploaded Images ({uploadedImages.length})
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm"
                        >
                          &#10005;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setCurrentStep(2)}
                disabled={uploadedImages.length === 0}
                className="w-full py-4 bg-brand-darkest text-white rounded-lg font-bold hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue to Project Editor
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Project Editor */}
        {currentStep === 2 && (
          <ErrorBoundary
            fallback={
              <div className="min-h-screen bg-brand-lightest flex items-center justify-center p-8">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h2 className="text-2xl font-bold text-brand-darkest mb-4 font-playfair">
                    Project Editor Error
                  </h2>
                  <p className="text-brand-dark mb-6">
                    The Project Editor failed to load. This may be due to a browser compatibility issue or missing dependencies.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-3 bg-brand-darkest text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors mr-3"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Reload Page
                    </button>
                  </div>
                </div>
              </div>
            }
          >
            <ProjectEditor
              productSlug={productType}
              config={{
                productSlug: productType,
                qrRequired: isCardType && quantity > 1, // Require QR for card products with quantity > 1
                allowedSidesForQR: ['front'],
                qrPlacementMode: 'flexible',
                defaultSkeletonKeyId: isCardType ? 'card_classic' : undefined,
                artKeyUrlPlaceholder: `https://theartfulexperience.com/artkey/PLACEHOLDER`,
              }}
              onComplete={handleProjectEditorComplete}
              onClose={() => setCurrentStep(1)}
            />
          </ErrorBoundary>
        )}

        {/* Step 3: Export Preview & ArtKey Transition */}
        {currentStep === 3 && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-6">✨</div>
              <h2 className="text-3xl font-bold text-brand-darkest mb-4 font-playfair">
                Design Complete!
              </h2>
              <p className="text-lg text-brand-dark mb-8">
                Review your exported design{exportedSides.length > 1 ? ' sides' : ''} before proceeding.
              </p>
              
              {/* Export Preview Thumbnails */}
              {exportedSides.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-brand-darkest mb-4">
                    Exported {exportedSides.length > 1 ? 'Sides' : 'Design'}
                  </h3>
                  <div className={`grid gap-4 ${exportedSides.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 sm:grid-cols-3'}`}>
                    {exportedSides.map((exportItem, idx) => (
                      <div key={idx} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                        <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={exportItem.dataUrl}
                            alt={`${exportItem.sideId} side`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-semibold capitalize">{exportItem.sideId}</p>
                          <p className="text-xs text-gray-500">
                            {Math.round(exportItem.width)} × {Math.round(exportItem.height)} px
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-brand-lightest rounded-xl p-6 mb-8">
                <p className="text-brand-darkest">
                  <strong>ArtKey ID:</strong> {artkeyId}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-4 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                >
                  Back to Editor
                </button>
                <button
                  onClick={goToArtKeyEditor}
                  className="px-8 py-4 bg-brand-darkest text-white rounded-lg font-bold hover:bg-brand-dark transition-colors"
                >
                  Continue to ArtKey Portal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Completion */}
        {currentStep === 4 && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="text-4xl font-bold text-brand-darkest mb-4 font-playfair">
                Your Order is Ready!
              </h1>
              <p className="text-lg text-brand-dark mb-8">
                Your {info.title} with ArtKey Portal is ready for checkout.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  className="px-8 py-4 bg-brand-light text-brand-darkest rounded-lg font-bold hover:bg-brand-medium transition-colors opacity-50 cursor-not-allowed"
                  disabled
                >
                  Save and Continue Shopping
                </button>
                <button
                  className="px-8 py-4 bg-brand-darkest text-white rounded-lg font-bold hover:bg-brand-dark transition-colors opacity-50 cursor-not-allowed"
                  disabled
                >
                  Save and Checkout
                </button>
              </div>
              <p className="text-sm text-brand-dark mt-4">
                (Checkout functionality coming soon)
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

