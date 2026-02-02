// app/studio/page.tsx
// Demo page for the Customization Studio with product & orientation selection
"use client";

import { useState } from "react";
import { CustomizationStudio } from "@/customization-studio";
import { ProductSpec } from "@/customization-studio/types";

// =============================================================================
// PRODUCT CATALOG - All available products with their specs
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
    // Dimensions are stored as width x height in LANDSCAPE orientation
    // For portrait, we swap them
    landscapeWidth: number;
    landscapeHeight: number;
  }[];
  printDpi: number;

  // IMPORTANT: these must match the Placement names used by CustomizationStudio
  placements: ProductSpec["placements"];

  requiresQrCode: boolean;
  supportsOrientation: boolean; // Can this product be rotated?
  defaultOrientation: Orientation;
  qrSizeInches: number; // QR code size in inches (e.g., 1 for 1"x1")
};

const PRODUCTS: ProductDefinition[] = [
  // =========================================================================
  // GREETING CARDS - Product 568
  // =========================================================================
  {
    id: "TAE-CARD",
    name: "Greeting Card",
    printfulProductId: 568,
    variants: [
      {
        id: "TAE-CARD-SM",
        name: 'Small (4.25" x 5.5")',
        printfulVariantId: 14457,
        landscapeWidth: 1842,
        landscapeHeight: 1240,
      },
      {
        id: "TAE-CARD-MD",
        name: 'Medium (5" x 7")',
        printfulVariantId: 14458,
        landscapeWidth: 2146,
        landscapeHeight: 1546,
      },
      {
        id: "TAE-CARD-LG",
        name: 'Large (A5 - 5.83" x 8.27")',
        printfulVariantId: 14460,
        landscapeWidth: 2526,
        landscapeHeight: 1794,
      },
    ],
    printDpi: 300,

    // FIXED: use inside1/inside2 (matches studio expectations)
    // Order: front -> inside left -> inside right -> back
    placements: ["front", "inside1", "inside2", "back"],

    requiresQrCode: true,
    supportsOrientation: true,
    defaultOrientation: "portrait",
    qrSizeInches: 1,
  },

  // =========================================================================
  // POSTCARDS - Product 156 (you'll need to verify this ID)
  // =========================================================================
  {
    id: "TAE-POST",
    name: "Postcard",
    printfulProductId: 156, // TODO: Verify with Printful API
    variants: [
      {
        id: "TAE-POST-4x6",
        name: '4" x 6"',
        printfulVariantId: 4545, // TODO: Verify
        landscapeWidth: 1872,
        landscapeHeight: 1272,
      },
      {
        id: "TAE-POST-5x7",
        name: '5" x 7"',
        printfulVariantId: 4546, // TODO: Verify
        landscapeWidth: 2172,
        landscapeHeight: 1572,
      },
    ],
    printDpi: 300,
    placements: ["front", "back"],
    requiresQrCode: true,
    supportsOrientation: true,
    defaultOrientation: "landscape",
    qrSizeInches: 0.75,
  },

  // =========================================================================
  // POSTERS - Product 1 (Enhanced Matte Paper Poster)
  // =========================================================================
  {
    id: "TAE-WALL",
    name: "Poster",
    printfulProductId: 1, // Enhanced Matte Paper Poster
    variants: [
      {
        id: "TAE-WALL-12x18",
        name: '12" x 18"',
        printfulVariantId: 8630, // TODO: Verify
        landscapeWidth: 5400,
        landscapeHeight: 3600,
      },
      {
        id: "TAE-WALL-18x24",
        name: '18" x 24"',
        printfulVariantId: 8631, // TODO: Verify
        landscapeWidth: 7200,
        landscapeHeight: 5400,
      },
      {
        id: "TAE-WALL-24x36",
        name: '24" x 36"',
        printfulVariantId: 8632, // TODO: Verify
        landscapeWidth: 10800,
        landscapeHeight: 7200,
      },
    ],
    printDpi: 300,
    placements: ["front"],
    requiresQrCode: true,
    supportsOrientation: true,
    defaultOrientation: "portrait",
    qrSizeInches: 1.5,
  },
];

