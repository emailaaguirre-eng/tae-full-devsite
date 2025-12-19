"use client";

import Image from "next/image";
import Link from "next/link";
import cocreatorsData from "@/content/cocreators.json";

interface CoCreator {
  name: string;
  title: string;
  image: string;
  mountainImage?: string;
  bio: string;
  description?: string;
  slug: string;
}

export default function CoCreators() {
  const { title, subtitle, cocreators, comingSoon, cta } = cocreatorsData;
  
  // Type assertion for cocreators
  const typedCocreators = cocreators as CoCreator[];

  return (
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
                    unoptimized={cocreator.image.startsWith('http')}
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
                  {/* Parse bio to show first part (before \n\n) */}
                  {cocreator.bio && (
                    <div className="text-brand-darkest mb-4">
                      {cocreator.bio.split('\n\n').map((part, idx) => {
                        if (idx === 0) {
                          // First part - show as preview
                          return (
                            <p key={idx} className="line-clamp-3">
                              {part}
                            </p>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                  <Link
                    href={`/cocreators#${cocreator.slug}`}
                    className="text-brand-dark font-semibold group-hover:text-brand-darkest transition-colors inline-block"
                  >
                    Learn More About {cocreator.name.split(' ')[0]} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
          
          {/* Expanded Details for Each CoCreator */}
          {typedCocreators.map((cocreator) => (
            <div
              key={`detail-${cocreator.slug}`}
              id={cocreator.slug}
              className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8"
            >
              {/* Mountain Image - shown when clicking Learn More */}
              {cocreator.mountainImage && (
                <div className="relative w-full h-96 md:h-[500px] mb-8 rounded-2xl overflow-hidden">
                  <Image
                    src={cocreator.mountainImage}
                    alt={`${cocreator.name} standing on a mountain`}
                    fill
                    className="object-cover"
                    unoptimized={cocreator.mountainImage.startsWith('http')}
                  />
                </div>
              )}
              
              <h3 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-4 font-playfair">
                {cocreator.name}
              </h3>
              <div className="mb-6">
                <span className="text-sm uppercase tracking-wide text-brand-medium font-semibold">
                  {cocreator.title}
                </span>
              </div>
              
              {/* First part of bio */}
              {cocreator.bio && (
                <div className="mb-8">
                  {cocreator.bio.split('\n\n').map((part, idx) => (
                    <p key={idx} className="text-lg text-brand-darkest leading-relaxed mb-4">
                      {part}
                    </p>
                  ))}
                </div>
              )}
              
              {/* Learn More About section */}
              {cocreator.description && (
                <div className="mt-8 pt-8 border-t border-brand-light">
                  <h4 className="text-2xl font-bold text-brand-darkest mb-4 font-playfair">
                    {cocreator.description.split('\n\n')[0]}
                  </h4>
                  {cocreator.description.split('\n\n').slice(1).map((part, idx) => (
                    <p key={idx} className="text-base text-brand-darkest leading-relaxed mb-4">
                      {part}
                    </p>
                  ))}
                </div>
              )}
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
  );
}

