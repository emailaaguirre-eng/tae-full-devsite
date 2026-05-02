"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArtKeyTrademark,
  renderStringWithArtKeyTrademarks,
} from "@/components/RefinedTm";
import { ArtKeyQR } from './ArtKeyQR';

type Phase = 'scan' | 'portal' | 'video';

const PHASE_DURATION: Record<Phase, number> = {
  scan:   3200,
  portal: 3200,
  video:  4000,
};
const NEXT_PHASE: Record<Phase, Phase> = {
  scan:   'portal',
  portal: 'video',
  video:  'scan',
};

// "Featured Video" gets tapped 2.0s into the portal phase
const TAP_DELAY = 2000;

const MENU_ITEMS = ['Photo Gallery', 'Featured Video', 'Our Playlist', 'Voice Message'];
const FEATURED_IDX = 1; // index in MENU_ITEMS

export function PhoneScanWidget() {
  const [phase, setPhase] = useState<Phase>('scan');
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    setTapped(false);
    const t = setTimeout(() => setPhase(NEXT_PHASE[phase]), PHASE_DURATION[phase]);
    // In portal phase: briefly show a tap on Featured Video
    let tapT: ReturnType<typeof setTimeout> | undefined;
    if (phase === 'portal') {
      tapT = setTimeout(() => setTapped(true), TAP_DELAY);
    }
    return () => {
      clearTimeout(t);
      if (tapT !== undefined) clearTimeout(tapT);
    };
  }, [phase]);

  return (
    <div
      style={{
        width: 220,
        height: 440,
        background: '#1A1A1A',
        borderRadius: 44,
        padding: 8,
        boxShadow: '0 6px 20px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        border: '2px solid #333',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Screen */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FFFFFF',
          borderRadius: 38,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Dynamic island */}
        <div style={{
          position: 'absolute', top: 10, left: '50%',
          transform: 'translateX(-50%)',
          width: 72, height: 20,
          background: '#1A1A1A', borderRadius: 12, zIndex: 50,
        }} />

        <AnimatePresence mode="popLayout">

          {/* ── Phase 1: SCAN ── */}
          {phase === 'scan' && (
            <motion.div
              key="scan"
              style={{
                position: 'absolute', inset: 0,
                background: '#FFFFFF',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}
              exit={{ opacity: 0, scale: 1.06 }}
              transition={{ duration: 0.5 }}
            >
              {/* Scan frame */}
              <div style={{
                position: 'relative',
                width: 134, height: 90,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 22,
              }}>
                {/* Gold corner brackets */}
                {[
                  { top: 0, left: 0,  borderTop: true,    borderLeft: true  },
                  { top: 0, right: 0, borderTop: true,    borderRight: true },
                  { bottom: 0, left: 0,  borderBottom: true, borderLeft: true  },
                  { bottom: 0, right: 0, borderBottom: true, borderRight: true },
                ].map((c, idx) => (
                  <div key={idx} style={{
                    position: 'absolute',
                    width: 18, height: 18,
                    top:    c.top    ?? undefined,
                    bottom: c.bottom ?? undefined,
                    left:   c.left   ?? undefined,
                    right:  c.right  ?? undefined,
                    borderTop:    (c.borderTop    ? '2px solid #C9A96E' : undefined),
                    borderBottom: (c.borderBottom ? '2px solid #C9A96E' : undefined),
                    borderLeft:   (c.borderLeft   ? '2px solid #C9A96E' : undefined),
                    borderRight:  (c.borderRight  ? '2px solid #C9A96E' : undefined),
                  }} />
                ))}

                {/* ArtKey with QR inside the scan frame */}
                <ArtKeyQR size={116} color="#1A1A1A" bgColor="#FFFFFF" />

                {/* Animated scan line */}
                <motion.div
                  style={{
                    position: 'absolute', left: 4, right: 4, height: 1.5,
                    background: '#C9A96E',
                    boxShadow: '0 0 8px #C9A96E',
                  }}
                  animate={{ top: ['8%', '92%', '8%'] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.09em' }}>
                {renderStringWithArtKeyTrademarks("Scanning ArtKey...")}
              </p>
            </motion.div>
          )}

          {/* ── Phase 2: PORTAL ── */}
          {phase === 'portal' && (
            <motion.div
              key="portal"
              style={{
                position: 'absolute', inset: 0,
                background: '#FFFFFF',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center',
                padding: '52px 20px 28px',
              }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
            >
              <h2 style={{
                fontFamily: 'Georgia, serif',
                fontSize: 20, fontWeight: 700,
                color: '#1A1A2E',
                textAlign: 'center', marginBottom: 28, lineHeight: 1.2,
              }}>
                <ArtKeyTrademark /> Portal
              </h2>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MENU_ITEMS.map((label, i) => {
                  const isFeatured = i === FEATURED_IDX;
                  const isPressed = isFeatured && tapped;
                  return (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: isPressed ? 0.94 : 1,
                        backgroundColor: isPressed ? '#3A3A3A' : '#1A1A1A',
                      }}
                      transition={isPressed
                        ? { duration: 0.12, ease: 'easeOut' }
                        : { duration: 0.35, delay: 0.3 + i * 0.08 }
                      }
                      style={{
                        width: '100%', padding: '11px 16px',
                        background: '#1A1A1A', borderRadius: 50,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {/* Tap ripple on Featured Video */}
                      {isFeatured && tapped && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0.5 }}
                          animate={{ scale: 3.5, opacity: 0 }}
                          transition={{ duration: 0.55, ease: 'easeOut' }}
                          style={{
                            position: 'absolute',
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.35)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                      <span style={{
                        color: '#FFFFFF', fontSize: 12.5, fontWeight: 500,
                        fontFamily: 'Georgia, serif', letterSpacing: '0.01em',
                        position: 'relative', zIndex: 1,
                      }}>
                        {label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Phase 3: VIDEO PLAYER ── */}
          {phase === 'video' && (
            <motion.div
              key="video"
              style={{
                position: 'absolute', inset: 0,
                background: '#111',
                display: 'flex', flexDirection: 'column',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
            >
              {/* Status bar space */}
              <div style={{ height: 38, flexShrink: 0 }} />

              {/* Header */}
              <div style={{
                padding: '0 16px 10px',
                color: '#FFFFFF',
                fontFamily: 'Georgia, serif',
                fontSize: 14, fontWeight: 700, textAlign: 'center',
                letterSpacing: '0.01em',
              }}>
                Featured Video
              </div>

              {/* Video frame */}
              <div style={{
                flex: 1,
                margin: '0 10px',
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
                background: '#1A1A1A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Beach photo thumbnail */}
                <img
                  src="https://theartfulexperience.com/wp-content/uploads/2026/04/howitworks.jpg"
                  alt="Couple walking on beach"
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: '30% center',
                  }}
                />
                {/* Subtle dark vignette so play button pops */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)',
                }} />

                {/* Play button */}
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.4, ease: 'easeOut' }}
                  style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.90)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                    zIndex: 10,
                    position: 'relative',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22">
                    <polygon points="8,4 19,11 8,18" fill="#1A1A1A" />
                  </svg>
                </motion.div>

                {/* Duration badge */}
                <div style={{
                  position: 'absolute', bottom: 8, right: 10,
                  fontSize: 9, color: 'rgba(255,255,255,0.85)',
                  fontFamily: 'monospace', letterSpacing: '0.05em',
                  zIndex: 10, textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                }}>
                  2:34
                </div>
              </div>

              <div style={{ height: 14, flexShrink: 0 }} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
