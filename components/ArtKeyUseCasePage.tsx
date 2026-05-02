import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import type { ArtKeyUseEntry } from "@/lib/artkeyUses";
import { getArtKeyFeatureIcon } from "@/lib/artkeyUseFeatureIcon";
import {
  ARTKEY_USE_CAROUSEL_DEFAULT_OBJECT_POSITION,
  getArtKeyUseCarouselImage,
} from "@/lib/artkeyUseCarouselImages";
import { ArtKeyTrademark, RefinedTm } from "@/components/RefinedTm";

function TitleWithTm({ title }: { title: string }) {
  return (
    <>
      {title.split("™").map((part, i, arr) => (
        <Fragment key={i}>
          {part}
          {i < arr.length - 1 ? <RefinedTm /> : null}
        </Fragment>
      ))}
    </>
  );
}

export default function ArtKeyUseCasePage({ entry }: { entry: ArtKeyUseEntry }) {
  const isComingSoon = Boolean(entry.comingSoon);
  const carouselHero = getArtKeyUseCarouselImage(entry.slug);
  const heroSrc = carouselHero?.useCasePageSrc ?? carouselHero?.src;
  const heroObjectPosition =
    carouselHero?.useCasePageObjectPosition ??
    carouselHero?.objectPosition ??
    ARTKEY_USE_CAROUSEL_DEFAULT_OBJECT_POSITION;
  const heroObjectFit = carouselHero?.useCasePageObjectFit ?? "cover";
  /** Full-column `object-contain` on `zinc-800` — no inner frame so letterboxing matches the panel. */
  const realtorContainHero =
    entry.slug === "realtor" && heroObjectFit === "contain";

  return (
    <div className="min-h-screen bg-brand-lightest font-body text-brand-darkest">
      <header
        className={
          carouselHero
            ? "bg-white"
            : "border-b border-brand-light bg-white"
        }
      >
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <nav>
            <Link
              href="/#home"
              className="text-sm font-medium text-brand-medium transition-colors hover:text-brand-dark"
            >
              ← Back to <ArtKeyTrademark /> uses
            </Link>
          </nav>
        </div>

        {carouselHero ? (
          <div
            className={`grid w-full border-b border-brand-light lg:grid-cols-2 lg:min-h-[min(64vh,720px)] lg:items-stretch ${
              realtorContainHero ? "bg-zinc-800" : ""
            }`}
          >
            <div
              className={`flex flex-col justify-center px-6 py-12 sm:px-8 sm:py-14 lg:min-h-0 lg:px-10 lg:py-16 xl:px-14 ${
                realtorContainHero ? "bg-transparent" : "bg-zinc-800"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75 sm:text-sm">
                {entry.category}
              </p>
              <h1 className="mt-3 max-w-xl font-playfair text-4xl font-normal leading-[1.1] tracking-tight text-white sm:text-5xl md:text-5xl md:leading-[1.08] lg:text-[2.75rem] xl:text-6xl">
                <TitleWithTm title={entry.title} />
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:mt-6 sm:text-lg sm:leading-relaxed">
                {entry.description}
              </p>
            </div>

            <div
              className={
                realtorContainHero
                  ? "relative isolate min-h-[min(40vh,300px)] w-full overflow-hidden bg-transparent sm:min-h-[min(44vh,340px)] lg:min-h-0 lg:h-full"
                  : "relative isolate min-h-[min(40vh,300px)] w-full overflow-hidden bg-zinc-900 sm:min-h-[min(44vh,340px)] lg:min-h-0 lg:h-full"
              }
            >
              <Image
                src={heroSrc}
                alt={`${entry.category} — ArtKey use case`}
                fill
                className={
                  heroObjectFit === "contain" ? "object-contain" : "object-cover"
                }
                style={{
                  objectPosition: heroObjectPosition,
                }}
                sizes="(max-width: 1023px) 100vw, 50vw"
                priority
              />
              {!realtorContainHero ? (
                <div
                  className="pointer-events-none absolute inset-0 bg-zinc-950/50"
                  aria-hidden
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl px-4 pb-12 pt-2 sm:px-6 sm:pb-14 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-5 inline-flex items-center justify-center rounded-full border border-brand-light bg-brand-lightest px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-medium">
                {entry.category}
              </p>
              <h1 className="font-playfair text-4xl font-normal leading-[1.12] tracking-tight text-brand-dark sm:text-5xl md:text-6xl md:leading-[1.08]">
                <TitleWithTm title={entry.title} />
              </h1>
              <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-brand-darkest/85 sm:text-lg sm:leading-relaxed">
                {entry.description}
              </p>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {isComingSoon ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-brand-light bg-white px-8 py-14 text-center shadow-sm sm:px-12 sm:py-16">
            <p className="font-playfair text-2xl font-normal text-brand-dark sm:text-3xl">
              Coming soon
            </p>
            <p className="mt-4 text-sm leading-relaxed text-brand-medium sm:text-base">
              We are finishing this <ArtKeyTrademark /> template story. Check back
              shortly, or return to the home page to explore other use cases.
            </p>
            <Link
              href="/#home"
              className="mt-8 inline-block bg-brand-dark px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-brand-darkest"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {entry.features.map((feature) => {
              const Icon = getArtKeyFeatureIcon(feature);
              return (
                <li
                  key={feature}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-brand-light/80 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
                >
                  <div className="flex flex-1 flex-col px-6 pb-7 pt-6 sm:px-7 sm:pb-8 sm:pt-7">
                    <span className="mb-5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-light bg-brand-lightest text-brand-accent transition group-hover:border-brand-medium/40">
                      <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="text-[15px] font-medium leading-snug text-brand-dark md:text-[15.5px] md:leading-relaxed">
                      {feature}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
