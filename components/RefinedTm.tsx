import type { ReactNode } from "react";

/**
 * ™ size relative to adjacent “ArtKey” / heading text (55% smaller → 45% of cap height).
 * Use `em` so the mark scales with whatever font-size wraps it.
 */
export const ARTKEY_TRADEMARK_RELATIVE_EM = 0.45;

/** Generic ™ for headings and display type (sans mark, scales with parent). */
export function RefinedTm({ className = "" }: { className?: string }) {
  return (
    <sup
      className={`ml-[0.06em] inline-block translate-y-[-0.08em] align-baseline font-sans font-normal leading-none tracking-normal text-current ${className}`}
      style={{ fontSize: `${ARTKEY_TRADEMARK_RELATIVE_EM}em` }}
    >
      ™
    </sup>
  );
}

/** ™ for body / links (same relative scale as {@link RefinedTm}). */
export function RefinedTmInline({ className = "" }: { className?: string }) {
  return (
    <span
      className={`ml-[0.06em] inline-block translate-y-[-0.06em] align-baseline font-sans font-normal leading-none text-current ${className}`}
      style={{ fontSize: `${ARTKEY_TRADEMARK_RELATIVE_EM}em` }}
    >
      ™
    </span>
  );
}

/** Word-mark: ArtKey + ™ (inherits surrounding weight/color). */
export function ArtKeyTrademark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline whitespace-nowrap ${className}`}>
      ArtKey
      <RefinedTm />
    </span>
  );
}

/** Plural: ArtKeys + ™ */
export function ArtKeysTrademark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline whitespace-nowrap ${className}`}>
      ArtKeys
      <RefinedTm />
    </span>
  );
}

/** Matches ArtKeys™ / ArtKey™ plus plain “ArtKey(s)” word marks (not identifiers like ArtKeyEditor). */
const ARTKEY_TOKEN_RE =
  /(ArtKeys\u2122|ArtKey\u2122|\bArtKeys\b|\bArtKey\b)/g;

/**
 * Replace `ArtKey` / `ArtKeys` (with or without a literal ™) in prose strings
 * with {@link ArtKeyTrademark} / {@link ArtKeysTrademark} so the ™ scales correctly.
 */
export function renderStringWithArtKeyTrademarks(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(ARTKEY_TOKEN_RE.source, "g");
  let k = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      out.push(text.slice(last, match.index));
    }
    const full = match[1]!;
    out.push(
      full.startsWith("ArtKeys") ? (
        <ArtKeysTrademark key={`ak-tm-${k++}`} />
      ) : (
        <ArtKeyTrademark key={`ak-tm-${k++}`} />
      )
    );
    last = match.index + full.length;
  }
  if (last < text.length) {
    out.push(text.slice(last));
  }
  return out;
}
