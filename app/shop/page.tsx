"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ShopPage() {
  const router = useRouter();
  const cardsHero =
    "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/tAE_Holiday_Hero.png";

  const handleProductSelect = (type: string) => {
    if (type === "ideas") {
      // For Ideas, redirect to gallery for inspiration
      router.push("/gallery");
      return;
    }
    // Navigate to customize page with product type
    router.push(`/customize?product_type=${type}`);
  };

  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero banner */}
          <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl mb-12 bg-white p-2 sm:p-3">
            <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50">
              <img
                src={cardsHero}
                alt="Shop hero"
                className="w-full h-auto object-contain max-h-[400px]"
              />
            </div>
          </div>

          {/* Product Selection Grid */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair text-center">
                Choose Your Product
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Cards */}
                <button
                  onClick={() => handleProductSelect("card")}
                  className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all text-left hover:shadow-lg"
                >
                  <div className="text-5xl mb-4">💌</div>
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Cards</h3>
                  <p className="text-brand-dark mb-3">Everyday greeting cards for notes and moments</p>
                  <div className="text-xs text-brand-medium space-y-1">
                    <p>• Birthday card</p>
                    <p>• Thank you card</p>
                    <p>• Holiday greeting card</p>
                    <p>• Sympathy card</p>
                    <p>• Thinking of you card</p>
                    <p>• Congratulations card</p>
                  </div>
                </button>

                {/* Postcards */}
                <button
                  onClick={() => handleProductSelect("postcard")}
                  className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all text-left hover:shadow-lg"
                >
                  <div className="text-5xl mb-4">📮</div>
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Postcards</h3>
                  <p className="text-brand-dark mb-3">Mail-ready postcards with a writable back</p>
                  <div className="text-xs text-brand-medium space-y-1">
                    <p>• Holiday postcard</p>
                    <p>• Thank you postcard</p>
                    <p>• Vacation/travel postcard</p>
                    <p>• New home &quot;We moved&quot; postcard</p>
                    <p>• Photo collage postcard</p>
                    <p>• Promo postcard (small mailer)</p>
                  </div>
                </button>

                {/* Invitations */}
                <button
                  onClick={() => handleProductSelect("invitation")}
                  className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all text-left hover:shadow-lg"
                >
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Invitations</h3>
                  <p className="text-brand-dark mb-3">Event invitations designed to gather your people</p>
                  <div className="text-xs text-brand-medium space-y-1">
                    <p>• Wedding invitation</p>
                    <p>• Birthday party invitation</p>
                    <p>• Baby shower invitation</p>
                    <p>• Graduation party invitation</p>
                    <p>• Corporate event invitation</p>
                    <p>• Holiday party invitation</p>
                  </div>
                </button>

                {/* Announcements */}
                <button
                  onClick={() => handleProductSelect("announcement")}
                  className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all text-left hover:shadow-lg"
                >
                  <div className="text-5xl mb-4">📢</div>
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Announcements</h3>
                  <p className="text-brand-dark mb-3">Share life updates and milestone news beautifully</p>
                  <div className="text-xs text-brand-medium space-y-1">
                    <p>• Birth announcement</p>
                    <p>• Graduation announcement</p>
                    <p>• Engagement announcement</p>
                    <p>• Wedding announcement</p>
                    <p>• New home announcement</p>
                    <p>• Memorial/celebration of life announcement</p>
                  </div>
                </button>

                {/* Wall Art */}
                <button
                  onClick={() => handleProductSelect("print")}
                  className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all text-left hover:shadow-lg"
                >
                  <div className="text-5xl mb-4">🖼️</div>
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Wall Art</h3>
                  <p className="text-brand-dark mb-3">Premium prints for your walls, framed or unframed</p>
                  <div className="text-xs text-brand-medium space-y-1">
                    <p>• Photo print (wall-ready)</p>
                    <p>• Canvas print</p>
                    <p>• Framed art print</p>
                    <p>• Poster print</p>
                    <p>• Metal print</p>
                    <p>• Mounted print</p>
                  </div>
                </button>

                {/* Ideas */}
                <button
                  onClick={() => handleProductSelect("ideas")}
                  className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all text-left hover:shadow-lg"
                >
                  <div className="text-5xl mb-4">💡</div>
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Ideas</h3>
                  <p className="text-brand-dark mb-3">Get inspired with creative ideas and examples</p>
                  <div className="text-xs text-brand-medium space-y-1">
                    <p>• Browse design inspiration</p>
                    <p>• View example projects</p>
                    <p>• Explore creative possibilities</p>
                    <p>• Get design tips and ideas</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

