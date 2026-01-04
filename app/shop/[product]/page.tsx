'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PRODUCT_CATALOG, getProductConfig, buildGelatoProductUid, calculatePrice, validateSelections } from '@/lib/productConfig';

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
});

// Frame color swatches for UI display
const frameSwatches: Record<string, { color: string; border: string }> = {
  'black': { color: '#1a1a1a', border: '#333333' },
  'white': { color: '#FFFFFF', border: '#CCCCCC' },
  'natural': { color: 'linear-gradient(135deg, #DEB887 0%, #D2B48C 50%, #C4A575 100%)', border: '#A0825A' },
  'walnut': { color: 'linear-gradient(135deg, #5D432C 0%, #8B6914 50%, #4A3520 100%)', border: '#3D2817' },
};

// Foil color swatches for UI display  
const foilSwatches: Record<string, { color: string }> = {
  'none': { color: 'transparent' },
  'gold': { color: 'linear-gradient(135deg, #FFD700 0%, #FFF8DC 30%, #DAA520 70%, #B8860B 100%)' },
  'silver': { color: 'linear-gradient(135deg, #C0C0C0 0%, #FFFFFF 30%, #A9A9A9 70%, #808080 100%)' },
  'rose-gold': { color: 'linear-gradient(135deg, #E8B4B8 0%, #FFE4E1 30%, #DDA0A0 70%, #C48888 100%)' },
  'copper': { color: 'linear-gradient(135deg, #B87333 0%, #DA8A47 30%, #CD7F32 70%, #A05A2C 100%)' },
};

