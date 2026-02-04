import AboutUs from "@/components/AboutUs";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      <AboutUs />
      <Footer />
    </main>
  );
}
