"use client";

import { useState } from "react";
import Link from "next/link";

interface PortalResult {
  title: string;
  portalUrl: string;
  editUrl: string;
  createdAt: string | null;
}

export default function ArtKeyHostLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [portals, setPortals] = useState<PortalResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setPortals(null);

    try {
      const res = await fetch("/api/portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", email: email.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.portals.length === 0) {
          setError("No ArtKey portals found for this email address.");
        } else {
          setPortals(data.portals);
        }
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #0f1118 0%, #1a1a2e 50%, #16213e 100%)" }}>
      {/* Header */}
      <div className="pt-12 pb-6 text-center">
        <div className="text-amber-400 text-3xl mb-3">✦</div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          ArtKey Portal
        </h1>
        <p className="text-slate-400 text-sm mt-2">by The Artful Experience</p>
      </div>

      {/* Main Card */}
      <div className="flex-1 flex items-start justify-center px-6 pt-4">
        <div className="w-full max-w-md">
          {!portals ? (
            /* Login Form */
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Host Login
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Enter the email associated with your ArtKey portal to access your dashboard.
              </p>

              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30 transition-all"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #C9A962, #D4AF37)", color: "#1a1a2e" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      Looking up...
                    </span>
                  ) : (
                    "Access My Portals"
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-slate-500 text-xs">
                  Don&apos;t have an ArtKey portal yet?
                </p>
                <Link
                  href="/"
                  className="text-amber-400 text-xs font-medium hover:text-amber-300 transition-colors"
                >
                  Visit The Artful Experience →
                </Link>
              </div>
            </div>
          ) : (
            /* Portal List */
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Your Portals
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">{portals.length} portal{portals.length !== 1 ? "s" : ""} found</p>
                </div>
                <button
                  onClick={() => { setPortals(null); setEmail(""); setError(null); }}
                  className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-3">
                {portals.map((portal, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all"
                  >
                    <h3 className="text-white font-semibold text-sm mb-1">
                      {portal.title || "Untitled Portal"}
                    </h3>
                    {portal.createdAt && (
                      <p className="text-slate-500 text-[10px] mb-3">
                        Created {new Date(portal.createdAt).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Link
                        href={portal.editUrl}
                        className="flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #C9A962, #D4AF37)", color: "#1a1a2e" }}
                      >
                        Edit Portal
                      </Link>
                      <a
                        href={portal.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2 rounded-lg text-xs font-medium border border-white/15 text-slate-300 hover:bg-white/10 transition-all"
                      >
                        View Live →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <Link
                  href="/"
                  className="text-slate-500 text-xs hover:text-slate-300 transition-colors"
                >
                  Visit The Artful Experience
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="text-[10px] text-slate-600">
          Powered by{" "}
          <a
            href="https://theartfulexperience.com"
            className="text-slate-500 hover:text-slate-400 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            The Artful Experience
          </a>
        </p>
      </div>
    </div>
  );
}
