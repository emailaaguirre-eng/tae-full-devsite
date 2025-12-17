import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";

export default function ContactPage() {
  const contactHero =
    "https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/poolside-with-laptop.png";

  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />

      {/* Hero image */}
      <section className="pt-16 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-brand-light/40">
            <img
              src={contactHero}
              alt="Person working by a pool with a laptop"
              className="w-full h-[360px] md:h-[480px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="pb-20">
        <Contact />
      </section>

      <Footer />
    </main>
  );
}
