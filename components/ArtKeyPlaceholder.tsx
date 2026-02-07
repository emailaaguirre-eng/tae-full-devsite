"use client";

/**
 * ArtKey Placeholder Component
 * 
 * Matches the mockup: Two white rectangular outlines on black background
 * with "ArtKey" in Playfair Display font. Inner rectangle is for QR code.
 * 
 * © 2026 B&D Servicing LLC. All rights reserved.
 */

import React from 'react';

interface ArtKeyPlaceholderProps {
  /**
   * Size of the QR code area in pixels
   * Default: 200px (recommended minimum for QR codes)
   */
  qrSize?: number;
  
  /**
   * Show the placeholder in a compact view (no "ArtKey" label)
   */
  compact?: boolean;
  
  /**
   * Custom className for styling
   */
  className?: string;
}

export default function ArtKeyPlaceholder({
  qrSize = 200,
  compact = false,
  className = '',
}: ArtKeyPlaceholderProps) {
  // Dimensions based on QR size
  // Outer rectangle contains everything
  // Inner rectangle is offset and contains the QR code area
  const padding = 20; // Space around QR code
  const innerOffset = 10; // Offset for inner rectangle
  
  // Outer rectangle dimensions (contains inner rect + padding)
  const outerWidth = qrSize + (padding * 2) + (innerOffset * 2);
  const outerHeight = qrSize + (padding * 2) + (innerOffset * 2);
  
  // Inner rectangle dimensions (contains QR code + padding)
  const innerWidth = qrSize + (padding * 2);
  const innerHeight = qrSize + (padding * 2);

  if (compact) {
    // Compact version - just the rectangles, no label
    return (
      <div 
        className={`relative bg-black ${className}`}
        style={{
          width: `${outerWidth}px`,
          height: `${outerHeight}px`,
        }}
      >
        {/* Outer Rectangle - white border */}
        <div
          className="absolute border-2 border-white"
          style={{
            top: '0',
            left: '0',
            width: `${outerWidth}px`,
            height: `${outerHeight}px`,
          }}
        />
        
        {/* Inner Rectangle - white border, offset */}
        <div
          className="absolute border-2 border-white"
          style={{
            top: `${innerOffset}px`,
            left: `${innerOffset}px`,
            width: `${innerWidth}px`,
            height: `${innerHeight}px`,
          }}
        />
        
        {/* QR Code Area - centered in inner rectangle */}
        <div
          className="absolute"
          style={{
            top: `${innerOffset + padding}px`,
            left: `${innerOffset + padding}px`,
            width: `${qrSize}px`,
            height: `${qrSize}px`,
            backgroundColor: 'transparent', // QR code will go here
          }}
        />
      </div>
    );
  }

  // Full version with "ArtKey" label
  return (
    <div 
      className={`relative bg-black flex flex-col items-center justify-center ${className}`}
      style={{
        width: `${outerWidth + 60}px`, // Extra width for label
        minHeight: `${outerHeight + 100}px`, // Extra height for label
        padding: '30px',
      }}
    >
      {/* ArtKey Label - Playfair Display */}
      <div 
        className="mb-6 text-center"
        style={{
          fontFamily: 'var(--font-playfair), "Playfair Display", serif',
        }}
      >
        <h3 
          className="text-white"
          style={{
            fontSize: '24px',
            fontWeight: 400,
            letterSpacing: '0.05em',
            fontFamily: 'var(--font-playfair), "Playfair Display", serif',
          }}
        >
          ArtKey
        </h3>
      </div>

      {/* Container for the two rectangles */}
      <div 
        className="relative"
        style={{ 
          width: `${outerWidth}px`, 
          height: `${outerHeight}px` 
        }}
      >
        {/* Outer Rectangle - white border */}
        <div
          className="absolute border-2 border-white"
          style={{
            top: '0',
            left: '0',
            width: `${outerWidth}px`,
            height: `${outerHeight}px`,
          }}
        />
        
        {/* Inner Rectangle - white border, offset */}
        <div
          className="absolute border-2 border-white"
          style={{
            top: `${innerOffset}px`,
            left: `${innerOffset}px`,
            width: `${innerWidth}px`,
            height: `${innerHeight}px`,
          }}
        />
        
        {/* QR Code Area - centered in inner rectangle */}
        <div
          className="absolute"
          style={{
            top: `${innerOffset + padding}px`,
            left: `${innerOffset + padding}px`,
            width: `${qrSize}px`,
            height: `${qrSize}px`,
            backgroundColor: 'transparent', // QR code will go here
          }}
        />
      </div>
    </div>
  );
}

/**
 * Inline ArtKey Placeholder (for use within designs)
 * Smaller version that can be embedded
 */
export function InlineArtKeyPlaceholder({ size = 150 }: { size?: number }) {
  const padding = 16;
  const innerOffset = 8;
  const outerSize = size + (padding * 2) + (innerOffset * 2);
  const innerSize = size + (padding * 2);

  return (
    <div 
      className="relative bg-black inline-block"
      style={{
        width: `${outerSize}px`,
        height: `${outerSize}px`,
      }}
    >
      {/* Outer Rectangle */}
      <div
        className="absolute border-2 border-white"
        style={{
          top: '0',
          left: '0',
          width: `${outerSize}px`,
          height: `${outerSize}px`,
        }}
      />
      
      {/* Inner Rectangle */}
      <div
        className="absolute border-2 border-white"
        style={{
          top: `${innerOffset}px`,
          left: `${innerOffset}px`,
          width: `${innerSize}px`,
          height: `${innerSize}px`,
        }}
      />
      
      {/* QR Area */}
      <div
        className="absolute"
        style={{
          top: `${innerOffset + padding}px`,
          left: `${innerOffset + padding}px`,
          width: `${size}px`,
          height: `${size}px`,
        }}
      />
    </div>
  );
}
