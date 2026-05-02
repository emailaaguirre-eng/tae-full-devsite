"use client";

import {
  ArtKeyTrademark,
  ArtKeysTrademark,
} from "@/components/RefinedTm";

export function ArtTechnologySection() {
  const artKeyReveals = [
    "Videos",
    "Music and playlists",
    "Photos and memories",
    "Personal messages",
    "Gift cards and surprises",
    "Social media links",
    "Favorite places and recommendations",
    "Updates added over time",
  ];

  return (
    <section className="py-20" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-brand-dark to-brand-darkest shadow-2xl p-8 md:p-12 text-white mb-16">
          <h2 className="text-3xl md:text-5xl font-normal mb-4 font-playfair text-center">
            Turn a Meaningful Image Into a Living Experience
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto opacity-90 text-center">
            Each piece includes an <ArtKeyTrademark /> that unlocks videos,
            music, messages, photos, and surprises when scanned.
          </p>
          <p className="text-base md:text-lg mt-6 mb-4 max-w-3xl mx-auto opacity-90 text-center">
            When scanned, the <ArtKeyTrademark /> can reveal:
          </p>
          <ul className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-left">
            {artKeyReveals.map((item) => (
              <li key={item} className="text-sm md:text-base opacity-95 flex items-start">
                <span className="mr-2 mt-[2px]">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function WhatIsTheArtfulExperienceSection() {
  return (
    <section className="py-20" style={{ backgroundColor: "#ecece9" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 md:p-12" style={{ backgroundColor: "#ffffff" }}>
          <h3 className="text-3xl md:text-4xl font-normal text-brand-dark mb-4 font-playfair text-center">
            What is The Artful Experience
          </h3>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-6"></div>
          <div className="text-lg text-brand-darkest max-w-4xl mx-auto space-y-4 text-left">
            <p>
              <strong>The Artful Experience</strong> is more than a product—it&apos;s a gift that opens a world. Powered by{" "}
              <strong>
                <ArtKeyTrademark /> technology
              </strong>
              , every card and image becomes an interactive portal that grows, responds, and continues giving long after it&apos;s shared.
            </p>
            <p>
              Imagine sending a <strong>wedding invitation</strong> that doesn&apos;t just announce a date—it tells your story. With the{" "}
              <ArtKeyTrademark />, your invitation can include photos, a short video of how you met, or a curated gallery of favorite moments. Guests can RSVP directly through the <ArtKeyTrademark /> portal, sign the digital guestbook, share their well wishes, and upload photos from the celebration.
            </p>
            <p>
              The same applies to holiday cards, baby reveals, graduation announcements, promotions, birthday cards, or any image or painting you would like to gift.
            </p>
            <p>
              What begins as an announcement, holiday card, or image becomes a living archive —created by you and enriched by everyone you love.
            </p>
            <p>
              There is more! Whether you&apos;re gifting a single image, a curated gallery, a heartfelt message, or time-released surprises, The Artful Experience transforms memories into something personal, interactive, and unforgettable. Perfect for loved ones, clients, colleagues—anyone you want to honor with a gift that truly feels alive.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EveryProductIncludesArtKeySection() {
  return (
    <section className="py-20" style={{ backgroundColor: "#000000" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 md:p-12" style={{ backgroundColor: "#000000" }}>
          <div className="text-center mb-8">
            <h3 className="text-3xl font-normal text-white mb-4 font-playfair">
              Every Product Includes <ArtKeyTrademark /> Technology
            </h3>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              The <ArtKeyTrademark /> works seamlessly with today&apos;s smartphones, turning every piece into an interactive experience. We print <ArtKeysTrademark /> on cards, invitations, and announcements, and discreetly embed them into commissioned artwork and art prints. The beauty of the piece remains untouched while the technology stays elegantly hidden.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function WhatWeAre() {
  return (
    <>
      <ArtTechnologySection />
      <WhatIsTheArtfulExperienceSection />
      <EveryProductIncludesArtKeySection />
    </>
  );
}
