"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import cocreatorsData from "@/content/cocreators.json";
import { creators as portalCreators } from "@/data/creators";
import { CoCreatorsSection } from "@/components/CoCreatorsSection";

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

interface CoCreatorsProps {
  simplified?: boolean;
}

function mapStaticCreators(): CoCreator[] {
  return cocreatorsData.cocreators as CoCreator[];
}

function staticCoCreatorBySlug(): Record<string, CoCreator> {
  return Object.fromEntries(
    mapStaticCreators().map((c) => [c.slug, c])
  );
}

export default function CoCreators({ simplified = false }: CoCreatorsProps) {
  const { title, subtitle, comingSoon, cta } = cocreatorsData;
  const [creators, setCreators] = useState<CoCreator[]>(mapStaticCreators());

  useEffect(() => {
    fetch("/api/cocreators")
      .then((r) => r.json())
      .then((res) => {
        if (res.source === "db" && res.data.length > 0) {
          const bySlug = staticCoCreatorBySlug();
          const mapped: CoCreator[] = res.data.map((c: any) => {
            const fb = bySlug[c.slug];
            const titleDb = c.title != null ? String(c.title).trim() : "";
            return {
              name: (c.name && String(c.name).trim()) || fb?.name || "",
              title: titleDb || fb?.title || "",
              image:
                c.thumbnailImage ||
                c.heroImage ||
                fb?.image ||
                "",
              mountainImage:
                c.mountainImage ||
                c.heroImage ||
                fb?.mountainImage ||
                fb?.heroImage ||
                "",
              heroImage: c.heroImage || fb?.heroImage || "",
              bio: (c.bio && String(c.bio).trim()) || fb?.bio || "",
              description: c.description ?? fb?.description ?? "",
              slug: c.slug,
            };
          });
          setCreators(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const kimber = creators[0];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash) {
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    }
  }, []);

  if (simplified) {
    return (
      <section id="cocreators" className="py-20" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-normal text-brand-dark mb-4 font-playfair">
              {title}
            </h2>
            <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
          </div>

          {kimber && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <Link
                  href="/cocreators"
                  className="relative min-h-[400px] md:min-h-[500px] w-full block cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {kimber.image && (
                    <Image
                      src={kimber.image}
                      alt={kimber.name}
                      fill
                      className="object-contain"
                      style={{ objectPosition: "top center" }}
                      unoptimized={kimber.image.startsWith("http")}
                    />
                  )}
                </Link>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h3 className="text-3xl md:text-4xl font-normal text-brand-darkest mb-4 font-playfair">
                    {kimber.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-sm uppercase tracking-wide text-brand-medium font-semibold">
                      {kimber.title}
                    </span>
                  </div>
                  <p className="text-lg text-brand-darkest leading-relaxed mb-6">
                    We welcome {kimber.name.split(" ")[0]} as The Artful Experience&apos;s first co-creator, with an art collaboration launching this month.
                  </p>
                  <Link
                    href="/cocreators"
                    className="bg-brand-medium text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-dark transition-all shadow-lg w-fit text-center"
                  >
                    Meet Our CoCreators →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  const sectionKicker =
    "sectionKicker" in cocreatorsData && typeof (cocreatorsData as { sectionKicker?: string }).sectionKicker === "string"
      ? (cocreatorsData as { sectionKicker: string }).sectionKicker
      : "THE COCREATORS";
  const sectionHeadline =
    "sectionHeadline" in cocreatorsData &&
    typeof (cocreatorsData as { sectionHeadline?: string }).sectionHeadline === "string"
      ? (cocreatorsData as { sectionHeadline: string }).sectionHeadline
      : subtitle;

  return (
    <section id="cocreators" className="py-20" style={{ backgroundColor: "#ecece9" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CoCreatorsSection
          creator={portalCreators[0]}
          isActive
          intro={{ kicker: sectionKicker, headline: sectionHeadline }}
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 mt-16 md:mt-20">
          {creators.map((cocreator) => (
            <div
              key={cocreator.slug}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
            >
              <div className="relative h-64 w-full bg-gradient-to-br from-brand-light to-brand-medium overflow-hidden">
                {cocreator.image && (
                  <Image
                    src={cocreator.image}
                    alt={cocreator.name}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                    style={{ objectPosition: "top center" }}
                    unoptimized={cocreator.image.startsWith("http")}
                  />
                )}
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-normal text-brand-darkest mb-2 font-playfair">
                  {cocreator.name}
                </h3>
                <div className="mb-3">
                  <span className="text-xs uppercase tracking-wide text-brand-dark font-semibold">
                    {cocreator.title}
                  </span>
                </div>
                {cocreator.bio && (
                  <div className="text-brand-darkest mb-4">
                    {cocreator.bio.split("\n\n").map((part, idx) => {
                      if (idx === 0) {
                        const trimmedPart = part.trim();
                        if (trimmedPart === cocreator.name.trim()) return null;
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
                  href={`/cocreators/${cocreator.slug}`}
                  className="text-brand-dark font-semibold group-hover:text-brand-darkest transition-colors inline-block cursor-pointer"
                >
                  Learn More About {cocreator.name.split(" ")[0]} →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg inline-block max-w-lg">
            <h3 className="text-2xl font-normal text-brand-dark mb-6 font-playfair">
              {comingSoon.title}
            </h3>
            <Link
              href={cta.href}
              className="inline-block bg-brand-medium text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-dark transition-all shadow-lg"
            >
              {cta.buttonText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
