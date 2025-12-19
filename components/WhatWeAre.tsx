"use client";

import Image from "next/image";

export default function WhatWeAre() {
  return (
    <section className="py-20" style={{ backgroundColor: '#ecece9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4 font-playfair">
            What is The Artful Experience
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-6"></div>
          <div className="text-lg text-brand-darkest max-w-4xl mx-auto space-y-4 text-left">
            <p>
              <strong>The Artful Experience</strong> is more than a product—it&apos;s a gift that opens a world. Powered by <strong>ArtKey™ technology</strong>, every card and image becomes an interactive portal that grows, responds, and continues giving long after it&apos;s shared.
            </p>
            <p>
              Imagine sending a <strong>wedding invitation</strong> that doesn&apos;t just announce a date—it tells your story. With the ArtKey™, your invitation can include photos, a short video of how you met, or a curated gallery of favorite moments. Guests can RSVP directly through the ArtKey portal, sign the digital guestbook, share their well wishes, and upload photos from the celebration.
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
        <div className="mb-16">
          <div className="rounded-2xl shadow-lg p-8 md:p-12" style={{ backgroundColor: '#ecece9' }}>
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-brand-dark rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🔑</span>
              </div>
              <h3 className="text-3xl font-bold text-brand-darkest mb-4 font-playfair">
                Every Product Includes ArtKey Technology
              </h3>
              <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
                The ArtKey works seamlessly with today&apos;s smartphones, turning every piece into an interactive experience. We print ArtKeys on cards, invitations, and announcements, and discreetly embed them into commissioned artwork and art prints. The beauty of the piece remains untouched while the technology stays elegantly hidden.
              </p>
            </div>
            
            {/* ArtKey Features */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mt-10">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <span className="text-3xl">📸</span>
                </div>
                <p className="text-brand-darkest font-semibold">Share Pictures</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <span className="text-3xl">🎬</span>
                </div>
                <p className="text-brand-darkest font-semibold">Upload Videos</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <span className="text-3xl">🎵</span>
                </div>
                <p className="text-brand-darkest font-semibold">Music Playlists</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <span className="text-3xl">✍️</span>
                </div>
                <p className="text-brand-darkest font-semibold">Guestbook</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <span className="text-3xl">💭</span>
                </div>
                <p className="text-brand-darkest font-semibold">Share Interests</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works - Card Based */}
        <div className="mb-16">
          <div className="rounded-2xl shadow-lg p-8 md:p-12" style={{ backgroundColor: '#ecece9' }}>
            <div className="text-center mb-12">
              <h3 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4 font-playfair">
                How It Works
              </h3>
              <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
              <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
                Create personalized art with embedded memories in just a few simple steps
              </p>
            </div>

            {/* Step 1 - Two Options Side by Side */}
            <div className="mb-12">
              <div className="grid md:grid-cols-3 gap-4 items-stretch">
                {/* Option 1: Upload Your Image */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  <Image
                    src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/uploadyourimage.png"
                    alt="Design Editor - Upload Your Image"
                    fill
                    className="object-cover"
                  />
                </div>
                  <div className="p-6">
                    <div className="inline-block bg-brand-dark text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mb-4">
                      1
                    </div>
                    <h4 className="text-xl font-bold text-brand-darkest mb-2">
                      Upload Your Image
                    </h4>
                    <p className="text-brand-darkest">
                      Personalize your art with a message. Upload your own photo and transform it into a beautiful piece of art using our Design Editor.
                    </p>
                  </div>
                </div>

                {/* OR Divider - Centered */}
                <div className="flex items-center justify-center">
                  <div className="bg-brand-dark text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl shadow-lg">
                    OR
                  </div>
                </div>

                {/* Option 2: Choose from Gallery */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  <Image
                    src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/buyanexistingprint.jpg"
                    alt="Choose art from gallery"
                    fill
                    className="object-cover"
                    style={{ top: 0 }}
                  />
                </div>
                  <div className="p-6">
                    <div className="inline-block bg-brand-dark text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mb-4">
                      1
                    </div>
                    <h4 className="text-xl font-bold text-brand-darkest mb-2">
                      Choose Art from Our Online Gallery
                    </h4>
                    <p className="text-brand-darkest">
                      Explore our unique art collection. Select from curated pieces by internationally recognized artists.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Steps 2-4 */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 2 */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                <Image
                  src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/uploadmedia.png"
                  alt="Upload your media"
                  fill
                  className="object-cover"
                  style={{ top: 0 }}
                />
              </div>
                <div className="p-6">
                  <div className="inline-block bg-brand-dark text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mb-4">
                    2
                  </div>
                  <h4 className="text-xl font-bold text-brand-darkest mb-2">
                    Upload Your Media
                  </h4>
                  <p className="text-brand-darkest">
                    Images, videos, music, e-gift card, or a time-released message. Add all the personal touches that make your gift unique.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                <Image
                  src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/legacy-3.jpeg"
                  alt="Send the gift"
                  fill
                  className="object-cover"
                  style={{ top: 0 }}
                />
              </div>
                <div className="p-6">
                  <div className="inline-block bg-brand-dark text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mb-4">
                    3
                  </div>
                  <h4 className="text-xl font-bold text-brand-darkest mb-2">
                    Send the Gift
                  </h4>
                  <p className="text-brand-darkest">
                    We&apos;ll carefully package and ship your personalized art. Your gift will arrive ready to be displayed and enjoyed.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                <Image
                  src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/couch.jpg"
                  alt="Find the perfect place"
                  fill
                  className="object-cover"
                  style={{ top: 0 }}
                />
              </div>
                <div className="p-6">
                  <div className="inline-block bg-brand-dark text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mb-4">
                    4
                  </div>
                  <h4 className="text-xl font-bold text-brand-darkest mb-2">
                    Interact with the ArtKey
                  </h4>
                  <p className="text-brand-darkest">
                    Find the perfect place for your art, then bring it to life with the ArtKey. Hold. Connect. Experience. Place your phone near the signature and hold it for a moment. Your personalized content opens, and your experience comes to life.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <a
                href="/customize"
                className="inline-block bg-brand-medium text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-brand-dark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Start Creating Your Art
                <span className="block text-sm font-normal opacity-90">
                  Upload your image • Choose from our library • Select an artist gallery
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Key Takeaway */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-brand-dark to-brand-darkest rounded-2xl shadow-2xl p-8 md:p-12 text-white">
            <h3 className="text-3xl font-bold mb-4 font-playfair">
              Art + Technology = Living Memories
            </h3>
            <p className="text-xl max-w-2xl mx-auto opacity-90">
              We don&apos;t just sell art products—we create interactive experiences that bring your memories to life 
              through the power of ArtKey technology. Every piece tells a story, and every story is accessible with a simple scan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

