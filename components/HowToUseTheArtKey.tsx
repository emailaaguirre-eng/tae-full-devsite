import Link from "next/link";

const PORTAL_BUTTONS = [
  "Videos",
  "Photos",
  "Messages",
  "Music",
  "Community",
  "Memories",
] as const;

function ArtKeyPhonePreview() {
  return (
    <div
      className="mx-auto w-[min(100%,280px)] sm:w-[300px] shrink-0"
      role="img"
      aria-label="Illustration: ArtKey portal on a phone with Videos, Photos, Messages, Music, Community, and Memories buttons"
    >
      {/* Outer bezel */}
      <div className="rounded-[2.75rem] bg-black p-3 sm:p-3.5 shadow-2xl">
        <div className="rounded-[2.25rem] bg-white px-4 pt-5 pb-8 min-h-[520px] flex flex-col">
          {/* Notch */}
          <div className="flex justify-center mb-5">
            <div className="h-7 w-[5.5rem] rounded-full bg-black" />
          </div>
          <h2 className="text-center text-lg sm:text-xl font-normal font-playfair text-brand-dark mb-6">
            ArtKey™ Portal
          </h2>
          <div className="flex flex-col gap-2.5 flex-1">
            {PORTAL_BUTTONS.map((label) => (
              <div
                key={label}
                className="w-full rounded-full bg-black py-3 px-4 text-center text-sm font-medium text-white tracking-tight"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Restored marketing page for /how-to-use-the-artkey (formerly external WP).
 * Headlines match legacy copy; body aligns with site messaging.
 */
export default function HowToUseTheArtKey() {
  return (
    <div className="min-h-screen bg-white">
      <section
        className="py-16 md:py-24 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: "#f3f3f3" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal text-brand-dark font-playfair leading-tight mb-8">
            One Scan Changes Everything
          </h1>
          <p className="text-xl md:text-2xl text-brand-darkest font-light leading-relaxed">
            The most fun gift giving idea in the world.
          </p>
        </div>
      </section>

      {/* Photo placeholders + phone preview (match intended layout: images first, then device mock) */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-brand-light/40">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="aspect-[4/3] rounded-lg border-2 border-dashed border-brand-medium/50 bg-brand-lightest flex flex-col items-center justify-center text-center px-4"
              >
                <span className="text-sm font-medium text-brand-medium uppercase tracking-wide">
                  Image {n}
                </span>
                <span className="text-xs text-brand-medium/80 mt-1">
                  Photo placeholder
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-brand-medium mb-8">
            Preview: recipient&apos;s ArtKey™ portal on a phone
          </p>
          <div className="flex justify-center">
            <ArtKeyPhonePreview />
          </div>
        </div>
      </section>

      <section
        className="py-12 px-4 sm:px-6 lg:px-8 border-t border-brand-light"
        style={{ backgroundColor: "#ecece9" }}
      >
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/shop"
            className="inline-block bg-brand-dark text-white px-8 py-4 text-base font-medium hover:bg-brand-darkest transition-all duration-300 text-center w-full sm:w-auto"
          >
            Shop
          </Link>
          <Link
            href="/#how-it-works"
            className="inline-block bg-white text-brand-dark border-2 border-brand-dark px-8 py-4 text-base font-medium hover:bg-brand-lightest transition-all duration-300 text-center w-full sm:w-auto"
          >
            How it works
          </Link>
          <Link
            href="/"
            className="inline-block text-brand-darkest px-6 py-4 text-base font-medium hover:text-brand-medium transition-colors"
          >
            ← Home
          </Link>
        </div>
      </section>
    </div>
  );
}
