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
        "Professionally printed & shipped",
      ],
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
        "Ready-to-gift, no design needed",
      ],
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
      ],
      href: "/cocreators",
      cta: "Meet CoCreators",
    },
  ];

  return (
    <section
      id="products"
      className="py-20"
      style={{ backgroundColor: "#ecece9" }}
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {categories.map((category, index) => (
            <div
              key={index}
              className="bg-white shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden group flex flex-col"
            >
              <div className="bg-gradient-to-br from-brand-light to-brand-medium p-8 text-center">
                <div className="text-5xl mb-3">{category.image}</div>
                <h3 className="text-xl font-bold text-white">
                  {category.title}
                </h3>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <p className="text-brand-darkest mb-4 text-sm leading-relaxed">
                  {category.description}
                </p>
                <ul className="space-y-2 mb-6 flex-1">
                  {category.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-brand-darkest flex items-start gap-2"
                    >
                      <span className="text-brand-medium mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={category.href}
                  className="block w-full text-center bg-brand-dark text-white py-3 font-semibold hover:bg-brand-darkest transition-colors"
                >
                  {category.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

