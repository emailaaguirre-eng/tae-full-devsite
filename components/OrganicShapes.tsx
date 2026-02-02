"use client";

/**
 * Organic Shapes Component
 * Hand-drawn style decorative elements to add human touch
 * © 2026 B&D Servicing LLC. All rights reserved.
 */

import React from 'react';

interface OrganicShapeProps {
  className?: string;
  color?: string;
  opacity?: number;
}

// Hand-drawn style brush stroke
export function BrushStroke({ className = '', color = 'currentColor', opacity = 0.1 }: OrganicShapeProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 200 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <path 
        d="M0,10 Q50,5 100,10 T200,10" 
        stroke={color} 
        strokeWidth="3" 
        strokeLinecap="round"
        opacity={opacity}
      />
      <path 
        d="M0,12 Q50,7 100,12 T200,12" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
        opacity={opacity * 0.7}
      />
    </svg>
  );
}

// Organic blob shape
export function OrganicBlob({ className = '', color = 'currentColor', opacity = 0.05 }: OrganicShapeProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M50,50 Q30,80 50,110 T50,150 Q70,180 100,180 T150,150 Q180,130 150,100 T150,50 Q130,20 100,30 T50,50" 
        fill={color} 
        opacity={opacity}
      />
    </svg>
  );
}

// Hand-drawn circle (slightly imperfect)
export function HandDrawnCircle({ className = '', color = 'currentColor', opacity = 0.1 }: OrganicShapeProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
        opacity={opacity}
        style={{ 
          strokeDasharray: '2,3',
          animation: 'none'
        }}
      />
    </svg>
  );
}

// Decorative squiggle
export function Squiggle({ className = '', color = 'currentColor', opacity = 0.15 }: OrganicShapeProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 300 50" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <path 
        d="M0,25 Q75,10 150,25 T300,25" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
        opacity={opacity}
      />
    </svg>
  );
}
