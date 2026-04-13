"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { HomeArtKeyCarouselItem } from "@/lib/homeArtKeyCarouselItems";
import styles from "./HomeArtKeyCarousel3D.module.css";

type Props = { items: HomeArtKeyCarouselItem[] };

const AUTO_DELAY = 2600;
const TRANSITION_MS = 620;

type CardMotion = {
  transform: string;
  filter: string;
  opacity: number;
  zIndex: number;
  boxShadow: string;
};

const defaultMotion: CardMotion = {
  transform: "translateY(0px) scale(1)",
  filter: "brightness(0.985) saturate(0.995)",
  opacity: 0.97,
  zIndex: 100,
  boxShadow:
    "0 16px 28px rgba(16,22,35,0.16), 0 46px 54px rgba(16,22,35,0.20), 0 96px 82px rgba(16,22,35,0.14)",
};

function motionForCard(isActive: boolean, isHovered: boolean): CardMotion {
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

export function HomeArtKeyCarousel3D({ items }: Props) {
  const n = items.length;
  const triple = useMemo(() => [...items, ...items, ...items], [items]);
  const tripleLen = triple.length;

  const stageRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(n);
  const isAnimatingRef = useRef(false);
  const isStageHoveredRef = useRef(false);
  const isStageVisibleRef = useRef(false);
  const hoveredTripleIdxRef = useRef<number | null>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const depthRafRef = useRef<number | null>(null);
  const measureRef = useRef({ stepWidth: 0, railPadding: 0, cardWidth: 0 });
  const startAutoplayRef = useRef<() => void>(() => {});

  const [railStyle, setRailStyle] = useState<CSSProperties>({
    transform: "translateX(0px)",
    transition: "none",
  });
  const [logical, setLogical] = useState(0);
  const [cardMotions, setCardMotions] = useState<CardMotion[]>(() =>
    Array.from({ length: tripleLen }, () => defaultMotion)
  );

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail || !rail.children.length) return;
    const rs = getComputedStyle(rail);
    const cardWidth = rail.children[0].getBoundingClientRect().width;
    const gap = parseFloat(rs.gap || "0");
    const railPadding = parseFloat(rs.paddingLeft || "0");
    measureRef.current = { stepWidth: cardWidth + gap, railPadding, cardWidth };
  }, []);

  const getStageCenterX = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) {
      return typeof window !== "undefined" ? window.innerWidth / 2 : 0;
    }
    const r = stage.getBoundingClientRect();
    return r.left + r.width / 2;
  }, []);

  const measureTranslate = useCallback(() => {
    const stage = stageRef.current;
    const rail = railRef.current;
    if (!stage || !rail || !rail.children.length) return 0;
    const stageRect = stage.getBoundingClientRect();
    const centerX = getStageCenterX();
    const { stepWidth, railPadding, cardWidth } = measureRef.current;
    if (!stepWidth) return 0;
    const i = idxRef.current;
    const cardCenter = railPadding + i * stepWidth + cardWidth / 2;
    return centerX - stageRect.left - cardCenter;
  }, [getStageCenterX]);

  const updateCardDepth = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const centerX = getStageCenterX();
    const children = Array.from(rail.children) as HTMLElement[];
    let closestIdx = -1;
    let closestDist = Infinity;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const d = Math.abs(cx - centerX);
      if (d < closestDist) {
        closestDist = d;
        closestIdx = i;
      }
    }
    const hovered = hoveredTripleIdxRef.current;
    setCardMotions(
      Array.from({ length: tripleLen }, (_, i) =>
        motionForCard(i === closestIdx, i === hovered)
      )
    );
  }, [getStageCenterX, tripleLen]);

  const animateDepthFor = useCallback(
    (duration = 700) => {
      if (depthRafRef.current !== null) {
        cancelAnimationFrame(depthRafRef.current);
      }
      const start = performance.now();
      const frame = (now: number) => {
        updateCardDepth();
        if (now - start < duration) {
          depthRafRef.current = requestAnimationFrame(frame);
        } else {
          depthRafRef.current = null;
        }
      };
      depthRafRef.current = requestAnimationFrame(frame);
    },
    [updateCardDepth]
  );

  const apply = useCallback(
    (animated: boolean) => {
      const tx = measureTranslate();
      setRailStyle({
        transform: `translateX(${tx}px)`,
        transition: animated
          ? `transform ${TRANSITION_MS}ms cubic-bezier(.22,.8,.22,1)`
          : "none",
      });
      updateCardDepth();
    },
    [measureTranslate, updateCardDepth]
  );

  const normalize = useCallback(() => {
    let changed = false;
    if (idxRef.current >= n * 2) {
      idxRef.current -= n;
      changed = true;
    }
    if (idxRef.current < n) {
      idxRef.current += n;
      changed = true;
    }
    if (changed) apply(false);
  }, [apply, n]);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimerRef.current !== null) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const shouldAutoplay = useCallback(
    () =>
      isStageVisibleRef.current &&
      !isStageHoveredRef.current &&
      !isAnimatingRef.current,
    []
  );

  const beginSlide = useCallback(
    (dir: number, restartAfter: boolean) => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      idxRef.current += dir;
      apply(true);
      animateDepthFor();
      window.setTimeout(() => {
        normalize();
        apply(false);
        isAnimatingRef.current = false;
        setLogical(((idxRef.current % n) + n) % n);
        updateCardDepth();
        if (restartAfter) startAutoplayRef.current();
      }, TRANSITION_MS + 20);
    },
    [animateDepthFor, apply, normalize, n, updateCardDepth]
  );

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (!shouldAutoplay()) return;
    autoplayTimerRef.current = setInterval(() => {
      if (!shouldAutoplay()) return;
      beginSlide(1, false);
    }, AUTO_DELAY);
  }, [beginSlide, shouldAutoplay, stopAutoplay]);

  useEffect(() => {
    startAutoplayRef.current = startAutoplay;
  }, [startAutoplay]);

  const move = useCallback(
    (dir: number) => {
      stopAutoplay();
      beginSlide(dir, true);
    },
    [beginSlide, stopAutoplay]
  );

  const goTo = useCallback(
    (i: number) => {
      stopAutoplay();
      idxRef.current = n + i;
      measure();
      apply(false);
      updateCardDepth();
      setLogical(i);
      startAutoplay();
    },
    [apply, measure, n, startAutoplay, stopAutoplay, updateCardDepth]
  );

  useEffect(() => {
    measure();
    apply(false);
    updateCardDepth();
    const onResize = () => {
      measure();
      apply(false);
      updateCardDepth();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [apply, measure, n, updateCardDepth]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        isStageVisibleRef.current = e?.isIntersecting ?? false;
        if (isStageVisibleRef.current) startAutoplay();
        else stopAutoplay();
      },
      { threshold: 0.35 }
    );
    obs.observe(stage);
    return () => obs.disconnect();
  }, [startAutoplay, stopAutoplay]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [startAutoplay, stopAutoplay]);

  useEffect(() => {
    return () => {
      stopAutoplay();
      if (depthRafRef.current !== null) {
        cancelAnimationFrame(depthRafRef.current);
      }
    };
  }, [stopAutoplay]);

  const onStageEnter = () => {
    isStageHoveredRef.current = true;
    stopAutoplay();
  };

  const onStageLeave = () => {
    isStageHoveredRef.current = false;
    hoveredTripleIdxRef.current = null;
    updateCardDepth();
    startAutoplay();
  };

  const onCardEnter = (tripleIdx: number) => {
    isStageHoveredRef.current = true;
    hoveredTripleIdxRef.current = tripleIdx;
    stopAutoplay();
    updateCardDepth();
  };

  const onCardLeave = (tripleIdx: number) => {
    if (hoveredTripleIdxRef.current === tripleIdx) {
      hoveredTripleIdxRef.current = null;
    }
    isStageHoveredRef.current = stageRef.current?.matches(":hover") ?? false;
    updateCardDepth();
    if (!isStageHoveredRef.current) startAutoplay();
  };

  return (
    <section className={styles.root} aria-label="ArtKey uses carousel">
      <div
        className={styles.stage}
        ref={stageRef}
        onMouseEnter={onStageEnter}
        onMouseLeave={onStageLeave}
      >
        <div className={styles.rail} ref={railRef} style={railStyle}>
          {triple.map((item, i) => (
            <Link
              key={`${item.slug}-${i}`}
              href={item.href}
              className={styles.card}
              aria-label={item.label}
              style={cardMotions[i] ?? defaultMotion}
              onMouseEnter={() => onCardEnter(i)}
              onMouseLeave={() => onCardLeave(i)}
            >
              <div
                className={styles.art}
                style={{ backgroundImage: `url('${item.image}')` }}
                role="img"
                aria-hidden
              />
              <div className={styles.content}>
                <div className={styles.top}>{item.top}</div>
                <div className={item.rightAlign ? `${styles.bottom} ${styles.bottomRight}` : styles.bottom}>
                  <h3>
                    <span className={styles.titleLine}>{item.title1}</span>
                    <span className={styles.titleLine}>{item.title2}</span>
                  </h3>
                  <p>{item.body}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className={styles.navRow}>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Previous"
          onClick={() => move(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Next"
          onClick={() => move(1)}
        >
          ›
        </button>
      </div>
      <div className={styles.dots}>
        {items.map((item, i) => (
          <button
            key={item.slug}
            type="button"
            className={`${styles.dot} ${i === logical ? styles.dotActive : ""}`}
            aria-label={`Go to ${item.label}`}
            aria-current={i === logical ? "true" : undefined}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </section>
  );
}
