"use client";

import { useEffect, useState, useCallback } from "react";
import { Upload, X, ImageIcon, RotateCcw } from "lucide-react";

interface SiteMediaSlot {
  key: string;
  label: string;
  component: string;
  defaultUrl: string;
}

interface Override {
  key: string;
  url: string;
  alt: string | null;
  updatedAt: string | null;
}

const SLOTS: SiteMediaSlot[] = [
  { key: "hero.background", label: "Hero Background", component: "Hero", defaultUrl: "https://theartfulexperience.com/wp-content/uploads/2026/01/herowedding.png" },
  { key: "howitworks.step1", label: "How It Works — Step 1", component: "HowItWorks", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/uploadyourimage.png" },
  { key: "howitworks.step2", label: "How It Works — Step 2", component: "HowItWorks", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/buyanexistingprint.jpg" },
  { key: "howitworks.step3", label: "How It Works — Step 3", component: "HowItWorks", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/uploadmedia.png" },
  { key: "howitworks.step4", label: "How It Works — Step 4", component: "HowItWorks", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/legacy-3.jpeg" },
  { key: "howitworks.step5", label: "How It Works — Step 5", component: "HowItWorks", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/couch.jpg" },
  { key: "collectors.image1", label: "Collectors — Image 1", component: "CollectorsSection", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/collectors_commissioned.jpeg" },
  { key: "collectors.image2", label: "Collectors — Image 2", component: "CollectorsSection", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/6021123e-401a-11f0-8abf-0242ac110002-unnamed-1-1.jpg" },
  { key: "testimonials.1", label: "Testimonial 1 — Portrait", component: "Testimonials", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/river-1.jpg" },
  { key: "testimonials.2", label: "Testimonial 2 — Portrait", component: "Testimonials", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/3125EEFB-C70A-4CF7-8DB3-1F4DB841E4B9-scaled.jpeg" },
  { key: "testimonials.3", label: "Testimonial 3 — Portrait", component: "Testimonials", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/IMG_0814.jpeg" },
  { key: "testimonials.4", label: "Testimonial 4 — Portrait", component: "Testimonials", defaultUrl: "https://theartfulexperience.com/wp-content/uploads/2025/12/IMG_7692-1-scaled.jpeg" },
  { key: "testimonials.5", label: "Testimonial 5 — Portrait", component: "Testimonials", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/photocuhtgg.png" },
  { key: "testimonials.6", label: "Testimonial 6 — Portrait", component: "Testimonials", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/9A91E9CB-3917-4204-9C30-B36EAC1BD4E2.jpeg" },
  { key: "testimonials.7", label: "Testimonial 7 — Portrait", component: "Testimonials", defaultUrl: "https://theartfulexperience.com/wp-content/uploads/2025/12/bctestimonial.png" },
  { key: "about.video", label: "About — Promo Video", component: "AboutUs", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/Hero-PROMO-VIDEO.mp4" },
  { key: "about.collage", label: "About — Collage Image", component: "AboutUs", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/10/collage.png" },
  { key: "cards.hero", label: "Cards Section — Hero", component: "CardsSection", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/tAE_Holiday_Hero.png" },
  { key: "giftideas.1", label: "Gift Idea 1 — Friend/Partner", component: "GiftIdeas", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/uploadyourprint.png" },
  { key: "giftideas.2", label: "Gift Idea 2 — Wedding", component: "GiftIdeas", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/forweddings.jpeg" },
  { key: "giftideas.3", label: "Gift Idea 3 — Client", component: "GiftIdeas", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/specialcustomer.png" },
  { key: "giftideas.4", label: "Gift Idea 4 — Legacy", component: "GiftIdeas", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/tae_legacy.png" },
  { key: "giftideas.5", label: "Gift Idea 5 — College", component: "GiftIdeas", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/offtocollege.png" },
];

export default function SiteMediaPage() {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filter, setFilter] = useState("");

  const loadOverrides = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/site-media");
      const data = await res.json();
      if (data.success) setOverrides(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadOverrides(); }, [loadOverrides]);

  const overrideMap = new Map(overrides.map((o) => [o.key, o]));

  const handleUpload = async (slot: SiteMediaSlot, file: File) => {
    setUploading(slot.key);
    setMessage(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("key", slot.key);
    fd.append("alt", slot.label);
    try {
      const res = await fetch("/api/admin/site-media", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: `Updated "${slot.label}"` });
        loadOverrides();
      } else {
        setMessage({ type: "error", text: data.error || "Upload failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    }
    setUploading(null);
  };

  const handleRevert = async (slot: SiteMediaSlot) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/site-media?key=${encodeURIComponent(slot.key)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: `Reverted "${slot.label}" to default` });
        loadOverrides();
      } else {
        setMessage({ type: "error", text: data.error || "Revert failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Revert failed" });
    }
  };

  const components = [...new Set(SLOTS.map((s) => s.component))];
  const filteredSlots = filter
    ? SLOTS.filter((s) => s.component === filter)
    : SLOTS;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-medium text-sm">Loading site media...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-playfair">Site Media</h1>
          <p className="text-sm text-brand-medium mt-1">
            Override homepage images without editing code. {overrides.length} of {SLOTS.length} overridden.
          </p>
        </div>
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 mb-4 flex items-center justify-between ${
          message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Component filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            !filter ? "bg-brand-dark text-white" : "border border-brand-light text-brand-medium hover:bg-brand-lightest"
          }`}
        >
          All ({SLOTS.length})
        </button>
        {components.map((c) => {
          const count = SLOTS.filter((s) => s.component === c).length;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === c ? "bg-brand-dark text-white" : "border border-brand-light text-brand-medium hover:bg-brand-lightest"
              }`}
            >
              {c} ({count})
            </button>
          );
        })}
      </div>

      {/* Media grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSlots.map((slot) => {
          const override = overrideMap.get(slot.key);
          const currentUrl = override?.url || slot.defaultUrl;
          const isVideo = currentUrl.endsWith(".mp4") || currentUrl.endsWith(".webm");
          const hasOverride = !!override;

          return (
            <div key={slot.key} className="bg-white border border-brand-light overflow-hidden">
              {/* Preview */}
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {isVideo ? (
                  <video src={currentUrl} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img
                    src={currentUrl}
                    alt={slot.label}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                {hasOverride && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-[9px] px-1.5 py-0.5 font-medium uppercase tracking-wider">
                    Overridden
                  </div>
                )}
                {!hasOverride && (
                  <div className="absolute top-2 left-2 bg-gray-500 text-white text-[9px] px-1.5 py-0.5 font-medium uppercase tracking-wider">
                    Default
                  </div>
                )}
              </div>

              {/* Info + actions */}
              <div className="px-4 py-3">
                <div className="text-sm font-medium text-brand-dark">{slot.label}</div>
                <div className="text-[10px] text-brand-medium mt-0.5 mb-3">
                  {slot.component} &middot; {slot.key}
                </div>

                <div className="flex gap-2">
                  <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs border border-brand-dark text-brand-dark cursor-pointer hover:bg-brand-dark/10 transition-colors">
                    <Upload className="w-3 h-3" />
                    {uploading === slot.key ? "Uploading..." : hasOverride ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept={isVideo ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp"}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(slot, f);
                        e.target.value = "";
                      }}
                      disabled={uploading === slot.key}
                      className="hidden"
                    />
                  </label>
                  {hasOverride && (
                    <button
                      onClick={() => handleRevert(slot)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                      title="Revert to default"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Revert
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
