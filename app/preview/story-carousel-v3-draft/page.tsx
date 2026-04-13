import type { Metadata } from "next";
import StoryCarouselV3Draft from "@/components/StoryCarouselV3Draft";

export const metadata: Metadata = {
  title: "Preview — StoryCarouselV3Draft",
  robots: { index: false, follow: false },
};

/**
 * Temporary preview only. Safe to delete after the draft ships or is rejected.
 * Does not affect the homepage or Testimonials.
 */
export default function StoryCarouselV3DraftPreviewPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f4f1",
        padding: "40px 16px 80px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p
          style={{
            textAlign: "center",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#64748b",
            margin: "0 0 24px",
          }}
        >
          Preview — StoryCarouselV3Draft (temporary)
        </p>
        <StoryCarouselV3Draft />
      </div>
    </main>
  );
}
