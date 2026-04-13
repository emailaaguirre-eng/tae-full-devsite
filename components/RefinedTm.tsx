/** Smaller, quieter ™ for large headings (Playfair body + sans mark). */
export function RefinedTm({ className = "" }: { className?: string }) {
  return (
    <sup
      className={`ml-[0.08em] inline-block translate-y-[-0.12em] align-baseline text-[0.42em] font-sans font-normal leading-none tracking-normal text-current opacity-[0.72] ${className}`}
    >
      ™
    </sup>
  );
}

/** Refined ™ next to body/small text (e.g. back link). */
export function RefinedTmInline() {
  return (
    <span className="ml-0.5 inline-block translate-y-[-2px] align-baseline text-[10px] font-sans font-normal leading-none text-current opacity-75">
      ™
    </span>
  );
}
