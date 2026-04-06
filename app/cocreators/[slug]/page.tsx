"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import cocreatorsData from "@/content/cocreators.json";

interface CoCreator {
  name: string;
  title: string;
  image: string;
  mountainImage?: string;
  heroImage?: string;
  bio: string;
  description?: string;
  slug: string;
  thumbnailImage?: string;
}

function firstNonEmpty(...candidates: Array<string | undefined | null>): string {
  for (const c of candidates) {
    if (c != null && String(c).trim() !== "") return String(c).trim();
  }
  return "";
}

function firstNonEmptyOptional(
  ...candidates: Array<string | undefined | null>
): string | undefined {
  const s = firstNonEmpty(...candidates);
  return s || undefined;
}

export default function CoCreatorDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const staticCreators = cocreatorsData.cocreators as CoCreator[];
  const staticMatch = staticCreators.find((c) => c.slug === slug);

  const [creator, setCreator] = useState<CoCreator | null>(staticMatch || null);

  useEffect(() => {
    fetch("/api/cocreators")
      .then((r) => r.json())
      .then((res) => {
        if (res.source === "db" && res.data.length > 0) {
          const dbMatch = res.data.find((c: any) => c.slug === slug);
          if (dbMatch) {
            const s = staticMatch;
            setCreator({
              name: firstNonEmpty(dbMatch.name, s?.name),
              title: firstNonEmpty(dbMatch.title, s?.title),
              image: firstNonEmpty(
                dbMatch.thumbnailImage,
                dbMatch.heroImage,
                s?.image
              ),
              mountainImage: firstNonEmptyOptional(
                dbMatch.mountainImage,
                dbMatch.heroImage,
                s?.mountainImage,
                s?.heroImage
              ),
              heroImage: firstNonEmptyOptional(dbMatch.heroImage, s?.heroImage),
              bio: firstNonEmpty(dbMatch.bio, s?.bio),
              description: firstNonEmpty(dbMatch.description, s?.description ?? ""),
              slug: firstNonEmpty(dbMatch.slug, s?.slug, slug),
              thumbnailImage: firstNonEmptyOptional(
                dbMatch.thumbnailImage,
                s?.thumbnailImage
              ),
            });
          }
        }
      })
      .catch(() => {});
  }, [slug]);

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-normal text-brand-darkest mb-4">
            CoCreator Not Found
          </h1>
          <p className="text-brand-darkest/60 mb-6">
            We couldn&apos;t find the creator you&apos;re looking for.
          </p>
          <Link
            href="/cocreators"
            className="bg-brand-dark text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-darkest transition-colors"
          >
            Back to CoCreators
          </Link>
        </div>
      </div>
    );
  }

  const bioLines = creator.bio
    .split("\n\n")
    .filter((part) => {
      const trimmed = part.trim();
      return trimmed && trimmed !== creator.name.trim();
    });

  const descLines = (creator.description || "")
    .split("\n\n")
    .filter((part) => {
      const trimmed = part.trim();
      return trimmed && !trimmed.startsWith("Learn More");
    });

  const heroImg = creator.mountainImage || creator.heroImage;
  const hideSecondImage =
    slug === "kimber-cross" || slug === "lance-jones";

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
              href="/cocreators"
              className="hover:text-brand-dark transition-colors"
            >
              CoCreators
            </Link>
            <span>/</span>
            <span className="text-brand-darkest font-medium">
              {creator.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-brand-light to-brand-medium">
              {creator.image && (
                <Image
                  src={creator.image}
                  alt={creator.name}
                  fill
                  className="object-contain"
                  style={{
                    objectPosition:
                      slug === "lance-jones" ? "center 58%" : "top center",
                  }}
                  unoptimized
                />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-medium uppercase tracking-wider mb-3">
                {creator.title}
              </p>
              <h1 className="text-4xl md:text-5xl font-normal text-brand-darkest font-playfair mb-6">
                {creator.name}
              </h1>
              <div className="space-y-4">
                {bioLines.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-lg text-brand-darkest/80 leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
                {descLines.map((line, idx) => (
                  <p
                    key={`desc-${idx}`}
                    className="text-lg text-brand-darkest/80 leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {heroImg && !hideSecondImage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={heroImg}
              alt={`${creator.name} in action`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-normal text-brand-darkest font-playfair mb-2">
          Collaborations
        </h2>
        <p className="text-brand-darkest/60 mb-10">
          Products and experiences created with {creator.name.split(" ")[0]}.
        </p>
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <p className="text-brand-darkest/50 text-lg">
            Collaboration products coming soon.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-center">
        <Link
          href="/cocreators"
          className="inline-block border-2 border-brand-dark text-brand-dark px-8 py-3 rounded-full font-semibold hover:bg-brand-dark hover:text-white transition-all"
        >
          Back to CoCreators
        </Link>
      </div>
    </div>
  );
}
