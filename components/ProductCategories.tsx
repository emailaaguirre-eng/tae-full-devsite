"use client";

import Link from "next/link";

export default function ProductCategories() {
  const categories = [
    {
      title: "Shop — Customize Your Own",
      description:
        "Upload your own image, place your ArtKey template, and design a personal QR-powered portal. Greeting cards, prints, canvas, and more.",
      image: "📤",
      items: [
        "Upload your photo or artwork",
        "Place the ArtKey template with QR target",
        "Design your ArtKey portal (links, video, guestbook)",
        "Printed & shipped by Printful",
      ],
      color: "from-brand-light to-brand-medium",
      href: "/shop",
      cta: "Browse Products",
    },
    {
      title: "theAE Gallery",
      description:
        "Curated works from internationally recognized artists — ready to purchase. Non-customizable, with optional ArtKey portal.",
      image: "🖼️",
      items: [
        "Artist narratives and inspiration included",
        "Gallery-quality prints and paintings",
        "Optional ArtKey portal linked by admin",
        "Ready-to-gift, no design needed",
      ],
      color: "from-brand-light to-brand-medium",
      href: "/gallery",
      cta: "Explore Gallery",
    },
    {
      title: "CoCreators",
      description:
        "Unique collaborations between The Artful Experience and creative partners. Limited-edition products with a story.",
      image: "🤝",
      items: [
        "Exclusive collaboration products",
        "Limited-edition runs",
        "Artist + brand storytelling built in",
        "Non-customizable, ready to purchase",
      ],
      color: "from-brand-medium to-brand-dark",
      href: "/cocreators",
      cta: "Meet CoCreators",
    },
  ];

  return (
    <section
      id="products"
      className="py-20"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            Three Ways to Shop
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
          <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
            Create something personal, discover curated art, or explore unique
            collaborations — each with an optional digital ArtKey experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden group"
            >
              <div
                className={`bg-gradient-to-br ${category.color} p-8 text-center`}
              >
                <div className="text-6xl mb-4">{category.image}</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {category.title}
                </h3>
              </div>
              <div className="p-6">
                <p className="text-brand-darkest mb-4">
                  {category.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {category.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-brand-darkest flex items-center gap-2"
                    >
                      <span className="text-brand-medium">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={category.href}
                  className="block w-full text-center bg-brand-medium text-white py-3 rounded-full font-semibold hover:bg-brand-dark transition-colors"
                >
                  {category.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-block bg-white p-8 rounded-2xl shadow-lg">
            <p className="text-brand-darkest text-lg mb-4">
              Ready to begin? Upload your image or browse the gallery to start
              crafting your living artwork.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-brand-dark text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-darkest transition-colors"
            >
              Start Creating
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

