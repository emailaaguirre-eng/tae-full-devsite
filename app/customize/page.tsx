"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import dynamic from "next/dynamic";
import Link from "next/link";
import { X, ArrowLeft } from "lucide-react";

// Dynamic import to avoid SSR issues with Fabric.js
const DesignEditor = dynamic(
  () => import("@/components/DesignEditor"),
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
  const initialProductType = searchParams.get("product_type") || "";
  const productName = searchParams.get("product_name") || "Product";
  const basePrice = parseFloat(searchParams.get("price") || "0");
  const fromHero = searchParams.get("from_hero") === "true";
  const heroImages = searchParams.get("images")?.split(',').filter(Boolean) || [];
  const heroMessage = searchParams.get("message") || "";

  // Step tracking - FLOW: 1=Product Selection, 2=Upload Image, 3=Options, 4=Design Editor, 5=ArtKeyT
  // If product_type is provided via URL (from Shop), skip to Upload step
  const [currentStep, setCurrentStep] = useState(initialProductType ? 2 : 1);
  
  // Uploaded images state
  const [uploadedImages, setUploadedImages] = useState<string[]>(heroImages);
  
  // Product selection state
  const [selectedProductType, setSelectedProductType] = useState<string>(initialProductType || "");
  const productType = selectedProductType || initialProductType || "print";
  
  // Design data from Gelato editor
  const [designData, setDesignData] = useState<DesignData | null>(null);
  
  // Initial images for design editor (from uploaded images)
  const [initialImages, setInitialImages] = useState<string[]>(heroImages);

  // State for customization options
  const [selectedSize, setSelectedSize] = useState<string | null>(
    productType === "print" ? "8x10" : productType === "card" ? "5x7" : null
  );
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
    // Automatically proceed to ArtKey Portal (Step 5)
    setCurrentStep(5);
    handleContinueToArtKey();
  };
  
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

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const newImages: string[] = [];
    
    try {
      // Convert all images to JPG
      const convertedImages = await Promise.all(
        fileArray.map(file => convertImageToJPG(file))
      );
      
      newImages.push(...convertedImages);
      
      const allImages = [...uploadedImages, ...newImages];
      setUploadedImages(allImages);
      setInitialImages(allImages);
    } catch (error) {
      console.error('Error converting images:', error);
      alert('Failed to process some images. Please try again.');
    }
  };
  
  const handleUploadComplete = () => {
    if (uploadedImages.length > 0) {
      setCurrentStep(2); // Move to product selection
    }
  };
  
  const handleProductSelect = (type: string) => {
    if (type === "ideas") {
      // For Ideas, redirect to gallery for inspiration
      router.push('/gallery');
      return;
    }
    setSelectedProductType(type);
    setCurrentStep(3); // Move to options selection
  };
  
  const handleVariantsComplete = () => {
    setCurrentStep(4); // Move to Design Editor
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

  const cardSizes = [
    { name: "4x6", price: 12.99, gelatoUid: "cards_cl_dtc_prt_pt" },
    { name: "5x7", price: 15.99, gelatoUid: "cards_cl_dtc_prt_pt" },
    { name: "6x9", price: 19.99, gelatoUid: "cards_cl_dtc_prt_pt" },
  ];

  const cardPaperTypes = [
    { name: "Premium Cardstock", price: 0, gelatoUid: "cards_cl_dtc_prt_pt", description: "350gsm coated silk" },
    { name: "Matte Cardstock", price: 0, gelatoUid: "cards_cl_dtc_prt_pt", description: "350gsm matte finish" },
    { name: "Linen Cardstock", price: 2.00, gelatoUid: "cards_cl_dtc_prt_pt", description: "350gsm textured linen" },
    { name: "Recycled Cardstock", price: 0, gelatoUid: "cards_cl_dtc_prt_pt", description: "350gsm eco-friendly" },
  ];

  const foilColors = [
    { name: "Gold", price: 5.00 },
    { name: "Silver", price: 5.00 },
    { name: "Rose Gold", price: 6.00 },
    { name: "Copper", price: 5.00 },
  ];

  const [selectedCardPaper, setSelectedCardPaper] = useState<string | null>(null);
  const [hasFoil, setHasFoil] = useState<boolean | null>(null);
  const [selectedFoilColor, setSelectedFoilColor] = useState<string | null>(null);

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
    } else if (productType === "card" || productType === "invitation" || productType === "announcement") {
      if (selectedSize) {
        const size = cardSizes.find(s => s.name === selectedSize);
        if (size) total = size.price;
      }
      if (selectedCardPaper) {
        const paper = cardPaperTypes.find(p => p.name === selectedCardPaper);
        if (paper) total += paper.price;
      }
      if (hasFoil && selectedFoilColor) {
        const foil = foilColors.find(f => f.name === selectedFoilColor);
        if (foil) total += foil.price;
      }
    } else if (productType === "postcard") {
      if (selectedSize) {
        const size = cardSizes.find(s => s.name === selectedSize);
        if (size) total = size.price;
      }
      if (selectedCardPaper) {
        const paper = cardPaperTypes.find(p => p.name === selectedCardPaper);
        if (paper) total += paper.price;
      }
    }
    
    return (total * quantity).toFixed(2);
  };

  const handleContinueToArtKey = () => {
    // This is called from Design Editor completion (step 3 -> step 4)
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
    } else if (productType === "card" || productType === "invitation" || productType === "announcement") {
      return selectedSize && selectedCardPaper && hasFoil !== null && (!hasFoil || selectedFoilColor);
    } else if (productType === "postcard") {
      // Postcards have simpler options - just size and paper type (no foil)
      return selectedSize && selectedCardPaper;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-brand-lightest pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-brand-darkest mb-2 font-playfair">
                {currentStep === 1 ? "Choose Your Product" : 
                 currentStep === 2 ? "Upload Your Image" : 
                 currentStep === 3 ? `Customize Your ${productType === "card" ? "Card" : productType === "invitation" ? "Invitation" : productType === "announcement" ? "Announcement" : productType === "postcard" ? "Postcard" : productType === "ideas" ? "Idea" : "Wall Art"}` :
                 currentStep === 4 ? "Design Your Product" :
                 "Create Your ArtKey™ Portal"}
              </h1>
              <p className="text-brand-dark">
                Upload your image, choose your product, select options, design it, and add your ArtKey™ portal.
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {currentStep > 1 && currentStep < 5 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="p-2 text-brand-dark hover:text-brand-darkest hover:bg-brand-lightest rounded-lg transition-colors"
                  title="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <Link
                href="/"
                className="p-2 text-brand-dark hover:text-brand-darkest hover:bg-brand-lightest rounded-lg transition-colors"
                title="Back to homepage"
              >
                <X className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center mt-6 gap-2 flex-wrap">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 1 ? 'bg-brand-medium text-white' : 'bg-gray-200 text-gray-700'}`}>
              <span className={`w-6 h-6 rounded-full ${currentStep >= 1 ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'} flex items-center justify-center text-sm font-bold`}>1</span>
              <span className="hidden sm:inline">Product</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 2 ? 'bg-brand-medium text-white' : 'bg-gray-200 text-gray-700'}`}>
              <span className={`w-6 h-6 rounded-full ${currentStep >= 2 ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'} flex items-center justify-center text-sm font-bold`}>2</span>
              <span className="hidden sm:inline">Upload</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 3 ? 'bg-brand-medium text-white' : 'bg-gray-200 text-gray-700'}`}>
              <span className={`w-6 h-6 rounded-full ${currentStep >= 3 ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'} flex items-center justify-center text-sm font-bold`}>3</span>
              <span className="hidden sm:inline">Options</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 4 ? 'bg-brand-medium text-white' : 'bg-gray-200 text-gray-700'}`}>
              <span className={`w-6 h-6 rounded-full ${currentStep >= 4 ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'} flex items-center justify-center text-sm font-bold`}>4</span>
              <span className="hidden sm:inline">Design</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 5 ? 'bg-brand-medium text-white' : 'bg-gray-200 text-gray-700'}`}>
              <span className={`w-6 h-6 rounded-full ${currentStep >= 5 ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'} flex items-center justify-center text-sm font-bold`}>5</span>
              <span>ArtKey™</span>
            </div>
          </div>
        </div>

        {/* Design Editor Modal */}
        {showStudio && (
          <DesignEditor
            productType={productType as 'canvas' | 'print' | 'card' | 'poster' | 'photobook'}
            productSize={getStudioSize()}
            onComplete={handleDesignComplete}
            initialImages={uploadedImages}
            initialMessage={heroMessage}
            onClose={() => {
              console.log('Closing design editor');
              setShowStudio(false);
            }}
          />
        )}

        {/* Step 1: Product Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair text-center">
                Upload Your Image
              </h2>
              <p className="text-brand-dark text-center mb-6">
                Start by uploading the image you&apos;d like to use for your product
              </p>
              
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                <div className="text-6xl mb-4">📤</div>
                <span className="text-lg font-medium text-gray-700 mb-2">Click to upload or drag and drop</span>
                <span className="text-sm text-gray-500">JPG/JPEG, PNG, BMP</span>
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.bmp,image/jpeg,image/png,image/bmp" 
                  multiple 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </label>
              
              {uploadedImages.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-brand-darkest mb-4">Uploaded Images</h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                        <img src={img} alt={`Uploaded ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            const newImages = uploadedImages.filter((_, idx) => idx !== i);
                            setUploadedImages(newImages);
                            setInitialImages(newImages);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleUploadComplete}
                    disabled={uploadedImages.length === 0}
                    className={`w-full py-4 rounded-full font-bold text-lg transition-all shadow-lg ${
                      uploadedImages.length > 0
                        ? "bg-brand-medium text-white hover:bg-brand-light"
                        : "bg-gray-400 text-gray-200 cursor-not-allowed"
                    }`}
                  >
                    Continue to Product Selection
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Upload Image */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair text-center">
                Choose Your Product
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Cards */}
                <button
                  onClick={() => handleProductSelect("card")}
                  className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all text-left hover:shadow-lg"
                >
                  <div className="text-5xl mb-4">💌</div>
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Cards</h3>
                  <p className="text-brand-dark">Everyday greeting cards for notes and moments</p>
                </button>
                
                {/* Postcards */}
                <button
                  onClick={() => handleProductSelect("postcard")}
                  className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all text-left hover:shadow-lg"
                >
                  <div className="text-5xl mb-4">📮</div>
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Postcards</h3>
                  <p className="text-brand-dark">Mail-ready postcards with a writable back</p>
                </button>
                
                {/* Invitations */}
                <button
                  onClick={() => handleProductSelect("invitation")}
                  className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all text-left hover:shadow-lg"
                >
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Invitations</h3>
                  <p className="text-brand-dark">Event invitations designed to gather your people</p>
                </button>
                
                {/* Announcements */}
                <button
                  onClick={() => handleProductSelect("announcement")}
                  className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all text-left hover:shadow-lg"
                >
                  <div className="text-5xl mb-4">📢</div>
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Announcements</h3>
                  <p className="text-brand-dark">Share life updates and milestone news beautifully</p>
                </button>
                
                {/* Wall Art */}
                <button
                  onClick={() => handleProductSelect("print")}
                  className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all text-left hover:shadow-lg"
                >
                  <div className="text-5xl mb-4">🖼️</div>
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Wall Art</h3>
                  <p className="text-brand-dark">Premium prints for your walls, framed or unframed</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Product Options */}
        {currentStep === 3 && (
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

          {/* Postcard-specific options */}
          {productType === "postcard" && (
            <>
              {/* Size Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-brand-darkest mb-4 font-playfair">
                  Choose Size
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {cardSizes.map((size) => (
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

              {/* Paper Type Selection (simpler for postcards) */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-brand-darkest mb-4 font-playfair">
                  Choose Paper Type
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {cardPaperTypes.map((paper) => (
                    <button
                      key={paper.name}
                      onClick={() => setSelectedCardPaper(paper.name)}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        selectedCardPaper === paper.name
                          ? "border-brand-dark bg-brand-light shadow-lg scale-105"
                          : "border-brand-light hover:border-brand-medium"
                      }`}
                    >
                      <div className="font-bold text-lg text-brand-darkest mb-1">
                        {paper.name}
                      </div>
                      <div className="text-sm text-brand-dark mb-2">
                        {paper.description}
                      </div>
                      <div className={`font-semibold ${selectedCardPaper === paper.name ? "text-brand-darkest" : "text-brand-medium"}`}>
                        {paper.price === 0 ? "Included" : `+$${paper.price.toFixed(2)}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Card/Invitation/Announcement-specific options */}
          {(productType === "card" || productType === "invitation" || productType === "announcement") && (
            <>
              {/* Size Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-brand-darkest mb-4 font-playfair">
                  Choose Size
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {cardSizes.map((size) => (
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

              {/* Paper Type Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-brand-darkest mb-4 font-playfair">
                  Choose Paper Type
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {cardPaperTypes.map((paper) => (
                    <button
                      key={paper.name}
                      onClick={() => setSelectedCardPaper(paper.name)}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        selectedCardPaper === paper.name
                          ? "border-brand-dark bg-brand-light shadow-lg scale-105"
                          : "border-brand-light hover:border-brand-medium"
                      }`}
                    >
                      <div className="font-bold text-lg text-brand-darkest mb-1">
                        {paper.name}
                      </div>
                      <div className="text-sm text-brand-dark mb-2">
                        {paper.description}
                      </div>
                      <div className={`font-semibold ${selectedCardPaper === paper.name ? "text-brand-darkest" : "text-brand-medium"}`}>
                        {paper.price === 0 ? "Included" : `+$${paper.price.toFixed(2)}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Foil Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-brand-darkest mb-4 font-playfair">
                  Add Foil Accents?
                </h2>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <button
                    onClick={() => {
                      setHasFoil(false);
                      setSelectedFoilColor(null);
                    }}
                    className={`p-8 rounded-xl border-2 transition-all ${
                      hasFoil === false
                        ? "border-brand-dark bg-brand-light shadow-lg scale-105"
                        : "border-brand-light hover:border-brand-medium"
                    }`}
                  >
                    <div className="text-4xl mb-3">📄</div>
                    <div className="font-bold text-xl text-brand-darkest mb-2">No Foil</div>
                    <div className="text-brand-darkest">Standard printing</div>
                  </button>
                  <button
                    onClick={() => setHasFoil(true)}
                    className={`p-8 rounded-xl border-2 transition-all ${
                      hasFoil === true
                        ? "border-brand-dark bg-brand-light shadow-lg scale-105"
                        : "border-brand-light hover:border-brand-medium"
                    }`}
                  >
                    <div className="text-4xl mb-3">✨</div>
                    <div className="font-bold text-xl text-brand-darkest mb-2">Add Foil</div>
                    <div className="text-brand-darkest">Premium metallic accents</div>
                  </button>
                </div>

                {hasFoil && (
                  <div className="border-t-2 border-brand-light pt-6">
                    <h3 className="font-bold text-lg text-brand-darkest mb-4 text-center">
                      Choose Foil Color:
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {foilColors.map((foil) => (
                        <button
                          key={foil.name}
                          onClick={() => setSelectedFoilColor(foil.name)}
                          className={`p-6 rounded-xl border-2 transition-all ${
                            selectedFoilColor === foil.name
                              ? "border-brand-dark bg-brand-medium text-white shadow-lg scale-105"
                              : "border-brand-light hover:border-brand-medium"
                          }`}
                        >
                          <div
                            className={`w-12 h-12 mx-auto mb-3 rounded-full border-2 ${
                              foil.name === "Gold"
                                ? "bg-yellow-400 border-yellow-500"
                                : foil.name === "Silver"
                                ? "bg-gray-300 border-gray-400"
                                : foil.name === "Rose Gold"
                                ? "bg-rose-300 border-rose-400"
                                : "bg-orange-400 border-orange-500"
                            }`}
                          ></div>
                          <div className={`font-bold ${selectedFoilColor === foil.name ? "text-white" : "text-brand-darkest"}`}>
                            {foil.name}
                          </div>
                          <div className={`text-sm mt-2 ${selectedFoilColor === foil.name ? "text-white" : "text-brand-medium"}`}>
                            {foil.price === 0 ? "+$0.00" : `+$${foil.price.toFixed(2)}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
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
              {selectedCardPaper && (
                <div className="flex justify-between">
                  <span>Paper:</span>
                  <span className="font-semibold">{selectedCardPaper}</span>
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
              {hasFoil !== null && (
                <div className="flex justify-between">
                  <span>Foil:</span>
                  <span className="font-semibold">
                    {hasFoil ? `${selectedFoilColor || "Select color"}` : "No Foil"}
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
                Use existing ArtKey™ Portal ({existingArtKeyId}) for this product
              </label>
            )}
            {!existingArtKeyId && (
              <p className="text-sm text-white/80 mb-4">
                A new ArtKey™ Portal ID will be generated automatically in the next step.
              </p>
            )}
            <button
              onClick={handleVariantsComplete}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-full font-bold text-lg transition-all shadow-lg ${
                canProceed()
                  ? "bg-brand-medium text-white hover:bg-brand-light"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}
            >
              🎨 Continue to Design Editor
            </button>
          </div>
        </div>
        </div>
        )}

        {/* Step 4: Design Editor */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-brand-darkest mb-4 font-playfair">
                Design Your Product
              </h2>
              <p className="text-brand-dark mb-4">
                Customize your design with the image you uploaded. You&apos;ll add your ArtKey™ portal in the next step.
              </p>
              {uploadedImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-brand-dark mb-2">Your uploaded images:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImages.map((img, i) => (
                      <img key={i} src={img} alt={`Uploaded ${i + 1}`} className="aspect-square rounded-lg object-cover border-2 border-gray-200" />
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4">
                <button
                  onClick={() => setShowStudio(true)}
                  disabled={uploadedImages.length === 0}
                  className={`px-8 py-4 rounded-full font-semibold transition-all shadow-md text-lg ${
                    uploadedImages.length > 0
                      ? "bg-brand-dark text-white hover:bg-brand-darkest"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Open Design Editor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: ArtKey™ Portal (handled by handleContinueToArtKey) */}
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
