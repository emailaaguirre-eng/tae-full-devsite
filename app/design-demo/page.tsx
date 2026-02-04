"use client";

/**
 * Design Authenticity Demo Page
 * Preview of custom icons and organic shapes
 */

import { CustomIcon, CustomIcons } from '@/components/CustomIcons';
import { IconStyles } from '@/components/CustomIconsV2';
import { BrushStroke, OrganicBlob, HandDrawnCircle, Squiggle } from '@/components/OrganicShapes';
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

type IconStyle = 'minimal' | 'bold' | 'elegant' | 'handDrawn';
type IconName = 'art' | 'sparkle' | 'sports' | 'cart';

export default function DesignDemoPage() {
  const [selectedStyle, setSelectedStyle] = useState<IconStyle>('minimal');

  return (
    <main className={`min-h-screen bg-brand-lightest ${playfairDisplay.variable}`}>
      <Navbar />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-darkest mb-4 font-playfair text-center">
            Design Authenticity Demo
          </h1>
          <p className="text-lg text-brand-dark text-center mb-12 max-w-2xl mx-auto">
            Preview of custom icons and organic shapes that replace emojis and add a human-crafted feel
          </p>

          {/* Icon Style Selector */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-bold text-brand-darkest mb-6 font-playfair">
              Choose Your Icon Style
            </h2>
            
            <div className="flex flex-wrap gap-3 mb-8">
              {(['minimal', 'bold', 'elegant', 'handDrawn'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style as IconStyle)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    selectedStyle === style
                      ? 'bg-brand-darkest text-white'
                      : 'bg-brand-lightest text-brand-darkest border-2 border-brand-light hover:border-brand-medium'
                  }`}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1).replace(/([A-Z])/g, ' $1')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {(['art', 'sparkle', 'sports', 'cart'] as const).map((iconName) => {
                const IconComponent = IconStyles[selectedStyle][iconName];
                return (
                  <div 
                    key={iconName}
                    className="flex flex-col items-center p-6 rounded-xl border-2 border-brand-light hover:border-brand-medium transition-colors bg-brand-lightest"
                  >
                    <IconComponent size={64} color="#353535" />
                    <span className="mt-4 text-sm font-semibold text-brand-darkest capitalize">
                      {iconName}
                    </span>
                    <span className="text-xs text-brand-medium mt-1">
                      {iconName === 'art' && 'replaces 🎨'}
                      {iconName === 'sparkle' && 'replaces ✨'}
                      {iconName === 'sports' && 'replaces 🏈'}
                      {iconName === 'cart' && 'replaces 🛒'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-6 rounded-lg bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-brand-darkest mb-2">Style Descriptions:</h3>
              <ul className="text-sm text-brand-dark space-y-1">
                <li><strong>Minimal:</strong> Clean, modern, professional - perfect for tech/business</li>
                <li><strong>Bold:</strong> Strong, confident, geometric - great for impactful brands</li>
                <li><strong>Elegant:</strong> Refined, sophisticated, premium - ideal for luxury/art</li>
                <li><strong>Hand-Drawn:</strong> Creative, unique, artistic - adds personality and warmth</li>
              </ul>
            </div>
          </div>

          {/* Original Icons for Comparison */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-bold text-brand-darkest mb-8 font-playfair">
              Original Icons (For Comparison)
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {Object.entries(CustomIcons).slice(0, 4).map(([key, IconComponent]) => (
                <div 
                  key={key}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-brand-light hover:border-brand-medium transition-colors bg-brand-lightest"
                >
                  <IconComponent size={48} color="#353535" />
                  <span className="mt-3 text-sm font-semibold text-brand-darkest capitalize">
                    {key} (Original)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Organic Shapes Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-bold text-brand-darkest mb-8 font-playfair">
              Organic Shapes (Decorative Elements)
            </h2>
            
            <div className="space-y-8">
              <div className="p-6 rounded-lg border-2 border-brand-light">
                <h3 className="text-xl font-semibold text-brand-darkest mb-4">Brush Stroke</h3>
                <div className="relative h-20 bg-brand-lightest rounded overflow-hidden">
                  <BrushStroke className="absolute inset-0 w-full h-full" color="#353535" opacity={0.2} />
                </div>
              </div>

              <div className="p-6 rounded-lg border-2 border-brand-light">
                <h3 className="text-xl font-semibold text-brand-darkest mb-4">Organic Blob</h3>
                <div className="relative h-48 bg-brand-lightest rounded overflow-hidden flex items-center justify-center">
                  <OrganicBlob className="absolute inset-0 w-full h-full" color="#475569" opacity={0.15} />
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
