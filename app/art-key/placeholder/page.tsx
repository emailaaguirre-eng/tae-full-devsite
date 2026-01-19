"use client";

/**
 * ArtKey Placeholder Demo Page
 * 
 * Shows the ArtKey placeholder component for proof of concept
 */

import ArtKeyPlaceholder, { InlineArtKeyPlaceholder } from "@/components/ArtKeyPlaceholder";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ArtKeyPlaceholderPage() {
  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-brand-darkest mb-4 font-playfair">
              ArtKey Placeholder
            </h1>
            <p className="text-lg text-brand-medium">
              Proof of concept - QR code placeholder with Playfair Display font
            </p>
          </div>

          {/* Full Placeholder */}
          <div className="bg-white rounded-2xl shadow-lg p-12 mb-12">
            <h2 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair text-center">
              Full ArtKey Placeholder
            </h2>
            <div className="flex justify-center">
              <ArtKeyPlaceholder qrSize={200} />
            </div>
          </div>

          {/* Compact Placeholder */}
          <div className="bg-white rounded-2xl shadow-lg p-12 mb-12">
            <h2 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair text-center">
              Compact Version
            </h2>
            <div className="flex justify-center">
              <ArtKeyPlaceholder qrSize={150} compact />
            </div>
          </div>

          {/* Inline Placeholder */}
          <div className="bg-white rounded-2xl shadow-lg p-12 mb-12">
            <h2 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair text-center">
              Inline Version (for embedding in designs)
            </h2>
            <div className="flex justify-center">
              <InlineArtKeyPlaceholder size={150} />
            </div>
          </div>

          {/* Different Sizes */}
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <h2 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair text-center">
              Different QR Code Sizes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-sm text-brand-medium mb-4">Small (150px)</p>
                <div className="flex justify-center">
                  <ArtKeyPlaceholder qrSize={150} compact />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-brand-medium mb-4">Medium (200px)</p>
                <div className="flex justify-center">
                  <ArtKeyPlaceholder qrSize={200} compact />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-brand-medium mb-4">Large (250px)</p>
                <div className="flex justify-center">
                  <ArtKeyPlaceholder qrSize={250} compact />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
