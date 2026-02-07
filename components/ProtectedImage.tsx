"use client";

/**
 * Protected Image Component
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 * 
 * Adds protection against casual image copying:
 * - Disables right-click context menu
 * - Disables drag-and-drop
 * - Prevents image selection
 * - Adds invisible overlay to block direct interaction
 * 
 * Note: This does NOT prevent determined users (screenshots, dev tools, etc.)
 * but it stops casual right-click > save as behavior.
 */

import Image from "next/image";
import { useState } from "react";

interface ProtectedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  onClick?: () => void;
}

export default function ProtectedImage({
  src,
  alt,
  fill,
  width,
  height,
  className = "",
  style,
  priority,
  onClick,
}: ProtectedImageProps) {
  const [showMessage, setShowMessage] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 2000);
    return false;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div 
      className="relative select-none"
      style={{ ...style, WebkitUserSelect: 'none', userSelect: 'none' }}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onClick={onClick}
    >
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={`${className} pointer-events-none select-none`}
        style={{ 
          WebkitUserDrag: 'none',
          userSelect: 'none',
          pointerEvents: 'none',
        } as React.CSSProperties}
        draggable={false}
        unoptimized={src.includes('theartfulexperience.com')}
        priority={priority}
      />
      
      {/* Invisible overlay to intercept clicks/interactions */}
      <div 
        className="absolute inset-0 z-10"
        style={{ background: 'transparent' }}
      />
      
      {/* Copyright message on right-click attempt */}
      {showMessage && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 transition-opacity">
          <div className="text-white text-center p-4">
            <p className="font-semibold">© The Artful Experience</p>
            <p className="text-sm opacity-80">This image is protected</p>
          </div>
        </div>
      )}
    </div>
  );
}
