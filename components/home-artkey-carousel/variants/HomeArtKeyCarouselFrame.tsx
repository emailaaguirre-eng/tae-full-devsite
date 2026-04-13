"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { HomeArtKeyCarouselItem } from "@/lib/homeArtKeyCarouselItems";
import styles from "./HomeArtKeyCarouselFrame.module.css";

type Props = { items: HomeArtKeyCarouselItem[] };

const SPEED_PX = 0.45;
const NUDGE_PX = 224;

export function HomeArtKeyCarouselFrame({ items }: Props) {
  const doubled = useMemo(() => [...items, ...items], [items]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const halfWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    halfWidthRef.current = rail.scrollWidth / 2;
  }, []);

  const applyTransform = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.style.transform = `translateX(${-offsetRef.current}px)`;
  }, []);

  const nudge = useCallback(
    (dir: number) => {
      const half = halfWidthRef.current;
      if (!half) return;
      offsetRef.current += dir * NUDGE_PX;
      if (offsetRef.current < 0) offsetRef.current += half;
      if (offsetRef.current >= half) offsetRef.current -= half;
      applyTransform();
    },
    [applyTransform]
  );

  useEffect(() => {
    measure();
    applyTransform();
    const onResize = () => {
      measure();
      applyTransform();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [applyTransform, doubled, measure]);

  useEffect(() => {
    const tick = () => {
      const half = halfWidthRef.current;
      if (!pausedRef.current && half > 0) {
        offsetRef.current += SPEED_PX;
        if (offsetRef.current >= half) offsetRef.current = 0;
        applyTransform();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [applyTransform]);

  return (
    <section className={styles.root} aria-label="ArtKey uses carousel (frames)">
      <div
        className={styles.viewport}
        ref={viewportRef}
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
      >
        <div className={styles.rail} ref={railRef}>
          {doubled.map((item, i) => (
            <div key={`${item.slug}-${i}`} className={styles.piece}>
              <Link href={item.href} className={styles.frame} aria-label={item.label}>
                <div className={styles.mat}>
                  <div className={styles.artWrap}>
                    <div
                      className={styles.art}
                      style={{ backgroundImage: `url('${item.image}')` }}
                      role="img"
                      aria-hidden
                    />
                  </div>
                </div>
              </Link>
              <div className={styles.caption}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.arrow}
          aria-label="Previous"
          onClick={() => nudge(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className={styles.arrow}
          aria-label="Next"
          onClick={() => nudge(1)}
        >
          ›
        </button>
      </div>
    </section>
  );
}
