export const dynamic = "force-dynamic";

import Hero from "@/components/Hero";
import ProductCategories from "@/components/ProductCategories";
import {
  ArtTechnologySection,
  EveryProductIncludesArtKeySection,
  WhatIsTheArtfulExperienceSection,
} from "@/components/WhatWeAre";
import HowItWorks from "@/components/HowItWorks";
import FeaturedArtist from "@/components/FeaturedArtist";
import CollectorsSection from "@/components/CollectorsSection";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Testimonials />
      <HowItWorks />
      <ArtTechnologySection />
      <WhatIsTheArtfulExperienceSection />
      <ProductCategories />
      <EveryProductIncludesArtKeySection />
      <FeaturedArtist />
      <CollectorsSection />
      <Contact />
    </>
  );
}
