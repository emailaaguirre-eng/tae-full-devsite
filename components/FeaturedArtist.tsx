"use client";

import Image from "next/image";
import Link from "next/link";
import galleryData from "@/content/gallery.json";
import cocreatorsData from "@/content/cocreators.json";

interface CoCreator {
  name: string;
  title: string;
  image: string;
  bio: string;
  slug: string;
}

export default function FeaturedArtist() {
  const { featuredArtist } = galleryData;
  const typedCocreators = cocreatorsData.cocreators as CoCreator[];
  const kimber = typedCocreators[0];

  return (
    <section className="py-20" style={{ backgroundColor: '#ecece9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Featured Artist */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4 font-playfair">
            Featured Artist
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
        </div>

        <div className="bg-white shadow-xl overflow-hidden mb-20">
          <div className="grid md:grid-cols-2 gap-0">
            <Link href={`/gallery/${featuredArtist.slug}`} className="relative min-h-[400px] md:min-h-[500px] w-full block cursor-pointer hover:opacity-90 transition-opacity">
              <Image
                src={featuredArtist.image}
                alt={featuredArtist.name}
                fill
                className="object-contain"
                style={{ objectPosition: 'top center' }}
                unoptimized={featuredArtist.image.includes('theartfulexperience.com')}
              />
            </Link>

            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h3 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-4 font-playfair">
                {featuredArtist.name}
              </h3>
              <div className="mb-4">
                <span className="text-sm uppercase tracking-wide text-brand-medium font-semibold">
                  {featuredArtist.title}
                </span>
              </div>
              <p className="text-lg text-brand-darkest leading-relaxed mb-4">
                {featuredArtist.bio}
              </p>
              <p className="text-base text-brand-dark leading-relaxed mb-6">
                {featuredArtist.description}
              </p>
              <Link
                href={`/gallery/${featuredArtist.slug}`}
                className="bg-brand-dark text-white px-8 py-3 font-semibold hover:bg-brand-darkest transition-all shadow-lg w-fit text-center"
              >
                {featuredArtist.buttonText}
              </Link>
            </div>
          </div>
        </div>

        {/* CoCreators */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4 font-playfair">
            CoCreators
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
        </div>

        <div style={{ backgroundColor: '#ded8d3' }} className="shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <Link href="/cocreators" className="relative min-h-[400px] md:min-h-[500px] w-full block cursor-pointer hover:opacity-90 transition-opacity">
              <Image
                src={kimber.image}
                alt={kimber.name}
                fill
                className="object-contain"
                style={{ objectPosition: 'top center' }}
                unoptimized={kimber.image.startsWith('http')}
              />
            </Link>

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
                href="/cocreators"
                className="bg-brand-dark text-white px-8 py-3 font-semibold hover:bg-brand-darkest transition-all shadow-lg w-fit text-center"
              >
                Meet Our CoCreators →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
