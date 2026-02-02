"use client";

import { useState } from "react";

export default function CardsSection() {
  const [uploadMethod, setUploadMethod] = useState<"upload" | "gallery" | null>(null);
  const cardsHero =
    "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/tAE_Holiday_Hero.png";

  return (
    <section id="cards" className="py-20" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero banner */}
        <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl mb-12 bg-white p-2 sm:p-3">
          <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50">
            <img
              src={cardsHero}
              alt="Cards and invitations hero"
              className="w-full h-auto object-contain max-h-[400px]"
            />
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            Cards, Invitations & Announcements
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Choose Your Own Image */}
          <div className="bg-brand-lightest rounded-2xl p-8 mb-8 shadow-lg">
            <h3 className="text-2xl font-bold text-brand-darkest mb-6 text-center">
              Choose Your Own Image
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => setUploadMethod("upload")}
                className={`p-8 rounded-xl border-2 transition-all ${
                  uploadMethod === "upload"
                    ? "border-brand-dark bg-brand-medium text-white shadow-xl scale-105"
                    : "border-brand-light bg-white hover:border-brand-medium"
                }`}
              >
                <div className="text-5xl mb-4">📤</div>
                <div className="font-bold text-xl mb-2">Upload Image</div>
                <p className={uploadMethod === "upload" ? "text-white" : "text-brand-darkest"}>
                  Choose from your device
                </p>
              </button>
              <button
                onClick={() => window.location.href = '/gallery'}
                className="p-8 rounded-xl border-2 transition-all border-brand-light bg-white hover:border-brand-medium hover:shadow-xl"
              >
                <div className="text-5xl mb-4">🖼️</div>
                <div className="font-bold text-xl mb-2">Choose From Library</div>
                <p className="text-brand-darkest">
                  Browse our collection
                </p>
              </button>
            </div>
          </div>

          {uploadMethod && (
            <>
              {/* Step 2: Personalize */}
              <div className="bg-gradient-to-br from-brand-light to-brand-medium rounded-2xl p-8 mb-8 shadow-lg">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  Step 2: Personalize
                </h3>
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-brand-darkest mb-4 text-center">
                    Use the Design Editor to customize your card
                  </p>
                  <button 
                    onClick={() => {
                      const params = new URLSearchParams({
                        product_type: 'card',
                        product_name: 'Card',
                        price: '19.99',
                      });
                      window.location.href = `/customize?${params}`;
                    }}
                    className="w-full bg-brand-dark text-white py-4 rounded-full font-semibold hover:bg-brand-darkest transition-all shadow-lg text-lg"
                  >
                    🎨 Open the Design Editor
                  </button>
                  <div className="mt-4 text-sm text-brand-darkest text-center">
                    Add layouts, images, text, elements, frames, filters, AI effects, and themes!
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </section>
  );
}




