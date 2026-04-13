"use client";

/**
 * DRAFT — Story carousel (visual + interaction rebuild).
 * Not mounted on the homepage. Do not replace StoryCarousel until approved.
 *
 * References:
 * - `docs/reference/v13dcarousel.html` — layout, CSS tokens, rail transition, depth shadows
 *   (viewport-centered rail + `updateCardDepth` box-shadow formula match the file’s script).
 * - `components/Carousel3D.tsx` — related React variant.
 *
 * Content: `ARTKEY_USES`, wp.eiag.com `STORY_CAROUSEL_IMAGES`, `/artkey-uses/${slug}` links
 * (not Unsplash / not static `cardData` from the HTML demo).
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

/** Same mapping as live carousel: wp images + /artkey-uses/... (draft-local; live export stays on StoryCarousel). */
const STORY_CAROUSEL_ITEMS = ARTKEY_USES.map((use, i) => ({
  image: STORY_CAROUSEL_IMAGES[i],
  href: `/artkey-uses/${use.slug}`,
  alt: `${use.title} — ${use.category}`,
}));

const AUTO_DELAY = 2600;
const TRANSITION_DURATION = 620;
const SWIPE_PX = 50;

function splitDisplayTitle(title: string): { line1: string; line2: string } {
  const hasTm = title.includes("™");
  const core = title.replace(/™/g, "").trim();
  const words = core.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return { line1: title, line2: "" };
  }
  const mid = Math.ceil(words.length / 2);
  const a = words.slice(0, mid).join(" ");
  const b = words.slice(mid).join(" ");
  if (hasTm) {
    return { line1: `${a}™`, line2: b };
  }
  return { line1: a, line2: b };
}

interface CardState {
  transform: string;
  filter: string;
  opacity: number;
  zIndex: number;
  boxShadow: string;
}

/** Base `.card` box-shadow from v13dcarousel.html (before JS depth pass). */
const defaultCardState: CardState = {
  transform: "translateY(0px) scale(1)",
  filter: "brightness(0.985) saturate(0.995)",
  opacity: 0.97,
  zIndex: 100,
  boxShadow:
    "0 10px 18px rgba(16,22,35,.12), 0 22px 38px rgba(16,22,35,.20), 0 46px 82px rgba(16,22,35,.14)",
};

function computeCardState(isActive: boolean, isHovered: boolean): CardState {
  const scale = isHovered ? 1.1 : 1;
  const translateY = isHovered ? -8 : 0;
  const brightness = isHovered ? 1.02 : isActive ? 1 : 0.985;
  const saturate = isHovered ? 1.05 : isActive ? 1.02 : 0.995;
  const opacity = isHovered ? 1 : 0.97;
  const shadowA = isHovered ? 22 : isActive ? 19 : 16;
  const shadowB = isHovered ? 62 : isActive ? 54 : 46;
  const shadowC = isHovered ? 128 : isActive ? 112 : 96;
  const shadowOpacity = isHovered ? 0.24 : isActive ? 0.2 : 0.16;

  return {
    transform: `translateY(${translateY}px) scale(${scale})`,
    filter: `brightness(${brightness}) saturate(${saturate})`,
    opacity,
    zIndex: isHovered ? 180 : isActive ? 120 : 100,
    boxShadow: `0 ${shadowA}px ${(shadowA * 1.6).toFixed(1)}px rgba(16,22,35,${shadowOpacity}), 0 ${shadowB}px ${(shadowB * 1.45).toFixed(1)}px rgba(16,22,35,${(shadowOpacity + 0.05).toFixed(2)}), 0 ${shadowC}px ${(shadowC * 1.08).toFixed(1)}px rgba(16,22,35,${Math.max(0.1, shadowOpacity - 0.02).toFixed(2)})`,
  };
}

