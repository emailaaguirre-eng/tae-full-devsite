"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { HomeArtKeyCarouselItem } from "@/lib/homeArtKeyCarouselItems";
import styles from "./HomeArtKeyCarouselPhone.module.css";

type Props = { items: HomeArtKeyCarouselItem[] };

const AUTO_DELAY = 2600;
const TRANSITION_MS = 620;

export function HomeArtKeyCarouselPhone({ items }: Props) {
  const n = items.length;
  const triple = useMemo(() => [...items, ...items, ...items], [items]);

  const phoneRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(n);
  const isAnimatingRef = useRef(false);
  const isHoveredRef = useRef(false);
  const isVisibleRef = useRef(false);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const measureRef = useRef({ stepWidth: 0, railPadding: 0, cardWidth: 0 });
  const startAutoplayRef = useRef<() => void>(() => {});

  const [railStyle, setRailStyle] = useState<CSSProperties>({
    transform: "translateX(0px)",
    transition: "none",
  });
  const [stripPaused, setStripPaused] = useState(false);

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail || !rail.children.length) return;
    const rs = getComputedStyle(rail);
    const cardWidth = rail.children[0].getBoundingClientRect().width;
    const gap = parseFloat(rs.gap || "0");
    measureRef.current = {
      stepWidth: cardWidth + gap,
      railPadding: 0,
      cardWidth,
    };
  }, []);

  const measureTranslate = useCallback(() => {
    const screen = screenRef.current;
    const strip = stripRef.current;
    const rail = railRef.current;
    if (!screen || !strip || !rail || !rail.children.length) return 0;
    const stripBox = strip.getBoundingClientRect();
    const stripPadL = parseFloat(getComputedStyle(strip).paddingLeft || "0");
    const flowOriginX = stripBox.left + stripPadL;
    const screenBox = screen.getBoundingClientRect();
    const screenCx = screenBox.left + screenBox.width / 2;
    const { stepWidth, cardWidth } = measureRef.current;
    if (!stepWidth) return 0;
    const i = idxRef.current;
    const cardCenterX = flowOriginX + i * stepWidth + cardWidth / 2;
    return screenCx - cardCenterX;
  }, []);

  const apply = useCallback(
    (animated: boolean) => {
      const tx = measureTranslate();
      setRailStyle({
        transform: `translateX(${tx}px)`,
        transition: animated
          ? `transform ${TRANSITION_MS}ms cubic-bezier(.22,.8,.22,1)`
          : "none",
      });
    },
    [measureTranslate]
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
      isVisibleRef.current && !isHoveredRef.current && !isAnimatingRef.current,
    []
  );

  const beginSlide = useCallback(
    (dir: number, restartAfter: boolean) => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      idxRef.current += dir;
      apply(true);
      window.setTimeout(() => {
        normalize();
        apply(false);
        isAnimatingRef.current = false;
        if (restartAfter) startAutoplayRef.current();
      }, TRANSITION_MS + 20);
    },
    [apply, normalize]
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

  useLayoutEffect(() => {
    measure();
    apply(false);
  }, [apply, measure, triple]);

  const move = useCallback(
    (dir: number) => {
      stopAutoplay();
      beginSlide(dir, true);
    },
    [beginSlide, stopAutoplay]
  );

  useEffect(() => {
    measure();
    apply(false);
    const onResize = () => {
      measure();
      apply(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [apply, measure, n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  useEffect(() => {
    const root = phoneRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        isVisibleRef.current = e?.isIntersecting ?? false;
        if (isVisibleRef.current) startAutoplay();
        else stopAutoplay();
      },
      { threshold: 0.35 }
    );
    obs.observe(root);
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
    return () => stopAutoplay();
  }, [stopAutoplay]);

  const onPhoneEnter = () => {
    isHoveredRef.current = true;
    setStripPaused(true);
    stopAutoplay();
  };

  const onPhoneLeave = () => {
    isHoveredRef.current = false;
    setStripPaused(false);
    startAutoplay();
  };

  return (
    <section className={styles.root} aria-label="ArtKey uses carousel (phone)">
      <div
        className={styles.phone}
        ref={phoneRef}
        onMouseEnter={onPhoneEnter}
        onMouseLeave={onPhoneLeave}
      >
        <div className={styles.notch} aria-hidden />
        <div className={styles.screen} ref={screenRef}>
          <div
            ref={stripRef}
            className={`${styles.strip} ${stripPaused ? styles.stripPaused : ""}`}
          >
            <div className={styles.rail} ref={railRef} style={railStyle}>
              {triple.map((item, i) => (
                <div
                  key={`${item.slug}-${i}`}
                  className={styles.cardFloat}
                  style={{
                    animationDelay: `${-(i % n) * 0.42}s`,
                  }}
                >
                  <Link
                    href={item.href}
                    className={styles.card}
                    aria-label={item.label}
                  >
                    <div
                      className={styles.art}
                      style={{ backgroundImage: `url('${item.image}')` }}
                      role="img"
                      aria-hidden
                    />
                    <div className={styles.label}>{item.label}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.phoneNav}>
        <button
          type="button"
          className={styles.phoneNavBtn}
          aria-label="Previous"
          onClick={() => move(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className={styles.phoneNavBtn}
          aria-label="Next"
          onClick={() => move(1)}
        >
          ›
        </button>
      </div>
      <p className={styles.hint}>
        Autoplay inside the phone; hover to pause (float animation pauses too).
      </p>
    </section>
  );
}
