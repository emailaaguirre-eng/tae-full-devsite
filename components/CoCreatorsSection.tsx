import { useState, useRef, type ReactNode } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Creator, PhoneButton } from "@/data/creators";
import { ArtKeyTrademark } from "@/components/RefinedTm";
import { PhoneModal } from "./PhoneModal";
import { GuestStylePhoneMockup } from "./GuestStylePhoneMockup";

export type CoCreatorsIntro = {
  kicker: string;
  headline: string;
};

interface Props {
  creator: Creator;
  isActive: boolean;
  /** Optional page intro (small caps kicker + serif headline), e.g. on /cocreators */
  intro?: CoCreatorsIntro;
  /** Inside the main white card, below the poster/phone row (e.g. home “Meet Our CoCreators”). */
  belowCardSlot?: ReactNode;
}

const bentoCardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function CoCreatorsSection({ creator, isActive, intro, belowCardSlot }: Props) {
  const [activeModal, setActiveModal] = useState<PhoneButton | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <>
      {intro ? (
        <div className="text-center mb-12 px-2">
          <p className="text-xs font-semibold text-brand-medium uppercase tracking-[0.18em] mb-3 font-body">
            {intro.kicker}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-normal text-brand-darkest font-playfair max-w-4xl mx-auto leading-snug">
            {intro.headline}
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mt-6" />
        </div>
      ) : null}

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
            <div className="bg-white border border-brand-light rounded-2xl shadow-lg p-6 md:p-8 lg:p-10">
              {/* Bio */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                className="grid grid-cols-1 md:grid-cols-[minmax(260px,320px)_1fr] gap-8 lg:gap-10 mb-10 md:mb-12 items-center"
              >
                <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-brand-light bg-brand-lightest mx-auto w-full max-w-[320px] md:max-w-none md:mx-0">
                  {creator.photo ? (
                    <img
                      src={creator.photo}
                      alt={creator.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-brand-light to-brand-lightest flex flex-col items-center justify-center gap-2">
                      <div className="w-[72px] h-[72px] rounded-full bg-brand-medium/30" />
                      <div className="w-[120px] h-2 bg-brand-medium/15 rounded" />
                    </div>
                  )}
                </div>

                <div className="text-left">
                  <p className="text-xs font-semibold text-brand-medium uppercase tracking-[0.14em] mb-3 font-body">
                    {creator.eyebrow}
                  </p>
                  <h2 className="font-playfair text-3xl md:text-4xl lg:text-[2.5rem] font-medium text-brand-darkest mb-2 leading-tight">
                    {creator.name}
                  </h2>
                  <p className="text-brand-medium text-sm md:text-[0.95rem] font-semibold mb-6 font-body">
                    {creator.role}
                  </p>
                  <div className="space-y-4 text-brand-medium text-base md:text-[1.05rem] font-body leading-relaxed">
                    {creator.bio.map((paragraph, idx) => {
                      if (idx === 0 && creator.bioBold) {
                        const bold = creator.bioBold;
                        const parts = paragraph.split(bold);
                        return (
                          <p key={idx}>
                            {parts[0]}
                            <strong className="text-brand-accent font-bold">{bold}</strong>
                            {parts[1]}
                          </p>
                        );
                      }
                      return <p key={idx}>{paragraph}</p>;
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Recessed strip: two white cards (Living Poster | Unlock + phone + CTA) */}
              <div className="rounded-2xl bg-brand-lightest border border-brand-light p-5 md:p-6 cocreators-dual-wrap">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 cocreators-dual-cards">
                  <motion.div
                    custom={0}
                    variants={bentoCardVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-white border border-brand-light rounded-xl p-6 flex flex-col shadow-sm"
                  >
                    <h3 className="font-playfair text-xl md:text-2xl font-medium text-brand-darkest mb-2">
                      {creator.posterTitle}
                    </h3>
                    <p className="text-brand-medium text-sm md:text-[0.9rem] mb-4 font-body leading-relaxed">
                      {creator.posterSubtitle}
                    </p>
                    <div className="flex-1 min-h-[220px] md:min-h-[260px] rounded-xl overflow-hidden border border-brand-light bg-brand-lightest mt-auto">
                      {creator.posterImage ? (
                        <img
                          src={creator.posterImage}
                          alt={creator.posterTitle}
                          className="w-full h-full object-cover min-h-[220px]"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[220px] flex items-center justify-center text-brand-medium text-xs font-semibold uppercase tracking-widest font-body">
                          Poster Coming Soon
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    custom={1}
                    variants={bentoCardVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    className="bg-white border border-brand-light rounded-xl p-6 flex flex-col items-center text-center shadow-sm min-h-[480px] md:min-h-0"
                  >
                    <h3 className="font-playfair text-xl md:text-2xl font-medium text-brand-darkest mb-2">
                      {creator.ctaHeading}
                    </h3>
                    <p className="text-brand-medium text-sm md:text-[0.9rem] mb-4 max-w-md mx-auto font-body leading-relaxed">
                      {creator.ctaSubtext}
                    </p>
                    <div className="flex-1 flex flex-col items-center justify-center w-full py-2 min-h-0">
                      <GuestStylePhoneMockup
                        creator={creator}
                        compact
                        title={
                          <>
                            <ArtKeyTrademark /> Portal
                          </>
                        }
                        onButtonClick={(btn) => setActiveModal(btn)}
                      />
                    </div>
                    <Link
                      href={creator.ctaHref ?? "#"}
                      className="mt-6 w-full max-w-sm mx-auto inline-flex items-center justify-center rounded-full bg-brand-dark text-white py-3.5 px-6 text-sm md:text-base font-semibold font-body shadow-md hover:bg-brand-darkest transition-colors"
                    >
                      {creator.ctaLabel}
                    </Link>
                  </motion.div>
                </div>
              </div>
              {belowCardSlot ? (
                <div className="mt-2 pt-8 border-t border-brand-light">{belowCardSlot}</div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PhoneModal
        open={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={activeModal?.modalTitle ?? ""}
        type={activeModal?.type ?? "gallery"}
      />

    </>
  );
}