export default function StoryCarouselV3Draft() {
  const n = STORY_CAROUSEL_ITEMS.length;
  const tripleLen = n * 3;
  const tripled = useMemo(
    () => Array.from({ length: tripleLen }, (_, i) => i),
    [tripleLen]
  );

  const stageRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const currentIndexRef = useRef(n);
  const isAnimatingRef = useRef(false);
  const hoveredIndexRef = useRef<number | null>(null);
  const isStageHoveredRef = useRef(false);
  const isStageVisibleRef = useRef(false);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const [railTransform, setRailTransform] = useState("translateX(0px)");
  const [railTransition, setRailTransition] = useState("none");
  const [cardStates, setCardStates] = useState<CardState[]>(() =>
    Array.from({ length: tripleLen }, () => defaultCardState)
  );
  const [activeSlide, setActiveSlide] = useState(0);

  const measureRef = useRef({ stepWidth: 0, wrapWidth: 0, railPadding: 0, cardWidth: 0 });

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail || !rail.children.length) return;
    const railStyles = getComputedStyle(rail);
    const cardWidth = rail.children[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(rail).gap || "0");
    const railPadding = parseFloat(railStyles.paddingLeft || "0");
    const stepWidth = cardWidth + gap;
    const wrapWidth = stepWidth * n;
    measureRef.current = { stepWidth, wrapWidth, railPadding, cardWidth };
  }, [n]);

  /** Same as v13dcarousel.html `applyRailPosition` / `updateCardDepth` (viewport center). */
  const computeRailTranslate = useCallback(() => {
    const { stepWidth, railPadding, cardWidth } = measureRef.current;
    if (!stepWidth) return 0;
    const viewportCenter = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
    const idx = currentIndexRef.current;
    const activeInner = railPadding + idx * stepWidth + cardWidth / 2;
    return viewportCenter - activeInner;
  }, []);

  const updateCardDepth = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const viewportCenter = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
    let closestIdx = -1;
    let closestDist = Infinity;

    const children = Array.from(rail.children) as HTMLElement[];
    children.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      if (distance < closestDist) {
        closestDist = distance;
        closestIdx = i;
      }
    });

    setCardStates(
      Array.from({ length: tripleLen }, (_, i) => {
        const isActive = i === closestIdx;
        const isHovered = i === hoveredIndexRef.current;
        return computeCardState(isActive, isHovered);
      })
    );
  }, [tripleLen]);

  const applyRailPosition = useCallback(
    (withTransition: boolean) => {
      const tx = computeRailTranslate();
      setRailTransition(
        withTransition ? `transform ${TRANSITION_DURATION}ms cubic-bezier(.22,.8,.22,1)` : "none"
      );
      setRailTransform(`translateX(${tx}px)`);
    },
    [computeRailTranslate]
  );

  const normalizeIndexIfNeeded = useCallback(() => {
    let normalized = false;
    if (currentIndexRef.current >= n * 2) {
      currentIndexRef.current -= n;
      normalized = true;
    }
    if (currentIndexRef.current < n) {
      currentIndexRef.current += n;
      normalized = true;
    }
    if (normalized) {
      applyRailPosition(false);
    }
  }, [n, applyRailPosition]);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimerRef.current !== null) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const shouldAutoplay = useCallback(
    () => isStageVisibleRef.current && !isStageHoveredRef.current && !isAnimatingRef.current,
    []
  );

  const animateDepthFor = useCallback(
    (duration = 700) => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      const start = performance.now();
      const frame = (now: number) => {
        updateCardDepth();
        if (now - start < duration) {
          animFrameRef.current = requestAnimationFrame(frame);
        }
      };
      animFrameRef.current = requestAnimationFrame(frame);
    },
    [updateCardDepth]
  );

  const syncActiveSlide = useCallback(() => {
    setActiveSlide(((currentIndexRef.current % n) + n) % n);
  }, [n]);

  const move = useCallback(
    (direction: number) => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      currentIndexRef.current += direction;
      applyRailPosition(true);
      animateDepthFor();

      setTimeout(() => {
        normalizeIndexIfNeeded();
        updateCardDepth();
        isAnimatingRef.current = false;
        syncActiveSlide();
      }, TRANSITION_DURATION + 20);
    },
    [applyRailPosition, animateDepthFor, normalizeIndexIfNeeded, updateCardDepth, syncActiveSlide]
  );

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (!shouldAutoplay()) return;
    autoplayTimerRef.current = setInterval(() => {
      if (!shouldAutoplay()) return;
      move(1);
    }, AUTO_DELAY);
  }, [stopAutoplay, shouldAutoplay, move]);

  useEffect(() => {
    measure();
    applyRailPosition(false);
    updateCardDepth();
    syncActiveSlide();
  }, [measure, applyRailPosition, updateCardDepth, syncActiveSlide]);

  useEffect(() => {
    const handleResize = () => {
      measure();
      applyRailPosition(false);
      updateCardDepth();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measure, applyRailPosition, updateCardDepth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isStageVisibleRef.current = entry?.isIntersecting ?? false;
        if (isStageVisibleRef.current) startAutoplay();
        else stopAutoplay();
      },
      { threshold: 0.35 }
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [startAutoplay, stopAutoplay]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [startAutoplay, stopAutoplay]);

  useEffect(() => {
    return () => {
      stopAutoplay();
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, [stopAutoplay]);

  const handleStageMouseEnter = () => {
    isStageHoveredRef.current = true;
    stopAutoplay();
  };

  const handleStageMouseLeave = () => {
    isStageHoveredRef.current = false;
    hoveredIndexRef.current = null;
    updateCardDepth();
    startAutoplay();
  };

  const handleCardMouseEnter = (i: number) => {
    isStageHoveredRef.current = true;
    stopAutoplay();
    hoveredIndexRef.current = i;
    updateCardDepth();
  };

  const handleCardMouseLeave = (i: number) => {
    if (hoveredIndexRef.current === i) hoveredIndexRef.current = null;
    isStageHoveredRef.current = stageRef.current?.matches(":hover") ?? false;
    updateCardDepth();
    if (!isStageHoveredRef.current) startAutoplay();
  };

  const goToLogicalSlide = (logical: number) => {
    stopAutoplay();
    currentIndexRef.current = n + logical;
    measure();
    applyRailPosition(false);
    updateCardDepth();
    setActiveSlide(logical);
    startAutoplay();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const dx = e.changedTouches[0].clientX - start;
    if (dx > SWIPE_PX) move(-1);
    else if (dx < -SWIPE_PX) move(1);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&display=swap');

        .scv3draft-root {
          --section-bg: #f6f4f1;
          --text: #ffffff;
          --ink: #1e293b;
          --muted: #64748b;
          box-sizing: border-box;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: var(--section-bg);
          color: var(--ink);
          width: 100%;
        }

        .scv3draft-root *, .scv3draft-root *::before, .scv3draft-root *::after {
          box-sizing: border-box;
        }

        .scv3draft-stage {
          width: 100%;
          height: 654px;
          position: relative;
          perspective: 2200px;
          perspective-origin: center 42%;
          overflow: hidden;
          margin-top: 6px;
        }

        .scv3draft-stage::before {
          content: "";
          position: absolute;
          inset: 5% 18% 24%;
          background:
            radial-gradient(circle at center, rgba(255,255,255,.72) 0%, rgba(255,255,255,.34) 26%, rgba(255,255,255,.05) 56%, rgba(255,255,255,0) 76%),
            radial-gradient(circle at center, rgba(59,130,246,.05) 0%, rgba(59,130,246,0) 55%);
          border-radius: 999px;
          filter: blur(28px);
          pointer-events: none;
          z-index: 0;
        }

        .scv3draft-rail-shadow {
          position: absolute;
          left: 1.5%;
          right: 1.5%;
          bottom: 50px;
          height: 126px;
          border-radius: 999px;
          background: radial-gradient(ellipse at center,
            rgba(15,23,42,.22) 0%,
            rgba(15,23,42,.15) 28%,
            rgba(15,23,42,.08) 50%,
            rgba(15,23,42,.03) 70%,
            rgba(15,23,42,0) 100%);
          filter: blur(18px);
          pointer-events: none;
          z-index: 1;
        }

        .scv3draft-viewport-fade {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 6;
          background:
            linear-gradient(90deg, var(--section-bg) 0%, rgba(246,244,241,0) 10%, rgba(246,244,241,0) 90%, var(--section-bg) 100%);
        }

        .scv3draft-rail {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          gap: 28px;
          padding: 18px 28px 0;
          transform-style: preserve-3d;
          will-change: transform;
          z-index: 3;
          transition: transform 620ms cubic-bezier(.22,.8,.22,1);
        }

        .scv3draft-card {
          --w: 332px;
          --h: 520px;
          flex: 0 0 auto;
          width: var(--w);
          height: var(--h);
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          transform-style: preserve-3d;
          border: 1px solid rgba(255,255,255,.24);
          box-shadow:
            0 10px 18px rgba(16,22,35,.12),
            0 22px 38px rgba(16,22,35,.20),
            0 46px 82px rgba(16,22,35,.14);
          transition: transform 220ms ease, filter 220ms ease, opacity 220ms ease, box-shadow 220ms ease;
          isolation: isolate;
          background: #1f2937;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .scv3draft-art {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transform: scale(1.025);
          filter: contrast(1.03) saturate(1.02);
        }

        .scv3draft-content {
          position: absolute;
          inset: 0;
          z-index: 4;
          padding: 26px 26px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transform: translateZ(34px);
          color: var(--text);
          text-shadow: 0 2px 16px rgba(0,0,0,.28);
        }

        .scv3draft-top {
          font-family: "Playfair Display", Georgia, "Times New Roman", serif;
          font-size: 33px;
          line-height: .98;
          letter-spacing: -.025em;
          text-transform: uppercase;
          max-width: 100%;
          min-height: 118px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          text-align: center;
          word-break: normal;
          overflow-wrap: normal;
          white-space: pre-line;
        }

        .scv3draft-bottom {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: auto;
          position: relative;
          z-index: 1;
        }

        .scv3draft-bottom--right {
          text-align: right;
        }

        .scv3draft-bottom h3 {
          margin: 0 0 10px;
          font-size: 21px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -.01em;
          text-transform: uppercase;
          min-height: 48px;
          width: 100%;
          display: grid;
          grid-template-rows: repeat(2, minmax(0, 1fr));
          align-items: start;
          white-space: normal;
          word-break: keep-all;
          overflow-wrap: normal;
        }

        .scv3draft-title-line {
          display: block;
          width: 100%;
        }

        .scv3draft-bottom p {
          margin: 0;
          font-size: 15px;
          line-height: 1.34;
          text-transform: none;
          letter-spacing: 0;
          opacity: .94;
          width: 100%;
        }

        .scv3draft-nav {
          position: absolute;
          top: 50%;
          z-index: 9;
          width: 54px;
          height: 54px;
          border-radius: 999px;
          border: 1px solid rgba(100,116,139,.18);
          background: rgba(255,255,255,.84);
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 500;
          cursor: pointer;
          backdrop-filter: blur(12px);
          box-shadow: 0 14px 30px rgba(15,23,42,.12);
          transform: translateY(-50%);
          transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
        }

        .scv3draft-nav:hover {
          background: rgba(255,255,255,.96);
          box-shadow: 0 18px 36px rgba(15,23,42,.16);
          transform: translateY(-50%) scale(1.03);
        }

        .scv3draft-nav:active {
          transform: translateY(-50%) scale(.98);
        }

        .scv3draft-nav-left { left: 24px; }
        .scv3draft-nav-right { right: 24px; }

        .scv3draft-dots {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding-top: 28px;
          max-width: min(980px, 100%);
          margin: 0 auto;
        }

        .scv3draft-dot {
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          border: 1px solid rgba(30,41,59,0.2);
          background: rgba(100,116,139,0.35);
          padding: 0;
          cursor: pointer;
          transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .scv3draft-dot:hover {
          background: rgba(100,116,139,0.55);
        }

        .scv3draft-dot[aria-current="true"] {
          transform: scale(1.15);
          background: #1e293b;
          border-color: rgba(30,41,59,0.45);
          box-shadow: 0 4px 14px rgba(15,23,42,0.18);
        }

        @media (max-width: 1100px) {
          .scv3draft-stage { height: 626px; }
          .scv3draft-card { --w: 286px; --h: 450px; }
          .scv3draft-rail { gap: 22px; padding-inline: 22px; }
          .scv3draft-top { font-size: 30px; min-height: 104px; }
          .scv3draft-rail-shadow { bottom: 42px; height: 144px; }
          .scv3draft-nav { width: 48px; height: 48px; }
          .scv3draft-nav-left { left: 16px; }
          .scv3draft-nav-right { right: 16px; }
        }

        @media (max-width: 760px) {
          .scv3draft-stage { height: 566px; }
          .scv3draft-card { --w: 248px; --h: 388px; border-radius: 20px; }
          .scv3draft-rail { gap: 18px; padding-inline: 18px; }
          .scv3draft-top { font-size: 27px; min-height: 92px; }
          .scv3draft-rail-shadow { bottom: 34px; height: 124px; }
          .scv3draft-bottom h3 { font-size: 18px; min-height: 42px; }
          .scv3draft-bottom p { font-size: 13.5px; line-height: 1.3; }
          .scv3draft-nav {
            width: 42px;
            height: 42px;
            font-size: 20px;
            top: auto;
            bottom: 20px;
            transform: none;
          }
          .scv3draft-nav:hover,
          .scv3draft-nav:active {
            transform: none;
          }
          .scv3draft-nav-left { left: calc(50% - 52px); }
          .scv3draft-nav-right { right: calc(50% - 52px); }
        }
      `}</style>

      <div className="scv3draft-root mb-16 w-full">
      <section
        className="scv3draft-stage"
        ref={stageRef}
        onMouseEnter={handleStageMouseEnter}
        onMouseLeave={handleStageMouseLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="scv3draft-rail-shadow" />

        <button
          className="scv3draft-nav scv3draft-nav-left"
          type="button"
          aria-label="Previous story (draft)"
          onClick={() => move(-1)}
        >
          ‹
        </button>

        <div
          className="scv3draft-rail"
          ref={railRef}
          style={{
            transform: railTransform,
            transition: railTransition,
          }}
        >
          {tripled.map((i) => {
            const item = STORY_CAROUSEL_ITEMS[i % n];
            const use = ARTKEY_USES[i % n];
            const state = cardStates[i] ?? defaultCardState;
            const { line1, line2 } = splitDisplayTitle(use.title);
            const topLabel = use.category.replace(/\s*\/\s*/g, "\n");
            return (
              <Link
                key={i}
                href={item.href}
                className="scv3draft-card"
                style={{
                  transform: state.transform,
                  filter: state.filter,
                  opacity: state.opacity,
                  zIndex: state.zIndex,
                  boxShadow: state.boxShadow,
                }}
                onMouseEnter={() => handleCardMouseEnter(i)}
                onMouseLeave={() => handleCardMouseLeave(i)}
                aria-label={item.alt}
              >
                <div
                  className="scv3draft-art"
                  style={{
                    backgroundImage: `url('${item.image}')`,
                  }}
                  role="img"
                  aria-hidden="true"
                />
                <div className="scv3draft-content">
                  <div className="scv3draft-top">{topLabel}</div>
                  <div
                    className={
                      use.slug === "realtor"
                        ? "scv3draft-bottom scv3draft-bottom--right"
                        : "scv3draft-bottom"
                    }
                  >
                    <h3>
                      <span className="scv3draft-title-line">{line1}</span>
                      <span className="scv3draft-title-line">{line2}</span>
                    </h3>
                    <p>{use.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <button
          className="scv3draft-nav scv3draft-nav-right"
          type="button"
          aria-label="Next story (draft)"
          onClick={() => move(1)}
        >
          ›
        </button>

        <div className="scv3draft-viewport-fade" />
      </section>

      <div className="scv3draft-dots">
        {STORY_CAROUSEL_ITEMS.map((_, i) => (
          <button
            key={i}
            type="button"
            className="scv3draft-dot"
            onClick={() => goToLogicalSlide(i)}
            aria-label={`Go to story ${i + 1} (draft)`}
            aria-current={i === activeSlide ? "true" : undefined}
          />
        ))}
      </div>
      </div>
    </>
  );
}
