import Link from "next/link";
import { Fragment } from "react";
import type { ArtKeyUseEntry } from "@/lib/artkeyUses";
import { getArtKeyFeatureIcon } from "@/lib/artkeyUseFeatureIcon";
import { RefinedTm, RefinedTmInline } from "@/components/RefinedTm";

export default function ArtKeyUseCasePage({ entry }: { entry: ArtKeyUseEntry }) {
  const isComingSoon = Boolean(entry.comingSoon);

  return (
    <div className="min-h-screen bg-brand-lightest font-body text-brand-darkest">
      <header className="border-b border-brand-light bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <nav className="mb-10">
            <Link
              href="/#home"
              className="text-sm font-medium text-brand-medium transition-colors hover:text-brand-dark"
            >
              ← Back to ArtKey
              <RefinedTmInline /> uses
            </Link>
          </nav>

          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 inline-flex items-center justify-center rounded-full border border-brand-light bg-brand-lightest px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-medium">
              {entry.category}
            </p>

            <h1 className="font-playfair text-4xl font-normal leading-[1.12] tracking-tight text-brand-dark sm:text-5xl md:text-6xl md:leading-[1.08]">
              {entry.title.split("™").map((part, i, arr) => (
                <Fragment key={i}>
                  {part}
                  {i < arr.length - 1 ? <RefinedTm /> : null}
                </Fragment>
              ))}
            </h1>

            <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-brand-darkest/85 sm:text-lg sm:leading-relaxed">
              {entry.description}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {isComingSoon ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-brand-light bg-white px-8 py-14 text-center shadow-sm sm:px-12 sm:py-16">
            <p className="font-playfair text-2xl font-normal text-brand-dark sm:text-3xl">
              Coming soon
            </p>
            <p className="mt-4 text-sm leading-relaxed text-brand-medium sm:text-base">
              We are finishing this ArtKey
              <RefinedTmInline /> template story. Check back shortly, or return to
              the home page to explore other use cases.
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
