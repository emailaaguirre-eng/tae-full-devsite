// app/customization-studio/page.tsx
"use client";

import dynamic from "next/dynamic";
import type { ProductSpec } from "@/customization-studio/types";

// Dynamic import to avoid SSR issues with Konva
const CustomizationStudio = dynamic(
  () => import("@/customization-studio/CustomizationStudio"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen text-lg" style={{ background: "#000000", color: "#ded8d3" }}>
        Loading Customization Studio...
      </div>
    ),
  }
);

// Demo product spec — postcard with ArtKey QR code
// ArtKey is sized automatically by the studio for a 0.5" QR code.
// At 300 DPI the ArtKey is ~536×536 print px (~1.79" square).
const DEMO_PRODUCT_SPEC: ProductSpec = {
  id: "demo-postcard-artkey",
  name: "Postcard with ArtKey (6\" x 4\")",
  printWidth: 1800,   // 6 inches at 300 DPI
  printHeight: 1200,  // 4 inches at 300 DPI
  printDpi: 300,
  placements: ["front", "back"],
  requiresQrCode: true,
  qrDefaultPosition: {
    placement: "front",
    // Position is now auto-calculated by CustomizationStudio (bottom-right).
    // These are ignored but kept for schema compatibility.
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  },
};

export default function Page() {
  return (
    <main className="h-screen">
      <CustomizationStudio
        productSpec={DEMO_PRODUCT_SPEC}
        artKeyTemplateUrl={`/templates/ArtKey-Template-v3.svg?v=${Date.now()}`}
        placeholderQrCodeUrl=""
      />
    </main>
  );
}