// Base prices by product type (used when Gelato API doesn't return prices)
const BASE_PRICES: Record<string, number> = {
  card: 12.99,
  postcard: 8.99,
  invitation: 14.99,
  announcement: 12.99,
  print: 9.99,
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productType = params.product as string;
  
  // Get product config from productConfig.ts
  const productConfig = getProductConfig(productType);
  
  // State
  const [currentStep, setCurrentStep] = useState(0); // 0=options, 1=upload, 2=design, 3=artkey, 4=complete
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [artkeyId, setArtkeyId] = useState<string | null>(null);
  const [exportedSides, setExportedSides] = useState<Array<{ sideId: string; dataUrl: string; width: number; height: number }>>([]);
  
  // Derived state
  const isPrint = productType === 'print';
  const isCardType = ['card', 'postcard', 'invitation', 'announcement'].includes(productType);
  
  // Set default orientation if not selected (since it's handled in editor)
  const selectionsWithDefaults = {
    ...selections,
    orientation: selections.orientation || 'vertical', // Default to portrait
  };
  
  // Build Gelato product UID from selections
  const gelatoProductUid = productConfig ? buildGelatoProductUid(productType, selectionsWithDefaults) : null;
  
  // Validate selections (orientation is optional, handled in editor)
  const validation = productConfig ? validateSelections(productType, selectionsWithDefaults) : { valid: false, missing: [] };
  
  // Calculate total price
  const basePrice = BASE_PRICES[productType] || 12.99;
  const totalPrice = productConfig ? calculatePrice(basePrice, productType, selections) * quantity : basePrice * quantity;
  
  // Helper to update a selection
  const updateSelection = (groupId: string, optionId: string) => {
    setSelections(prev => ({ ...prev, [groupId]: optionId }));
  };

  // Log in dev mode when selections change
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && gelatoProductUid) {
      console.log('[ProductPage] Gelato Product UID:', gelatoProductUid, 'Selections:', selections);
    }
  }, [gelatoProductUid, selections]);

  // Check if can proceed (all required options selected)
  const canProceed = () => {
    return validation.valid;
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
    if (typeof e.target !== 'undefined' && e.target) {
      e.target.value = '';
    }
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
          selections,
          quantity,
          gelatoProductUid,
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
    const sizeId = selections.size;
    if (!sizeId) return { width: 800, height: 600, name: 'Default' };
    // Parse size from option name (e.g., "5x7" or "A5")
    const sizeOption = productConfig?.optionGroups
      .find(g => g.id === 'size')?.options
      .find(o => o.id === sizeId);
    const sizeName = sizeOption?.name || sizeId;
    // Try to extract dimensions from name like "5x7" or "A5 (5.8" × 8.3")"
    const match = sizeName.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/);
    if (match) {
      const [, w, h] = match;
      const scale = 100;
      return { width: parseFloat(w) * scale, height: parseFloat(h) * scale, name: sizeName };
    }
    return { width: 800, height: 600, name: sizeName };
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
            {productConfig && (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <div className="flex items-start gap-6">
                  <div className="text-6xl">{productConfig.icon}</div>
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-brand-darkest mb-4 font-playfair">
                      {productConfig.name}
                    </h1>
                    <p className="text-lg text-brand-dark mb-6">{productConfig.description}</p>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-darkest mb-3 font-playfair">
                        Perfect For:
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-brand-dark">
                        {productConfig.examples.map((example, idx) => (
                          <li key={idx}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Options Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-brand-darkest mb-8 font-playfair">
                Choose Your Options
              </h2>

              {productConfig && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Options Column */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Dynamic Option Groups from productConfig - exclude orientation (handled in editor) */}
                    {productConfig.optionGroups
                      .filter(group => group.id !== 'orientation') // Remove orientation from shop page
                      .map((group) => (
                      <div key={group.id}>
                        <h3 className="text-lg font-semibold text-brand-darkest mb-2">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-brand-dark mb-4">{group.description}</p>
                        )}
                        <div className={`grid gap-4 ${
                          group.id === 'size' ? 'grid-cols-2 md:grid-cols-4' :
                          group.id === 'orientation' ? 'grid-cols-2' :
                          group.id === 'frame' || group.id === 'foil' ? 'grid-cols-2 md:grid-cols-4' :
                          'grid-cols-2 md:grid-cols-3'
                        }`}>
                          {group.options.map((option) => {
                            const isSelected = selections[group.id] === option.id;
                            const hasColorSwatch = option.swatch && option.swatch !== 'transparent';
                            const isFrame = group.id === 'frame' && option.id !== 'none';
                            const isFoil = group.id === 'foil' && option.id !== 'none';
                            
                            return (
                              <button
                                key={option.id}
                                onClick={() => updateSelection(group.id, option.id)}
                                className={`p-4 rounded-xl border-2 transition-all text-center ${
                                  isSelected
                                    ? 'border-brand-darkest bg-brand-lightest shadow-md'
                                    : 'border-brand-light hover:border-brand-medium'
                                }`}
                              >
                                {/* Frame swatch (square shape) */}
                                {isFrame && hasColorSwatch && (
                                  <div
                                    className="w-12 h-12 rounded mx-auto mb-2 shadow-md border-2"
                                    style={{
                                      background: option.swatch,
                                      borderColor: option.swatch === '#ffffff' ? '#ccc' : option.swatch,
                                    }}
                                  />
                                )}
                                {/* Foil swatch (circle with gradient) */}
                                {isFoil && hasColorSwatch && (
                                  <div
                                    className="w-12 h-12 rounded-full mx-auto mb-2 shadow-inner border border-gray-200"
                                    style={{ 
                                      background: option.swatch === '#D4AF37' 
                                        ? 'linear-gradient(135deg, #FFD700 0%, #FFF8DC 30%, #DAA520 70%, #B8860B 100%)' 
                                        : option.swatch === '#C0C0C0'
                                        ? 'linear-gradient(135deg, #C0C0C0 0%, #FFFFFF 30%, #A9A9A9 70%, #808080 100%)'
                                        : option.swatch 
                                    }}
                                  />
                                )}
                                {/* Image preview for papers/materials */}
                                {option.image && !hasColorSwatch && (
                                  <div className="w-full h-16 rounded mb-2 bg-gray-100 overflow-hidden">
                                    <img 
                                      src={option.image} 
                                      alt={option.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Hide broken images
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="font-bold text-brand-darkest text-sm">{option.name}</div>
                                {option.description && (
                                  <div className="text-xs text-brand-dark mt-1">{option.description}</div>
                                )}
                                {option.priceModifier !== undefined && option.priceModifier !== 0 && (
                                  <div className="text-xs text-green-600 font-semibold mt-1">
                                    +${option.priceModifier.toFixed(2)}
                                  </div>
                                )}
                                {option.priceModifier === 0 && group.id !== 'size' && group.id !== 'orientation' && (
                                  <div className="text-xs text-brand-dark mt-1">Included</div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

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
                        {productConfig.optionGroups
                          .filter(group => group.id !== 'orientation') // Don't show orientation in summary
                          .map((group) => {
                            const selectedOption = group.options.find(o => o.id === selections[group.id]);
                            return selectedOption ? (
                              <div key={group.id}>
                                {group.name}: {selectedOption.name}
                              </div>
                            ) : (
                              <div key={group.id} className="text-white/60">
                                {group.name}: <span className="italic">Select...</span>
                              </div>
                            );
                          })}
                        <div>Quantity: {quantity}</div>
                        {process.env.NODE_ENV === 'development' && gelatoProductUid && (
                          <div className="text-xs text-white/60 mt-2 pt-2 border-t border-white/20">
                            Gelato UID: <code className="text-xs break-all">{gelatoProductUid}</code>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-white/20 pt-4 mb-6">
                        <div className="flex justify-between text-xl font-bold">
                          <span>Total:</span>
                          <span>${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setCurrentStep(1)}
                        disabled={!canProceed()}
                        className="w-full py-4 bg-white text-brand-darkest rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={!canProceed() ? 'Please complete all required options' : ''}
                      >
                        Continue to Upload Image
                      </button>
                      {!validation.valid && validation.missing.length > 0 && (
                        <p className="text-white/60 text-xs mt-2 text-center">
                          Please select: {validation.missing.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                  <div className="text-5xl mb-4">{'\uD83D\uDCF7'}</div>
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
                onClick={() => {
                  // Prevent Step 2 if options not complete
                  if (!validation.valid) {
                    alert(`Please select: ${validation.missing.join(', ')}`);
                    return;
                  }
                  setCurrentStep(2);
                }}
                disabled={uploadedImages.length === 0 || !validation.valid}
                className="w-full py-4 bg-brand-darkest text-white rounded-lg font-bold hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={!validation.valid ? `Please select: ${validation.missing.join(', ')}` : ''}
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
                  <div className="text-6xl mb-4">{'\u26A0\uFE0F'}</div>
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
              gelatoVariantUid={gelatoProductUid || undefined}
              selectedVariant={{
                uid: gelatoProductUid || '',
                size: selections.size || null,
                orientation: (selectionsWithDefaults.orientation === 'horizontal' ? 'landscape' : 'portrait'), // Map to editor format
                material: selections.material || null,
                paper: selections.paper || null,
                frame: selections.frame || null,
                foil: selections.foil || null, // Pass foil selection from shop page
                fold: selections.fold || null, // Pass fold selection (bifold or flat)
                price: totalPrice,
              }}
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
              <div className="text-6xl mb-6">{'\u2705'}</div>
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
                            {Math.round(exportItem.width)} ├ù {Math.round(exportItem.height)} px
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
              <div className="text-6xl mb-6">{'\uD83C\uDF89'}</div>
              <h1 className="text-4xl font-bold text-brand-darkest mb-4 font-playfair">
                Your Order is Ready!
              </h1>
              <p className="text-lg text-brand-dark mb-8">
                Your {productConfig?.name || 'Product'} with ArtKey Portal is ready for checkout.
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

