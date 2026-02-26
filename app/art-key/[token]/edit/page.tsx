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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<"settings" | "moderation">(
    "settings"
  );

  // ── Auth ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const urlOwner = searchParams.get("owner");
    const stored = sessionStorage.getItem(`portal_owner_${token}`);
    const ot = urlOwner || stored || null;
    const payload: Record<string, any> = {
      action: "validate",
      publicToken: token,
    };
    if (ot) payload.ownerToken = ot;

    fetch("/api/portal/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;

        if (ot) {
          setOwnerToken(ot);
          // Keep legacy owner token for compatibility; server now also sets
          // an httpOnly session cookie during validation.
          sessionStorage.setItem(`portal_owner_${token}`, ot);
          // Strip owner token from URL for security
          if (urlOwner) {
            router.replace(`/art-key/${token}/edit`);
          }
        } else {
          // Admin demo-mode session (tae_demokey_* + valid admin cookie)
          setOwnerToken("__admin_demo__");
        }
        setAuthed(true);
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
      setUploadedImages(Array.isArray(d.uploadedImages) ? d.uploadedImages : []);
      setUploadedVideos(Array.isArray(d.uploadedVideos) ? d.uploadedVideos : []);
    }
  }, [authed, token]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  // ── Load guestbook for moderation ─────────────────────────────────────

  const loadGuestbook = useCallback(async () => {
    if (!authed) return;
    const url =
      ownerToken && ownerToken !== "__admin_demo__"
        ? `/api/portal/${token}/guestbook?owner=${ownerToken}`
        : `/api/portal/${token}/guestbook`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      setEntries(data.entries || []);
    }
  }, [authed, ownerToken, token]);

  useEffect(() => {
    if (activeTab === "moderation") loadGuestbook();
  }, [activeTab, loadGuestbook]);

  // ── Save handler ──────────────────────────────────────────────────────

  const handleSave = async (openLivePreview = false) => {
    if (!authed) return;
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
      uploadedImages,
      uploadedVideos,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (ownerToken && ownerToken !== "__admin_demo__") {
      headers["X-Owner-Token"] = ownerToken;
    } else if (ownerToken === "__admin_demo__") {
      headers["X-Owner-Token"] = "__admin_demo__";
    }

    const res = await fetch(`/api/portal/${token}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setSaveMsg("Saved!");
      setPreviewRefreshKey((k) => k + 1);
      if (openLivePreview && typeof window !== "undefined") {
        window.open(`https://${domain}/${token}?preview=${Date.now()}`, "_blank", "noopener,noreferrer");
      }
    } else {
      setSaveMsg(data.error || "Save failed");
    }
    setTimeout(() => setSaveMsg(null), 3000);
  };

  // ── Moderate ──────────────────────────────────────────────────────────

  const handleModerate = async (
    entryId: string,
    action: "approve" | "reject"
  ) => {
    if (!authed) return;
    setModerating(entryId);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (ownerToken && ownerToken !== "__admin_demo__") {
      headers["X-Owner-Token"] = ownerToken;
    } else if (ownerToken === "__admin_demo__") {
      headers["X-Owner-Token"] = "__admin_demo__";
    }
    await fetch(`/api/portal/${token}/moderate`, {
      method: "POST",
      headers,
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

  const uploadFile = async (file: File, kind: "image" | "video") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("publicToken", token);
    if (ownerToken && ownerToken !== "__admin_demo__") {
      formData.append("ownerToken", ownerToken);
    }

    const res = await fetch("/api/artkey/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success || !data?.url) {
      throw new Error(data?.error || `Failed to upload ${kind}`);
    }
    return data.url as string;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    setUploadErr(null);
    try {
      let next = [...uploadedImages];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file, "image");
        next = [...next, url];
      }
      setUploadedImages(next);
      setSaveMsg("Image(s) uploaded. Click Save to publish.");
    } catch (err: any) {
      setUploadErr(err?.message || "Image upload failed");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingVideo(true);
    setUploadErr(null);
    try {
      let next = [...uploadedVideos];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file, "video");
        next = [...next, url];
      }
      setUploadedVideos(next);
      setSaveMsg("Video uploaded. Click Save to publish.");
    } catch (err: any) {
      setUploadErr(err?.message || "Video upload failed");
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  };

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
  const fullEditorHref = ownerToken
    ? `/artkey-editor?portal_token=${encodeURIComponent(token)}&owner_token=${encodeURIComponent(ownerToken)}`
    : `/artkey-editor?portal_token=${encodeURIComponent(token)}`;

  const previewButtons: string[] = [
    ...(enableGallery ? ["Gallery"] : []),
    ...(enableVideo ? [videoUrl || uploadedVideos.length > 0 ? "Watch Video" : "Featured Video (add source)"] : []),
    ...(enableSpotify ? [spotifyUrl ? "Listen" : "Listen (add Spotify URL)"] : []),
    ...(showGuestbook ? ["Guestbook"] : []),
    ...(enableLinks ? links.map((l, idx) => l.label?.trim() || `Link ${idx + 1}`) : []),
  ];
  const previewTheme = portal?.theme || {};
  const previewTextColor = previewTheme.text_color || "#ffffff";
  const previewTitleColor = previewTheme.title_color || "#ffffff";
  const previewButtonColor = previewTheme.button_color || "#3b82f6";
  const previewBgColor = previewTheme.bg_color || "#1a1a2e";

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
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back
            </button>
            <Link
              href="/b_d_admn_tae/artkey-demos"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Demo Builder
            </Link>
            <Link
              href={`https://${domain}/${token}`}
              target="_blank"
              className="text-sm text-blue-600 hover:underline"
            >
              Open Portal
            </Link>
            <Link
              href={fullEditorHref}
              className="text-sm text-indigo-600 hover:underline"
            >
              Edit Full ArtKey Design
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save + Preview Live"}
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
            <Section title="Live Preview">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="text-xs text-gray-500">
                  This preview updates instantly as you edit. Use <span className="font-medium text-gray-700">Open Portal</span> to verify the published live page after saving.
                </div>
                <Link
                  href={`https://${domain}/${token}`}
                  target="_blank"
                  className="justify-self-start md:justify-self-end text-sm text-blue-600 hover:underline"
                >
                  Open Portal in New Tab
                </Link>
              </div>
              <div className="mt-2">
                <Link
                  href={fullEditorHref}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Need full page design controls? Open Full ArtKey Editor
                </Link>
              </div>
              <div className="mt-3 flex justify-center">
                <div className="w-full max-w-sm rounded-[28px] p-2 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
                  <div
                    className="rounded-[22px] min-h-[560px] px-5 py-8 text-center"
                    style={{
                      backgroundColor: previewBgColor,
                      backgroundImage: previewTheme.bg_image_url
                        ? `url(${previewTheme.bg_image_url})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <h2
                      className="text-2xl font-bold mb-4 break-words"
                      style={{ color: previewTitleColor }}
                    >
                      {title || "Your Portal Title"}
                    </h2>
                    <div className="space-y-2">
                      {previewButtons.length === 0 ? (
                        <p className="text-xs opacity-80" style={{ color: previewTextColor }}>
                          No sections enabled yet.
                        </p>
                      ) : (
                        previewButtons.map((label, idx) => (
                          <div
                            key={`${label}-${idx}`}
                            className="w-full py-3 px-4 rounded-full text-sm font-semibold shadow-md"
                            style={{ backgroundColor: previewButtonColor, color: "#fff" }}
                          >
                            {label}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">
                  Live portal snapshot (updates after Save):
                </p>
                <div className="rounded-xl border overflow-hidden bg-white">
                  <iframe
                    key={previewRefreshKey}
                    src={`https://${domain}/${token}?preview=${previewRefreshKey}`}
                    className="w-full h-[520px]"
                    title="Live Portal Snapshot"
                  />
                </div>
              </div>
            </Section>
            {uploadErr && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">
                {uploadErr}
              </div>
            )}
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
              <Section title="Featured Video">
                <div className="space-y-3">
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=... (optional)"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="flex items-center gap-3">
                    <label className="px-3 py-2 text-sm border rounded-lg cursor-pointer hover:bg-gray-50">
                      {uploadingVideo ? "Uploading..." : "Upload Video File"}
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        multiple
                        onChange={handleVideoUpload}
                        disabled={uploadingVideo}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-gray-500">MP4/WebM/MOV</span>
                  </div>
                  {uploadedVideos.length > 0 && (
                    <div className="space-y-2">
                      {uploadedVideos.map((url, i) => (
                        <div key={`${url}-${i}`} className="flex items-center gap-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline break-all flex-1"
                          >
                            {url}
                          </a>
                          <button
                            onClick={() =>
                              setUploadedVideos(uploadedVideos.filter((_, idx) => idx !== i))
                            }
                            className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {enableGallery && (
              <Section title="Gallery Uploads">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="px-3 py-2 text-sm border rounded-lg cursor-pointer hover:bg-gray-50">
                      {uploadingImage ? "Uploading..." : "Upload Image Files"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                        multiple
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-gray-500">JPG/PNG/WebP/GIF/SVG</span>
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {uploadedImages.map((url, i) => (
                        <div key={`${url}-${i}`} className="border rounded-lg p-2">
                          <img src={url} alt={`Uploaded ${i + 1}`} className="w-full h-24 object-cover rounded" />
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-600 hover:underline truncate"
                            >
                              Open
                            </a>
                            <button
                              onClick={() =>
                                setUploadedImages(uploadedImages.filter((_, idx) => idx !== i))
                              }
                              className="text-[11px] px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
