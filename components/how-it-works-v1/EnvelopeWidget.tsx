"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArtKeyQR } from './ArtKeyQR';

// ── Envelope geometry ────────────────────────────────────────────────────────
// Classic envelope: four triangles meeting at the center point.
// All clip-paths use percentages so they're independent of element size.
//
//   ┌──────────────────────────────┐
//   │ \   TOP FLAP (opens)       / │
//   │   \                       /  │
//   │LEFT \       50%,50%      / RIGHT
//   │ FOLD  ×───────────────×  FOLD│
//   │   /                   \   /  │
//   │ /   BOTTOM POCKET      \ /   │
//   └──────────────────────────────┘
//
// Center point = (50%, 50%)
// Top flap    polygon(0% 0%,  100% 0%,  50% 50%)  — rotates open
// Left fold   polygon(0% 0%,  0%  100%, 50% 50%)  — stays, covers card L corners
// Right fold  polygon(100% 0%, 100% 100%, 50% 50%) — stays, covers card R corners
// Bottom fold polygon(0% 100%, 100% 100%, 50% 50%) — stays (bottom of front face)
//
// With all four panels in place the card (z=5) is completely hidden.
// When the flap rotates back, only the center strip of the card becomes visible,
// then the card rises out from the top — exactly like a real physical envelope.

const EW = 276;
const EH = 184;

// Card sits inside; its top edge starts at 54 px from envelope top.
// • y=54 to y=92 (center) is above the pocket — covered by flap + side folds ✓
// • Card height = EH - CARD_TOP = 130 px so the bottom aligns exactly with envelope bottom.
// • After card rises -80 px:  top → 54-80 = -26 px (26 px above envelope)
//                             bottom → 54+130-80 = 104 px (12 px behind pocket) ✓
const CARD_TOP  = 4;                       // card starts just inside the envelope top
const CARD_H    = Math.round(EH * 0.97);  // 97% height = 178 px (stays inside envelope)
const CARD_RISE = -CARD_H;                 // rise full card height so bottom stays at y≈4

// Animation phases:  0 = closed,  1 = flap open,  2 = card risen
// Timing (cumulative ms):
//   0 ms  → closed
//   900   → flap starts opening  (900 ms duration)
//   1800  → flap done, pause 380 ms
//   2180  → card starts rising   (1100 ms duration)
//   3280  → card done, hold 2200 ms
//   5480  → loop restart

const PHASE_TIMINGS = [0, 900, 900 + 900 + 380, 900 + 900 + 380 + 1100 + 2200] as const;
//                       closed  flapOpen           cardRisen                     restart

