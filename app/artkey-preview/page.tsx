"use client";

/**
 * ArtKey QR Code Placeholder Preview
 * Shows the ArtKey placeholder design for QR codes
 */

import ArtKeyPlaceholder, { InlineArtKeyPlaceholder } from '@/components/ArtKeyPlaceholder';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Playfair_Display } from 'next/font/google';
import { useState } from 'react';

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "600", "700"],
});

export default function ArtKeyPreviewPage() {
  const [qrSize, setQrSize] = useState(200);
  const [showQR, setShowQR] = useState(false);

  // Mock QR code (in real implementation, this would be generated)
  const mockQRCode = showQR ? (
    <div className="w-full h-full bg-white p-2">
      <div className="w-full h-full bg-black grid grid-cols-8 gap-0.5 p-1">
        {Array.from({ length: 64 }).map((_, i) => (
          <div 
            key={i} 
            className={`aspect-square ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
          />
        ))}
      </div>
    </div>
  ) : null;

  return (
    <main className={`min-h-screen bg-gray-100 ${playfairDisplay.variable} font-playfair`}>
      <Navbar />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-playfair text-center">
            ArtKey QR Code Placeholder
          </h1>
          <p className="text-lg text-gray-700 text-center mb-12 max-w-2xl mx-auto">
            Preview of the ArtKey placeholder design that will hold QR codes on physical products
          </p>

          {/* Full Version Preview */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-playfair">
              Full ArtKey Placeholder
            </h2>
            <p className="text-gray-600 mb-6">
              This is the complete ArtKey placeholder with "ArtKey" label. The inner rectangle is where the QR code will be placed.
            </p>
            
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl">
              <div className="relative">
                <ArtKeyPlaceholder qrSize={qrSize} compact={false} />
                {showQR && (
                  <div 
                    className="absolute"
                    style={{
                      top: `${24 + 12}px`, // padding + innerOffset
                      left: `${24 + 12}px`,
                      width: `${qrSize}px`,
                      height: `${qrSize}px`,
                    }}
                  >
                    {mockQRCode}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-700">QR Size:</span>
                <input
                  type="range"
                  min="150"
                  max="300"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-gray-700 w-12">{qrSize}px</span>
              </label>
              <button
                onClick={() => setShowQR(!showQR)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showQR ? 'Hide' : 'Show'} Mock QR Code
              </button>
            </div>
          </div>

          {/* Compact Version */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-playfair">
              Compact Version
            </h2>
            <p className="text-gray-600 mb-6">
              Minimal version without the "ArtKey" label - perfect for smaller spaces or when you want a more subtle placement.
            </p>
            
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl">
              <ArtKeyPlaceholder qrSize={200} compact={true} />
            </div>
          </div>

          {/* Inline Version */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-playfair">
              Inline Version
            </h2>
            <p className="text-gray-600 mb-6">
              Smallest version for embedding within designs or as a subtle element.
            </p>
            
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl">
              <InlineArtKeyPlaceholder size={150} />
            </div>
          </div>

          {/* Real-World Examples */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-playfair">
              Real-World Usage Examples
            </h2>
            
            <div className="space-y-8">
              {/* Example 1: On a Card */}
              <div className="p-8 rounded-lg border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <ArtKeyPlaceholder qrSize={120} compact={true} />
                </div>
                <div className="pr-32">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 font-playfair">
                    Wedding Invitation
                  </h3>
                  <p className="text-gray-600 mb-4">
                    The ArtKey placeholder appears in the bottom-right corner, ready for the QR code that links to the couple's ArtKey portal.
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Example: Bottom-right placement on a 5x7 invitation card
                  </p>
                </div>
              </div>

              {/* Example 2: On a Print */}
              <div className="p-8 rounded-lg border-2 border-gray-200 bg-white relative">
                <div className="absolute bottom-4 left-4">
                  <ArtKeyPlaceholder qrSize={150} compact={true} />
                </div>
                <div className="pb-32">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 font-playfair">
                    Art Print
                  </h3>
                  <p className="text-gray-600 mb-4">
                    The ArtKey can be placed in a corner or along the edge, allowing customers to scan and access additional content about the artwork.
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Example: Bottom-left placement on an 8x10 art print
                  </p>
                </div>
              </div>

              {/* Example 3: Inline in Design */}
              <div className="p-8 rounded-lg border-2 border-gray-200 bg-gray-50">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 font-playfair">
                  Embedded in Design
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-white p-6 rounded-lg">
                    <p className="text-gray-700 mb-4">
                      Your custom design content goes here. The ArtKey can be integrated seamlessly into the layout.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <InlineArtKeyPlaceholder size={100} />
                  </div>
                </div>
                <p className="text-sm text-gray-500 italic mt-4">
                  Example: Inline placement within a custom design
                </p>
              </div>
            </div>
          </div>

          {/* Design Specifications */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-playfair">
              Design Specifications
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">Visual Design</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Black background (#000000)</li>
                  <li>• White border outlines (2px)</li>
                  <li>• Two overlapping rectangles for depth</li>
                  <li>• Inner rectangle offset by 12px</li>
                  <li>• Playfair Display font for "ArtKey" label</li>
                  <li>• QR code area clearly defined in center</li>
                </ul>
              </div>

              <div className="p-6 rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">Technical Details</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• QR code area: Customizable size (default 200px)</li>
                  <li>• Minimum recommended: 150px for scanning</li>
                  <li>• Maximum recommended: 300px for visibility</li>
                  <li>• Fully scalable SVG-based design</li>
                  <li>• Works on any background color</li>
                  <li>• Print-ready at 300 DPI</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-6 rounded-lg bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">Implementation Notes:</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>The placeholder is positioned by the customer/host in the design editor</li>
                <li>When the design is finalized, a unique QR code is generated and placed in the inner rectangle</li>
                <li>The QR code links to the ArtKey portal with the customer's custom content</li>
                <li>The design ensures the QR code has proper quiet zone (white space) for reliable scanning</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