// =============================================================================
// HELPER: Build ProductSpec from selections
// =============================================================================

function buildProductSpec(
  product: ProductDefinition,
  variantIndex: number,
  orientation: Orientation
): ProductSpec {
  const variant = product.variants[variantIndex];

  // Swap dimensions based on orientation
  const isPortrait = orientation === "portrait";
  const printWidth = isPortrait ? variant.landscapeHeight : variant.landscapeWidth;
  const printHeight = isPortrait ? variant.landscapeWidth : variant.landscapeHeight;

  // Calculate QR position (bottom-right with margin)
  const qrSize = Math.round(product.qrSizeInches * product.printDpi);
  // The ArtKey template contains the QR inside it. In the editor, QR is drawn at ~24% of the template size.
  // To ensure the printed QR is ~qrSize (e.g., 1 inch), we scale the template accordingly.
  const qrInTemplateFraction = 0.24;
  const templateSize = Math.round(qrSize / qrInTemplateFraction);
  const margin = Math.round(0.5 * product.printDpi); // 0.5" margin

  // Decide which surface the QR box should live on:
  // If "back" exists, put it there, otherwise default to "front"
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
          placement: qrPlacement as any,
          top: printHeight - templateSize - margin,
          left: printWidth - templateSize - margin,
          width: templateSize,
          height: templateSize,
        }
      : undefined,
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function StudioPage() {
  // State for product selection
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(1); // Default to medium
  const [orientation, setOrientation] = useState<Orientation>(
    PRODUCTS[0].defaultOrientation
  );

  const selectedProduct = PRODUCTS[selectedProductIndex];

  const productSpec = buildProductSpec(
    selectedProduct,
    selectedVariantIndex,
    orientation
  );

  // Handle product change
  const handleProductChange = (index: number) => {
    setSelectedProductIndex(index);
    setSelectedVariantIndex(0);
    setOrientation(PRODUCTS[index].defaultOrientation);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Product Selection Bar */}
      <div className="bg-gray-100 border-b px-4 py-3 flex items-center gap-6 flex-wrap">
        {/* Product Type */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Product:</label>
          <select
            value={selectedProductIndex}
            onChange={(e) => handleProductChange(Number(e.target.value))}
            className="border rounded px-3 py-1.5 text-sm bg-white"
          >
            {PRODUCTS.map((p, i) => (
              <option key={p.id} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Size/Variant */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Size:</label>
          <select
            value={selectedVariantIndex}
            onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
            className="border rounded px-3 py-1.5 text-sm bg-white"
          >
            {selectedProduct.variants.map((v, i) => (
              <option key={v.id} value={i}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Orientation Toggle */}
        {selectedProduct.supportsOrientation && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Orientation:</label>
            <div className="flex border rounded overflow-hidden">
              <button
                type="button"
                onClick={() => setOrientation("portrait")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                  orientation === "portrait"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="3" width="12" height="18" rx="1" />
                </svg>
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setOrientation("landscape")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                  orientation === "landscape"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="6" width="18" height="12" rx="1" />
                </svg>
                Landscape
              </button>
            </div>
          </div>
        )}

        {/* Dimensions Display */}
        <div className="text-sm text-gray-500 ml-auto">
          {productSpec.printWidth} × {productSpec.printHeight} px @ {productSpec.printDpi} DPI
        </div>
      </div>

      {/* Customization Studio */}
      <div className="flex-1">
        <CustomizationStudio
          key={`${selectedProduct.id}-${selectedVariantIndex}-${orientation}`}
          productSpec={productSpec}
          placeholderQrCodeUrl="/images/placeholder-qr.svg"
          artKeyTemplateUrl="/images/artkey-template.svg"
          onExport={(files) => {
            console.log("Exported files:", files);
            // In production, send to server for Printful order
          }}
        />
      </div>
    </div>
  );
}
