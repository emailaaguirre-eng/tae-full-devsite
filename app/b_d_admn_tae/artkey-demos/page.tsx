"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  X,
  QrCode,
  Copy,
  ExternalLink,
  Download,
  Check,
  Link as LinkIcon,
} from "lucide-react";

interface ArtKeyDemo {
  id: string;
  publicToken: string;
  ownerToken: string;
  ownerEmail: string | null;
  title: string;
  portalUrl: string;
  editUrl: string;
  createdAt: string | null;
  updatedAt: string | null;
}

interface NewDemoResult {
  id: string;
  publicToken: string;
  ownerToken: string;
  title: string;
  portalUrl: string;
  editUrl: string;
  qrCodeDataUrl: string | null;
}

export default function AdminArtKeyDemosPage() {
  const searchParams = useSearchParams();
  const [demos, setDemos] = useState<ArtKeyDemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const [newResult, setNewResult] = useState<NewDemoResult | null>(null);

  const loadDemos = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/artkey-demos");
      const data = await res.json();
      if (data.success) setDemos(data.data || []);
      else setError(data.error);
    } catch {
      setError("Failed to load ArtKey demos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDemos(); }, [loadDemos]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setShowForm(true);
    }
  }, [searchParams]);

  const handleCreate = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/artkey-demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, ownerEmail: ownerEmail || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setNewResult(data.data);
        setTitle("");
        setOwnerEmail("");
        await loadDemos();
      } else {
        setError(data.error || "Creation failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const downloadQr = (dataUrl: string, title: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `artkey-qr-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-brand-medium text-sm">Loading ArtKey demos...</div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-playfair">ArtKey Demo Builder</h1>
          <p className="text-sm text-brand-medium mt-1">
            Create ArtKey portals with unique URLs and QR codes
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setNewResult(null); }}
          className="bg-brand-dark text-white px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-brand-dark/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Demo
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Create form */}
      {showForm && !newResult && (
        <div className="bg-white border border-brand-light p-6 mb-6">
          <h3 className="text-sm font-semibold text-brand-dark mb-4">Create New ArtKey Portal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Portal Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                placeholder="e.g. Holiday Card 2026, Wedding Invite"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Owner Email (optional)</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                placeholder="owner@example.com"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !title.trim()}
              className="px-6 py-2 text-sm bg-brand-dark text-white hover:bg-brand-dark/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Creating..." : "Generate Portal + QR Code"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm border border-brand-light hover:bg-brand-lightest transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* New demo result */}
      {newResult && (
        <div className="bg-green-50 border border-green-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                <Check className="w-4 h-4" /> Portal Created Successfully
              </h3>
              <p className="text-lg font-bold text-brand-dark mt-1">{newResult.title}</p>
            </div>
            <button onClick={() => { setNewResult(null); setShowForm(false); }}>
              <X className="w-5 h-5 text-brand-medium" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* URLs */}
            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-brand-dark/70 uppercase tracking-wider mb-1 font-medium">Public Portal URL</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-white px-3 py-2 border border-green-200 flex-1 break-all">
                    {newResult.portalUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newResult.portalUrl, "portal")}
                    className="p-2 text-green-700 hover:bg-green-100 transition-colors"
                    title="Copy URL"
                  >
                    {copiedId === "portal" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-brand-dark/70 uppercase tracking-wider mb-1 font-medium">Owner Edit URL</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-white px-3 py-2 border border-green-200 flex-1 break-all">
                    {newResult.editUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(window.location.origin + newResult.editUrl, "edit")}
                    className="p-2 text-green-700 hover:bg-green-100 transition-colors"
                    title="Copy URL"
                  >
                    {copiedId === "edit" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-brand-dark/70 uppercase tracking-wider mb-1 font-medium">Tokens</div>
                <div className="text-xs text-brand-medium">
                  Public: <code className="bg-white px-1">{newResult.publicToken}</code>
                </div>
                <div className="text-xs text-brand-medium mt-1">
                  Owner: <code className="bg-white px-1">{newResult.ownerToken}</code>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center">
              {newResult.qrCodeDataUrl ? (
                <>
                  <div className="bg-white p-4 border border-green-200 mb-3">
                    <img
                      src={newResult.qrCodeDataUrl}
                      alt={`QR Code for ${newResult.title}`}
                      className="w-48 h-48"
                    />
                  </div>
                  <button
                    onClick={() => downloadQr(newResult.qrCodeDataUrl!, newResult.title)}
                    className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download QR Code
                  </button>
                </>
              ) : (
                <div className="text-sm text-brand-medium">QR code generation is available on the server.</div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-green-200 flex gap-2">
            <button
              onClick={() => { setNewResult(null); setShowForm(true); }}
              className="px-4 py-2 text-sm bg-brand-dark text-white hover:bg-brand-dark/90 transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      )}

      {/* Demos list */}
      <div className="bg-white border border-brand-light">
        {demos.length === 0 ? (
          <div className="p-8 text-center">
            <QrCode className="w-8 h-8 text-brand-medium mx-auto mb-2" />
            <div className="text-sm text-brand-medium">No ArtKey demos yet</div>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-brand-accent hover:underline mt-2"
            >
              Create your first demo
            </button>
          </div>
        ) : (
          <div className="divide-y divide-brand-light">
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-brand-medium font-medium bg-brand-lightest">
              <div className="col-span-3">Title</div>
              <div className="col-span-3">Portal URL</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-2">Actions</div>
            </div>
            {demos.map((d) => (
              <div key={d.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-brand-lightest/50 transition-colors">
                <div className="col-span-3">
                  <div className="text-sm font-medium text-brand-dark flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-brand-medium flex-shrink-0" />
                    {d.title}
                  </div>
                </div>
                <div className="col-span-3">
                  <code className="text-[10px] text-brand-medium break-all">{d.portalUrl}</code>
                </div>
                <div className="col-span-2 text-xs text-brand-medium">
                  {d.ownerEmail || "—"}
                </div>
                <div className="col-span-2 text-xs text-brand-medium">
                  {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                </div>
                <div className="col-span-2 flex items-center gap-1 justify-end">
                  <button
                    onClick={() => copyToClipboard(d.portalUrl, d.id)}
                    className="p-1.5 text-brand-medium hover:text-brand-dark transition-colors"
                    title="Copy Portal URL"
                  >
                    {copiedId === d.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={d.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-brand-medium hover:text-brand-dark transition-colors"
                    title="Open Portal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={d.editUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-brand-medium hover:text-brand-dark transition-colors"
                    title="Edit Portal"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
