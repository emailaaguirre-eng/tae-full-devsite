import Hero from "@/components/Hero";
import ProductCategories from "@/components/ProductCategories";
import FeaturedProducts from "@/components/FeaturedProducts";
import HowItWorks from "@/components/HowItWorks";
import Gallery from "@/components/Gallery";
import CoCreators from "@/components/CoCreators";
import AboutUs from "@/components/AboutUs";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProductCategories />
      <FeaturedProducts title="Shop — Customize Your Own" />
      <Gallery />
      <CoCreators simplified />
      <HowItWorks />
      <AboutUs />
      <Testimonials />
      <Contact />
    </>
  );
}
