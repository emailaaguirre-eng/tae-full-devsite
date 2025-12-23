"use client";

import Image from "next/image";
import Link from "next/link";
import cocreatorsData from "@/content/cocreators.json";

export default function FeaturedCoCreator() {
  const { featuredCoCreator } = cocreatorsData;

  return (
    <section className="py-20" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4 font-playfair">
            Featured CoCreator
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* CoCreator Profile Picture */}
            <div className="relative min-h-[400px] md:min-h-[500px] w-full">
              <Image
                src={featuredCoCreator.image}
                alt={featuredCoCreator.name}
                fill
                className="object-contain"
                style={{ objectPosition: 'top center' }}
              />
            </div>
            
            {/* CoCreator Bio */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h3 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-4 font-playfair">
                {featuredCoCreator.name}
              </h3>
              <div className="mb-4">
                <span className="text-sm uppercase tracking-wide text-brand-medium font-semibold">
                  {featuredCoCreator.title}
                </span>
              </div>
              <p className="text-lg text-brand-darkest leading-relaxed mb-4">
                {featuredCoCreator.bio}
              </p>
              <p className="text-base text-brand-dark leading-relaxed mb-6">
                {featuredCoCreator.description}
              </p>
              <Link
                href={`/cocreators#${featuredCoCreator.slug}`}
                className="bg-brand-medium text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-dark transition-all shadow-lg w-fit text-center"
              >
                {featuredCoCreator.buttonText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

