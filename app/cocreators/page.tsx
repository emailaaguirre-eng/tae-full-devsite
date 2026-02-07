import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CoCreators from "@/components/CoCreators";

export default function CoCreatorsPage() {
  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      <CoCreators />
      <Footer />
    </main>
  );
}
