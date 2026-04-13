import { useEffect, useRef, useCallback, useState } from "react";

const CARD_DATA = [
  {
    art: "https://theartfulexperience.com/wp-content/uploads/2026/04/Public-Speakers.png",
    overlay: "rgba(8,15,28,.10), rgba(8,15,28,.34)",
    top: "Public\nSpeakers",
    title1: "The Living",
    title2: "Poster",
    body: "A collectible poster that opens the story behind the stage",
    accent: "#4f8ef7",
  },
  {
    art: "https://theartfulexperience.com/wp-content/uploads/2026/04/Artists.png",
    overlay: "rgba(7,10,20,.08), rgba(7,10,20,.42)",
    top: "Artists",
    title1: "The Creator",
    title2: "Portal",
    body: "A gateway into the story behind the work",
    accent: "#a78cf2",
  },
  {
    art: "https://theartfulexperience.com/wp-content/uploads/2026/04/Wedding.png",
    overlay: "rgba(7,10,20,.02), rgba(7,10,20,.28)",
    top: "Wedding",
    title1: "The",
    title2: "Keepsake",
    body: "A living archive for your stories, memories, and legacy",
    accent: "#f7c5d0",
  },
  {
    art: "https://theartfulexperience.com/wp-content/uploads/2026/04/Travel.png",
    overlay: "rgba(28,10,2,.06), rgba(28,10,2,.34)",
    top: "Travel",
    title1: "The",
    title2: "Postcard",
    body: "A living postcard or print to memorialize your trip",
    accent: "#f0a45a",
  },
  {
    art: "https://theartfulexperience.com/wp-content/uploads/2026/04/Birth-Announcement.png",
    overlay: "rgba(12,10,10,.02), rgba(12,10,10,.28)",
    top: "Birth\nAnnouncement",
    title1: "The First",
    title2: "Chapter",
    body: "An elevated birth announcement that becomes a living legacy",
    accent: "#f9d87a",
  },
  {
    art: "https://theartfulexperience.com/wp-content/uploads/2026/04/Realtor.png",
    overlay: "rgba(18,12,8,.02), rgba(18,12,8,.30)",
    top: "Realtor",
    title1: "The Closing",
    title2: "Moment",
    body: "A closing gift that keeps your presence long after the keys are handed over",
    accent: "#6ee7c0",
    bottomAlign: "right" as const,
  },
  {
    art: "https://theartfulexperience.com/wp-content/uploads/2026/04/HolidayCard.png",
    overlay: "rgba(10,18,8,.02), rgba(10,18,8,.28)",
    top: "Holiday\nCard",
    title1: "Year in",
    title2: "Review",
    body: "A holiday card that opens into the story of your year",
    accent: "#f77b72",
  },
  {
    art: "https://theartfulexperience.com/wp-content/uploads/2026/04/Coaches.png",
    overlay: "rgba(8,14,12,.02), rgba(8,14,12,.28)",
    top: "Coaches",
    title1: "Defining",
    title2: "Moment",
    body: "A visual designed for coaches and the clients they guide",
    accent: "#7dd3fc",
  },
  {
    art: "https://theartfulexperience.com/wp-content/uploads/2026/04/graduate_1.jpg",
    overlay: "rgba(10,14,10,.04), rgba(10,14,10,.32)",
    top: "Graduate",
    title1: "The",
    title2: "Milestone",
    body: "A meaningful way to announce the turning of one chapter into another.",
    accent: "#4ade80",
  },
  {
    art: "https://theartfulexperience.com/wp-content/uploads/2026/04/AirBnb.png",
    overlay: "rgba(7,10,18,.02), rgba(7,10,18,.34)",
    top: "Airbnb",
    title1: "The",
    title2: "Experience",
    body: "A living postcard or print for your guests",
    accent: "#fb7185",
  },
];

const GAP = 28;
const AUTO_DELAY = 2600;
const CARD_W = 332;
const CARD_H = 520;

