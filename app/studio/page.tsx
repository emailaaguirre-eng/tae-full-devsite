// app/studio/page.tsx
// Customization Studio — loads product spec from URL params or falls back to built-in catalog
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CustomizationStudio } from "@/customization-studio";
import { ProductSpec, Placement } from "@/customization-studio/types";
import Link from "next/link";

// =============================================================================
// BUILT-IN PRODUCT CATALOG (fallback when no URL params)
// =============================================================================

type Orientation = "portrait" | "landscape";

type ProductDefinition = {
  id: string;
  name: string;
  printfulProductId: number;
  variants: {
    id: string;
    name: string;
    printfulVariantId: number;
    landscapeWidth: number;
    landscapeHeight: number;
  }[];
  printDpi: number;
  placements: ProductSpec["placements"];
  requiresQrCode: boolean;
  supportsOrientation: boolean;
  defaultOrientation: Orientation;
  qrSizeInches: number;
};

const PRODUCTS: ProductDefinition[] = [
  {
    id: "TAE-CARD",
    name: "Greeting Card",
    printfulProductId: 568,
    variants: [
      { id: "TAE-CARD-SM", name: 'Small (4.25" x 5.5")', printfulVariantId: 14457, landscapeWidth: 1842, landscapeHeight: 1240 },
      { id: "TAE-CARD-MD", name: 'Medium (5" x 7")', printfulVariantId: 14458, landscapeWidth: 2146, landscapeHeight: 1546 },
      { id: "TAE-CARD-LG", name: 'Large (A5 - 5.83" x 8.27")', printfulVariantId: 14460, landscapeWidth: 2526, landscapeHeight: 1794 },
    ],
    printDpi: 300,
    placements: ["front", "inside1", "inside2", "back"],
    requiresQrCode: true,
    supportsOrientation: true,
    defaultOrientation: "portrait",
    qrSizeInches: 0.4,
  },
  {
    id: "TAE-POST",
    name: "Postcard",
    printfulProductId: 156,
    variants: [
      { id: "TAE-POST-4x6", name: '4" x 6"', printfulVariantId: 4545, landscapeWidth: 1872, landscapeHeight: 1272 },
      { id: "TAE-POST-5x7", name: '5" x 7"', printfulVariantId: 4546, landscapeWidth: 2172, landscapeHeight: 1572 },
    ],
    printDpi: 300,
    placements: ["front", "back"],
    requiresQrCode: true,
    supportsOrientation: true,
    defaultOrientation: "landscape",
    qrSizeInches: 0.4,
  },
  {
    id: "TAE-WALL",
    name: "Poster",
    printfulProductId: 1,
    variants: [
      { id: "TAE-WALL-12x18", name: '12" x 18"', printfulVariantId: 8630, landscapeWidth: 5400, landscapeHeight: 3600 },
      { id: "TAE-WALL-18x24", name: '18" x 24"', printfulVariantId: 8631, landscapeWidth: 7200, landscapeHeight: 5400 },
      { id: "TAE-WALL-24x36", name: '24" x 36"', printfulVariantId: 8632, landscapeWidth: 10800, landscapeHeight: 7200 },
    ],
    printDpi: 300,
    placements: ["front"],
    requiresQrCode: true,
    supportsOrientation: true,
    defaultOrientation: "portrait",
    qrSizeInches: 0.5,
  },
];

function buildProductSpec(
  product: ProductDefinition,
  variantIndex: number,
  orientation: Orientation
): ProductSpec {
  const variant = product.variants[variantIndex];
  const isPortrait = orientation === "portrait";
  const printWidth = isPortrait ? variant.landscapeHeight : variant.landscapeWidth;
  const printHeight = isPortrait ? variant.landscapeWidth : variant.landscapeHeight;

  const qrSize = Math.round(product.qrSizeInches * product.printDpi);
  const qrInTemplateFraction = 0.55;
  const templateSize = Math.round(qrSize / qrInTemplateFraction);
  const margin = Math.round(0.5 * product.printDpi);
  const qrPlacement = (product.placements as string[]).includes("back") ? "back" : "front";

  return {
    id: variant.id,
    name: `${product.name} - ${variant.name} (${orientation})`,
    printfulProductId: product.printfulProductId,
    printfulVariantId: variant.printfulVariantId,
    printWidth,
    printHeight,
    printDpi: product.printDpi,
    placements: product.placements,
    requiresQrCode: product.requiresQrCode,
    qrDefaultPosition: product.requiresQrCode
      ? {
          placement: qrPlacement as Placement,
          top: printHeight - templateSize - margin,
          left: printWidth - templateSize - margin,
          width: templateSize,
          height: templateSize,
        }
      : undefined,
  };
}

// =============================================================================
// Build ProductSpec from API product data
// =============================================================================
function buildSpecFromApiProduct(apiProduct: any): ProductSpec {
  const printWidth = apiProduct.printWidth || 2146;
  const printHeight = apiProduct.printHeight || 1546;
  const printDpi = apiProduct.printDpi || 300;

  let placements: Placement[] = ["front"];
  if (apiProduct.requiredPlacements) {
    try {
      placements = JSON.parse(apiProduct.requiredPlacements);
    } catch { /* keep default */ }
  }

  let qrDefaultPosition: ProductSpec["qrDefaultPosition"] = undefined;
  if (apiProduct.requiresQrCode) {
    if (apiProduct.qrDefaultPosition) {
      try {
        qrDefaultPosition = JSON.parse(apiProduct.qrDefaultPosition);
      } catch { /* compute below */ }
    }
    if (!qrDefaultPosition) {
      const qrSizeInches = 0.4;
      const qrSize = Math.round(qrSizeInches * printDpi);
      const templateSize = Math.round(qrSize / 0.55);
      const margin = Math.round(0.5 * printDpi);
      const qrPlacement = placements.includes("back") ? "back" : "front";
      qrDefaultPosition = {
        placement: qrPlacement,
        top: printHeight - templateSize - margin,
        left: printWidth - templateSize - margin,
        width: templateSize,
        height: templateSize,
      };
    }
  }

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    printfulProductId: apiProduct.printfulProductId || undefined,
    printfulVariantId: apiProduct.printfulVariantId || undefined,
    productSlug: apiProduct.slug,
    basePrice: apiProduct.basePrice,
    printWidth,
    printHeight,
    printDpi,
    placements,
    requiresQrCode: apiProduct.requiresQrCode || false,
    qrDefaultPosition,
  };
}

