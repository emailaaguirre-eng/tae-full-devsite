import Hero from "@/components/Hero";
import WhatWeAre from "@/components/WhatWeAre";
import VideoSection from "@/components/VideoSection";
import GiftIdeas from "@/components/GiftIdeas";
import FeaturedArtist from "@/components/FeaturedArtist";
import CoCreators from "@/components/CoCreators";
import ProductCategories from "@/components/ProductCategories";
import FeaturedProducts from "@/components/FeaturedProducts";
import CollectorsSection from "@/components/CollectorsSection";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

// Force dynamic rendering to prevent build-time static generation issues
export const dynamic = 'force-dynamic';

export default function Home() {
  // Updated: Section backgrounds now alternate between #ecece9 and #ffffff
  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      <Hero />
      <Testimonials />
      <WhatWeAre />
      <VideoSection />
      <GiftIdeas />
      <FeaturedArtist />
      <CoCreators simplified={true} />
      <FeaturedProducts />
      <CollectorsSection />
      <Contact />
      <Footer />
    </main>
  );
}
