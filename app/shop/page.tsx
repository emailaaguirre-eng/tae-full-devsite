import CardsSection from "@/components/CardsSection";
import PrintsSection from "@/components/PrintsSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      <CardsSection />
      <PrintsSection />
      <FeaturedProducts title="Products" />
      <Footer />
    </main>
  );
}
