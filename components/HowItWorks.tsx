import Image from "next/image";

/** Canonical homepage “How It Works” artwork. Bump `?v=` on the URL if you replace this file in place. */
const HOW_IT_WORKS_IMAGE =
  "https://theartfulexperience.com/wp-content/uploads/2026/04/temphowitworks-2.png";

/** Intrinsic PNG size (from file headers). */
const IMAGE_WIDTH = 1917;
const IMAGE_HEIGHT = 720;

const STEPS = [
  {
    n: "1",
    title: "CHOOSE THE ART",
    body: "Upload or select the image that holds your story.",
  },
  {
    n: "2",
    title: "BUILD YOUR PORTAL",
    body: "Add videos, photos, playlists, and messages.",
  },
  {
    n: "3",
    title: "TAP TO ENTER",
    body: "Tap with your phone and step inside.",
  },
] as const;

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-4xl md:text-5xl font-normal font-playfair text-brand-dark mb-4">
            How It Works
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4" aria-hidden />
          <p className="text-sm sm:text-base md:text-lg text-brand-medium max-w-3xl mx-auto font-normal tracking-[0.2em] uppercase">
            TURN A MEANINGFUL IMAGE INTO A LIVING EXPERIENCE
          </p>
        </div>

        {/* Steps + artwork: small gap only — negative margin on the figure was overlapping and clipping the copy */}
        <div className="max-w-6xl mx-auto flex flex-col gap-2 md:gap-3">
          {/* Horizontal inset matches artwork margins in temphowitworks-2.png so each step lines up with its panel */}
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-3 lg:gap-5 list-none p-0 m-0 relative z-10 md:px-7 lg:px-11 xl:px-14">
            {STEPS.map((step, idx) => (
              <li key={step.n}>
                <div
                  className={`flex items-start gap-3 ${
                    idx === 0
                      ? "md:pl-1 lg:pl-2"
                      : idx === 1
                        ? "md:pl-5 lg:pl-8"
                        : "md:pl-6 lg:pl-10"
                  }`}
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-full border-2 border-brand-dark flex items-center justify-center text-sm font-semibold text-brand-dark"
                    aria-hidden
                  >
                    {step.n}
                  </div>
                  <div className="min-w-0">
                    <span className="sr-only">Step {step.n}: </span>
                    <h4 className="text-xl font-normal text-brand-darkest uppercase tracking-wide mb-1">
                      {step.title}
                    </h4>
                    <p className="text-brand-darkest text-sm sm:text-base leading-snug">{step.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Main artwork — exact composition from temphowitworks.png */}
          <figure className="w-full m-0 shrink-0">
            <Image
              src={HOW_IT_WORKS_IMAGE}
              alt=""
              width={IMAGE_WIDTH}
              height={IMAGE_HEIGHT}
              className="w-full h-auto block"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1152px"
              priority
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
