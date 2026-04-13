"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from "react";
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

const AUTO_DELAY = 2600;
const TRANSITION_MS = 620;
const SWIPE_PX = 50;

type CarouselItem = {
  slug: string;
  category: string;
  title: string;
  description: string;
  image: string;
  href: string;
  alt: string;
  titleLine1: string;
  titleLine2: string;
};

function splitTitle(title: string): [string, string] {
  const clean = title.replace(/™/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length <= 1) return [clean, ""];
  if (words.length === 2) return [words[0], words[1]];

  return [words.slice(0, -1).join(" "), words[words.length - 1]];
}

function formatCategory(category: string): string[] {
  return category.replace(" / ", " /\n").split("\n");
}

export default function StoryCarousel() {
  const baseItems = useMemo<CarouselItem[]>(
    () =>
      ARTKEY_USES.map((useEntry, index) => {
        const [titleLine1, titleLine2] = splitTitle(useEntry.title);

        return {
          slug: useEntry.slug,
          category: useEntry.category,
          title: useEntry.title,
          description: useEntry.description,
          image: STORY_CAROUSEL_IMAGES[index] ?? STORY_CAROUSEL_IMAGES[0],
          href: `/artkey-uses/${useEntry.slug}`,
          alt: `${useEntry.title} — ${useEntry.category}`,
          titleLine1,
          titleLine2,
        };
      }),
    []
  );

  const originalCount = baseItems.length;
  const duplicatedItems = useMemo(
    () => [...baseItems, ...baseItems, ...baseItems],
    [baseItems]
  );

  const stageRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(originalCount);
  const [enableTransition, setEnableTransition] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isStageHovered, setIsStageHovered] = useState(false);
  const [isStageVisible, setIsStageVisible] = useState(true);
  const [layout, setLayout] = useState({
    stageWidth: 0,
    cardWidth: 0,
    stepWidth: 0,
    railPadding: 0,
  });

  const activeLogicalIndex =
    ((currentIndex % originalCount) + originalCount) % originalCount;

  const measure = useCallback(() => {
    if (!stageRef.current || !railRef.current) return;

    const firstCard = railRef.current.querySelector<HTMLElement>(".story-rail-card");
    if (!firstCard) return;

    const railStyles = window.getComputedStyle(railRef.current);
    const gap = parseFloat(railStyles.gap || "0");
    const railPadding = parseFloat(railStyles.paddingLeft || "0");
    const cardWidth = firstCard.getBoundingClientRect().width;
    const stageWidth = stageRef.current.clientWidth;

    setLayout({
      stageWidth,
      cardWidth,
      stepWidth: cardWidth + gap,
      railPadding,
    });
  }, []);

  useEffect(() => {
    measure();

    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const timer = window.setTimeout(() => {
      measure();
      setEnableTransition(true);
    }, 0);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, [measure]);

  useEffect(() => {
    if (!stageRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStageVisible(entry?.isIntersecting ?? false);
      },
      { threshold: 0.35 }
    );

    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsStageVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!enableTransition || !isStageVisible || isStageHovered) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((value) => value + 1);
    }, AUTO_DELAY);

    return () => window.clearInterval(timer);
  }, [enableTransition, isStageHovered, isStageVisible]);

  useEffect(() => {
    if (enableTransition) return;

    const raf = window.requestAnimationFrame(() => {
      setEnableTransition(true);
    });

    return () => window.cancelAnimationFrame(raf);
  }, [enableTransition, currentIndex]);

  const goPrev = useCallback(() => {
    setCurrentIndex((value) => value - 1);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((value) => value + 1);
  }, []);

  const goToLogicalSlide = useCallback(
    (target: number) => {
      const current = ((currentIndex % originalCount) + originalCount) % originalCount;
      let diff = target - current;
      const half = Math.floor(originalCount / 2);

      if (diff > half) diff -= originalCount;
      if (diff < -half) diff += originalCount;
      if (diff === 0) return;

      setCurrentIndex((value) => value + diff);
    },
    [currentIndex, originalCount]
  );

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.targetTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;

    const end = event.changedTouches[0]?.clientX;
    if (typeof end !== "number") return;

    const dx = end - start;
    if (dx > SWIPE_PX) goPrev();
    else if (dx < -SWIPE_PX) goNext();
  };

  const handleRailTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== railRef.current || event.propertyName !== "transform") return;

    if (currentIndex >= originalCount * 2) {
      setEnableTransition(false);
      setCurrentIndex((value) => value - originalCount);
      return;
    }

    if (currentIndex < originalCount) {
      setEnableTransition(false);
      setCurrentIndex((value) => value + originalCount);
    }
  };

  const translateX =
    layout.stageWidth > 0 && layout.stepWidth > 0
      ? layout.stageWidth / 2 -
        (layout.railPadding + currentIndex * layout.stepWidth + layout.cardWidth / 2)
      : 0;

  const getCardStyle = (itemIndex: number): CSSProperties => {
    const distance = Math.abs(itemIndex - currentIndex);
    const isHovered = hoveredIndex === itemIndex;

    let scale = 0.86;
    let opacity = 0.9;
    let brightness = 0.97;
    let saturate = 0.98;
    let translateY = 0;
    let zIndex = 20;
    let boxShadow =
      "0 10px 18px rgba(16,22,35,.12), 0 22px 38px rgba(16,22,35,.20), 0 46px 82px rgba(16,22,35,.14)";

    if (distance === 0) {
      scale = 1;
      opacity = 1;
      brightness = 1;
      saturate = 1.02;
      zIndex = 60;
      boxShadow =
        "0 18px 30px rgba(16,22,35,.16), 0 40px 64px rgba(16,22,35,.22), 0 80px 120px rgba(16,22,35,.16)";
    } else if (distance === 1) {
      scale = 0.94;
      opacity = 0.98;
      brightness = 0.99;
      saturate = 1;
      zIndex = 50;
      boxShadow =
        "0 14px 24px rgba(16,22,35,.14), 0 30px 48px rgba(16,22,35,.20), 0 58px 92px rgba(16,22,35,.15)";
    } else if (distance === 2) {
      scale = 0.89;
      opacity = 0.94;
      brightness = 0.98;
      saturate = 0.99;
      zIndex = 40;
    } else if (distance >= 3) {
      scale = 0.83;
      opacity = 0.88;
      brightness = 0.96;
      saturate = 0.97;
      zIndex = 30;
    }

    if (isHovered) {
      scale += 0.06;
      translateY = -8;
      opacity = 1;
      brightness = 1.02;
      saturate = 1.05;
      zIndex = 80;
      boxShadow =
        "0 22px 34px rgba(16,22,35,.18), 0 50px 72px rgba(16,22,35,.24), 0 96px 132px rgba(16,22,35,.18)";
    }

    return {
      transform: `translateY(${translateY}px) scale(${scale})`,
      opacity,
      filter: `brightness(${brightness}) saturate(${saturate})`,
      zIndex,
      boxShadow,
    };
  };

  return (
    <div className="story-carousel-shell">
      <div className="story-carousel-wrap">
        <button
          type="button"
          className="story-nav story-nav-left"
          onClick={goPrev}
          aria-label="Previous cards"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        <div
          ref={stageRef}
          className="story-stage"
          onMouseEnter={() => setIsStageHovered(true)}
          onMouseLeave={() => {
            setIsStageHovered(false);
            setHoveredIndex(null);
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="story-stage-glow" />
          <div className="story-rail-shadow" />

          <div
            ref={railRef}
            className="story-rail"
            onTransitionEnd={handleRailTransitionEnd}
            style={{
              transform: `translateX(${translateX}px)`,
              transition: enableTransition
                ? `transform ${TRANSITION_MS}ms cubic-bezier(.22,.8,.22,1)`
                : "none",
            }}
          >
            {duplicatedItems.map((item, itemIndex) => {
              const categoryLines = formatCategory(item.category);
              const rightAlign = item.slug === "realtor";

              return (
                <Link
                  key={`${item.slug}-${itemIndex}`}
                  href={item.href}
                  className="story-rail-card"
                  style={getCardStyle(itemIndex)}
                  onMouseEnter={() => {
                    setIsStageHovered(true);
                    setHoveredIndex(itemIndex);
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex((current) =>
                      current === itemIndex ? null : current
                    );
                  }}
                  aria-label={`${item.title} — ${item.category}`}
                >
                  <div
                    className="story-card-art"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <div className="story-card-overlay" />

                  <div className="story-card-content">
                    <div className="story-card-top">
                      {categoryLines.map((line) => (
                        <span key={line} className="story-card-top-line">
                          {line}
                        </span>
                      ))}
                    </div>

                    <div
                      className={`story-card-bottom ${
                        rightAlign ? "story-card-bottom-right" : ""
                      }`}
                    >
                      <h3>
                        <span className="story-title-line">{item.titleLine1}</span>
                        <span className="story-title-line">
                          {item.titleLine2 || "\u00A0"}
                        </span>
                      </h3>
                      <p>{item.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="story-viewport-fade" />
        </div>

        <button
          type="button"
          className="story-nav story-nav-right"
          onClick={goNext}
          aria-label="Next cards"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="story-dots" aria-label="Carousel pagination">
        {baseItems.map((item, index) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => goToLogicalSlide(index)}
            className={`story-dot ${index === activeLogicalIndex ? "is-active" : ""}`}
            aria-label={`Go to ${item.title}`}
            aria-current={index === activeLogicalIndex ? "true" : undefined}
          />
        ))}
      </div>

      <style jsx>{`
        .story-carousel-shell {
          width: 100%;
          margin-bottom: 4rem;
        }

        .story-carousel-wrap {
          position: relative;
          width: min(1280px, 100%);
          margin: 0 auto;
        }

        .story-stage {
          position: relative;
          width: 100%;
          height: 654px;
          overflow: hidden;
          perspective: 2200px;
          perspective-origin: center 42%;
          margin-top: 6px;
        }

        .story-stage-glow {
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

        .story-rail-shadow {
          position: absolute;
          left: 1.5%;
          right: 1.5%;
          bottom: 50px;
          height: 126px;
          border-radius: 999px;
          background: radial-gradient(
            ellipse at center,
            rgba(15,23,42,.22) 0%,
            rgba(15,23,42,.15) 28%,
            rgba(15,23,42,.08) 50%,
            rgba(15,23,42,.03) 70%,
            rgba(15,23,42,0) 100%
          );
          filter: blur(18px);
          pointer-events: none;
          z-index: 1;
        }

        .story-viewport-fade {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 6;
          background:
            linear-gradient(
              90deg,
              #f6f4f1 0%,
              rgba(246,244,241,0) 10%,
              rgba(246,244,241,0) 90%,
              #f6f4f1 100%
            );
        }

        .story-rail {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          gap: 28px;
          padding: 18px 28px 0;
          will-change: transform;
          z-index: 3;
        }

        .story-rail-card {
          --card-width: 332px;
          --card-height: 520px;
          position: relative;
          flex: 0 0 auto;
          width: var(--card-width);
          height: var(--card-height);
          border-radius: 24px;
          overflow: hidden;
          isolation: isolate;
          border: 1px solid rgba(255,255,255,.24);
          background: #1f2937;
          transition:
            transform 220ms ease,
            filter 220ms ease,
            opacity 220ms ease,
            box-shadow 220ms ease;
          cursor: pointer;
          transform-style: preserve-3d;
          text-decoration: none;
        }

        .story-card-art,
        .story-card-overlay,
        .story-card-content {
          position: absolute;
          inset: 0;
        }

        .story-card-art {
          background-size: cover;
          background-position: center;
          transform: scale(1.025);
          filter: contrast(1.03) saturate(1.02);
        }

        .story-card-overlay {
          background:
            linear-gradient(
              180deg,
              rgba(12, 18, 28, 0.18) 0%,
              rgba(12, 18, 28, 0.16) 16%,
              rgba(12, 18, 28, 0.34) 54%,
              rgba(10, 14, 22, 0.72) 100%
            );
          z-index: 2;
        }

        .story-card-content {
          z-index: 4;
          padding: 26px 26px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transform: translateZ(34px);
          color: #ffffff;
          text-shadow: 0 2px 16px rgba(0, 0, 0, 0.28);
        }

        .story-card-top {
          font-family: "Playfair Display", Georgia, "Times New Roman", serif;
          font-size: 33px;
          line-height: 0.98;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          min-height: 118px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          text-align: center;
        }

        .story-card-top-line {
          display: block;
          width: 100%;
        }

        .story-card-bottom {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: auto;
          position: relative;
          z-index: 1;
          text-align: left;
        }

        .story-card-bottom-right {
          text-align: right;
        }

        .story-card-bottom h3 {
          margin: 0 0 10px;
          font-size: 21px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.01em;
          text-transform: uppercase;
          min-height: 48px;
          width: 100%;
          display: grid;
          grid-template-rows: repeat(2, minmax(0, 1fr));
          align-items: start;
        }

        .story-title-line {
          display: block;
          width: 100%;
        }

        .story-card-bottom p {
          margin: 0;
          font-size: 15px;
          line-height: 1.34;
          opacity: 0.94;
          width: 100%;
        }

        .story-nav {
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
          cursor: pointer;
          backdrop-filter: blur(12px);
          box-shadow: 0 14px 30px rgba(15,23,42,.12);
          transform: translateY(-50%);
          transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
        }

        .story-nav:hover {
          background: rgba(255,255,255,.96);
          box-shadow: 0 18px 36px rgba(15,23,42,.16);
          transform: translateY(-50%) scale(1.03);
        }

        .story-nav:active {
          transform: translateY(-50%) scale(.98);
        }

        .story-nav-left {
          left: 24px;
        }

        .story-nav-right {
          right: 24px;
        }

        .story-dots {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          padding-top: 1.5rem;
        }

        .story-dot {
          width: 0.65rem;
          height: 0.65rem;
          border: 0;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.45);
          transition: transform 160ms ease, background 160ms ease;
          cursor: pointer;
        }

        .story-dot:hover {
          background: rgba(100, 116, 139, 0.78);
        }

        .story-dot.is-active {
          transform: scale(1.12);
          background: #141414;
        }

        @media (max-width: 1100px) {
          .story-stage {
            height: 626px;
          }

          .story-rail {
            gap: 22px;
            padding-inline: 22px;
          }

          .story-rail-card {
            --card-width: 286px;
            --card-height: 450px;
          }

          .story-card-top {
            font-size: 30px;
            min-height: 104px;
          }

          .story-rail-shadow {
            bottom: 42px;
            height: 144px;
          }

          .story-nav {
            width: 48px;
            height: 48px;
          }

          .story-nav-left {
            left: 16px;
          }

          .story-nav-right {
            right: 16px;
          }
        }

        @media (max-width: 760px) {
          .story-stage {
            height: 566px;
          }

          .story-rail {
            gap: 18px;
            padding-inline: 18px;
          }

          .story-rail-card {
            --card-width: 248px;
            --card-height: 388px;
            border-radius: 20px;
          }

          .story-card-top {
            font-size: 27px;
            min-height: 92px;
          }

          .story-rail-shadow {
            bottom: 34px;
            height: 124px;
          }

          .story-card-bottom h3 {
            font-size: 18px;
            min-height: 42px;
          }

          .story-card-bottom p {
            font-size: 13.5px;
            line-height: 1.3;
          }

          .story-nav {
            width: 42px;
            height: 42px;
            top: auto;
            bottom: 20px;
            transform: none;
          }

          .story-nav:hover,
          .story-nav:active {
            transform: none;
          }

          .story-nav-left {
            left: calc(50% - 52px);
          }

          .story-nav-right {
            right: calc(50% - 52px);
          }
        }
      `}</style>
    </div>
  );
}
