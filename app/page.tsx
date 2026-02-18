import Hero from "@/components/Hero";
import ProductCategories from "@/components/ProductCategories";
import WhatWeAre from "@/components/WhatWeAre";
import HowItWorks from "@/components/HowItWorks";
import FeaturedArtist from "@/components/FeaturedArtist";
import CoCreators from "@/components/CoCreators";
import CollectorsSection from "@/components/CollectorsSection";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Testimonials />
      <ProductCategories />
      <section className="py-12" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-gradient-to-br from-brand-dark to-brand-darkest shadow-2xl p-8 md:p-12 text-white">
              <h3 className="text-3xl font-bold mb-4 font-playfair">
                Art + Technology = Living Memories
              </h3>
              <p className="text-xl max-w-2xl mx-auto opacity-90">
                We don&apos;t just sell art products—we create interactive experiences that bring your memories to life
                through the power of ArtKey™ technology. Every piece tells a story, and every story is accessible with a simple scan.
              </p>
            </div>
          </div>
        </div>
      </section>
      <WhatWeAre />
      <FeaturedArtist />
      <CoCreators simplified />
      <CollectorsSection />
      <HowItWorks />
      <Contact />
    </>
  );
}
