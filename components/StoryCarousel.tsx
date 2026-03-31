"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ARTKEY_USES } from "@/lib/artkeyUses";

const STORY_CAROUSEL_IMAGES = [
  "https://wp.eiag.com/wp-content/uploads/2026/03/1-1.png",
  "https://wp.eiag.com/wp-content/uploads/2026/03/2.png",
  "https://wp.eiag.com/wp-content/uploads/2026/03/3.png",
  "https://wp.eiag.com/wp-content/uploads/2026/03/4.png",
  "https://wp.eiag.com/wp-content/uploads/2026/03/5.png",
  "https://wp.eiag.com/wp-content/uploads/2026/03/6.png",
  "https://wp.eiag.com/wp-content/uploads/2026/03/7.png",
  "https://wp.eiag.com/wp-content/uploads/2026/03/8.png",
  "https://wp.eiag.com/wp-content/uploads/2026/03/9.png",
] as const;

export const STORY_CAROUSEL_ITEMS = ARTKEY_USES.map((use, i) => ({
  image: STORY_CAROUSEL_IMAGES[i],
  href: `/artkey-uses/${use.slug}`,
  alt: `${use.title} — ${use.category}`,
}));

const AUTOPLAY_MS = 5500;
const SWIPE_PX = 50;

const STAGE_H = 340;
const CARD_W = 180;
const CARD_H = 300;
const CARD_TOP = 10;
const CARD_ML = -90;

function signedCircularDistance(i: number, active: number, n: number): number {
  let d = i - active;
  const half = Math.floor(n / 2);
  if (d > half) d -= n;
  if (d < -half) d += n;
  return d;
}

/** Matches mockup: active, near, mid, far, hidden */
function tierForDistance(d: number): { x: number; scale: number; opacity: number; z: number } {
  const ad = Math.abs(d);
  const sign = d < 0 ? -1 : 1;
  if (ad === 0) return { x: 0, scale: 1, opacity: 1, z: 50 };
  if (ad === 1) return { x: sign * 150, scale: 0.92, opacity: 1, z: 40 };
  if (ad === 2) return { x: sign * 255, scale: 0.82, opacity: 1, z: 30 };
  if (ad === 3) return { x: sign * 345, scale: 0.7, opacity: 1, z: 20 };
  return { x: sign * 430, scale: 0.58, opacity: 0, z: 10 };
}

const cardBase: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: CARD_TOP,
  width: CARD_W,
  height: CARD_H,
  marginLeft: CARD_ML,
  display: "block",
  borderRadius: 16,
  overflow: "hidden",
  isolation: "isolate",
  boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
  transition: "transform 0.45s ease, opacity 0.45s ease",
  WebkitTapHighlightColor: "transparent",
};

const mediaStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  background: "transparent",
  borderRadius: "inherit",
  overflow: "hidden",
};

const mediaImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  objectPosition: "center",
  borderRadius: "inherit",
};

export default function StoryCarousel() {
  const n = STORY_CAROUSEL_ITEMS.length;
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => setIndex((i) => (i - 1 + n) % n), [n]);
  const goNext = useCallback(() => setIndex((i) => (i + 1) % n), [n]);

  useEffect(() => {
    const t = window.setInterval(() => setIndex((i) => (i + 1) % n), AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [n]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const dx = e.changedTouches[0].clientX - start;
    if (dx > SWIPE_PX) goPrev();
    else if (dx < -SWIPE_PX) goNext();
  };

  const arrowBtn: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 60,
    width: 40,
    height: 40,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9999px",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    color: "#222",
    cursor: "pointer",
    padding: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  };

  return (
    <div className="mb-16 w-full">
      <div
        className="story-carousel-stage-wrap"
        style={{
          position: "relative",
          width: "min(980px, 100%)",
          margin: "0 auto",
        }}
      >
        <div
          className="story-carousel-stage"
          style={{
            position: "relative",
            width: "100%",
            height: STAGE_H,
            overflow: "hidden",
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {STORY_CAROUSEL_ITEMS.map((item, i) => {
            const d = signedCircularDistance(i, index, n);
            const { x, scale, opacity, z } = tierForDistance(d);
            const transform = `translateX(${x}px) scale(${scale})`;
            const peelOff = opacity === 0;

            return (
              <Link
                key={i}
                href={item.href}
                className="story-carousel-card"
                aria-hidden={peelOff}
                tabIndex={peelOff ? -1 : 0}
                style={{
                  ...cardBase,
                  transform,
                  opacity,
                  zIndex: z,
                  pointerEvents: peelOff ? "none" : "auto",
                }}
              >
                <div className="story-carousel-media" style={mediaStyle}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- external CDN; avoid next.config churn */}
                  <img src={item.image} alt={item.alt} style={mediaImgStyle} loading="lazy" decoding="async" />
                </div>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={goPrev}
          style={{ ...arrowBtn, left: 6 }}
          aria-label="Previous story"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={goNext}
          style={{ ...arrowBtn, right: 6 }}
          aria-label="Next story"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div
        className="flex flex-wrap items-center justify-center gap-2 pt-6"
        style={{ maxWidth: "min(980px, 100%)", margin: "0 auto" }}
      >
        {STORY_CAROUSEL_ITEMS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-2.5 w-2.5 rounded-full transition ${i === index ? "scale-110 bg-brand-darkest" : "bg-brand-medium/45 hover:bg-brand-medium"}`}
            aria-label={`Go to story ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
