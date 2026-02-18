"use client";

import { KeyIcon, CameraIcon, VideoIcon, MusicIcon, PenIcon, ThoughtIcon } from "@/components/CustomIcons";

export default function WhatWeAre() {
  const features = [
    { icon: CameraIcon, label: "Share Pictures" },
    { icon: VideoIcon, label: "Upload Videos" },
    { icon: MusicIcon, label: "Music Playlists" },
    { icon: PenIcon, label: "Guestbook" },
    { icon: ThoughtIcon, label: "Share Interests" },
  ];

  return (
    <section className="py-20" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Art + Technology Banner */}
        <div className="bg-gradient-to-br from-brand-dark to-brand-darkest shadow-2xl p-8 md:p-12 text-white text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-playfair">
            Art + Technology = Living Memories
          </h2>
          <p className="text-xl max-w-2xl mx-auto opacity-90">
            We don&apos;t just sell art products—we create interactive experiences that bring your memories to life
            through the power of ArtKey™ technology. Every piece tells a story, and every story is accessible with a simple scan.
          </p>
        </div>

        {/* What is The Artful Experience */}
        <div className="p-8 md:p-12 mb-16" style={{ backgroundColor: '#ecece9' }}>
          <h3 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4 font-playfair text-center">
            What is The Artful Experience
          </h3>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-6"></div>
          <div className="text-lg text-brand-darkest max-w-4xl mx-auto space-y-4 text-left">
            <p>
              <strong>The Artful Experience</strong> is more than a product—it&apos;s a gift that opens a world. Powered by <strong>ArtKey™ technology</strong>, every card and image becomes an interactive portal that grows, responds, and continues giving long after it&apos;s shared.
            </p>
            <p>
              Imagine sending a <strong>wedding invitation</strong> that doesn&apos;t just announce a date—it tells your story. With the ArtKey™, your invitation can include photos, a short video of how you met, or a curated gallery of favorite moments. Guests can RSVP directly through the ArtKey™ portal, sign the digital guestbook, share their well wishes, and upload photos from the celebration.
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

        {/* ArtKey Technology */}
        <div className="p-8 md:p-12" style={{ backgroundColor: '#ded8d3' }}>
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-brand-dark rounded-full flex items-center justify-center mx-auto mb-6">
              <KeyIcon size={48} color="white" strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-bold text-brand-darkest mb-4 font-playfair">
              Every Product Includes ArtKey™ Technology
            </h3>
            <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
              The ArtKey™ works seamlessly with today&apos;s smartphones, turning every piece into an interactive experience. We print ArtKeys™ on cards, invitations, and announcements, and discreetly embed them into commissioned artwork and art prints. The beauty of the piece remains untouched while the technology stays elegantly hidden.
            </p>
          </div>

          {/* ArtKey Features */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-10">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div key={feature.label} className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm bg-white">
                    <IconComponent size={28} color="#918c86" strokeWidth={1.5} />
                  </div>
                  <p className="text-brand-darkest font-semibold">{feature.label}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