export function PhoneCarousel() {
  const railRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(CARD_DATA.length);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [reveal, setReveal] = useState(false);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tripled dataset for infinite looping
  const allCards = [...CARD_DATA, ...CARD_DATA, ...CARD_DATA];

  const getTranslateX = useCallback(
    (idx: number) => {
      const viewCenter = 1280 / 2;
      const cardCenter = 28 + idx * (CARD_W + GAP) + CARD_W / 2;
      return viewCenter - cardCenter;
    },
    []
  );

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
        applyPosition(next, true);
        setActiveIdx(computeActive(next));
        setTimeout(() => {
          setCurrentIndex((p) => {
            let n = p;
            const orig = CARD_DATA.length;
            if (n >= orig * 2) n -= orig;
            if (n < orig) n += orig;
            if (n !== p) applyPosition(n, false);
            return n;
          });
          setIsAnimating(false);
        }, 650);
        return next;
      });
    },
    [isAnimating, applyPosition, computeActive]
  );

  // Init
  useEffect(() => {
    applyPosition(CARD_DATA.length, false);
    setActiveIdx(CARD_DATA.length);
    // Entrance reveal
    const t = setTimeout(() => setReveal(true), 80);
    return () => clearTimeout(t);
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
        background: "#f6f4f1",
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
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            inset: "5% 18% 24%",
            background:
              "radial-gradient(circle at center, rgba(255,255,255,.72) 0%, rgba(255,255,255,.34) 26%, rgba(255,255,255,.05) 56%, rgba(255,255,255,0) 76%), radial-gradient(circle at center, rgba(59,130,246,.05) 0%, rgba(59,130,246,0) 55%)",
            borderRadius: 999,
            filter: "blur(28px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Rail shadow */}
        <div
          style={{
            position: "absolute",
            left: "1.5%",
            right: "1.5%",
            bottom: 50,
            height: 126,
            borderRadius: 999,
            background:
              "radial-gradient(ellipse at center, rgba(15,23,42,.22) 0%, rgba(15,23,42,.15) 28%, rgba(15,23,42,.08) 50%, rgba(15,23,42,.03) 70%, rgba(15,23,42,0) 100%)",
            filter: "blur(18px)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

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
            opacity: reveal ? 1 : 0,
            transition: "opacity 600ms ease 100ms",
          }}
        >
          {allCards.map((card, idx) => (
            <div
              key={idx}
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
              {/* Art — full vibrancy, no colour overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url('${card.art}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
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
                  padding: "26px 26px 2px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  color: "#ffffff",
                  textShadow: "0 2px 16px rgba(0,0,0,.28)",
                }}
              >
                {/* Top label */}
                <div
                  style={{
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

                {/* Bottom text */}
                <div style={{ width: "100%", position: "relative", zIndex: 1, textAlign: card.bottomAlign ?? "left" }}>
                  {/* Bottom gradient */}
                  <div
                    style={{
                      position: "absolute",
                      left: -26,
                      right: -26,
                      top: -24,
                      bottom: -24,
                      background:
                        "linear-gradient(180deg, rgba(10,12,18,0) 0%, rgba(10,12,18,.12) 16%, rgba(10,12,18,.56) 56%, rgba(10,12,18,.82) 100%)",
                      zIndex: -1,
                      pointerEvents: "none",
                    }}
                  />
                  <h3
                    style={{
                      margin: "0 0 10px",
                      fontSize: 21,
                      lineHeight: 1,
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                      textTransform: "uppercase",
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

                  {/* CTA button — appears on hover */}
                  <div
                    style={{
                      marginTop: 14,
                      opacity: hoveredIdx === idx ? 1 : 0,
                      transform:
                        hoveredIdx === idx
                          ? "translateY(0)"
                          : "translateY(6px)",
                      transition:
                        "opacity 240ms ease, transform 240ms ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: card.accent,
                      }}
                    >
                      Explore template
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      style={{ marginTop: 1 }}
                    >
                      <path
                        d="M2 7h10M8 3l4 4-4 4"
                        stroke={card.accent}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
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
          ))}
        </div>

        {/* Viewport fade edges */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 6,
            background:
              "linear-gradient(90deg, #f6f4f1 0%, rgba(246,244,241,0) 10%, rgba(246,244,241,0) 90%, #f6f4f1 100%)",
          }}
        />

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
