import Link from "next/link";
import type { ArtKeyUseEntry } from "@/lib/artkeyUses";

export default function ArtKeyUseCasePage({ entry }: { entry: ArtKeyUseEntry }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <nav className="mb-10">
          <Link
            href="/#testimonials"
            className="text-sm font-medium text-brand-medium transition hover:text-brand-dark"
          >
            ← Back to ArtKey™ uses
          </Link>
        </nav>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-medium">
          {entry.category}
        </p>
        <h1 className="font-playfair text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl md:text-6xl">
          {entry.title}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-brand-darkest/90">
          {entry.description}
        </p>

        <div className="mt-14">
          <h2 className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.18em] text-brand-medium">
            What&apos;s included
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {entry.features.map((feature) => (
              <li
                key={feature}
                className="flex flex-col rounded-[1rem] border border-brand-light/80 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
              >
                <span className="mb-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-lightest text-brand-dark ring-1 ring-brand-light">
                  <span className="text-xs font-bold text-brand-medium">✓</span>
                </span>
                <span className="text-[15px] leading-snug text-brand-darkest">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
