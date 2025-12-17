"use client";

import Image from "next/image";
import { useState } from "react";
import cocreatorsData from "@/content/cocreators.json";

interface CoCreator {
  id: string;
  name: string;
  image: string;
  modalImage?: string;
  bio: string;
  extendedBio?: string;
  link: string;
}

export default function CoCreators() {
  const { title, subtitle, cocreators, cta } = cocreatorsData;
  const [openModal, setOpenModal] = useState<string | null>(null);
  
  // Type assertion for cocreators
  const typedCocreators = cocreators as CoCreator[];

  return (
    <section id="cocreators" className="py-20" style={{ backgroundColor: '#ecece9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            {title}
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
          <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* CoCreator profiles */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {typedCocreators.map((cocreator) => (
              <div key={cocreator.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all">
                <div className="relative h-48 bg-gradient-to-br from-brand-light to-brand-medium overflow-hidden">
                  {cocreator.image ? (
                    <Image
                      src={cocreator.image}
                      alt={cocreator.name}
                      fill
                      className="object-contain"
                      style={{ objectPosition: 'center' }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-light to-brand-medium">
                      <div className="text-7xl">👤</div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-brand-darkest mb-2">
                    {cocreator.name}
                  </h3>
                  <p className="text-brand-darkest mb-4 line-clamp-3">
                    {cocreator.bio}
                  </p>
                  {cocreator.modalImage && (
                    <button 
                      onClick={() => setOpenModal(cocreator.id)}
                      className="text-brand-medium font-semibold hover:text-brand-dark transition-colors"
                    >
                      Learn More →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg inline-block">
              <h3 className="text-2xl font-bold text-brand-dark mb-4">
                {cta.title}
              </h3>
              <p className="text-brand-darkest mb-6">
                {cta.description}
              </p>
              <button className="bg-brand-medium text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-dark transition-all shadow-lg">
                {cta.buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for CoCreator details */}
      {openModal && (() => {
        const cocreator = typedCocreators.find(c => c.id === openModal);
        if (!cocreator || !cocreator.modalImage) return null;
        
        return (
          <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setOpenModal(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <button
                  onClick={() => setOpenModal(null)}
                  className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="relative h-96 md:h-[500px] bg-gray-50">
                  <Image
                    src={cocreator.modalImage}
                    alt={`${cocreator.name} - Additional image`}
                    fill
                    className="object-contain rounded-t-2xl"
                    style={{ objectPosition: 'center' }}
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-3xl font-bold text-brand-darkest mb-4">
                    {cocreator.name}
                  </h3>
                  <p className="text-lg text-brand-darkest leading-relaxed">
                    {cocreator.bio}
                  </p>
                  {cocreator.extendedBio && (
                    <p className="text-base text-brand-dark leading-relaxed mt-4">
                      {cocreator.extendedBio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

