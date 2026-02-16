"use client";

import { useParams } from "next/navigation";
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

export default function CoCreatorDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const cocreators = cocreatorsData.cocreators as CoCreator[];
  const creator = cocreators.find((c) => c.slug === slug);

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-darkest mb-4">
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

  // Parse bio: remove leading name line if present
  const bioLines = creator.bio.split("\n\n").filter((part) => {
    const trimmed = part.trim();
    return trimmed && trimmed !== creator.name.trim();
  });

  // Parse description: remove leading "Learn More About..." line if present
  const descLines = (creator.description || "")
    .split("\n\n")
    .filter((part) => {
      const trimmed = part.trim();
      return trimmed && !trimmed.startsWith("Learn More");
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
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

      {/* Creator Hero */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Creator Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-brand-light to-brand-medium">
              <Image
                src={creator.image}
                alt={creator.name}
                fill
                className="object-contain"
                style={{ objectPosition: "top center" }}
                unoptimized
              />
            </div>

            {/* Creator Info */}
            <div>
              <p className="text-xs font-semibold text-brand-medium uppercase tracking-wider mb-3">
                {creator.title}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-brand-darkest font-playfair mb-6">
                {creator.name}
              </h1>
              {bioLines.map((line, idx) => (
                <p
                  key={idx}
                  className="text-lg text-brand-darkest/80 leading-relaxed mb-4"
                >
                  {line}
                </p>
              ))}
              {descLines.map((line, idx) => (
                <p
                  key={`desc-${idx}`}
                  className="text-brand-darkest/70 leading-relaxed mb-4"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Image (mountain, action shot, etc.) */}
      {creator.mountainImage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={creator.mountainImage}
              alt={`${creator.name} in action`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Collaboration Products Placeholder */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-brand-darkest font-playfair mb-2">
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

      {/* Back to CoCreators */}
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