// ── Component ────────────────────────────────────────────────────────────────
export function EnvelopeWidget() {
  // tick increments each loop to re-trigger the effect
  const [tick, setTick]   = useState(0);
  // phase: 0=closed  1=flapOpen  2=cardRisen
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), PHASE_TIMINGS[1]);
    const t2 = setTimeout(() => setPhase(2), PHASE_TIMINGS[2]);
    const t3 = setTimeout(() => setTick(n => n + 1), PHASE_TIMINGS[3]);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [tick]);

  return (
    // Extra height above the envelope so the rising card isn't clipped
    <div
      className="relative mx-auto select-none cursor-pointer group"
      style={{ width: EW, height: EH + 210 }}
      onClick={() => setTick(n => n + 1)}
    >

      {/* Envelope sits at the bottom; card floats upward into the space above */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: EH, perspective: '900px' }}
      >

        {/* ── z=1 Back body ───────────────────────────────────────────────── */}
        <div className="absolute inset-0 rounded-lg" style={{
          backgroundColor: '#E8D5B7',
          boxShadow: '0 4px 22px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)',
        }} />

        {/* ── z=5 Card — slides upward ────────────────────────────────────── */}
        <motion.div
          className="absolute rounded-md"
          style={{
            left: 4, right: 4,        // 97% of envelope width, 4 px margin each side
            top: CARD_TOP,
            height: CARD_H,           // 97% of envelope height = 178 px
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.28), 0 3px 10px rgba(0,0,0,0.14)',
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            overflow: 'hidden',
          }}
          animate={{ y: phase >= 2 ? CARD_RISE : 0 }}
          transition={phase === 0
            ? { duration: 0 }                              // instant snap on reset
            : { duration: 1.1, ease: [0.16, 1, 0.3, 1] } // smooth rise
          }
        >
          {/* Photo area — warm gradient with a simple landscape illustration */}
          <div style={{
            width: '100%',
            height: 112,
            background: 'linear-gradient(135deg, #D4C5A9 0%, #C2A97D 50%, #A8845A 100%)',
            borderRadius: '6px 6px 0 0',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {/* Sky tone */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
              background: 'linear-gradient(180deg, #B8D4E8 0%, #D4C5A9 100%)',
            }} />
            {/* Sun */}
            <div style={{
              position: 'absolute', top: 8, right: 20,
              width: 16, height: 16, borderRadius: '50%',
              background: 'rgba(255,220,100,0.85)',
              boxShadow: '0 0 10px rgba(255,200,60,0.5)',
            }} />
            {/* Hills */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: '52%',
              background: 'linear-gradient(180deg, #8BA888 0%, #6B8F68 100%)',
              clipPath: 'polygon(0% 40%, 25% 0%, 50% 30%, 75% 5%, 100% 35%, 100% 100%, 0% 100%)',
            }} />
          </div>

          {/* Card label + ArtKey badge */}
          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '10px 12px 0',
          }}>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#3D2E1A',
              fontFamily: 'var(--font-body, sans-serif)',
            }}>
              Greeting Card
            </span>
            {/* Gold accent line */}
            <div style={{ width: 40, height: 1.5, background: '#C9A96E', borderRadius: 1 }} />
            {/* ArtKey™ QR badge — bottom-right of the card */}
            <div style={{
              position: 'absolute',
              bottom: 6,
              right: 8,
              opacity: 0.78,
            }}>
              <ArtKeyQR size={26} color="#3D2E1A" bgColor="#FFFFFF" />
            </div>
          </div>
        </motion.div>

        {/* ── z=8 Left side fold — always-visible, hides left card corners ── */}
        {/* polygon: top-left → bottom-left → center */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 8 }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: '#DBC6A4',
            clipPath: 'polygon(0% 0%, 0% 100%, 50% 50%)',
          }} />
        </div>

        {/* ── z=9 Right side fold — always-visible, hides right card corners ─ */}
        {/* polygon: top-right → bottom-right → center */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9 }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: '#DBC6A4',
            clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)',
          }} />
        </div>

        {/* ── z=10 Bottom fold / front pocket ─────────────────────────────── */}
        {/* polygon: bottom-left → bottom-right → center */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: '#DFCAAB',
            clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)',
          }} />
          {/* Subtle fold-crease shadow at the pocket's top V-edge */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.04)',
            clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)',
          }} />
        </div>

        {/* ── z=20 Top flap — rotates backward to open ────────────────────── */}
        {/* Bounding box is the top half of the envelope (0 → 50% height).    */}
        {/* The triangle fills this box edge-to-edge with polygon(0% 0%, 100% 0%, 50% 100%) */}
        <motion.div
          className="absolute inset-x-0 top-0"
          style={{
            height: '50%',            // 92 px — exactly the center point
            transformOrigin: 'top center',
            // When closed (phase 0): on top of everything so it seals the envelope.
            // Once opening (phase ≥ 1): drop behind the card so the card always
            // appears in front of the folded-back flap.
            zIndex: phase === 0 ? 20 : 3,
          }}
          animate={{ rotateX: phase >= 1 ? -175 : 0 }}
          transition={phase === 0
            ? { duration: 0 }                                   // instant snap on reset
            : { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] } // smooth open
          }
        >
          {/* Flap face — disappears once it folds past 90° (backface hidden) */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: '#D4BC96',
            clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }} />
        </motion.div>

      </div>{/* /envelope container */}

      {/* Hover hint */}
      <div
        className="absolute left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ bottom: -22, textAlign: 'center' }}
      >
        <span style={{
          fontSize: 9.5, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: '#A89880',
          fontFamily: 'var(--font-body)',
        }}>
          Click to replay
        </span>
      </div>
    </div>
  );
}

