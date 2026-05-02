"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import { ArtKeyTrademark } from "@/components/RefinedTm";
import { ARTKEY_USE_CAROUSEL_IMAGE } from "@/lib/artkeyUseCarouselImages";

function carouselArtFields(href: string): { art: string; bgPos?: string } {
  const slug = href.replace(/^\/artkey-uses\//, "");
  const m = ARTKEY_USE_CAROUSEL_IMAGE[slug];
  if (!m) {
    throw new Error(`PhoneCarousel: missing ARTKEY_USE_CAROUSEL_IMAGE for slug "${slug}"`);
  }
  return {
    art: m.src,
    ...(m.objectPosition ? { bgPos: m.objectPosition } : {}),
  };
}

/**
 * `currentIndex === CARD_DATA.length` centers the middle copy’s first slot = `CARD_DATA[0]` (Birth).
 * Rail order L→R at that index: [5]…[9], [0], [1]…[4] = positions −5…+4:
 * −5 Travel, −4 Influencers, −3 Realtor, −2 Coaches, −1 Wedding | 0 Birth | +1 Holiday … +4 Artists.
 */
const CARD_DATA = [
  {
    ...carouselArtFields("/artkey-uses/birth-announcement"),
    top: "Birth\nAnnouncement",
    title1: "The First",
    title2: "Chapter",
    body: "An elevated birth announcement that becomes a living legacy",
    accent: "#f9d87a",
    href: "/artkey-uses/birth-announcement",
  },
  {
    ...carouselArtFields("/artkey-uses/holiday-card"),
    top: "Holiday\nCard",
    title1: "Year in",
    title2: "Review",
    body: "A holiday card that opens into the story of your year",
    accent: "#f77b72",
    href: "/artkey-uses/holiday-card",
  },
  {
    ...carouselArtFields("/artkey-uses/graduate"),
    top: "Graduate",
    title1: "The",
    title2: "Milestone",
    body: "A meaningful way to announce the turning of one chapter into another.",
    accent: "#4ade80",
    href: "/artkey-uses/graduate",
  },
  {
    ...carouselArtFields("/artkey-uses/airbnb"),
    top: "Airbnb",
    title1: "The",
    title2: "Experience",
    body: "A living postcard or print for your guests",
    accent: "#fb7185",
    href: "/artkey-uses/airbnb",
  },
  {
    ...carouselArtFields("/artkey-uses/artists"),
    top: "Artists",
    title1: "The Creator",
    title2: "Portal",
    body: "A gateway into the story behind the work",
    accent: "#a78cf2",
    href: "/artkey-uses/artists",
  },
  {
    ...carouselArtFields("/artkey-uses/travel"),
    top: "Travel",
    title1: "The",
    title2: "Postcard",
    body: "A living postcard or print to memorialize your trip",
    accent: "#f0a45a",
    href: "/artkey-uses/travel",
  },
  {
    ...carouselArtFields("/artkey-uses/public-figures-speakers"),
    top: "Influencers",
    title1: "The Living",
    title2: "Poster",
    body: "A collectible poster that opens the story behind the stage",
    accent: "#4f8ef7",
    href: "/artkey-uses/public-figures-speakers",
  },
  {
    ...carouselArtFields("/artkey-uses/realtor"),
    top: "Realtor",
    title1: "The Closing",
    title2: "Moment",
    body: "A closing gift that keeps your presence long after the keys are handed over",
    accent: "#6ee7c0",
    bottomAlign: "right" as const,
    href: "/artkey-uses/realtor",
  },
  {
    ...carouselArtFields("/artkey-uses/coaches"),
    top: "Coaches",
    title1: "Defining",
    title2: "Moment",
    body: "A visual designed for coaches and the clients they guide",
    accent: "#7dd3fc",
    href: "/artkey-uses/coaches",
  },
  {
    ...carouselArtFields("/artkey-uses/wedding"),
    top: "Wedding",
    title1: "The",
    title2: "Keepsake",
    body: "A living archive for your stories, memories, and legacy",
    accent: "#f7c5d0",
    href: "/artkey-uses/wedding",
  },
];

const GAP = 28;
const AUTO_DELAY = 2600;
const CARD_W = 332;
const CARD_H = 520;

const MOBILE_GAP = 14;

/** Mobile-only order (desktop still uses CARD_DATA as-is). No duplicates. */
const MOBILE_LEAD_HREFS = [
  "/artkey-uses/birth-announcement",
  "/artkey-uses/wedding",
  "/artkey-uses/holiday-card",
  "/artkey-uses/graduate",
] as const;

function mobileCarouselCards(): (typeof CARD_DATA)[number][] {
  const byHref = new Map(CARD_DATA.map((c) => [c.href, c]));
  const lead = MOBILE_LEAD_HREFS.map((h) => byHref.get(h)).filter(
    (c): c is (typeof CARD_DATA)[number] => c != null
  );
  const leadSet = new Set<string>(MOBILE_LEAD_HREFS);
  const rest = CARD_DATA.filter((c) => !leadSet.has(c.href));
  return [...lead, ...rest];
}

const PHONE_CAROUSEL_MOBILE_CARDS = mobileCarouselCards();

function ArtKeyUsesSectionHeading() {
  return (
    <header className="mx-auto w-full max-w-screen-2xl px-4 pt-10 pb-3 text-center sm:px-6 md:pt-12 md:pb-5 lg:px-8">
      <h2
        id="artkey-uses-heading"
        className="font-playfair text-3xl font-normal leading-[1.12] tracking-tight text-brand-dark sm:text-4xl md:text-5xl"
      >
        Ways to use your <ArtKeyTrademark />
      </h2>
    </header>
  );
}

/**
 * Mobile (viewport &lt; 768px): horizontal scroll-snap, next/image, no 3D / triple rail / ResizeObserver / autoplay.
 * Desktop keeps PhoneCarouselDesktop.
 */
function PhoneCarouselMobile() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBySlide = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.querySelector("article");
    const w = slide ? slide.getBoundingClientRect().width + MOBILE_GAP : 294;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  return (
    <div
      role="region"
      aria-labelledby="artkey-uses-heading"
      style={{
        width: "100%",
        minHeight: "min(100vh, 720px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",
        padding: "0 0 40px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position: "relative",
        background: "#fff",
      }}
    >
      <div
        ref={scrollerRef}
        style={{
          display: "flex",
          flexDirection: "row",
          gap: MOBILE_GAP,
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
          touchAction: "pan-x",
          padding: "12px max(16px, calc(50vw - min(42vw, 140px))) 20px",
          scrollbarWidth: "thin",
        }}
      >
        {PHONE_CAROUSEL_MOBILE_CARDS.map((card, i) => (
          <article
            key={card.href}
            style={{
              flex: "0 0 auto",
              width: "min(calc(100vw - 48px), 300px)",
              maxWidth: 300,
              scrollSnapAlign: "center",
              borderRadius: 20,
              overflow: "hidden",
              background: "#1f2937",
              boxShadow: "0 12px 32px rgba(15,23,42,.18), 0 4px 12px rgba(15,23,42,.08)",
              border: "1px solid rgba(255,255,255,.12)",
            }}
          >
            <Link
              href={card.href}
              prefetch={false}
              className="block h-full text-inherit no-underline outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent"
              aria-label={`Open ${card.top.replace(/\n/g, " ")} — ${card.title1} ${card.title2}`}
            >
              {/* Same text layout as PhoneCarouselDesktop: overlay on art, top label + bottom block (no separate footer strip). */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "332 / 520",
                  background: "#1f2937",
                }}
              >
                <Image
                  src={card.art}
                  alt=""
                  fill
                  sizes="(max-width: 767px) min(100vw - 48px, 300px) 300px"
                  style={{
                    objectFit: "cover",
                    objectPosition: card.bgPos ?? "center",
                    transform: "scale(1.02)",
                  }}
                  {...(i === 0 ? { priority: true } : { loading: "lazy" as const })}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 4,
                    padding: "18px 16px 26px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    minHeight: "100%",
                    color: "#ffffff",
                    textShadow: "0 2px 16px rgba(0,0,0,.28)",
                    background:
                      "linear-gradient(180deg, rgba(12,18,28,0.12) 0%, rgba(12,18,28,0) 38%, rgba(10,14,22,0.45) 100%)",
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      fontFamily:
                        "'Playfair Display', Georgia, 'Times New Roman', serif",
                      fontSize: 22,
                      lineHeight: 0.98,
                      letterSpacing: "-0.025em",
                      textTransform: "uppercase",
                      textAlign: "center",
                      maxWidth: "100%",
                      minHeight: 80,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {card.top}
                  </div>
                  <div
                    style={{
                      marginTop: "auto",
                      flexShrink: 0,
                      width: "100%",
                      position: "relative",
                      zIndex: 1,
                      textAlign: card.bottomAlign ?? "left",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 8px",
                        fontSize: 16,
                        lineHeight: 1,
                        fontWeight: 800,
                        letterSpacing: "-0.01em",
                        textTransform: "uppercase",
                        fontFamily:
                          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      }}
                    >
                      <span style={{ display: "block" }}>{card.title1}</span>
                      <span style={{ display: "block" }}>{card.title2}</span>
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 1.34,
                        opacity: 0.94,
                      }}
                    >
                      {card.body}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 72,
                    height: 3,
                    borderRadius: 999,
                    background: "rgba(255,255,255,.88)",
                    zIndex: 5,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </Link>
          </article>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          marginTop: 8,
          paddingBottom: 8,
        }}
      >
        <button
          type="button"
          aria-label="Scroll cards left"
          onClick={() => scrollBySlide(-1)}
          className="active:opacity-80"
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            border: "1px solid rgba(100,116,139,.35)",
            background: "rgba(255,255,255,.95)",
            color: "#1e293b",
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(15,23,42,.1)",
          }}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Scroll cards right"
          onClick={() => scrollBySlide(1)}
          className="active:opacity-80"
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            border: "1px solid rgba(100,116,139,.35)",
            background: "rgba(255,255,255,.95)",
            color: "#1e293b",
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(15,23,42,.1)",
          }}
        >
          ›
        </button>
      </div>
    </div>
  );
}