// =============================================================================
// STUDIO CONTENT (uses searchParams)
// =============================================================================

function StudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const slugParam = searchParams.get("slug");
  const productIdParam = searchParams.get("product_id");

  // API-loaded product state
  const [apiProduct, setApiProduct] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(!!slugParam);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fallback catalog state
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(1);
  const [orientation, setOrientation] = useState<Orientation>(PRODUCTS[0].defaultOrientation);

  // Fetch product from API if slug is provided
  useEffect(() => {
    if (!slugParam) return;
    setApiLoading(true);
    fetch(`/api/products/${slugParam}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setApiProduct(data.data);
        } else {
          setApiError(data.error || "Product not found");
        }
      })
      .catch(() => setApiError("Failed to load product"))
      .finally(() => setApiLoading(false));
  }, [slugParam]);

  // Determine product spec
  const isApiMode = !!slugParam && !!apiProduct;
  const selectedProduct = PRODUCTS[selectedProductIndex];

  const productSpec: ProductSpec = isApiMode
    ? buildSpecFromApiProduct(apiProduct)
    : buildProductSpec(selectedProduct, selectedVariantIndex, orientation);

  const productName = isApiMode ? apiProduct.name : selectedProduct.name;

  // Handle export: save design files to sessionStorage, then navigate to ArtKey editor
  const handleExport = useCallback(
    (
      files: { placement: string; dataUrl: string }[],
      artKeyTemplatePosition?: { placement: string; x: number; y: number; width: number; height: number }
    ) => {
      const studioData = {
        productSpec: {
          id: productSpec.id,
          name: productSpec.name,
          printfulProductId: productSpec.printfulProductId,
          printfulVariantId: productSpec.printfulVariantId,
          productSlug: productSpec.productSlug,
          basePrice: productSpec.basePrice,
          requiresQrCode: productSpec.requiresQrCode,
        },
        designFiles: files,
        artKeyTemplatePosition: artKeyTemplatePosition || null,
        exportedAt: new Date().toISOString(),
      };

      sessionStorage.setItem("tae-studio-export", JSON.stringify(studioData));

      // If product requires QR, go to ArtKey editor; otherwise go to cart
      if (productSpec.requiresQrCode) {
        const params = new URLSearchParams({
          from_studio: "true",
          product_id: productSpec.id,
          product_name: productSpec.name,
        });
        if (productSpec.productSlug) params.set("slug", productSpec.productSlug);
        router.push(`/artkey-editor?${params}`);
      } else {
        router.push("/cart");
      }
    },
    [productSpec, router]
  );

  const handleProductChange = (index: number) => {
    setSelectedProductIndex(index);
    setSelectedVariantIndex(0);
    setOrientation(PRODUCTS[index].defaultOrientation);
  };

  if (apiLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6">{apiError}</p>
          <Link
            href="/shop"
            className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-100 border-b px-4 py-3 flex items-center gap-6 flex-wrap">
        {isApiMode ? (
          <>
            {/* API product mode: show product name and back link */}
            <Link
              href={`/shop/${apiProduct.slug}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              &larr; Back
            </Link>
            <span className="text-sm font-semibold text-gray-800">
              {productName}
            </span>
            {apiProduct.sizeLabel && (
              <span className="text-sm text-gray-500">{apiProduct.sizeLabel}</span>
            )}
          </>
        ) : (
          <>
            {/* Catalog mode: product/variant/orientation dropdowns */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Product:</label>
              <select
                value={selectedProductIndex}
                onChange={(e) => handleProductChange(Number(e.target.value))}
                className="border rounded px-3 py-1.5 text-sm bg-white"
              >
                {PRODUCTS.map((p, i) => (
                  <option key={p.id} value={i}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Size:</label>
              <select
                value={selectedVariantIndex}
                onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                className="border rounded px-3 py-1.5 text-sm bg-white"
              >
                {selectedProduct.variants.map((v, i) => (
                  <option key={v.id} value={i}>{v.name}</option>
                ))}
              </select>
            </div>
            {selectedProduct.supportsOrientation && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Orientation:</label>
                <div className="flex border rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOrientation("portrait")}
                    className={`px-3 py-1.5 text-sm ${
                      orientation === "portrait" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation("landscape")}
                    className={`px-3 py-1.5 text-sm ${
                      orientation === "landscape" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Landscape
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="text-sm text-gray-500 ml-auto">
          {productSpec.printWidth} x {productSpec.printHeight} px @ {productSpec.printDpi} DPI
        </div>
      </div>

      {/* Customization Studio */}
      <div className="flex-1">
        <CustomizationStudio
          key={`${productSpec.id}-${productSpec.printWidth}-${productSpec.printHeight}`}
          productSpec={productSpec}
          placeholderQrCodeUrl="/images/placeholder-qr.svg"
          artKeyTemplateUrl="/images/artkey-template-compact.svg"
          onExport={handleExport}
        />
      </div>
    </div>
  );
}

// =============================================================================
// PAGE WRAPPER (Suspense boundary for useSearchParams)
// =============================================================================

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
