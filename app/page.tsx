export const dynamic = "force-dynamic";

import Hero from "@/components/Hero";
import { HomeArtKeyCarouselSection } from "@/components/home-artkey-carousel/HomeArtKeyCarouselSection";
import ProductCategories from "@/components/ProductCategories";
import {
  EveryProductIncludesArtKeySection,
  WhatIsTheArtfulExperienceSection,
} from "@/components/WhatWeAre";
import { HowItWorksScene } from "@/components/how-it-works-v1/HowItWorksScene";
import FeaturedArtist from "@/components/FeaturedArtist";
import CollectorsSection from "@/components/CollectorsSection";
import Testimonials from "@/components/Testimonials";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HomeArtKeyCarouselSection />
      <Testimonials />
      <section id="how-it-works">
        <HowItWorksScene />
      </section>
      <WhatIsTheArtfulExperienceSection />
      <ProductCategories />
      <EveryProductIncludesArtKeySection />
      <FeaturedArtist />
      <CollectorsSection />
    </>
  );
}
