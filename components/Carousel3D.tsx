"use client";

/**
 * React port of the canonical carousel: `docs/reference/v13dcarousel.html`.
 * Visuals, timing, and behavior should match that file; update the HTML first, then sync here.
 * Fonts: root layout loads Playfair + Inter (HTML loads Playfair; Inter falls back to system in standalone HTML).
 * Each card is a Next `Link` to `/artkey-uses/[slug]` (`card.slug` matches `lib/artkeyUses.ts`).
 */

import Link from "next/link";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type CardDatum = {
  art: string;
  /** Route slug: `/artkey-uses/[slug]` (see `app/artkey-uses/[slug]/page.tsx`). */
  slug: string;
  top: string;
  title1: string;
  title2: string;
  body: string;
  rightAlign?: boolean;
};

const cardData: CardDatum[] = [
  {
    art: "public",
    slug: "public-figures-speakers",
    top: "Public\nSpeakers",
    title1: "The Living",
    title2: "Poster",
    body: "A collectible poster that opens the story behind the stage",
    rightAlign: false,
  },
  {
    art: "artists",
    slug: "artists",
    top: "Artists",
    title1: "The Creator",
    title2: "Portal",
    body: "A gateway into the story behind the work",
    rightAlign: false,
  },
  {
    art: "wedding",
    slug: "wedding",
    top: "Wedding",
    title1: "The",
    title2: "Keepsake",
    body: "A living archive for your stories, memories, and legacy",
    rightAlign: false,
  },
  {
    art: "travel",
    slug: "travel",
    top: "Travel",
    title1: "The",
    title2: "Postcard",
    body: "A living postcard or print to memorialize your trip",
    rightAlign: false,
  },
  {
    art: "birth",
    slug: "birth-announcement",
    top: "Birth\nAnnouncement",
    title1: "The First",
    title2: "Chapter",
    body: "An elevated birth announcement that becomes a living legacy",
    rightAlign: false,
  },
  {
    art: "realtor",
    slug: "realtor",
    top: "Realtor",
    title1: "The Closing",
    title2: "Moment",
    body: "A closing gift that keeps your presence long after the keys are handed over",
    rightAlign: true,
  },
  {
    art: "holiday",
    slug: "holiday-card",
    top: "Holiday Card",
    title1: "Year in",
    title2: "Review",
    body: "A holiday card that opens into the story of your year",
    rightAlign: false,
  },
  {
    art: "coaches",
    slug: "coaches",
    top: "Coaches",
    title1: "Defining",
    title2: "Moment",
    body: "A visual designed for coaches and the clients they guide",
    rightAlign: false,
  },
  {
    art: "airbnb",
    slug: "airbnb",
    top: "Airbnb",
    title1: "The",
    title2: "Experience",
    body: "A living postcard or print for your guests",
    rightAlign: false,
  },
];

const WP_ART_BASE =
  "https://theartfulexperience.com/wp-content/uploads/2026/04";

const artImages: Record<string, string> = {
  public: `${WP_ART_BASE}/Public-Speakers.png`,
  artists: `${WP_ART_BASE}/Artists.png`,
  wedding: `${WP_ART_BASE}/Wedding.png`,
  travel: `${WP_ART_BASE}/Travel.png`,
  birth: `${WP_ART_BASE}/Birth-Announcement.png`,
  realtor: `${WP_ART_BASE}/Realtor.png`,
  holiday: `${WP_ART_BASE}/HolidayCard.png`,
  coaches: `${WP_ART_BASE}/Coaches.png`,
  airbnb: `${WP_ART_BASE}/AirBnb.png`,
};

const AUTO_DELAY = 2600;
const TRANSITION_DURATION = 620;

interface CardState {
  transform: string;
  filter: string;
  opacity: number;
  zIndex: number;
  boxShadow: string;
}

const defaultCardState: CardState = {
  transform: "translateY(0px) scale(1)",
  filter: "brightness(0.985) saturate(0.995)",
  opacity: 0.97,
  zIndex: 100,
  boxShadow:
    "0 16px 25.6px rgba(16,22,35,0.16), 0 46px 66.7px rgba(16,22,35,0.21), 0 96px 103.68px rgba(16,22,35,0.14)",
};

