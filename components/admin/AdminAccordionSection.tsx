"use client";

import { ChevronDown } from "lucide-react";

type AdminAccordionSectionProps = {
  title: string;
  /** When true, section starts expanded (uncontrolled `<details>`). */
  defaultOpen?: boolean;
  children: React.ReactNode;
};

/**
 * Major-section accordion for admin forms. Presentation-only wrapper around native <details>.
 */
export function AdminAccordionSection({
  title,
  defaultOpen = true,
  children,
}: AdminAccordionSectionProps) {
  return (
    <details
      className="group border border-brand-light rounded-lg overflow-hidden"
      defaultOpen={defaultOpen}
    >
      <summary className="cursor-pointer select-none list-none px-4 py-3 text-xs font-semibold uppercase tracking-wider text-brand-dark/70 bg-brand-lightest/40 border-b border-brand-light flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown className="w-4 h-4 shrink-0 text-brand-medium opacity-80 transition-transform group-open:rotate-180" />
      </summary>
      <div className="p-4 space-y-4">{children}</div>
    </details>
  );
}
