"use client";

import { motion } from 'framer-motion';
import { renderStringWithArtKeyTrademarks } from "@/components/RefinedTm";
import { EnvelopeWidget } from './EnvelopeWidget';
import { PortalBuilderWidget } from './PortalBuilderWidget';
import { PhoneScanWidget } from './PhoneScanWidget';

const steps = [
  {
    number: '1',
    heading: 'Choose the Art',
    body: 'Upload or select the image that holds your story.',
  },
  {
    number: '2',
    heading: 'Build Your Portal',
    body: 'Add and have fun customizing your videos, photos, playlists, and messages.',
  },
  {
    number: '3',
    heading: 'We Embed the ArtKey',
    body: 'Your artwork arrives ready to unlock its story. Scan with your phone and step inside.',
  },
];

const widgets = [<EnvelopeWidget />, <PortalBuilderWidget />, <PhoneScanWidget />];

// Inner alignment for each animation within its flex-1 zone
const animationClasses = [
  'flex flex-col justify-center pb-[6%]',
  'flex items-center justify-center p-6',
  'flex items-center justify-center',
];

export function HowItWorksScene() {
  return (
    <div className="w-full pt-8 pb-8">
      <div className="max-w-[1300px] mx-auto px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h1
          className="font-display tracking-tight leading-none"
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          How It Works
        </motion.h1>
        <motion.p
          className="font-body mt-4"
          style={{
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          Giving a gift has never been so easy, fun and simple.
        </motion.p>
      </div>

      {/* Three-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
        {steps.map((step, i) => (
          <div key={step.number} className="flex flex-col">

            {/* Step label + heading — centered within column */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <span
                className="flex items-center justify-center w-8 h-8 rounded-full border font-body text-sm flex-shrink-0"
                style={{ borderColor: '#000000', color: '#000000' }}
              >
                {step.number}
              </span>
              <h3
                className="font-display text-xl leading-snug"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
              >
                {renderStringWithArtKeyTrademarks(step.heading)}
              </h3>
            </div>

            {/* Description — fixed min-height so all cards start at the same y-position */}
            <p
              className="font-body text-sm mb-5 leading-relaxed min-h-[2.5rem] text-center"
              style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
            >
              {renderStringWithArtKeyTrademarks(step.body)}
            </p>

            {/* Widget card — fixed height, flex column */}
            <div
              className="rounded-2xl border relative overflow-hidden flex flex-col"
              style={{
                height: 550,
                backgroundColor: '#ffffff',
                borderColor: '#ded8d3',
                boxShadow: '0 2px 20px rgba(0,0,0,0.04)',
              }}
            >
              {/* Animation zone — fills remaining space */}
              <div className={`flex-1 relative pb-8 ${animationClasses[i]}`}>
                {widgets[i]}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Bottom tagline */}
      <motion.p
        className="text-center mt-8 font-body"
        style={{
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(0.95rem, 1.3vw, 1.1rem)',
          letterSpacing: '0.01em',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        We make creative gift-giving easy, personal, and unforgettable.
      </motion.p>

      </div>
    </div>
  );
}
