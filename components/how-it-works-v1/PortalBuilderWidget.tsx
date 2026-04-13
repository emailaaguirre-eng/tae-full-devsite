"use client";

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function PortalBuilderWidget() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-[280px] bg-white rounded-xl shadow-lg border border-black/5 overflow-hidden flex flex-col font-body">
      
      {/* Top Header */}
      <div className="p-4 border-b border-black/5 bg-[#FAFAFA]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">1</div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Start Here</span>
        </div>
        <h4 className="text-lg font-display text-primary leading-tight">Start Style</h4>
      </div>

      {/* Content */}
      <div className="p-4 flex-1">
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          {['Solid Color', 'Stock Photos', 'Upload'].map((tab, i) => (
            <div 
              key={tab}
              className={`flex-1 text-[10px] sm:text-xs text-center py-2 rounded-md transition-colors ${activeTab === i ? 'bg-white shadow-sm text-primary font-medium' : 'text-secondary'}`}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Color Swatches Grid (Visible on Tab 0) */}
        <div className="relative h-[210px]">
          <AnimateTab isVisible={activeTab === 0}>
            <div className="grid grid-cols-4 gap-2">
              {['#F5F0E8', '#1A1A1A', '#C9A96E', '#E8D5B7', '#D4BC96', '#FFFAF5', '#EFEFEF', '#5A5A5A', '#2C2C2C', '#8C7B62', '#D9CDBF', '#FFFFFF'].map((color, i) => (
                <motion.div 
                  key={i}
                  className="aspect-square rounded-md border border-black/5 cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: color }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                />
              ))}
            </div>
          </AnimateTab>
          
          <AnimateTab isVisible={activeTab === 1}>
            <div className="grid grid-cols-2 gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-[4/3] bg-gray-200 rounded-md overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                </div>
              ))}
            </div>
          </AnimateTab>

          <AnimateTab isVisible={activeTab === 2}>
            <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-secondary">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span className="text-xs">Drag & Drop files here</span>
            </div>
          </AnimateTab>
        </div>
      </div>

    </div>
  );
}

function AnimateTab({ children, isVisible }: { children: React.ReactNode, isVisible: boolean }) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={false}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        pointerEvents: isVisible ? 'auto' : 'none',
        y: isVisible ? 0 : 10
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
