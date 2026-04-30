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

interface ShopProductCard {
  slug: string;
  name: string;
  heroImage: string | null;
  basePrice: number;
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
  const [coCreatorLookupComplete, setCoCreatorLookupComplete] = useState(false);
  const [shopProducts, setShopProducts] = useState<ShopProductCard[]>([]);
  const [collabProductsLoading, setCollabProductsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setCoCreatorLookupComplete(false);
      setCollabProductsLoading(true);
      setShopProducts([]);

      let coId: string | null = null;
      try {
        const cocRes = await (await fetch("/api/cocreators")).json();
        if (cancelled) return;
        if (cocRes.source === "db" && Array.isArray(cocRes.data) && cocRes.data.length > 0) {
          const dbMatch = cocRes.data.find((c: any) => c.slug === slug);
          if (dbMatch) {
            coId = String(dbMatch.id || "").trim() || null;
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
      } catch {
        /* keep coId null; still fetch products by slug below */
      }

      if (cancelled) return;
      setCoCreatorLookupComplete(true);

      if (!slug) {
        if (!cancelled) setCollabProductsLoading(false);
        return;
      }

      const params = new URLSearchParams({ limit: "50", group: "false" });
      params.set("coCreatorSlug", slug);
      if (coId) params.set("coCreatorId", coId);
      try {
        const pres = await (await fetch(`/api/products?${params}`)).json();
        if (cancelled) return;
        if (pres.success && Array.isArray(pres.data)) {
          setShopProducts(
            pres.data.map((p: any) => ({
              slug: p.slug,
              name: p.name,
              heroImage: p.heroImage ?? null,
              basePrice: Number(p.basePrice) || 0,
            }))
          );
        } else {
          setShopProducts([]);
        }
      } catch {
        if (!cancelled) setShopProducts([]);
      } finally {
        if (!cancelled) setCollabProductsLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [slug, staticMatch]);

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
      if (!trimmed || trimmed === creator.name.trim()) return false;
      if (/^more about lance coming soon\.?$/i.test(trimmed)) return false;
      return true;
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
        {collabProductsLoading || !coCreatorLookupComplete ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <p className="text-brand-darkest/50 text-lg">
              Loading collaboration products…
            </p>
          </div>
        ) : shopProducts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {shopProducts.map((p) => (
              <Link
                key={p.slug}
                href={`/shop/${p.slug}`}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all group"
              >
                <div className="relative aspect-square bg-gradient-to-br from-brand-light to-brand-medium overflow-hidden">
                  {p.heroImage ? (
                    <Image
                      src={p.heroImage}
                      alt={p.name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-darkest/25 text-5xl">
                      ◆
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-brand-darkest mb-1 line-clamp-2">{p.name}</h3>
                  <span className="text-lg font-bold text-brand-dark">
                    ${p.basePrice.toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <p className="text-brand-darkest/50 text-lg">
              Collaboration products coming soon.
            </p>
          </div>
        )}
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
