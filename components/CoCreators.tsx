"use client";

import Image from "next/image";
import Link from "next/link";
import cocreatorsData from "@/content/cocreators.json";
import FeaturedCoCreator from "@/components/FeaturedCoCreator";

interface CoCreator {
  name: string;
  title: string;
  image: string;
  bio: string;
  description?: string;
  slug: string;
}

export default function CoCreators() {
  const { title, subtitle, cocreators, comingSoon, cta } = cocreatorsData;
  
  // Type assertion for cocreators
  const typedCocreators = cocreators as CoCreator[];

  return (
    <>
      {/* Featured CoCreator Section */}
      <FeaturedCoCreator />

      {/* All CoCreators Grid Section */}
      <section id="cocreators" className="py-20" style={{ backgroundColor: '#ecece9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4 font-playfair">
              {title}
            </h2>
            <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
            <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
              {subtitle}
            </p>
          </div>

          {/* CoCreators Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {typedCocreators.map((cocreator) => (
              <div
                key={cocreator.slug}
                id={cocreator.slug}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
              >
                <div className="relative h-64 w-full bg-gradient-to-br from-brand-light to-brand-medium overflow-hidden">
                  <Image
                    src={cocreator.image}
                    alt={cocreator.name}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                    style={{ objectPosition: 'top center' }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-brand-darkest mb-2 font-playfair">
                    {cocreator.name}
                  </h3>
                  <div className="mb-3">
                    <span className="text-xs uppercase tracking-wide text-brand-dark font-semibold">
                      {cocreator.title}
                    </span>
                  </div>
                  <p className="text-brand-darkest mb-4 line-clamp-3">
                    {cocreator.bio}
                  </p>
                  <div className="text-brand-dark font-semibold group-hover:text-brand-darkest transition-colors">
                    Learn More About {cocreator.name.split(' ')[0]} →
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coming Soon Message */}
          <div className="mt-12 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg inline-block">
              <h3 className="text-2xl font-bold text-brand-dark mb-4 font-playfair">
                {comingSoon.title}
              </h3>
              <p className="text-brand-darkest mb-6">
                {comingSoon.description}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

