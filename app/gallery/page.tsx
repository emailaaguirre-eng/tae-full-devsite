import Gallery from "@/components/Gallery";
import CommissionedArt from "@/components/CommissionedArt";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      <Gallery />
      <CommissionedArt />
      <Footer />
    </main>
  );
}

