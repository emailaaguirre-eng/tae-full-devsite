import { getSiteMediaMap } from "@/lib/site-media";

const VIDEO_DEFAULT = "https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/Hero-PROMO-VIDEO.mp4";
const COLLAGE_DEFAULT = "https://dredev.theartfulexperience.com/wp-content/uploads/2025/10/collage.png";

export default async function AboutUs() {
  const media = await getSiteMediaMap();
  const aboutVideoUrl = media["about.video"]?.url || VIDEO_DEFAULT;
  const aboutFeatureImage = media["about.collage"]?.url || COLLAGE_DEFAULT;

  return (
    <section id="about" className="bg-white">
      {/* Hero video area */}
      <div className="relative w-full overflow-hidden">
        <div className="relative w-full aspect-[16/9] sm:aspect-[16/8] lg:aspect-[16/7]">
          <video
            src={aboutVideoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* About Us heading */}
      <div className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-normal text-brand-dark mb-4 font-playfair">
              About Us
            </h2>
            <div className="w-24 h-1 bg-brand-medium mx-auto"></div>
          </div>
        </div>
      </div>

      {/* About + feature image */}
      <div className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
              <img
                src={aboutFeatureImage}
                alt="Gallery interior with featured artwork"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="bg-brand-lightest rounded-2xl p-8 md:p-10 shadow-lg space-y-5 font-body text-brand-darkest">
              <p className="text-lg md:text-xl leading-relaxed">
                What happens when a globe-travelling entrepreneur sits down with an artist and lifestyle coach for a curious conversation?
              </p>
              <p className="text-2xl md:text-3xl font-normal font-playfair leading-snug">
                You get The Artful Experience.
              </p>
              <p className="text-lg leading-relaxed">
                A place where art, technology, and storytelling come together to turn meaningful images into living portals filled with videos, music, messages, memories, and moments that continue to grow over time.
              </p>
              <p className="text-lg leading-relaxed">
                Because in the end, life isn’t about things.
              </p>
              <p className="text-lg leading-relaxed">
                It’s about people, stories, and the legacy we leave behind.
              </p>
              <div className="grid sm:grid-cols-2 gap-8 pt-4 border-t border-brand-light">
                <div>
                  <p className="text-lg font-semibold font-playfair">Bryant</p>
                  <p className="text-base text-brand-darkest/90">Entrepreneur & explorer</p>
                </div>
                <div>
                  <p className="text-lg font-semibold font-playfair">Deanna</p>
                  <p className="text-base text-brand-darkest/90">Artist & storyteller</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

