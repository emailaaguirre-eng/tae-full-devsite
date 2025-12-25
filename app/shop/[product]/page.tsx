"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

const DesignEditor = dynamic(() => import("@/components/DesignEditor"), {
  ssr: false,
});

interface GelatoVariant {
  sizes?: Array<{ name: string; price: number; gelatoUid: string }>;
  materials?: Array<{ name: string; price: number; gelatoUid: string }>;
  frames?: Array<{ name: string; price: number }>;
  paperTypes?: Array<{ name: string; price: number; gelatoUid: string; description?: string }>;
  foilColors?: Array<{ name: string; price: number }>;
}

interface DesignData {
  canvasData?: string;
  images?: string[];
}

const productInfo: Record<string, {
  title: string;
  icon: string;
  description: string;
  examples: string[];
}> = {
  card: {
    title: "Cards",
    icon: "💌",
    description: "Everyday greeting cards for notes and moments. Perfect for birthdays, holidays, thank you notes, and any occasion where you want to share a personal touch.",
    examples: [
      "Birthday cards with personalized messages",
      "Thank you cards for special occasions",
      "Holiday greeting cards",
      "Congratulations cards",
      "Thinking of you cards"
    ]
  },
  postcard: {
    title: "Postcards",
    icon: "📮",
    description: "Mail-ready postcards with a writable back. Ideal for travel memories, vacation updates, or quick notes to friends and family.",
    examples: [
      "Travel postcards from your adventures",
      "Vacation updates to family",
      "Quick notes to friends",
      "Event announcements",
      "Photo postcards of special moments"
    ]
  },
  invitation: {
    title: "Invitations",
    icon: "🎉",
    description: "Event invitations designed to gather your people. Make your special events memorable with beautifully designed invitations.",
    examples: [
      "Wedding invitations",
      "Birthday party invitations",
      "Anniversary celebration invites",
      "Graduation party invitations",
      "Baby shower invitations"
    ]
  },
  announcement: {
    title: "Announcements",
    icon: "📢",
    description: "Share life updates and milestone news beautifully. Perfect for announcing important life events and achievements.",
    examples: [
      "Birth announcements",
      "Graduation announcements",
      "Engagement announcements",
      "New job announcements",
      "Moving announcements"
    ]
  },
  print: {
    title: "Wall Art",
    icon: "🖼️",
    description: "Premium prints for your walls, framed or unframed. Transform your favorite photos into stunning wall art for your home or office.",
    examples: [
      "Family portrait prints",
      "Landscape photography prints",
      "Abstract art prints",
      "Pet portrait prints",
      "Custom artwork prints"
    ]
  }
};

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const productType = params.product as string;

  const [gelatoVariants, setGelatoVariants] = useState<GelatoVariant | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Options state
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [isFramed, setIsFramed] = useState<boolean | null>(null);
  const [frameColor, setFrameColor] = useState<string | null>(null);
  const [selectedCardPaper, setSelectedCardPaper] = useState<string | null>(null);
  const [hasFoil, setHasFoil] = useState<boolean | null>(null);
  const [selectedFoilColor, setSelectedFoilColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Design Editor state
  const [showDesignEditor, setShowDesignEditor] = useState(false);
  const [designData, setDesignData] = useState<DesignData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Fallback variants
  const getFallbackVariants = (type: string): GelatoVariant => {
    if (type === "print") {
      return {
        sizes: [
          { name: "5x7", price: 9.99, gelatoUid: "prints_pt_cl" },
          { name: "8x10", price: 14.99, gelatoUid: "prints_pt_cl" },
          { name: "11x14", price: 24.99, gelatoUid: "prints_pt_cl" },
          { name: "16x20", price: 39.99, gelatoUid: "canvas_print_gallery_wrap" },
          { name: "20x24", price: 59.99, gelatoUid: "canvas_print_gallery_wrap" },
          { name: "24x36", price: 89.99, gelatoUid: "canvas_print_gallery_wrap" },
        ],
        materials: [
          { name: "Glossy Paper", price: 0, gelatoUid: "prints_pt_cl" },
          { name: "Matte Paper", price: 2.00, gelatoUid: "prints_pt_cl" },
          { name: "Canvas", price: 15.00, gelatoUid: "canvas_print_gallery_wrap" },
          { name: "Metal", price: 35.00, gelatoUid: "metal_prints" },
        ],
        frames: [
          { name: "Black", price: 0 },
          { name: "White", price: 5.00 },
          { name: "Silver", price: 6.00 },
        ],
      };
    } else if (type === "card" || type === "invitation" || type === "announcement") {
      return {
        sizes: [
          { name: "4x6", price: 12.99, gelatoUid: "cards_cl_dtc_prt_pt" },
          { name: "5x7", price: 15.99, gelatoUid: "cards_cl_dtc_prt_pt" },
          { name: "6x9", price: 19.99, gelatoUid: "cards_cl_dtc_prt_pt" },
        ],
        paperTypes: [
          { name: "Premium Cardstock", price: 0, gelatoUid: "cards_cl_dtc_prt_pt", description: "350gsm coated silk" },
          { name: "Matte Cardstock", price: 0, gelatoUid: "cards_cl_dtc_prt_pt", description: "350gsm matte finish" },
          { name: "Linen Cardstock", price: 2.00, gelatoUid: "cards_cl_dtc_prt_pt", description: "350gsm textured linen" },
          { name: "Recycled Cardstock", price: 0, gelatoUid: "cards_cl_dtc_prt_pt", description: "350gsm eco-friendly" },
        ],
        foilColors: [
          { name: "Gold", price: 5.00 },
          { name: "Silver", price: 5.00 },
          { name: "Rose Gold", price: 6.00 },
          { name: "Copper", price: 5.00 },
        ],
      };
    } else if (type === "postcard") {
      return {
        sizes: [
          { name: "4x6", price: 12.99, gelatoUid: "cards_cl_dtc_prt_pt" },
          { name: "5x7", price: 15.99, gelatoUid: "cards_cl_dtc_prt_pt" },
          { name: "6x9", price: 19.99, gelatoUid: "cards_cl_dtc_prt_pt" },
        ],
        paperTypes: [
          { name: "Premium Cardstock", price: 0, gelatoUid: "cards_cl_dtc_prt_pt", description: "350gsm coated silk" },
          { name: "Matte Cardstock", price: 0, gelatoUid: "cards_cl_dtc_prt_pt", description: "350gsm matte finish" },
          { name: "Linen Cardstock", price: 2.00, gelatoUid: "cards_cl_dtc_prt_pt", description: "350gsm textured linen" },
          { name: "Recycled Cardstock", price: 0, gelatoUid: "cards_cl_dtc_prt_pt", description: "350gsm eco-friendly" },
        ],
      };
    }
    return {};
  };

  const fetchGelatoVariants = useCallback(async (type: string) => {
    setLoadingVariants(true);
    try {
      const response = await fetch(`/api/gelato/variants?productType=${type}`);
      if (response.ok) {
        const data = await response.json();
        setGelatoVariants(data);
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0].name);
        }
        if (data.materials && data.materials.length > 0) {
          setSelectedMaterial(data.materials[0].name);
        }
        if (data.paperTypes && data.paperTypes.length > 0) {
          setSelectedCardPaper(data.paperTypes[0].name);
        }
      } else {
        setGelatoVariants(getFallbackVariants(type));
      }
    } catch (error) {
      console.error("Error fetching Gelato variants:", error);
      setGelatoVariants(getFallbackVariants(type));
    } finally {
      setLoadingVariants(false);
    }
  }, []);

  useEffect(() => {
    if (productType && productInfo[productType]) {
      fetchGelatoVariants(productType);
    }
  }, [productType, fetchGelatoVariants]);

  const calculateTotal = (): string => {
    let total = 0;
    const variants = gelatoVariants || getFallbackVariants(productType);

    if (productType === "print") {
      if (selectedSize) {
        const size = variants.sizes?.find(s => s.name === selectedSize);
        if (size) total = size.price;
      }
      if (selectedMaterial) {
        const material = variants.materials?.find(m => m.name === selectedMaterial);
        if (material) total += material.price;
      }
      if (isFramed && frameColor) {
        const frame = variants.frames?.find(f => f.name === frameColor);
        if (frame) total += frame.price + 20;
      }
    } else if (productType === "card" || productType === "invitation" || productType === "announcement") {
      if (selectedSize) {
        const size = variants.sizes?.find(s => s.name === selectedSize);
        if (size) total = size.price;
      }
      if (selectedCardPaper) {
        const paper = variants.paperTypes?.find(p => p.name === selectedCardPaper);
        if (paper) total += paper.price;
      }
      if (hasFoil && selectedFoilColor) {
        const foil = variants.foilColors?.find(f => f.name === selectedFoilColor);
        if (foil) total += foil.price;
      }
    } else if (productType === "postcard") {
      if (selectedSize) {
        const size = variants.sizes?.find(s => s.name === selectedSize);
        if (size) total = size.price;
      }
      if (selectedCardPaper) {
        const paper = variants.paperTypes?.find(p => p.name === selectedCardPaper);
        if (paper) total += paper.price;
      }
    }

    return (total * quantity).toFixed(2);
  };

  const canProceedToUpload = (): boolean => {
    if (productType === "print") {
      return selectedSize !== null && selectedMaterial !== null && isFramed !== null && (!isFramed || frameColor !== null);
    } else if (productType === "card" || productType === "invitation" || productType === "announcement") {
      return selectedSize !== null && selectedCardPaper !== null && hasFoil !== null && (!hasFoil || selectedFoilColor !== null);
    } else if (productType === "postcard") {
      return selectedSize !== null && selectedCardPaper !== null;
    }
    return false;
  };

  const handleOptionsComplete = () => {
    if (canProceedToUpload()) {
      setCurrentStep(1);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          if (newImages.length === files.length) {
            setUploadedImages([...uploadedImages, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadComplete = () => {
    if (uploadedImages.length > 0) {
      setCurrentStep(2);
      setShowDesignEditor(true);
    }
  };

  const handleDesignComplete = (data: DesignData) => {
    setDesignData(data);
    setShowDesignEditor(false);
    setCurrentStep(3);
  };

  const generateArtKeyId = (length = 8): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const handleContinueToArtKey = () => {
    const artKeyId = generateArtKeyId();
    const params = new URLSearchParams({
      product_type: productType,
      artkey_id: artKeyId,
    });
    router.push(`/art-key/editor?${params}`);
  };

  const getStudioSize = (): { width: number; height: number; name: string } => {
    if (selectedSize) {
      const [width, height] = selectedSize.split("x").map(Number);
      return { width: width * 100, height: height * 100, name: selectedSize };
    }
    return { width: 800, height: 1000, name: "8x10" };
  };

  if (!productType || !productInfo[productType]) {
    return (
      <main className="min-h-screen bg-brand-lightest">
        <Navbar />
        <div className="pt-24 pb-12 text-center">
          <h1 className="text-3xl font-bold text-brand-darkest mb-4">Product Not Found</h1>
          <Link
            href="/shop"
            className="px-6 py-3 bg-brand-darkest text-white rounded-lg hover:bg-brand-dark transition-colors"
          >
            Back to Shop
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const info = productInfo[productType];
  const variants = gelatoVariants || getFallbackVariants(productType);

  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      
      <div className="pt-24 pb-12">
        {currentStep === 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 relative">
              <Link
                href="/shop"
                className="absolute top-4 right-4 p-2 text-brand-dark hover:text-brand-darkest hover:bg-brand-lightest rounded-lg transition-colors text-xl font-bold leading-none"
                title="Close"
              >
                ×
              </Link>
              <div className="flex items-start gap-6">
                <div className="text-6xl">{info.icon}</div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-brand-darkest mb-4 font-playfair">{info.title}</h1>
                  <p className="text-lg text-brand-dark mb-6">{info.description}</p>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-darkest mb-3 font-playfair">Perfect For:</h3>
                    <ul className="list-disc list-inside space-y-2 text-brand-dark">
                      {info.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-brand-darkest font-playfair">Select Options</h2>
                <div className="flex items-center gap-3">
                  <Link
                    href="/shop"
                    className="flex items-center gap-2 px-4 py-2 text-brand-dark hover:text-brand-darkest hover:bg-brand-lightest rounded-lg transition-colors"
                  >
                    <span>←</span>
                    <span>Back to Products</span>
                  </Link>
                  <Link
                    href="/shop"
                    className="p-2 text-brand-dark hover:text-brand-darkest hover:bg-brand-lightest rounded-lg transition-colors text-xl font-bold"
                    title="Close"
                  >
                    ×
                  </Link>
                </div>
              </div>

              {loadingVariants ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-brand-dark border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-brand-dark">Loading options...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {variants.sizes && variants.sizes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-brand-darkest mb-4">Choose Size</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {variants.sizes.map((size) => (
                          <button
                            key={size.name}
                            onClick={() => setSelectedSize(size.name)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              selectedSize === size.name
                                ? "border-brand-darkest bg-brand-lightest shadow-md"
                                : "border-brand-light hover:border-brand-medium"
                            }`}
                          >
                            <div className="font-bold text-brand-darkest mb-1">{size.name}"</div>
                            <div className="text-sm text-brand-dark">${size.price.toFixed(2)}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {productType === "print" && variants.materials && variants.materials.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-brand-darkest mb-4">Choose Material</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {variants.materials.map((material) => (
                          <button
                            key={material.name}
                            onClick={() => setSelectedMaterial(material.name)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              selectedMaterial === material.name
                                ? "border-brand-darkest bg-brand-lightest shadow-md"
                                : "border-brand-light hover:border-brand-medium"
                            }`}
                          >
                            <div className="font-bold text-brand-darkest mb-1">{material.name}</div>
                            <div className="text-sm text-brand-dark">
                              {material.price === 0 ? "Included" : `+$${material.price.toFixed(2)}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(productType === "card" || productType === "postcard" || productType === "invitation" || productType === "announcement") && 
                   variants.paperTypes && variants.paperTypes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-brand-darkest mb-4">Choose Paper Type</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {variants.paperTypes.map((paper) => (
                          <button
                            key={paper.name}
                            onClick={() => setSelectedCardPaper(paper.name)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              selectedCardPaper === paper.name
                                ? "border-brand-darkest bg-brand-lightest shadow-md"
                                : "border-brand-light hover:border-brand-medium"
                            }`}
                          >
                            <div className="font-bold text-brand-darkest mb-1">{paper.name}</div>
                            {paper.description && (
                              <div className="text-xs text-brand-dark mb-1">{paper.description}</div>
                            )}
                            <div className="text-sm text-brand-dark">
                              {paper.price === 0 ? "Included" : `+$${paper.price.toFixed(2)}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {productType === "print" && variants.frames && variants.frames.length > 0 && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-brand-darkest mb-4">Framed or Unframed?</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => {
                              setIsFramed(false);
                              setFrameColor(null);
                            }}
                            className={`p-6 rounded-xl border-2 transition-all text-left ${
                              isFramed === false
                                ? "border-brand-darkest bg-brand-lightest shadow-md"
                                : "border-brand-light hover:border-brand-medium"
                            }`}
                          >
                            <div className="font-bold text-brand-darkest mb-2">Unframed</div>
                            <div className="text-sm text-brand-dark">Print only</div>
                          </button>
                          <button
                            onClick={() => setIsFramed(true)}
                            className={`p-6 rounded-xl border-2 transition-all text-left ${
                              isFramed === true
                                ? "border-brand-darkest bg-brand-lightest shadow-md"
                                : "border-brand-light hover:border-brand-medium"
                            }`}
                          >
                            <div className="font-bold text-brand-darkest mb-2">Framed</div>
                            <div className="text-sm text-brand-dark">With professional frame</div>
                          </button>
                        </div>
                      </div>

                      {isFramed && (
                        <div>
                          <h3 className="text-lg font-semibold text-brand-darkest mb-4">Choose Frame Color:</h3>
                          <div className="grid grid-cols-3 gap-4">
                            {variants.frames.map((frame) => (
                              <button
                                key={frame.name}
                                onClick={() => setFrameColor(frame.name)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                  frameColor === frame.name
                                    ? "border-brand-darkest bg-brand-lightest shadow-md"
                                    : "border-brand-light hover:border-brand-medium"
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div
                                    className={`w-6 h-6 rounded-full border-2 ${
                                      frame.name === "Black"
                                        ? "bg-gray-900 border-gray-700"
                                        : frame.name === "White"
                                        ? "bg-white border-gray-300"
                                        : "bg-gray-400 border-gray-500"
                                    }`}
                                  />
                                  <div className="font-bold text-brand-darkest">{frame.name}</div>
                                </div>
                                <div className="text-sm text-brand-dark">
                                  {frame.price === 0 ? "+$0.00" : `+$${frame.price.toFixed(2)}`}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {(productType === "card" || productType === "invitation" || productType === "announcement") && 
                   variants.foilColors && variants.foilColors.length > 0 && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-brand-darkest mb-4">Add Foil Accent?</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => {
                              setHasFoil(false);
                              setSelectedFoilColor(null);
                            }}
                            className={`p-6 rounded-xl border-2 transition-all text-left ${
                              hasFoil === false
                                ? "border-brand-darkest bg-brand-lightest shadow-md"
                                : "border-brand-light hover:border-brand-medium"
                            }`}
                          >
                            <div className="font-bold text-brand-darkest mb-2">No Foil</div>
                            <div className="text-sm text-brand-dark">Standard printing</div>
                          </button>
                          <button
                            onClick={() => setHasFoil(true)}
                            className={`p-6 rounded-xl border-2 transition-all text-left ${
                              hasFoil === true
                                ? "border-brand-darkest bg-brand-lightest shadow-md"
                                : "border-brand-light hover:border-brand-medium"
                            }`}
                          >
                            <div className="font-bold text-brand-darkest mb-2">Add Foil</div>
                            <div className="text-sm text-brand-dark">Elegant metallic accent</div>
                          </button>
                        </div>
                      </div>

                      {hasFoil && (
                        <div>
                          <h3 className="text-lg font-semibold text-brand-darkest mb-4">Choose Foil Color:</h3>
                          <div className="grid grid-cols-4 gap-4">
                            {variants.foilColors.map((foil) => (
                              <button
                                key={foil.name}
                                onClick={() => setSelectedFoilColor(foil.name)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                  selectedFoilColor === foil.name
                                    ? "border-brand-darkest bg-brand-lightest shadow-md"
                                    : "border-brand-light hover:border-brand-medium"
                                }`}
                              >
                                <div className="font-bold text-brand-darkest mb-1">{foil.name}</div>
                                <div className="text-sm text-brand-dark">+${foil.price.toFixed(2)}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-brand-darkest mb-4">Quantity</h3>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 rounded-lg border-2 border-brand-light hover:border-brand-medium transition-colors font-bold text-brand-darkest"
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
                        className="w-12 h-12 rounded-lg border-2 border-brand-light hover:border-brand-medium transition-colors font-bold text-brand-darkest"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bg-brand-darkest text-white rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4">Order Summary</h3>
                    <div className="space-y-2 mb-4 text-sm">
                      {selectedSize && <div>Size: {selectedSize}"</div>}
                      {selectedMaterial && <div>Material: {selectedMaterial}</div>}
                      {selectedCardPaper && <div>Paper: {selectedCardPaper}</div>}
                      {isFramed !== null && (
                        <div>Frame: {isFramed ? (frameColor || "Not selected") : "Unframed"}</div>
                      )}
                      {hasFoil !== null && (
                        <div>Foil: {hasFoil ? (selectedFoilColor || "Not selected") : "None"}</div>
                      )}
                      <div>Quantity: {quantity}</div>
                    </div>
                    <div className="border-t border-white/20 pt-4 mb-4">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span>Total:</span>
                        <span>${calculateTotal()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/80 mb-4">
                      A new ArtKey™ Portal ID will be generated automatically in the next step.
                    </p>
                    <button
                      onClick={handleOptionsComplete}
                      disabled={!canProceedToUpload()}
                      className="w-full py-4 px-6 bg-white text-brand-darkest rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      Continue to Upload Image
                      <span className="text-pink-500">ArtKey</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-brand-darkest mb-6 font-playfair">Upload Your Image</h2>
              <div className="border-2 border-dashed border-brand-light rounded-xl p-12 text-center mb-6">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer block"
                >
                  <div className="text-5xl mb-4">📷</div>
                  <p className="text-lg text-brand-dark mb-2">Click to upload images</p>
                  <p className="text-sm text-brand-dark">JPG, PNG, or BMP format</p>
                </label>
              </div>

              {uploadedImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-brand-darkest mb-4">Uploaded Images:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative">
                        <img src={img} alt={`Upload ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="px-6 py-3 border-2 border-brand-light rounded-lg hover:border-brand-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleUploadComplete}
                  disabled={uploadedImages.length === 0}
                  className="flex-1 px-6 py-3 bg-brand-darkest text-white rounded-lg font-semibold hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue to Design Editor
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && showDesignEditor && (
          <DesignEditor
            productType={productType as 'canvas' | 'print' | 'card' | 'poster' | 'photobook'}
            productSize={getStudioSize()}
            onComplete={handleDesignComplete}
            initialImages={uploadedImages}
            frameColor={isFramed && frameColor ? frameColor : undefined}
            onClose={() => {
              setShowDesignEditor(false);
              setCurrentStep(1);
            }}
          />
        )}

        {currentStep === 3 && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <h2 className="text-3xl font-bold text-brand-darkest mb-6 font-playfair">Design Complete!</h2>
              <p className="text-lg text-brand-dark mb-8">
                Your design has been saved. Continue to the ArtKey™ Portal to finalize your order.
              </p>
              <button
                onClick={handleContinueToArtKey}
                className="px-8 py-4 bg-brand-darkest text-white rounded-lg font-bold hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                Continue to ArtKey™ Portal
                <span className="text-pink-500">ArtKey</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
