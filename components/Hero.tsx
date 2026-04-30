"use client";

import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import { useSiteMedia } from "@/hooks/useSiteMedia";

const HERO_VIDEO_DEFAULT = mediaUrl(
  "https://theartfulexperience.com/wp-content/uploads/2026/04/taehero-1.mp4"
);

export default function Hero() {
  const heroVideoSrc = useSiteMedia("hero.video", HERO_VIDEO_DEFAULT);

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col overflow-hidden pt-16 supports-[min-height:100dvh]:min-h-[100dvh]"
      style={{ backgroundColor: "#f3f3f3" }}
    >
      {/* Organic background shapes (same language as previous hero) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-light/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-medium/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-brand-dark/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col w-full min-h-0">
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 sm:py-10 md:py-14 min-h-0">
          <div className="w-full max-w-screen-2xl 2xl:max-w-[1720px] mr-auto">
            <div className="grid gap-8 sm:gap-10 lg:gap-14 xl:gap-16 lg:grid-cols-[1.12fr_1fr] items-center">
              {/* Left — based on former slide 2 typography */}
              <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
                <p className="text-base font-medium tracking-[0.2em] uppercase text-brand-medium">
                  The Artful Experience
                </p>
                <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-normal text-brand-dark leading-[1.12] tracking-tight font-playfair">
                  Where you get to bring images to life
                </h1>
                <div className="pl-3 sm:pl-4 border-l-4 border-brand-medium space-y-4">
                  <p className="text-base md:text-lg text-brand-darkest leading-relaxed font-light">
                    {
                      "ArtKey™ turns photographs, artwork, and moments into living portals filled with memories, videos, music, and connection."
                    }
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/#how-it-works"
                    className="inline-block bg-brand-dark text-white px-8 py-4 text-base font-medium hover:bg-brand-darkest transition-all duration-300 text-center"
                  >
                    Explore How To Use The ArtKey
                  </Link>
                </div>
              </div>

              {/* Right — hero video (replacing still image) */}
              <div className="relative order-1 lg:order-2">
                <div className="w-full bg-white/80 flex items-center justify-center overflow-hidden shadow-xl border border-brand-light/60">
                  <video
                    key={heroVideoSrc}
                    className="w-full max-h-[min(70vh,640px)] object-contain bg-black/5"
                    style={{ objectPosition: "top center" }}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label="ArtKey experience"
                  >
                    <source src={heroVideoSrc} type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organic wave divider into next section */}
      <div className="relative z-10 mt-auto pointer-events-none">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full block"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80L48 75C96 70 192 60 288 55C384 50 480 50 576 52.5C672 55 768 60 864 62.5C960 65 1056 65 1152 60C1248 55 1344 45 1392 40L1440 35V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
