"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
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

interface CoCreatorsProps {
  simplified?: boolean;
}

export default function CoCreators({ simplified = false }: CoCreatorsProps) {
  const { title, subtitle, cocreators, comingSoon, cta } = cocreatorsData;
  
  // Type assertion for cocreators
  const typedCocreators = cocreators as CoCreator[];
  const kimber = typedCocreators[0]; // Kimber Cross

  // Scroll to anchor when page loads with hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash) {
        // Wait for content to render, then scroll
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, []);

  // Simplified view for home page
  if (simplified) {
    return (
      <section id="cocreators" className="py-20" style={{ backgroundColor: '#ecece9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4 font-playfair">
              {title}
            </h2>
            <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
          </div>

          {/* Simplified: Just Kimber Cross */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Kimber Image */}
              <div className="relative min-h-[400px] md:min-h-[500px] w-full">
                <Image
                  src={kimber.image}
                  alt={kimber.name}
                  fill
                  className="object-contain"
                  style={{ objectPosition: 'top center' }}
                  unoptimized={kimber.image.startsWith('http')}
                />
              </div>
              
              {/* Kimber Bio */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <h3 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-4 font-playfair">
                  {kimber.name}
                </h3>
                <div className="mb-4">
                  <span className="text-sm uppercase tracking-wide text-brand-medium font-semibold">
                    {kimber.title}
                  </span>
                </div>
                <p className="text-lg text-brand-darkest leading-relaxed mb-6">
                  We welcome Kimber as The Artful Experience&apos;s first co-creator, with an art collaboration launching in the New Year.
                </p>
                <Link
                  href="/cocreators#kimber-cross"
                  className="bg-brand-medium text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-dark transition-all shadow-lg w-fit text-center"
                >
                  Learn More About Kimber →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Full view for CoCreators page
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
                    href={`#${cocreator.slug}`}
                    className="text-brand-dark font-semibold group-hover:text-brand-darkest transition-colors inline-block"
                  >
                    Learn More About {cocreator.name.split(' ')[0]} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {/* Expanded Details for Each CoCreator */}
          {typedCocreators.map((cocreator) => (
            <div
              key={`detail-${cocreator.slug}`}
              id={cocreator.slug}
              className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8"
            >
              {/* Mountain Image - shown when clicking Learn More */}
              {cocreator.mountainImage && (
                <div className="relative w-full h-[600px] md:h-[700px] mb-8 rounded-2xl overflow-hidden bg-brand-lightest">
                  <Image
                    src={cocreator.mountainImage}
                    alt={`${cocreator.name} standing on a mountain`}
                    fill
                    className="object-contain"
                    style={{ objectPosition: 'center top' }}
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
              
              {/* Complete Bio */}
              {cocreator.bio && (
                <div className="mb-6">
                  {cocreator.bio.split('\n\n').map((part, idx) => (
                    <p key={idx} className="text-lg text-brand-darkest leading-relaxed mb-4">
                      {part}
                    </p>
                  ))}
                </div>
              )}
              
              {/* Learn More About section */}
              {cocreator.description && (
                <div className="mb-8">
                  <h4 className="text-2xl font-bold text-brand-darkest mb-4 font-playfair">
                    {cocreator.description.split('\n\n')[0]}
                  </h4>
                  {cocreator.description.split('\n\n').slice(1).map((part, idx) => (
                    <p key={idx} className="text-base text-brand-darkest leading-relaxed mb-4 whitespace-pre-line">
                      {part}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
          
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

