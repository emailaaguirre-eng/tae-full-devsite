"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface PortalData {
  id: string;
  publicToken: string;
  title: string;
  theme: Record<string, any>;
  features: Record<string, any>;
  links: { label: string; url: string }[];
  spotify: { url: string; autoplay?: boolean };
  featuredVideo: { video_url: string; button_label: string } | null;
  customizations: Record<string, any>;
  uploadedImages: string[];
  uploadedVideos: string[];
}

interface GuestbookEntry {
  id: string;
  name: string;
  email: string | null;
  message: string;
  role: string;
  approved: boolean;
  createdAt: string;
}

export default function PortalEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = params.token as string;

  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Guestbook moderation
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [moderating, setModerating] = useState<string | null>(null);

  // Editable fields
  const [title, setTitle] = useState("");
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [showGuestbook, setShowGuestbook] = useState(true);
  const [enableGallery, setEnableGallery] = useState(true);
  const [enableVideo, setEnableVideo] = useState(false);
  const [enableSpotify, setEnableSpotify] = useState(false);
  const [enableLinks, setEnableLinks] = useState(true);
  const [gbRequireApproval, setGbRequireApproval] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<"settings" | "moderation">(
    "settings"
  );

  // ── Auth ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const urlOwner = searchParams.get("owner");
    const stored = sessionStorage.getItem(`portal_owner_${token}`);
    const ot = urlOwner || stored || null;

    if (!ot) {
      setLoading(false);
      return;
    }

    // Validate the token
    fetch("/api/portal/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "validate",
        publicToken: token,
        ownerToken: ot,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setOwnerToken(ot);
          setAuthed(true);
          // Persist in session so they don't lose auth on refresh
          sessionStorage.setItem(`portal_owner_${token}`, ot);
          // Strip owner token from URL for security
          if (urlOwner) {
            router.replace(`/art-key/${token}/edit`);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, searchParams, router]);

  // ── Load portal data ──────────────────────────────────────────────────

  const loadPortal = useCallback(async () => {
    if (!authed) return;
    const res = await fetch(`/api/portal/${token}`);
    const data = await res.json();
    if (data.success) {
      const d = data.data;
      setPortal(d);
      setTitle(d.title);
      setLinks(d.links || []);
      setSpotifyUrl(d.spotify?.url || "");
      setVideoUrl(d.featuredVideo?.video_url || "");
      setShowGuestbook(d.features?.show_guestbook !== false);
      setEnableGallery(d.features?.enable_gallery !== false);
      setEnableVideo(d.features?.enable_video === true);
      setEnableSpotify(d.features?.enable_spotify === true);
      setEnableLinks(d.features?.enable_custom_links !== false);
      setGbRequireApproval(d.features?.gb_require_approval !== false);
    }
  }, [authed, token]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  // ── Load guestbook for moderation ─────────────────────────────────────

  const loadGuestbook = useCallback(async () => {
    if (!authed || !ownerToken) return;
    const res = await fetch(
      `/api/portal/${token}/guestbook?owner=${ownerToken}`
    );
    const data = await res.json();
    if (data.success) {
      setEntries(data.entries || []);
    }
  }, [authed, ownerToken, token]);

  useEffect(() => {
    if (activeTab === "moderation") loadGuestbook();
  }, [activeTab, loadGuestbook]);

  // ── Save handler ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!ownerToken) return;
    setSaving(true);
    setSaveMsg(null);

    const payload = {
      title,
      links,
      spotify: { url: spotifyUrl, autoplay: false },
      featuredVideo: videoUrl
        ? { video_url: videoUrl, button_label: "Watch" }
        : null,
      features: {
        ...(portal?.features || {}),
        show_guestbook: showGuestbook,
        enable_gallery: enableGallery,
        enable_video: enableVideo,
        enable_spotify: enableSpotify,
        enable_custom_links: enableLinks,
        gb_require_approval: gbRequireApproval,
      },
    };

    const res = await fetch(`/api/portal/${token}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Owner-Token": ownerToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);
    setSaveMsg(data.success ? "Saved!" : data.error || "Save failed");
    setTimeout(() => setSaveMsg(null), 3000);
  };

  // ── Moderate ──────────────────────────────────────────────────────────

  const handleModerate = async (
    entryId: string,
    action: "approve" | "reject"
  ) => {
    if (!ownerToken) return;
    setModerating(entryId);
    await fetch(`/api/portal/${token}/moderate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Owner-Token": ownerToken,
      },
      body: JSON.stringify({ type: "guestbook", entryId, action }),
    });
    await loadGuestbook();
    setModerating(null);
  };

  // ── Link management ───────────────────────────────────────────────────

  const addLink = () => setLinks([...links, { label: "", url: "" }]);
  const removeLink = (idx: number) =>
    setLinks(links.filter((_, i) => i !== idx));
  const updateLink = (idx: number, field: "label" | "url", value: string) =>
    setLinks(links.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

  // ── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Authenticating...</div>
      </div>
    );
  }

  if (!authed) {
    return <NotAuthenticated token={token} />;
  }

  const domain =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_ARTKEY_DOMAIN ||
        "artkey.theartfulexperience.com"
      : "artkey.theartfulexperience.com";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Edit ArtKey Portal
            </h1>
            <p className="text-xs text-gray-500">
              {domain}/{token}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/art-key/${token}`}
              target="_blank"
              className="text-sm text-blue-600 hover:underline"
            >
              Preview
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        {saveMsg && (
          <div
            className={`text-center text-sm py-1 ${
              saveMsg === "Saved!"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {saveMsg}
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 mt-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "settings"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Portal Settings
          </button>
          <button
            onClick={() => setActiveTab("moderation")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "moderation"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Moderation
            {entries.filter((e) => !e.approved).length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs bg-red-500 text-white rounded-full">
                {entries.filter((e) => !e.approved).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Title */}
            <Section title="Portal Title">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </Section>

            {/* Features Toggle */}
            <Section title="Sections">
              <div className="space-y-3">
                <Toggle
                  label="Custom Links"
                  checked={enableLinks}
                  onChange={setEnableLinks}
                />
                <Toggle
                  label="Photo Gallery"
                  checked={enableGallery}
                  onChange={setEnableGallery}
                />
                <Toggle
                  label="Featured Video"
                  checked={enableVideo}
                  onChange={setEnableVideo}
                />
                <Toggle
                  label="Spotify"
                  checked={enableSpotify}
                  onChange={setEnableSpotify}
                />
                <Toggle
                  label="Guestbook"
                  checked={showGuestbook}
                  onChange={setShowGuestbook}
                />
                {showGuestbook && (
                  <div className="ml-6">
                    <Toggle
                      label="Require Approval"
                      checked={gbRequireApproval}
                      onChange={setGbRequireApproval}
                    />
                  </div>
                )}
              </div>
            </Section>

            {/* Links */}
            {enableLinks && (
              <Section title="Links">
                <div className="space-y-3">
                  {links.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Label"
                        value={link.label}
                        onChange={(e) => updateLink(i, "label", e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) => updateLink(i, "url", e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        onClick={() => removeLink(i)}
                        className="px-3 text-red-500 hover:bg-red-50 rounded-lg text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addLink}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Add Link
                  </button>
                </div>
              </Section>
            )}

            {/* Spotify */}
            {enableSpotify && (
              <Section title="Spotify">
                <input
                  type="url"
                  placeholder="https://open.spotify.com/..."
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </Section>
            )}

            {/* Video */}
            {enableVideo && (
              <Section title="Featured Video URL">
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </Section>
            )}
          </div>
        )}

        {activeTab === "moderation" && (
          <div className="space-y-4">
            {entries.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No guestbook entries yet.
              </div>
            )}
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`bg-white rounded-xl border p-4 ${
                  !entry.approved ? "border-yellow-300" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {entry.name}
                    </p>
                    {entry.email && (
                      <p className="text-xs text-gray-400">{entry.email}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      entry.approved
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {entry.approved ? "Approved" : "Pending"}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-2">{entry.message}</p>
                <div className="flex gap-2 mt-3">
                  {!entry.approved && (
                    <button
                      onClick={() => handleModerate(entry.id, "approve")}
                      disabled={moderating === entry.id}
                      className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleModerate(entry.id, "reject")}
                    disabled={moderating === entry.id}
                    className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <div
        className={`w-10 h-6 rounded-full transition-colors relative ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
            checked ? "left-5" : "left-1"
          }`}
        />
      </div>
    </label>
  );
}

function NotAuthenticated({ token }: { token: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const res = await fetch("/api/portal/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lookup", email: email.trim() }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-sm w-full">
        <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
          ArtKey Portal Access
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Enter the email associated with your portal to access your edit link.
        </p>

        <form onSubmit={handleLookup} className="space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
          >
            {loading ? "Looking up..." : "Find My Portals"}
          </button>
        </form>

        {result && (
          <div className="mt-6">
            {result.portals?.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Your portals:</p>
                {result.portals.map((p: any, i: number) => (
                  <a
                    key={i}
                    href={p.editUrl}
                    className="block bg-white border rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-900">
                      {p.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                No portals found for this email.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