function PhoneCarouselDesktop() {
  const railRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(CARD_DATA.length);
  const [currentIndex, setCurrentIndex] = useState(CARD_DATA.length);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tripled dataset for infinite looping
  const allCards = [...CARD_DATA, ...CARD_DATA, ...CARD_DATA];

  const getTranslateX = useCallback((idx: number) => {
    const stage = stageRef.current;
    const viewCenter = stage
      ? stage.getBoundingClientRect().width / 2
      : CARD_W / 2 + 28;
    const cardCenter = 28 + idx * (CARD_W + GAP) + CARD_W / 2;
    return viewCenter - cardCenter;
  }, []);

  const applyPosition = useCallback(
    (idx: number, animated: boolean) => {
      const rail = railRef.current;
      if (!rail) return;
      rail.style.transition = animated
        ? "transform 620ms cubic-bezier(.22,.8,.22,1)"
        : "none";
      rail.style.transform = `translateX(${getTranslateX(idx)}px)`;
      if (!animated) rail.getBoundingClientRect(); // force reflow
    },
    [getTranslateX]
  );

  const computeActive = useCallback(
    (idx: number) => {
      // Closest card to center
      return idx;
    },
    []
  );

  const normalize = useCallback(
    (idx: number, cb: (newIdx: number) => void) => {
      const orig = CARD_DATA.length;
      if (idx >= orig * 2) {
        const next = idx - orig;
        applyPosition(next, false);
        cb(next);
      } else if (idx < orig) {
        const next = idx + orig;
        applyPosition(next, false);
        cb(next);
      }
    },
    [applyPosition]
  );

  const stopAuto = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = null;
  }, []);

  const startAuto = useCallback(
    (idxRef: { current: number }) => {
      stopAuto();
      autoTimer.current = setInterval(() => {
        if (isHovered) return;
        setCurrentIndex((prev) => {
          const next = prev + 1;
          currentIndexRef.current = next;
          applyPosition(next, true);
          setIsAnimating(true);
          setActiveIdx(computeActive(next));
          setTimeout(() => {
            setCurrentIndex((p) => {
              let n = p;
              const orig = CARD_DATA.length;
              if (n >= orig * 2) n -= orig;
              if (n < orig) n += orig;
              if (n !== p) applyPosition(n, false);
              currentIndexRef.current = n;
              return n;
            });
            setIsAnimating(false);
          }, 650);
          return next;
        });
      }, AUTO_DELAY);
    },
    [applyPosition, computeActive, isHovered, stopAuto]
  );

  const move = useCallback(
    (dir: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrentIndex((prev) => {
        const next = prev + dir;
        currentIndexRef.current = next;
        applyPosition(next, true);
        setActiveIdx(computeActive(next));
        setTimeout(() => {
          setCurrentIndex((p) => {
            let n = p;
            const orig = CARD_DATA.length;
            if (n >= orig * 2) n -= orig;
            if (n < orig) n += orig;
            if (n !== p) applyPosition(n, false);
            currentIndexRef.current = n;
            return n;
          });
          setIsAnimating(false);
        }, 650);
        return next;
      });
    },
    [isAnimating, applyPosition, computeActive]
  );

  currentIndexRef.current = currentIndex;

  // Init: center Birth (`CARD_DATA[0]`) using real stage width once layout exists
  useEffect(() => {
    const center = CARD_DATA.length;
    applyPosition(center, false);
    setActiveIdx(center);
    currentIndexRef.current = center;
    const raf = requestAnimationFrame(() => {
      applyPosition(center, false);
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [applyPosition]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      applyPosition(currentIndexRef.current, false);
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, [applyPosition]);

  // Autoplay
  useEffect(() => {
    if (isHovered) {
      stopAuto();
    } else {
      const idxRef = { current: currentIndex };
      startAuto(idxRef);
    }
    return () => stopAuto();
  }, [isHovered, stopAuto, startAuto, currentIndex]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  const cardStyle = (idx: number, _accent: string) => {
    const isActive = idx === activeIdx;
    const isHov = idx === hoveredIdx;
    const scale = isHov ? 1.08 : 1;
    const translateY = isHov ? -10 : 0;
    const opacity = isHov ? 1 : 0.97;
    const brightness = isHov ? 1.04 : isActive ? 1 : 0.985;
    const saturate = isHov ? 1.05 : isActive ? 1.02 : 0.995;

    return {
      transform: `translateY(${translateY}px) scale(${scale})`,
      filter: `brightness(${brightness}) saturate(${saturate})`,
      opacity,
      zIndex: isHov ? 180 : isActive ? 120 : 100,
      transition:
        "transform 220ms cubic-bezier(.22,.8,.22,1), filter 220ms ease, opacity 220ms ease, box-shadow 300ms ease",
    };
  };

  return (
    <>
    <style>{`
      @keyframes cardFloat {
        0%   { transform: translateY(0px); }
        100% { transform: translateY(-8px); }
      }
    `}</style>
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Stage */}
      <div
        ref={stageRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoveredIdx(null);
        }}
        style={{
          width: "100%",
          height: 654,
          position: "relative",
          perspective: 2200,
          perspectiveOrigin: "center 42%",
          overflow: "hidden",
          marginTop: 6,
        }}
      >

        {/* Rail */}
        <div
          ref={railRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            gap: GAP,
            padding: "18px 28px 0",
            transformStyle: "preserve-3d",
            willChange: "transform",
            zIndex: 3,
            opacity: 1,
          }}
        >
          {allCards.map((card, idx) => (
            <Link
              key={idx}
              href={card.href}
              prefetch={false}
              className="shrink-0 text-inherit no-underline outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent"
              aria-label={`Open ${card.top.replace(/\n/g, " ")} — ${card.title1} ${card.title2}`}
            >
            <div
              style={{
                flexShrink: 0,
                animation: `cardFloat 3.8s ease-in-out infinite alternate`,
                animationDelay: `${-(idx % CARD_DATA.length) * 0.42}s`,
                animationPlayState: hoveredIdx === idx ? "paused" : "running",
              }}
            >
            {/* Aluminum phone frame */}
            <div
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                width: CARD_W,
                height: CARD_H,
                borderRadius: 40,
                padding: "2px",
                cursor: "pointer",
                background: "linear-gradient(160deg, #f4f4f6 0%, #e0e0e4 8%, #bebebc 22%, #a2a2a6 38%, #b0b0b4 54%, #969698 68%, #c0c0c4 82%, #e8e8ec 94%, #f2f2f6 100%)",
                boxShadow: hoveredIdx === idx ? `
                  inset 0 2px 0 rgba(255,255,255,.95),
                  inset 0 -1.5px 0 rgba(0,0,0,.30),
                  inset 2px 0 0 rgba(255,255,255,.45),
                  inset -2px 0 0 rgba(0,0,0,.22),
                  3px 4px 0 rgba(0,0,0,.45),
                  0 10px 20px rgba(15,15,25,.42),
                  0 28px 50px rgba(15,15,25,.34),
                  0 60px 90px rgba(15,15,25,.24),
                  0 100px 140px rgba(15,15,25,.14),
                  0 160px 200px rgba(15,15,25,.07)
                ` : `
                  inset 0 2px 0 rgba(255,255,255,.95),
                  inset 0 -1.5px 0 rgba(0,0,0,.30),
                  inset 2px 0 0 rgba(255,255,255,.45),
                  inset -2px 0 0 rgba(0,0,0,.22),
                  3px 4px 0 rgba(0,0,0,.45),
                  0 6px 14px rgba(15,15,25,.28),
                  0 18px 36px rgba(15,15,25,.20),
                  0 44px 70px rgba(15,15,25,.14),
                  0 80px 110px rgba(15,15,25,.09),
                  0 130px 170px rgba(15,15,25,.05)
                `,
                ...cardStyle(idx, card.accent),
              }}
            >
            <article
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                borderRadius: 37,
                position: "relative",
                overflow: "hidden",
                transformStyle: "preserve-3d",
                isolation: "isolate",
                background: "#1f2937",
              }}
            >
              {/* Art */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url('${card.art}')`,
                  backgroundSize: "cover",
                  backgroundPosition: card.bgPos ?? "center",
                  transform: "scale(1.025)",
                  filter: "contrast(1.08) saturate(1.18) brightness(1.04)",
                }}
              />

              {/* Content */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 4,
                  padding: "26px 26px 36px",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  minHeight: "100%",
                  color: "#ffffff",
                  textShadow: "0 2px 16px rgba(0,0,0,.28)",
                }}
              >
                {/* Top label */}
                <div
                  style={{
                    flexShrink: 0,
                    fontFamily:
                      "'Playfair Display', Georgia, 'Times New Roman', serif",
                    fontSize: 33,
                    lineHeight: 0.98,
                    letterSpacing: "-0.025em",
                    textTransform: "uppercase",
                    textAlign: "center",
                    maxWidth: "100%",
                    minHeight: 118,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    whiteSpace: "pre-line",
                  }}
                >
                  {card.top}
                </div>

                {/* Bottom text — marginTop auto pins block to bottom above padding/home bar */}
                <div
                  style={{
                    marginTop: "auto",
                    flexShrink: 0,
                    width: "100%",
                    position: "relative",
                    zIndex: 1,
                    textAlign: card.bottomAlign ?? "left",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 10px",
                      fontSize: 21,
                      lineHeight: 1,
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                      textTransform: "uppercase",
                      fontFamily:
                        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    }}
                  >
                    <span style={{ display: "block" }}>{card.title1}</span>
                    <span style={{ display: "block" }}>{card.title2}</span>
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      lineHeight: 1.34,
                      opacity: 0.94,
                    }}
                  >
                    {card.body}
                  </p>
                </div>
              </div>

              {/* Home indicator */}
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 100,
                  height: 4,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.92)",
                  zIndex: 5,
                  pointerEvents: "none",
                }}
              />
            </article>
            </div>{/* end phone frame */}
            </div>
            </Link>
          ))}
        </div>

        {/* Nav buttons */}
        <button
          onClick={() => move(-1)}
          aria-label="Previous"
          style={{
            position: "absolute",
            left: 24,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 9,
            width: 54,
            height: 54,
            borderRadius: 999,
            border: "1px solid rgba(100,116,139,.18)",
            background: "rgba(255,255,255,.84)",
            color: "#1e293b",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            cursor: "pointer",
            backdropFilter: "blur(12px)",
            boxShadow: "0 14px 30px rgba(15,23,42,.12)",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,.96)";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-50%) scale(1.04)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,.84)";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-50%)";
          }}
        >
          ‹
        </button>
        <button
          onClick={() => move(1)}
          aria-label="Next"
          style={{
            position: "absolute",
            right: 24,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 9,
            width: 54,
            height: 54,
            borderRadius: 999,
            border: "1px solid rgba(100,116,139,.18)",
            background: "rgba(255,255,255,.84)",
            color: "#1e293b",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            cursor: "pointer",
            backdropFilter: "blur(12px)",
            boxShadow: "0 14px 30px rgba(15,23,42,.12)",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,.96)";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-50%) scale(1.04)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,.84)";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-50%)";
          }}
        >
          ›
        </button>

      </div>
    </div>
    </>
  );
}

export function PhoneCarousel() {
  const [viewport, setViewport] = useState<"pending" | "narrow" | "wide">(
    "pending"
  );

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setViewport(mq.matches ? "narrow" : "wide");
    sync();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }
    mq.addListener(sync);
    return () => mq.removeListener(sync);
  }, []);

  if (viewport === "pending") {
    return (
      <div
        id="artkey-uses"
        style={{
          width: "100%",
          minHeight: "min(100vh, 700px)",
          background: "#fff",
          scrollMarginTop: "5rem",
        }}
        aria-hidden
      />
    );
  }

  return (
    <section
      id="artkey-uses"
      className="bg-white"
      style={{ scrollMarginTop: "5rem" }}
    >
      <ArtKeyUsesSectionHeading />
      {viewport === "narrow" ? (
        <PhoneCarouselMobile />
      ) : (
        <PhoneCarouselDesktop />
      )}
    </section>
  );
}
