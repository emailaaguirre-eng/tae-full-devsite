"use client";

import { useState } from "react";

export default function PrintsSection() {
  const [uploadMethod, setUploadMethod] = useState<"upload" | "gallery" | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [isFramed, setIsFramed] = useState<boolean | null>(null);
  const [frameColor, setFrameColor] = useState<string | null>(null);

  const sizes = [
    { name: "5x7", price: 9.99 },
    { name: "8x10", price: 14.99 },
    { name: "11x14", price: 24.99 },
    { name: "16x20", price: 39.99 },
    { name: "20x24", price: 59.99 },
    { name: "24x36", price: 89.99 },
  ];

  const materials = [
    { name: "Glossy Paper", description: "Vibrant colors, classic finish", price: 0 },
    { name: "Matte Paper", description: "Elegant, glare-free finish", price: 2.00 },
    { name: "Canvas", description: "Gallery-wrapped canvas", price: 15.00 },
    { name: "Metal", description: "Modern aluminum print", price: 35.00 },
  ];

  const frameColors = [
    { name: "Black", price: 0 },
    { name: "White", price: 5.00 },
    { name: "Silver", price: 6.00 },
  ];

  const calculateTotal = () => {
    let total = 0;
    if (selectedSize) {
      const size = sizes.find(s => s.name === selectedSize);
      if (size) total += size.price;
    }
    if (selectedMaterial) {
      const material = materials.find(m => m.name === selectedMaterial);
      if (material) total += material.price;
    }
    if (isFramed && frameColor) {
      const frame = frameColors.find(f => f.name === frameColor);
      if (frame) total += frame.price + 20; // Base frame cost
    }
    return total.toFixed(2);
  };

  return (
    <section id="prints" className="py-20" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🖼️</div>
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            Prints
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Step 1: Upload or Gallery */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <h3 className="text-2xl font-bold text-brand-darkest mb-6 text-center">
              Step 1: Choose Your Image Source
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => setUploadMethod("upload")}
                className={`p-8 rounded-xl border-2 transition-all ${
                  uploadMethod === "upload"
                    ? "border-brand-dark bg-brand-medium text-white shadow-xl scale-105"
                    : "border-brand-light bg-brand-lightest hover:border-brand-medium"
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
                className="p-8 rounded-xl border-2 transition-all border-brand-light bg-brand-lightest hover:border-brand-medium hover:shadow-xl"
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
              {/* Step 2: Personalize with Designer */}
              <div className="bg-gradient-to-br from-brand-light to-brand-medium rounded-2xl p-8 mb-8 shadow-lg">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  Step 2: Personalize
                </h3>
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-brand-darkest mb-4 text-center">
                    Use the Design Editor to enhance your image
                  </p>
                  <button className="w-full bg-brand-dark text-white py-4 rounded-full font-semibold hover:bg-brand-darkest transition-all shadow-lg text-lg">
                    🎨 Open the Design Editor
                  </button>
                  <div className="mt-4 text-sm text-brand-darkest text-center">
                    Add layouts, images, text, elements, frames, filters, AI effects, and themes!
                  </div>
                </div>
              </div>

              {/* Step 3: Choose Size */}
              <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
                <h3 className="text-2xl font-bold text-brand-darkest mb-6 text-center">
                  Step 3: Choose Size
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sizes.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size.name)}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        selectedSize === size.name
                          ? "border-brand-dark bg-brand-light shadow-lg scale-105"
                          : "border-brand-light hover:border-brand-medium"
                      }`}
                    >
                      <div className="font-bold text-xl text-brand-darkest mb-2">{size.name}&quot;</div>
                      <div className="text-brand-medium font-semibold">${size.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Choose Material */}
              <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
                <h3 className="text-2xl font-bold text-brand-darkest mb-6 text-center">
                  Step 4: Choose Material
                </h3>
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
                      <div className="font-bold text-lg text-brand-darkest mb-1">{material.name}</div>
                      <div className="text-sm text-brand-darkest mb-2">{material.description}</div>
                      <div className="text-brand-medium font-semibold">
                        {material.price === 0 ? "Included" : `+$${material.price}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 5: Framed or Unframed */}
              <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
                <h3 className="text-2xl font-bold text-brand-darkest mb-6 text-center">
                  Step 5: Framed or Unframed?
                </h3>
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

                {/* Frame Color Selection */}
                {isFramed && (
                  <div className="border-t-2 border-brand-light pt-6">
                    <h4 className="font-bold text-lg text-brand-darkest mb-4 text-center">
                      Plastic Frame - Choose Color:
                    </h4>
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

              {/* Order Summary & Add to Cart */}
              {selectedSize && selectedMaterial && isFramed !== null && (
                <div className="bg-gradient-to-br from-brand-dark to-brand-darkest rounded-2xl p-8 shadow-2xl text-white">
                  <h3 className="text-2xl font-bold mb-6 text-center">Order Summary</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-semibold">{selectedSize}&quot;</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Material:</span>
                      <span className="font-semibold">{selectedMaterial}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frame:</span>
                      <span className="font-semibold">
                        {isFramed ? `${frameColor || "Select color"}` : "Unframed"}
                      </span>
                    </div>
                    <div className="border-t border-brand-light pt-3 mt-4">
                      <div className="flex justify-between text-2xl font-bold">
                        <span>Total:</span>
                        <span className="text-brand-light">${calculateTotal()}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="w-full bg-brand-medium text-white py-4 rounded-full font-bold text-lg hover:bg-brand-dark transition-all shadow-lg mb-3"
                    disabled={isFramed && !frameColor}
                    onClick={() => {
                      if (isFramed && !frameColor) return;
                      // Redirect to ArtKey editor
                      const params = new URLSearchParams({
                        product_type: 'print',
                        size: selectedSize || '',
                        material: selectedMaterial || '',
                        framed: isFramed ? '1' : '0',
                        frame_color: frameColor || '',
                      });
                      window.location.href = `/artkey/editor?${params}`;
                    }}
                  >
                    🎨 Personalize with ArtKey
                  </button>
                  <button 
                    className="w-full bg-brand-light text-brand-darkest py-4 rounded-full font-bold text-lg hover:bg-white transition-all shadow-lg"
                    disabled={isFramed && !frameColor}
                  >
                    {isFramed && !frameColor ? "Select Frame Color" : "Add to Cart 🛒"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

