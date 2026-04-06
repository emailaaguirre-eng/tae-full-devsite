"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import galleryData from "@/content/gallery.json";

interface ArtistWork {
  title: string;
  image: string;
  forSale: boolean;
  price?: number | null;
}

interface Artist {
  name: string;
  title: string;
  image: string;
  bioImage?: string;
  bio: string;
  description?: string;
  slug: string;
  thumbnailImage?: string;
  portfolio?: ArtistWork[];
}

export default function ArtistDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const staticArtists = galleryData.artists as Artist[];
  const staticMatch = staticArtists.find((a) => a.slug === slug);

  const [artist, setArtist] = useState<Artist | null>(staticMatch || null);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((res) => {
        if (res.source === "db" && res.data.length > 0) {
          const dbMatch = res.data.find((a: any) => a.slug === slug);
          if (dbMatch) {
            setArtist({
              name: dbMatch.name,
              title: dbMatch.title || "",
              image: dbMatch.thumbnailImage || dbMatch.bioImage || "",
              bioImage: dbMatch.bioImage || dbMatch.thumbnailImage || "",
              bio: dbMatch.bio || "",
              description: dbMatch.description || "",
              slug: dbMatch.slug,
              portfolio: dbMatch.portfolio || [],
            });
          }
        }
      })
      .catch(() => {});
  }, [slug]);

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-normal text-brand-darkest mb-4">
            Artist Not Found
          </h1>
          <p className="text-brand-darkest/60 mb-6">
            We couldn&apos;t find the artist you&apos;re looking for.
          </p>
          <Link
            href="/gallery"
            className="bg-brand-dark text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-darkest transition-colors"
          >
            Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  const portfolio = artist.portfolio || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-brand-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-brand-darkest/60">
            <Link href="/" className="hover:text-brand-dark transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/gallery"
              className="hover:text-brand-dark transition-colors"
            >
              theAE Gallery
            </Link>
            <span>/</span>
            <span className="text-brand-darkest font-medium">
              {artist.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-brand-light to-brand-medium">
              {(artist.bioImage || artist.image) && (
                <Image
                  src={artist.bioImage || artist.image}
                  alt={artist.name}
                  fill
                  className="object-contain"
                  style={{ objectPosition: "top center" }}
                  unoptimized
                />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-medium uppercase tracking-wider mb-3">
                {artist.title}
              </p>
              <h1 className="text-4xl md:text-5xl font-normal text-brand-darkest font-playfair mb-6">
                {artist.name}
              </h1>
              <div className="space-y-4">
                {artist.bio && (
                  <p className="text-lg text-brand-darkest/80 leading-relaxed">
                    {artist.bio}
                  </p>
                )}
                {artist.description && (
                  <p className="text-lg text-brand-darkest/80 leading-relaxed">
                    {artist.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {portfolio.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-normal text-brand-darkest font-playfair mb-2">
            Portfolio
          </h2>
          <p className="text-brand-darkest/60 mb-10">
            {portfolio.filter((w) => w.forSale).length} works available
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {portfolio.map((work, index) => (
              <div
                key={index}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all group"
              >
                <div className="relative aspect-square bg-gradient-to-br from-brand-light to-brand-medium overflow-hidden">
                  <Image
                    src={work.image}
                    alt={work.title}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>
                <div className="p-4">
                  {work.title && !/^untitled\s*\d*$/i.test(work.title.trim()) && (
                    <h3 className="font-semibold text-brand-darkest mb-1">
                      {work.title}
                    </h3>
                  )}
                  <div className="flex items-center justify-between">
                    {work.price ? (
                      <span className="text-lg font-bold text-brand-dark">
                        ${work.price.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm text-brand-darkest/50">
                        Price on request
                      </span>
                    )}
                    {work.forSale && (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        Available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-center">
        <Link
          href="/gallery"
          className="inline-block border-2 border-brand-dark text-brand-dark px-8 py-3 rounded-full font-semibold hover:bg-brand-dark hover:text-white transition-all"
        >
          Back to Gallery
        </Link>
      </div>
    </div>
  );
}
