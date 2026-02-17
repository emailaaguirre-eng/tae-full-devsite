import Hero from "@/components/Hero";
import ProductCategories from "@/components/ProductCategories";
import FeaturedProducts from "@/components/FeaturedProducts";
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
      <FeaturedProducts title="Shop — Customize Your Own" />
      <FeaturedArtist />
      <CoCreators simplified />
      <CollectorsSection />
      <HowItWorks />
      <Contact />
    </>
  );
}
