import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Creator, PhoneButton } from "@/data/creators";
import { PhoneModal } from "./PhoneModal";
import PortalButtonList from "@/artkey-portal/PortalButtonList";

interface Props {
  creator: Creator;
  isActive: boolean;
}

function SponsorLogo({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const fallback = (
    <span
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "#000000",
      }}
    >
      {name}
    </span>
  );
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        style={{
          maxHeight: "36px",
          maxWidth: "160px",
          objectFit: "contain",
          filter: "grayscale(100%)",
        }}
        onError={(e) => {
          const img = e.currentTarget;
          img.style.display = "none";
          const parent = img.parentElement;
          if (parent) {
            const span = document.createElement("span");
            span.textContent = name;
            span.style.cssText =
              "font-family:Inter,sans-serif;font-size:0.7rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#000000";
            parent.appendChild(span);
          }
        }}
      />
    );
  }
  return fallback;
}

function PlaceholderSponsor({ name }: { name: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "40px",
        fontFamily: "Inter, sans-serif",
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "#918c86",
      }}
    >
      {name}
    </div>
  );
}

function PhoneMockup({
  creator,
  onButtonClick,
}: {
  creator: Creator;
  onButtonClick: (btn: PhoneButton) => void;
}) {
  return (
    <div
      style={{
        width: "200px",
        height: "400px",
        background: "#1A1A1A",
        borderRadius: "44px",
        padding: "8px",
        border: "2px solid #333",
        boxShadow: "0 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)",
        marginTop: "16px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "38px",
          height: "100%",
          padding: "18px 10px 10px",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "18px",
            background: "#1A1A1A",
            borderRadius: "12px",
            margin: "0 auto 8px",
            flexShrink: 0,
          }}
        />
        <h4
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "17px",
            fontWeight: 700,
            color: "#000000",
            margin: "0 0 8px",
            textAlign: "center",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          ArtKey™ Portal
        </h4>
        <PortalButtonList
          mode="live"
          buttons={creator.phoneButtons}
          onButtonClick={onButtonClick}
        />
      </div>
    </div>
  );
}

const bentoCardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function CoCreatorsSection({ creator, isActive }: Props) {
  const [activeModal, setActiveModal] = useState<PhoneButton | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <>
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            key={creator.id}
            ref={sectionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ded8d3",
                borderRadius: "24px",
                boxShadow: "0 12px 32px rgba(20,20,20,0.08)",
                padding: "32px",
                marginBottom: "32px",
              }}
            >
              {/* Bio Layout */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "320px 1fr",
                  gap: "32px",
                  marginBottom: "40px",
                  alignItems: "center",
                }}
                className="bio-layout-grid"
              >
                <div
                  style={{
                    aspectRatio: "4/5",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid #ded8d3",
                    background: "#ecece9",
                  }}
                >
                  {creator.photo ? (
                    <img
                      src={creator.photo}
                      alt={creator.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(180deg, #ded8d3 0%, #ecece9 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "72px",
                          height: "72px",
                          borderRadius: "50%",
                          background: "#918c86",
                          opacity: 0.3,
                        }}
                      />
                      <div
                        style={{
                          width: "120px",
                          height: "8px",
                          background: "#918c86",
                          opacity: 0.15,
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <span className="eyebrow">{creator.eyebrow}</span>
                  <h2
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "clamp(2rem, 3vw, 2.5rem)",
                      fontWeight: 500,
                      marginBottom: "8px",
                      color: "#000000",
                    }}
                  >
                    {creator.name}
                  </h2>
                  <p
                    style={{
                      color: "#918c86",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      marginBottom: "24px",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {creator.role}
                  </p>
                  <div
                    style={{
                      color: "#918c86",
                      fontSize: "1.05rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      fontFamily: "Inter, sans-serif",
                      lineHeight: 1.6,
                    }}
                  >
                    {creator.bio.map((paragraph, idx) => {
                      if (idx === 0 && creator.bioBold) {
                        const bold = creator.bioBold;
                        const parts = paragraph.split(bold);
                        return (
                          <p key={idx}>
                            {parts[0]}
                            <strong style={{ color: "#475569", fontWeight: 700 }}>{bold}</strong>
                            {parts[1]}
                          </p>
                        );
                      }
                      return <p key={idx}>{paragraph}</p>;
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Bento Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "20px",
                  background: "#f3f3f3",
                  padding: "24px",
                  borderRadius: "16px",
                  border: "1px solid #ded8d3",
                }}
                className="bento-grid-container"
              >
                {/* Card 1: Living Poster */}
                <motion.div
                  custom={0}
                  variants={bentoCardVariants}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #ded8d3",
                    borderRadius: "12px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 4px 12px rgba(20,20,20,0.04)",
                    cursor: "default",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "1.25rem",
                      fontWeight: 500,
                      marginBottom: "8px",
                      color: "#000000",
                    }}
                  >
                    {creator.posterTitle}
                  </h3>
                  <p
                    style={{
                      color: "#918c86",
                      fontSize: "0.9rem",
                      marginBottom: "16px",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {creator.posterSubtitle}
                  </p>
                  <div
                    style={{
                      flexGrow: 1,
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid #ded8d3",
                      marginTop: "auto",
                      background: "#ecece9",
                      minHeight: "200px",
                    }}
                  >
                    {creator.posterImage ? (
                      <img
                        src={creator.posterImage}
                        alt={creator.posterTitle}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          minHeight: "200px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "0.75rem",
                            color: "#918c86",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          Poster Coming Soon
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Card 2: Phone ArtKey */}
                <motion.div
                  custom={1}
                  variants={bentoCardVariants}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  style={{
                    background: "linear-gradient(180deg, #f3f3f3, #ecece9)",
                    border: "1px solid #ded8d3",
                    borderRadius: "12px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    boxShadow: "0 4px 12px rgba(20,20,20,0.04)",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "1.25rem",
                      fontWeight: 500,
                      marginBottom: "8px",
                      color: "#000000",
                    }}
                  >
                    {creator.artKeyTitle}
                  </h3>
                  <p
                    style={{
                      color: "#918c86",
                      fontSize: "0.9rem",
                      marginBottom: "4px",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Tap a button to unlock the experience.
                  </p>
                  <PhoneMockup
                    creator={creator}
                    onButtonClick={(btn) => setActiveModal(btn)}
                  />
                </motion.div>

                {/* Card 3: Featured Media + Sponsors */}
                <motion.div
                  custom={2}
                  variants={bentoCardVariants}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #ded8d3",
                    borderRadius: "12px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 4px 12px rgba(20,20,20,0.04)",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "1.25rem",
                      fontWeight: 500,
                      marginBottom: "8px",
                      color: "#000000",
                    }}
                  >
                    Featured Media
                  </h3>
                  <p
                    style={{
                      color: "#918c86",
                      fontSize: "0.9rem",
                      marginBottom: "16px",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Watch {creator.name.split(" ")[0]} in action.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      flexGrow: 1,
                    }}
                  >
                    {creator.featuredMedia.map((media, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          background: "#ded8d3",
                          borderRadius: "8px",
                          height: "90px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8rem",
                          color: "#918c86",
                          fontWeight: 600,
                          fontFamily: "Inter, sans-serif",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        ▶ {media.label}
                      </motion.div>
                    ))}
                  </div>

                  <div style={{ marginTop: "24px" }}>
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: "1rem",
                        fontWeight: 500,
                        marginBottom: "8px",
                        color: "#000000",
                      }}
                    >
                      Supported By
                    </h3>
                    <div
                      style={{
                        height: "64px",
                        border: creator.sponsor.placeholder
                          ? "1px dashed #ded8d3"
                          : "1px solid #ded8d3",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "12px",
                        marginTop: "8px",
                      }}
                    >
                      {creator.sponsor.placeholder ? (
                        <PlaceholderSponsor name={creator.sponsor.name} />
                      ) : (
                        <SponsorLogo name={creator.sponsor.name} logoUrl={creator.sponsor.logoUrl} />
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* CTA Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              style={{
                background: "linear-gradient(135deg, #000000, #1a1a2e)",
                color: "#fff",
                borderRadius: "24px",
                padding: "40px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 12px 32px rgba(20,20,20,0.12)",
                flexWrap: "wrap",
                gap: "24px",
              }}
              className="cta-box"
            >
              <div>
                <h2
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                    fontWeight: 500,
                    marginBottom: "8px",
                    color: "#ffffff",
                  }}
                >
                  {creator.ctaHeading}
                </h2>
                <p
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "1.05rem",
                    fontFamily: "Inter, sans-serif",
                    maxWidth: "480px",
                  }}
                >
                  {creator.ctaSubtext}
                </p>
              </div>
              <motion.a
                href="#"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: "#fff",
                  color: "#141414",
                  textDecoration: "none",
                  padding: "16px 32px",
                  borderRadius: "9999px",
                  fontWeight: 600,
                  fontSize: "1rem",
                  fontFamily: "Inter, sans-serif",
                  display: "inline-block",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(255,255,255,0.15)",
                }}
              >
                {creator.ctaLabel}
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone Button Modal */}
      <PhoneModal
        open={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={activeModal?.modalTitle ?? ""}
        type={activeModal?.type ?? "gallery"}
      />

      <style>{`
        @media (max-width: 900px) {
          .bento-grid-container {
            grid-template-columns: 1fr !important;
          }
          .bio-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .cta-box {
            flex-direction: column !important;
            text-align: center !important;
          }
        }
      `}</style>
    </>
  );
}
