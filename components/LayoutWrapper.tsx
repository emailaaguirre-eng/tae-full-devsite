"use client";

import { ReactNode } from "react";

interface LayoutWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function LayoutWrapper({ children, className = "" }: LayoutWrapperProps) {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-lightest via-white to-brand-lightest"></div>
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #918c86 1px, transparent 1px),
              linear-gradient(to bottom, #918c86 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      {/* Main content wrapper with professional styling */}
      <div className="relative">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-brand-medium via-brand-dark to-brand-medium"></div>
        
        {/* Content container with subtle shadow and border */}
        <div className="relative">
          {/* Left border accent */}
          <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-light via-brand-medium to-brand-light opacity-30 z-0"></div>
          
          {/* Right border accent */}
          <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-light via-brand-medium to-brand-light opacity-30 z-0"></div>
          
          {/* Main content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-1 bg-gradient-to-r from-brand-medium via-brand-dark to-brand-medium"></div>
      </div>

      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Top right decorative circle */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-brand-light/20 rounded-full blur-3xl"></div>
        {/* Bottom left decorative circle */}
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-brand-medium/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}

