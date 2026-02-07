"use client";

import { ReactNode } from "react";

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  withShadow?: boolean;
  withBorder?: boolean;
}

export default function SectionWrapper({ 
  children, 
  className = "", 
  containerClassName = "",
  withShadow = false,
  withBorder = false,
}: SectionWrapperProps) {
  return (
    <section className={`relative ${className}`}>
      {/* Section container with professional styling */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${containerClassName}`}>
        {/* Optional top border */}
        {withBorder && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-light to-transparent"></div>
        )}
        
        {/* Content with optional shadow */}
        <div className={`relative ${withShadow ? 'bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8 lg:p-12' : ''}`}>
          {children}
        </div>
      </div>
    </section>
  );
}

