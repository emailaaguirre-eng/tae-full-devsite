export const dynamic = "force-dynamic";

import Hero from "@/components/Hero";
import ProductCategories from "@/components/ProductCategories";
import {
  EveryProductIncludesArtKeySection,
  WhatIsTheArtfulExperienceSection,
} from "@/components/WhatWeAre";
import HowItWorks from "@/components/HowItWorks";
import FeaturedArtist from "@/components/FeaturedArtist";
import CollectorsSection from "@/components/CollectorsSection";
import Testimonials from "@/components/Testimonials";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Testimonials />
      <HowItWorks />
      <WhatIsTheArtfulExperienceSection />
      <ProductCategories />
      <EveryProductIncludesArtKeySection />
      <FeaturedArtist />
      <CollectorsSection />
    </>
  );
}