function computeCardState(
  isActive: boolean,
  isHovered: boolean
): CardState {
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

export default function Carousel3D() {
  const originalCount = cardData.length;
  const tripled = [...cardData, ...cardData, ...cardData];

  const stageRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const currentIndexRef = useRef(originalCount);
  const isAnimatingRef = useRef(false);
  const hoveredIndexRef = useRef<number | null>(null);
  const isStageHoveredRef = useRef(false);
  const isStageVisibleRef = useRef(false);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startAutoplayRef = useRef<() => void>(() => {});

  const [railTransform, setRailTransform] = useState("translateX(0px)");
  const [railTransition, setRailTransition] = useState("none");
  const [cardStates, setCardStates] = useState<CardState[]>(
    tripled.map(() => defaultCardState)
  );

  const measureRef = useRef({ stepWidth: 0, wrapWidth: 0, railPadding: 0, cardWidth: 0 });

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail || !rail.children.length) return;
    const railStyles = getComputedStyle(rail);
    const cardWidth = rail.children[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(rail).gap || "0");
    const railPadding = parseFloat(railStyles.paddingLeft || "0");
    const stepWidth = cardWidth + gap;
    const wrapWidth = stepWidth * originalCount;
    measureRef.current = { stepWidth, wrapWidth, railPadding, cardWidth };
  }, [originalCount]);

  const computeRailTranslate = useCallback(() => {
    const { stepWidth, railPadding, cardWidth } = measureRef.current;
    const viewportCenter = window.innerWidth / 2;
    const activeCardCenter =
      railPadding + currentIndexRef.current * stepWidth + cardWidth / 2;
    return viewportCenter - activeCardCenter;
  }, []);

  const updateCardDepth = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const viewportCenter = window.innerWidth / 2;
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
      tripled.map((_, i) => {
        const isActive = i === closestIdx;
        const isHovered = i === hoveredIndexRef.current;
        return computeCardState(isActive, isHovered);
      })
    );
  }, [tripled]);

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
    if (currentIndexRef.current >= originalCount * 2) {
      currentIndexRef.current -= originalCount;
      normalized = true;
    }
    if (currentIndexRef.current < originalCount) {
      currentIndexRef.current += originalCount;
      normalized = true;
    }
    if (normalized) {
      applyRailPosition(false);
    }
  }, [originalCount, applyRailPosition]);

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
        startAutoplayRef.current();
      }, TRANSITION_DURATION + 20);
    },
    [applyRailPosition, animateDepthFor, normalizeIndexIfNeeded, updateCardDepth]
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
    startAutoplayRef.current = startAutoplay;
  }, [startAutoplay]);

  useEffect(() => {
    measure();
    applyRailPosition(false);
    updateCardDepth();
  }, [measure, applyRailPosition, updateCardDepth]);

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
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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

  return (
    <>
      <style>{`
        .carousel3d-root {
          --section-bg: #ffffff;
          --text: #ffffff;
          --ink: #1e293b;
          --muted: #64748b;
          box-sizing: border-box;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: var(--section-bg);
          color: var(--ink);
          width: 100%;
        }

        .carousel3d-root *, .carousel3d-root *::before, .carousel3d-root *::after {
          box-sizing: border-box;
        }

        .carousel3d-stage {
          width: 100%;
          height: 654px;
          position: relative;
          perspective: 2200px;
          perspective-origin: center 42%;
          overflow: hidden;
          margin-top: 6px;
        }

        .carousel3d-stage::before {
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

        .carousel3d-rail-shadow {
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

        /* Below rail so cards/links are never under a full-screen layer (fixes blocked clicks). */
        .carousel3d-viewport-fade {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          background:
            linear-gradient(90deg, var(--section-bg) 0%, transparent 10%, transparent 90%, var(--section-bg) 100%);
        }

        .carousel3d-rail {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          gap: 28px;
          padding: 18px 28px 0;
          transform-style: preserve-3d;
          will-change: transform;
          z-index: 4;
          transition: transform 620ms cubic-bezier(.22,.8,.22,1);
        }

        /* Hit target only: no filter/transform on <a> (those break click hit-testing in some browsers). */
        .carousel3d-card-hit {
          --w: 332px;
          --h: 520px;
          flex: 0 0 auto;
          width: var(--w);
          height: var(--h);
          position: relative;
          display: block;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          pointer-events: auto;
          -webkit-tap-highlight-color: transparent;
        }

        .carousel3d-card-face {
          width: 100%;
          height: 100%;
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
        }

        .carousel3d-art {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transform: scale(1.025);
          filter: contrast(1.03) saturate(1.02);
        }

        .carousel3d-content {
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

        .carousel3d-top {
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

        .carousel3d-bottom {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: auto;
          position: relative;
          z-index: 1;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .carousel3d-bottom--right {
          text-align: right;
        }

        /* Explicit sans: global @layer base sets Playfair on all h3 — override for title lines only */
        .carousel3d-root .carousel3d-bottom h3,
        .carousel3d-root .carousel3d-bottom h3 .carousel3d-title-line {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .carousel3d-bottom h3 {
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

        .carousel3d-title-line {
          display: block;
          width: 100%;
        }

        .carousel3d-root .carousel3d-bottom p {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .carousel3d-bottom p {
          margin: 0;
          font-size: 15px;
          line-height: 1.34;
          text-transform: none;
          letter-spacing: 0;
          opacity: .94;
          width: 100%;
        }

        .carousel3d-nav {
          position: absolute;
          top: 50%;
          z-index: 9;
          width: 54px;
          height: 54px;
          border-radius: 999px;
          border: 1px solid rgba(100,116,139,.18);
          background: rgba(255,255,255,.84);
          color: #1e293b;
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

        .carousel3d-nav:hover {
          background: rgba(255,255,255,.96);
          box-shadow: 0 18px 36px rgba(15,23,42,.16);
          transform: translateY(-50%) scale(1.03);
        }

        .carousel3d-nav:active {
          transform: translateY(-50%) scale(.98);
        }

        .carousel3d-nav-left { left: 24px; }
        .carousel3d-nav-right { right: 24px; }

        @media (max-width: 1100px) {
          .carousel3d-stage { height: 626px; }
          .carousel3d-card-hit { --w: 286px; --h: 450px; }
          .carousel3d-rail { gap: 22px; padding-inline: 22px; }
          .carousel3d-top { font-size: 30px; min-height: 104px; }
          .carousel3d-rail-shadow { bottom: 42px; height: 144px; }
          .carousel3d-nav { width: 48px; height: 48px; }
          .carousel3d-nav-left { left: 16px; }
          .carousel3d-nav-right { right: 16px; }
        }

        @media (max-width: 760px) {
          .carousel3d-stage { height: 566px; }
          .carousel3d-card-hit { --w: 248px; --h: 388px; }
          .carousel3d-card-face { border-radius: 20px; }
          .carousel3d-rail { gap: 18px; padding-inline: 18px; }
          .carousel3d-top { font-size: 27px; min-height: 92px; }
          .carousel3d-rail-shadow { bottom: 34px; height: 124px; }
          .carousel3d-bottom h3 { font-size: 18px; min-height: 42px; }
          .carousel3d-bottom p { font-size: 13.5px; line-height: 1.3; }
          .carousel3d-nav {
            width: 42px;
            height: 42px;
            font-size: 20px;
            top: auto;
            bottom: 20px;
            transform: none;
          }
          .carousel3d-nav:hover,
          .carousel3d-nav:active {
            transform: none;
          }
          .carousel3d-nav-left { left: calc(50% - 52px); }
          .carousel3d-nav-right { right: calc(50% - 52px); }
        }
      `}</style>

      <div className="carousel3d-root">
        <section
          className="carousel3d-stage"
          ref={stageRef}
          onMouseEnter={handleStageMouseEnter}
          onMouseLeave={handleStageMouseLeave}
        >
          <div className="carousel3d-rail-shadow" />

          <button
            className="carousel3d-nav carousel3d-nav-left"
            type="button"
            aria-label="Previous cards"
            onClick={() => move(-1)}
          >
            ‹
          </button>

          <div
            className="carousel3d-rail"
            ref={railRef}
            style={{
              transform: railTransform,
              transition: railTransition,
            }}
          >
            {tripled.map((card, i) => {
              const state = cardStates[i] ?? defaultCardState;
              const bgImage = artImages[card.art];
              const href = `/artkey-uses/${card.slug}`;
              const ariaLabel = `${card.title1} ${card.title2}`.trim();
              return (
                <Link
                  key={i}
                  href={href}
                  className="carousel3d-card-hit"
                  aria-label={ariaLabel}
                  style={{ zIndex: state.zIndex }}
                  onMouseEnter={() => handleCardMouseEnter(i)}
                  onMouseLeave={() => handleCardMouseLeave(i)}
                >
                  <div
                    className="carousel3d-card-face"
                    style={{
                      transform: state.transform,
                      filter: state.filter,
                      opacity: state.opacity,
                      boxShadow: state.boxShadow,
                    }}
                  >
                    <div
                      className="carousel3d-art"
                      style={{
                        backgroundImage: `url('${bgImage}')`,
                      }}
                      role="img"
                      aria-hidden
                    />
                    <div className="carousel3d-content">
                      <div className="carousel3d-top">{card.top}</div>
                      <div
                        className={
                          card.rightAlign
                            ? "carousel3d-bottom carousel3d-bottom--right"
                            : "carousel3d-bottom"
                        }
                      >
                        <h3>
                          <span className="carousel3d-title-line">{card.title1}</span>
                          <span className="carousel3d-title-line">{card.title2}</span>
                        </h3>
                        <p>{card.body}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <button
            className="carousel3d-nav carousel3d-nav-right"
            type="button"
            aria-label="Next cards"
            onClick={() => move(1)}
          >
            ›
          </button>

          <div className="carousel3d-viewport-fade" />
        </section>
      </div>
    </>
  );
}
