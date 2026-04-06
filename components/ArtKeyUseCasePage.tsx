import Link from "next/link";
import { Fragment } from "react";
import type { ArtKeyUseEntry } from "@/lib/artkeyUses";
import { getArtKeyFeatureIcon } from "@/lib/artkeyUseFeatureIcon";
import { RefinedTm, RefinedTmInline } from "@/components/RefinedTm";

const PAGE_BG = "#f3f3f3";
const CARD_BG = "#ffffff";
const BONE = "#ded8d3";
const TAUPE = "#918c86";
const TEXT = "#141414";
const ACCENT = "#475569";

export default function ArtKeyUseCasePage({ entry }: { entry: ArtKeyUseEntry }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      <div
        className="h-px w-full bg-gradient-to-r from-transparent to-transparent"
        style={{
          backgroundImage: `linear-gradient(90deg, transparent, ${TAUPE}66, transparent)`,
        }}
        aria-hidden
      />

      <header
        className="relative border-b bg-white"
        style={{ borderColor: `${BONE}` }}
      >
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 text-center sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
          <nav className="mb-12 text-left">
            <Link
              href="/#testimonials"
              className="text-sm font-medium transition-colors hover:text-[#475569]"
              style={{ color: TAUPE }}
            >
              ← Back to ArtKey
              <RefinedTmInline /> uses
            </Link>
          </nav>

          <p className="mb-5 inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-black shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            {entry.category}
          </p>

          <h1
            className="font-playfair text-[2.35rem] font-normal leading-[1.12] tracking-tight sm:text-5xl md:text-6xl md:leading-[1.08]"
            style={{ color: TEXT }}
          >
            {entry.title.split("™").map((part, i, arr) => (
              <Fragment key={i}>
                {part}
                {i < arr.length - 1 ? <RefinedTm /> : null}
              </Fragment>
            ))}
          </h1>

          <p
            className="mx-auto mt-14 max-w-xl text-base leading-relaxed sm:text-lg sm:leading-relaxed"
            style={{ color: `${TEXT}e6` }}
          >
            {entry.description}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <ul className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {entry.features.map((feature) => {
            const Icon = getArtKeyFeatureIcon(feature);
            return (
              <li
                key={feature}
                className="group relative flex flex-col overflow-hidden rounded-[1.25rem] border p-0 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.05)] transition duration-300"
                style={{
                  backgroundColor: CARD_BG,
                  borderColor: `${BONE}b3`,
                }}
              >
                <div
                  className="h-0.5 w-full opacity-90 transition group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, ${BONE}, ${TAUPE}, ${BONE})`,
                  }}
                  aria-hidden
                />
                <div className="flex flex-1 flex-col px-7 pb-8 pt-7">
                  <span
                    className="mb-5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 transition group-hover:ring-[#47556933]"
                    style={{
                      backgroundColor: PAGE_BG,
                      borderColor: BONE,
                      color: ACCENT,
                    }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span
                    className="text-[15px] font-medium leading-snug md:text-[15.5px] md:leading-relaxed"
                    style={{ color: TEXT }}
                  >
                    {feature}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
