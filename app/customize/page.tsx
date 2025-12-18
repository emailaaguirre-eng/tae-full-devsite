"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Fabric.js
const PersonalizationStudio = dynamic(
  () => import("@/components/PersonalizationStudio"),
  { 
    ssr: false, 
    loading: () => (
      <div className="fixed inset-0 bg-gray-950/95 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Design Editor...</p>
        </div>
      </div>
    )
  }
);

interface DesignData {
  imageDataUrl: string;
  imageBlob: Blob;
  dimensions: { width: number; height: number };
  dpi: number;
  productType: string;
  productSize: string;
}

function CustomizeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const productId = searchParams.get("product_id") || "";
  const productType = searchParams.get("product_type") || "print";
  const productName = searchParams.get("product_name") || "Product";
  const basePrice = parseFloat(searchParams.get("price") || "0");
  const fromHero = searchParams.get("from_hero") === "true";
  const heroImages = searchParams.get("images")?.split(',').filter(Boolean) || [];
  const heroMessage = searchParams.get("message") || "";

  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  
  // Design data from Gelato editor
  const [designData, setDesignData] = useState<DesignData | null>(null);
  
  // Initial images from hero
  const [initialImages, setInitialImages] = useState<string[]>(heroImages);

  // State for customization options
  const [selectedSize, setSelectedSize] = useState<string | null>("8x10");
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [isFramed, setIsFramed] = useState<boolean | null>(null);
  const [frameColor, setFrameColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [showStudio, setShowStudio] = useState(false);
  const [existingArtKeyId, setExistingArtKeyId] = useState<string | null>(null);
  const [reuseExistingArtKey, setReuseExistingArtKey] = useState(false);

  // Generate short alphanumeric ArtKey IDs for portal URLs
  const generateArtKeyId = (length = 8) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Load any existing ArtKey ID to reuse (but don't auto-open design editor)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lastArtKeyId");
      if (stored) {
        setExistingArtKeyId(stored);
      }
    }
  }, []);
  
  // Get selected size for studio
  const getStudioSize = () => {
    if (selectedSize) {
      const parts = selectedSize.split('x');
      return { width: parseInt(parts[0]), height: parseInt(parts[1]), name: selectedSize };
    }
    return { width: 8, height: 10, name: '8x10' };
  };
  
  const handleDesignComplete = (data: DesignData) => {
    setDesignData(data);
    setShowStudio(false);
    setCurrentStep(2); // Move to product options
  };

  // Product-specific options
  const printSizes = [
    { name: "5x7", price: 9.99, gelatoUid: "prints_pt_cl" },
    { name: "8x10", price: 14.99, gelatoUid: "prints_pt_cl" },
    { name: "11x14", price: 24.99, gelatoUid: "prints_pt_cl" },
    { name: "16x20", price: 39.99, gelatoUid: "canvas_print_gallery_wrap" },
    { name: "20x24", price: 59.99, gelatoUid: "canvas_print_gallery_wrap" },
    { name: "24x36", price: 89.99, gelatoUid: "canvas_print_gallery_wrap" },
  ];

  const materials = [
    { name: "Glossy Paper", price: 0, gelatoUid: "prints_pt_cl" },
    { name: "Matte Paper", price: 2.00, gelatoUid: "prints_pt_cl" },
    { name: "Canvas", price: 15.00, gelatoUid: "canvas_print_gallery_wrap" },
    { name: "Metal", price: 35.00, gelatoUid: "metal_prints" },
  ];

  const frameColors = [
    { name: "Black", price: 0 },
    { name: "White", price: 5.00 },
    { name: "Silver", price: 6.00 },
  ];

  const cardTypes = [
    { name: "Holiday Cards", price: 19.99, gelatoUid: "cards_cl_dtc_prt_pt" },
    { name: "Birthday Cards", price: 15.99, gelatoUid: "cards_cl_dtc_prt_pt" },
    { name: "Thank You Cards", price: 14.99, gelatoUid: "cards_cl_dtc_prt_pt" },
  ];

  const calculateTotal = () => {
    let total = basePrice;
    
    if (productType === "print") {
      if (selectedSize) {
        const size = printSizes.find(s => s.name === selectedSize);
        if (size) total = size.price;
      }
      if (selectedMaterial) {
        const material = materials.find(m => m.name === selectedMaterial);
        if (material) total += material.price;
      }
      if (isFramed && frameColor) {
        const frame = frameColors.find(f => f.name === frameColor);
        if (frame) total += frame.price + 20; // Base frame cost
      }
    } else if (productType === "card") {
      // Card pricing handled by card type selection
    }
    
    return (total * quantity).toFixed(2);
  };

  const handleContinueToArtKey = () => {
    // Save customization to session/cart
    const customization = {
      productId,
      productType,
      productName,
      designData: designData, // Include the uploaded image/design
      customizations: {
        size: selectedSize,
        material: selectedMaterial,
        frame: isFramed ? frameColor : null,
        isFramed,
        quantity,
      },
      basePrice: parseFloat(calculateTotal()) / quantity,
      totalPrice: parseFloat(calculateTotal()),
    };

    // Store in sessionStorage
    sessionStorage.setItem("productCustomization", JSON.stringify(customization));

    // Choose ArtKey portal ID (reuse or new)
    const artKeyId =
      reuseExistingArtKey && existingArtKeyId
        ? existingArtKeyId
        : generateArtKeyId();
    sessionStorage.setItem("artKeyPortalId", artKeyId);
    if (!reuseExistingArtKey || !existingArtKeyId) {
      localStorage.setItem("lastArtKeyId", artKeyId);
    }

    // Navigate to ArtKey Editor - use /art-key/editor (not /artkey/editor)
    const params = new URLSearchParams({
      product_id: productId,
      product_type: productType,
      from_customize: "true",
      artkey_id: artKeyId,
    });
    router.push(`/art-key/editor?${params}`);
  };

  const canProceed = () => {
    if (productType === "print") {
      return selectedSize && selectedMaterial && isFramed !== null && (!isFramed || frameColor);
    } else if (productType === "card") {
      return true; // Cards have simpler requirements
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-brand-lightest pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-brand-darkest mb-2 font-playfair">
            Customize Your {productName}
          </h1>
          <p className="text-brand-dark">
            Start in the design editor, then pick options and finish in the ArtKey portal.
          </p>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center mt-6 gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 1 ? 'bg-brand-medium text-white' : 'bg-gray-200 text-gray-700'}`}>
              <span className={`w-6 h-6 rounded-full ${currentStep >= 1 ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'} flex items-center justify-center text-sm font-bold`}>1</span>
              <span className="hidden sm:inline">Design Editor</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 2 ? 'bg-brand-medium text-white' : 'bg-gray-200 text-gray-700'}`}>
              <span className={`w-6 h-6 rounded-full ${currentStep >= 2 ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'} flex items-center justify-center text-sm font-bold`}>2</span>
              <span className="hidden sm:inline">Product Options</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 3 ? 'bg-brand-medium text-white' : 'bg-gray-200 text-gray-700'}`}>
              <span className={`w-6 h-6 rounded-full ${currentStep >= 3 ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'} flex items-center justify-center text-sm font-bold`}>3</span>
              <span className="hidden sm:inline">ArtKey</span>
            </div>
          </div>
        </div>

        {/* Personalization Studio Modal */}
        {showStudio && (
          <PersonalizationStudio
            productType={productType as 'canvas' | 'print' | 'card' | 'poster' | 'photobook'}
            productSize={getStudioSize()}
            onComplete={handleDesignComplete}
            initialImages={initialImages}
            initialMessage={heroMessage}
            onClose={() => {
              console.log('Closing design editor');
              setShowStudio(false);
            }}
          />
        )}

        {/* Step 1: Design editor opens first */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* If coming from hero with images, auto-open studio */}
            {fromHero && initialImages.length > 0 && !showStudio && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <p className="text-brand-dark mb-4">Opening design editor with your selected images...</p>
                <button
                  onClick={() => setShowStudio(true)}
                  className="px-6 py-3 rounded-full font-semibold bg-brand-dark text-white hover:bg-brand-darkest transition-all shadow-md"
                >
                  Open Design Editor
                </button>
              </div>
            )}
            
            {/* Design Editor Button */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-brand-darkest mb-4 font-playfair">
                Design Your Product
              </h2>
              <p className="text-brand-dark mb-4">
                Start by opening the design editor to upload your image and create your design. 
                You&apos;ll be able to choose size and other options in the next step.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setShowStudio(true)}
                  className="px-8 py-4 rounded-full font-semibold bg-brand-dark text-white hover:bg-brand-darkest transition-all shadow-md text-lg"
                >
                  {fromHero && initialImages.length > 0 ? 'Open Design Editor' : 'Open Design Editor'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Product Options */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Image Preview */}
            {designData?.imageDataUrl && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-brand-darkest font-playfair">Your Design</h2>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-brand-medium hover:text-brand-dark underline text-sm"
                  >
                    Change Image
                  </button>
                </div>
                <div className="flex justify-center">
                  <img 
                    src={designData.imageDataUrl} 
                    alt="Your design" 
                    className="max-h-48 rounded-lg shadow-md"
                  />
                </div>
              </div>
            )}

        {/* Customization Options */}
        <div className="space-y-6">
          {/* Print-specific options */}
          {productType === "print" && (
            <>
              {/* Size Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-brand-darkest mb-4 font-playfair">
                  Choose Size
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {printSizes.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size.name)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedSize === size.name
                          ? "border-brand-dark bg-brand-light shadow-lg scale-105"
                          : "border-brand-light hover:border-brand-medium"
                      }`}
                    >
                      <div className="font-bold text-lg text-brand-darkest mb-1">
                        {size.name}&quot;
                      </div>
                      <div className={`font-semibold ${selectedSize === size.name ? "text-brand-darkest" : "text-brand-medium"}`}>
                        ${size.price}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Material Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-brand-darkest mb-4 font-playfair">
                  Choose Material
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {materials.map((material) => (
                    <button
                      key={material.name}
                      onClick={() => setSelectedMaterial(material.name)}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        selectedMaterial === material.name
                          ? "border-brand-dark bg-brand-light shadow-lg scale-105"
                          : "border-brand-light hover:border-brand-medium"
                      }`}
                    >
                      <div className="font-bold text-lg text-brand-darkest mb-1">
                        {material.name}
                      </div>
                      <div className={`font-semibold ${selectedMaterial === material.name ? "text-brand-darkest" : "text-brand-medium"}`}>
                        {material.price === 0 ? "Included" : `+$${material.price.toFixed(2)}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-brand-darkest mb-4 font-playfair">
                  Framed or Unframed?
                </h2>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <button
                    onClick={() => {
                      setIsFramed(false);
                      setFrameColor(null);
                    }}
                    className={`p-8 rounded-xl border-2 transition-all ${
                      isFramed === false
                        ? "border-brand-dark bg-brand-light shadow-lg scale-105"
                        : "border-brand-light hover:border-brand-medium"
                    }`}
                  >
                    <div className="text-4xl mb-3">🖼️</div>
                    <div className="font-bold text-xl text-brand-darkest mb-2">Unframed</div>
                    <div className="text-brand-darkest">Print only</div>
                  </button>
                  <button
                    onClick={() => setIsFramed(true)}
                    className={`p-8 rounded-xl border-2 transition-all ${
                      isFramed === true
                        ? "border-brand-dark bg-brand-light shadow-lg scale-105"
                        : "border-brand-light hover:border-brand-medium"
                    }`}
                  >
                    <div className="text-4xl mb-3">🖼️</div>
                    <div className="font-bold text-xl text-brand-darkest mb-2">Framed</div>
                    <div className="text-brand-darkest">With professional frame</div>
                  </button>
                </div>

                {isFramed && (
                  <div className="border-t-2 border-brand-light pt-6">
                    <h3 className="font-bold text-lg text-brand-darkest mb-4 text-center">
                      Choose Frame Color:
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {frameColors.map((frame) => (
                        <button
                          key={frame.name}
                          onClick={() => setFrameColor(frame.name)}
                          className={`p-6 rounded-xl border-2 transition-all ${
                            frameColor === frame.name
                              ? "border-brand-dark bg-brand-medium text-white shadow-lg scale-105"
                              : "border-brand-light hover:border-brand-medium"
                          }`}
                        >
                          <div
                            className={`w-12 h-12 mx-auto mb-3 rounded-full border-2 ${
                              frame.name === "Black"
                                ? "bg-gray-900 border-gray-700"
                                : frame.name === "White"
                                ? "bg-white border-gray-300"
                                : "bg-gray-400 border-gray-500"
                            }`}
                          ></div>
                          <div className={`font-bold ${frameColor === frame.name ? "text-white" : "text-brand-darkest"}`}>
                            {frame.name}
                          </div>
                          <div className={`text-sm mt-2 ${frameColor === frame.name ? "text-white" : "text-brand-medium"}`}>
                            {frame.price === 0 ? "+$0.00" : `+$${frame.price.toFixed(2)}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Card-specific options */}
          {productType === "card" && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-brand-darkest mb-4 font-playfair">
                Choose Card Type
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {cardTypes.map((card) => (
                  <button
                    key={card.name}
                    className="p-6 rounded-xl border-2 border-brand-light hover:border-brand-medium hover:shadow-lg transition-all text-center"
                  >
                    <div className="font-bold text-lg text-brand-darkest mb-2">
                      {card.name}
                    </div>
                    <div className="text-brand-medium font-semibold">
                      ${card.price}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-brand-darkest mb-4 font-playfair">
              Quantity
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 bg-brand-light text-brand-dark rounded-lg font-bold hover:bg-brand-medium transition-colors"
              >
                −
              </button>
              <span className="text-2xl font-bold text-brand-darkest w-16 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 bg-brand-light text-brand-dark rounded-lg font-bold hover:bg-brand-medium transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-br from-brand-dark to-brand-darkest rounded-2xl p-8 shadow-2xl text-white">
            <h2 className="text-2xl font-bold mb-6 text-center font-playfair">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Product:</span>
                <span className="font-semibold">{productName}</span>
              </div>
              {selectedSize && (
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span className="font-semibold">{selectedSize}&quot;</span>
                </div>
              )}
              {selectedMaterial && (
                <div className="flex justify-between">
                  <span>Material:</span>
                  <span className="font-semibold">{selectedMaterial}</span>
                </div>
              )}
              {isFramed !== null && (
                <div className="flex justify-between">
                  <span>Frame:</span>
                  <span className="font-semibold">
                    {isFramed ? `${frameColor || "Select color"}` : "Unframed"}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-semibold">{quantity}</span>
              </div>
              <div className="border-t border-white/20 pt-3 mt-4">
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                  <span className="text-white">${calculateTotal()}</span>
                </div>
              </div>
            </div>
            {existingArtKeyId && (
              <label className="flex items-center gap-2 mb-4 text-sm text-white/90">
                <input
                  type="checkbox"
                  checked={reuseExistingArtKey}
                  onChange={(e) => setReuseExistingArtKey(e.target.checked)}
                  className="w-4 h-4"
                />
                Use existing ArtKey Portal ({existingArtKeyId}) for this product
              </label>
            )}
            {!existingArtKeyId && (
              <p className="text-sm text-white/80 mb-4">
                A new ArtKey Portal ID will be generated automatically in the next step.
              </p>
            )}
            <button
              onClick={handleContinueToArtKey}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-full font-bold text-lg transition-all shadow-lg ${
                canProceed()
                  ? "bg-brand-medium text-white hover:bg-brand-light"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}
            >
              🎨 Continue to ArtKey Editor
            </button>
          </div>
        </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default function CustomizePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-lightest flex items-center justify-center"><div className="text-xl">Loading...</div></div>}>
      <CustomizeContent />
    </Suspense>
  );
}
