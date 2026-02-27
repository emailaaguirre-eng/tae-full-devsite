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
  Paintbrush,
  Settings,
  Trash2,
  ArrowLeft,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { ARTKEY_TEMPLATES } from "@/lib/artkeyTemplates";

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

const BTN_PRIMARY =
  "bg-brand-dark text-white px-4 py-2 text-sm font-medium inline-flex items-center gap-2 hover:bg-brand-dark/90 transition-colors disabled:opacity-50";
const BTN_SECONDARY =
  "border border-brand-dark text-brand-dark px-3 py-2 text-sm font-medium inline-flex items-center gap-2 hover:bg-brand-lightest transition-colors disabled:opacity-50";
const BTN_SUBTLE =
  "border border-brand-light text-brand-dark px-3 py-2 text-sm font-medium inline-flex items-center gap-2 hover:bg-brand-lightest transition-colors disabled:opacity-50";
const BTN_CHIP =
  "px-2 py-1 text-[10px] border border-brand-light text-brand-medium hover:text-brand-dark hover:bg-brand-lightest transition-colors inline-flex items-center gap-1 disabled:opacity-50";
const BTN_ICON =
  "p-1.5 text-brand-medium hover:text-brand-dark transition-colors disabled:opacity-50";
const BTN_DANGER_ICON =
  "p-1.5 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50";

export default function AdminArtKeyDemosPage() {
  const searchParams = useSearchParams();
  const [demos, setDemos] = useState<ArtKeyDemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingArchiveFor, setSendingArchiveFor] = useState<string | null>(null);
  const [downloadingQrId, setDownloadingQrId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const [newResult, setNewResult] = useState<NewDemoResult | null>(null);
  const [qrDownloadSize, setQrDownloadSize] = useState(600);
  const [showExportTool, setShowExportTool] = useState(false);
  const [exportToken, setExportToken] = useState("");
  const [exportFormat, setExportFormat] = useState<"pdf" | "png" | "svg">("pdf");
  const [exportTemplateId, setExportTemplateId] = useState(ARTKEY_TEMPLATES[0]?.id || "artkey-elegant");
  const [exportPaper, setExportPaper] = useState<"letter" | "a4">("letter");
  const [exportWidth, setExportWidth] = useState(1800);
  const [exporting, setExporting] = useState(false);

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
    if (!exportToken && demos.length > 0) {
      setExportToken(demos[0].publicToken);
    }
  }, [demos, exportToken]);

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

  const downloadQr = (dataUrl: string, title: string, sizePx: number) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `artkey-qr-${title.toLowerCase().replace(/\s+/g, "-")}-${sizePx}px.png`;
    a.click();
  };

  const downloadPortalQr = async (demo: ArtKeyDemo) => {
    setDownloadingQrId(demo.id);
    setError("");
    try {
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(demo.portalUrl, {
        width: qrDownloadSize,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      });
      downloadQr(dataUrl, demo.title, qrDownloadSize);
    } catch {
      setError("Failed to generate QR code download");
    } finally {
      setDownloadingQrId(null);
    }
  };

  const openUrlsAndQr = async (demo: ArtKeyDemo) => {
    setError("");
    try {
      const QRCode = await import("qrcode");
      const qrCodeDataUrl = await QRCode.toDataURL(demo.portalUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      });
      setNewResult({
        id: demo.id,
        publicToken: demo.publicToken,
        ownerToken: demo.ownerToken,
        title: demo.title,
        portalUrl: demo.portalUrl,
        editUrl: demo.editUrl,
        qrCodeDataUrl,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Failed to load URL + QR panel");
    }
  };

  const printPortalQr = async (demo: { title: string; portalUrl: string }) => {
    setError("");
    try {
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(demo.portalUrl, {
        width: qrDownloadSize,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      });
      const w = window.open("", "_blank", "width=900,height=700");
      if (!w) {
        setError("Popup blocked. Please allow popups to print QR.");
        return;
      }
      w.document.write(`
        <html>
          <head><title>Print ArtKey QR</title></head>
          <body style="font-family:Arial,sans-serif;padding:24px">
            <h2 style="margin:0 0 8px">${demo.title}</h2>
            <p style="margin:0 0 16px"><a href="${demo.portalUrl}">${demo.portalUrl}</a></p>
            <img src="${dataUrl}" style="width:${Math.min(480, qrDownloadSize)}px;height:${Math.min(480, qrDownloadSize)}px;display:block;border:1px solid #ddd;padding:8px" />
            <p style="margin-top:12px;color:#555;font-size:12px">QR export: PNG (${qrDownloadSize}px)</p>
          </body>
        </html>
      `);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 200);
    } catch {
      setError("Failed to prepare printable QR");
    }
  };

  const handleDeleteDemo = async (demo: ArtKeyDemo) => {
    const confirmed = window.confirm(
      `Delete demo "${demo.title}" (${demo.publicToken})?\n\nThis will permanently remove the portal and related guestbook/media data.`
    );
    if (!confirmed) return;

    setDeletingId(demo.id);
    setError("");
    try {
      const res = await fetch("/api/admin/artkey-demos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: demo.id }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to delete demo");
      } else {
        if (newResult?.id === demo.id) setNewResult(null);
        await loadDemos();
      }
    } catch {
      setError("Network error while deleting demo");
    } finally {
      setDeletingId(null);
    }
  };

  const openExportTool = (demo?: ArtKeyDemo) => {
    if (demo) setExportToken(demo.publicToken);
    setShowExportTool(true);
  };

  const runExportDownload = async () => {
    if (!exportToken) {
      setError("Select an ArtKey portal to export.");
      return;
    }
    setExporting(true);
    setError("");
    try {
      const params = new URLSearchParams({
        token: exportToken,
        format: exportFormat,
        templateId: exportTemplateId,
      });
      if (exportFormat === "pdf") {
        params.set("paper", exportPaper);
      } else {
        params.set("width", String(exportWidth));
      }
      const url = `/api/admin/artkey-demos/export?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to export ArtKey template");
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ext = exportFormat;
      a.href = objectUrl;
      a.download = `artkey-demo-template.${ext}`;
      a.click();
      URL.revokeObjectURL(objectUrl);
      setShowExportTool(false);
    } catch {
      setError("Network error while exporting ArtKey template");
    } finally {
      setExporting(false);
    }
  };

  const handleSendArchiveDigest = async (demo?: ArtKeyDemo) => {
    const token = demo?.publicToken || null;
    setSendingArchiveFor(token || "__all__");
    setError("");
    setNotice(null);
    try {
      const res = await fetch("/api/admin/artkey/archive-digests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          token ? { publicToken: token, force: true } : {}
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.error || "Failed to send archive digest");
        return;
      }
      const sentCount = data?.summary?.sent || 0;
      const failedCount = data?.summary?.failed || 0;
      const skippedCount = data?.summary?.skipped || 0;
      if (token) {
        setNotice(
          sentCount > 0
            ? `Archive digest sent for ${token}.`
            : `No digest sent for ${token} (skipped: ${skippedCount}, failed: ${failedCount}).`
        );
      } else {
        setNotice(
          `Archive digest run complete: sent ${sentCount}, skipped ${skippedCount}, failed ${failedCount}.`
        );
      }
    } catch {
      setError("Network error while sending archive digest");
    } finally {
      setSendingArchiveFor(null);
    }
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
            Create and manage demo portals for QR testing and studio validation.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-2 border border-brand-light px-2 py-1.5 bg-white">
            <label className="text-[11px] text-brand-medium">QR Size</label>
            <select
              value={qrDownloadSize}
              onChange={(e) => setQrDownloadSize(parseInt(e.target.value, 10))}
              className="text-xs border border-brand-light px-2 py-1 bg-white"
            >
              <option value={300}>300 px</option>
              <option value={600}>600 px</option>
              <option value={900}>900 px</option>
              <option value={1200}>1200 px</option>
            </select>
          </div>
          <Link
            href="/b_d_admn_tae/dashboard"
            className={BTN_SUBTLE}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <button
            onClick={() => handleSendArchiveDigest()}
            disabled={sendingArchiveFor === "__all__"}
            className={BTN_SECONDARY}
            title="Send pre-expiry archive digest emails now"
          >
            {sendingArchiveFor === "__all__" ? "Sending..." : "Send Archive Digests"}
          </button>
          <button
            onClick={() => openExportTool()}
            className={BTN_SECONDARY}
          >
            <Printer className="w-4 h-4" /> Export Template
          </button>
          <button
            onClick={() => { setShowForm(true); setNewResult(null); }}
            className={BTN_PRIMARY}
          >
            <Plus className="w-4 h-4" /> New Portal
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}
      {notice && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 mb-4 flex items-center justify-between">
          {notice}
          <button onClick={() => setNotice(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {showExportTool && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg border border-brand-light">
            <div className="px-5 py-4 border-b border-brand-light flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-dark">Demo ArtKey Print/Export Tool</h3>
              <button onClick={() => setShowExportTool(false)} className="text-brand-medium hover:text-brand-dark">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-brand-medium bg-brand-lightest border border-brand-light px-3 py-2">
                Use this tool to generate downloadable test assets with the correct portal QR.
              </p>
              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                  ArtKey Portal
                </label>
                <select
                  value={exportToken}
                  onChange={(e) => setExportToken(e.target.value)}
                  className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest focus:outline-none focus:ring-2 focus:ring-brand-medium"
                >
                  {demos.map((d) => (
                    <option key={d.id} value={d.publicToken}>
                      {d.title} ({d.publicToken.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                    Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as "pdf" | "png" | "svg")}
                    className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest focus:outline-none focus:ring-2 focus:ring-brand-medium"
                  >
                    <option value="pdf">PDF (paper)</option>
                    <option value="svg">SVG</option>
                    <option value="png">PNG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                    Template
                  </label>
                  <select
                    value={exportTemplateId}
                    onChange={(e) => setExportTemplateId(e.target.value)}
                    className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest focus:outline-none focus:ring-2 focus:ring-brand-medium"
                  >
                    {ARTKEY_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {exportFormat === "pdf" ? (
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                    Paper
                  </label>
                  <select
                    value={exportPaper}
                    onChange={(e) => setExportPaper(e.target.value as "letter" | "a4")}
                    className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest focus:outline-none focus:ring-2 focus:ring-brand-medium"
                  >
                    <option value="letter">Letter (US)</option>
                    <option value="a4">A4</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                    Output Width (px)
                  </label>
                  <input
                    type="number"
                    min={800}
                    max={5000}
                    step={100}
                    value={exportWidth}
                    onChange={(e) => setExportWidth(parseInt(e.target.value || "1800", 10))}
                    className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest focus:outline-none focus:ring-2 focus:ring-brand-medium"
                  />
                </div>
              )}
              <p className="text-xs text-brand-medium">
                Exports always include the selected ArtKey portal QR on the template.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-brand-light flex justify-end gap-2">
              <button
                onClick={() => setShowExportTool(false)}
                className={BTN_SUBTLE}
              >
                Cancel
              </button>
              <button
                onClick={runExportDownload}
                disabled={exporting || demos.length === 0}
                className={BTN_PRIMARY}
              >
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
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
              className={BTN_PRIMARY}
            >
              {saving ? "Creating..." : "Create Portal"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className={BTN_SUBTLE}
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
                <div className="text-[10px] text-brand-dark/70 uppercase tracking-wider mb-1 font-medium">Host: Edit ArtKey Portal URL</div>
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
                    onClick={() => downloadQr(newResult.qrCodeDataUrl!, newResult.title, 300)}
                    className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download Preview QR (PNG)
                  </button>
                </>
              ) : (
                <div className="text-sm text-brand-medium">QR code generation is available on the server.</div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-green-200 flex gap-2 flex-wrap">
            <a
              href={`/artkey-editor?portal_token=${newResult.publicToken}&owner_token=${newResult.ownerToken}`}
              className={BTN_PRIMARY}
            >
              <Paintbrush className="w-4 h-4" /> ArtKey Demo Page Editor
            </a>
            <a
              href={`/art-key/${newResult.publicToken}/edit?owner=${newResult.ownerToken}`}
              className={BTN_SECONDARY}
            >
              <Settings className="w-4 h-4" /> Host: Edit ArtKey Portal
            </a>
            <button
              onClick={() => printPortalQr({ title: newResult.title, portalUrl: newResult.portalUrl })}
              className={BTN_SECONDARY}
            >
              <Printer className="w-4 h-4" /> Print QR + URL
            </button>
            <button
              onClick={() => { setNewResult(null); setShowForm(true); }}
              className={BTN_SUBTLE}
            >
              Create Another
            </button>
          </div>
        </div>
      )}

      {/* Demos list */}
      <div className="bg-white border border-brand-light">
        <div className="px-4 py-2 text-[11px] text-brand-medium border-b border-brand-light bg-brand-lightest/40">
          <span className="font-medium text-brand-dark">Admin Editor</span> is for internal design/setup.
          {" "}
          <span className="font-medium text-brand-dark">Host Settings</span> is what you send to the customer/host to manage their portal.
        </div>
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
                  <a
                    href={`/artkey-editor?portal_token=${d.publicToken}&owner_token=${d.ownerToken}`}
                    className={BTN_CHIP}
                    title="ArtKey Demo Page Editor"
                  >
                    <Paintbrush className="w-3 h-3" />
                    <span>Admin Editor</span>
                  </a>
                  <a
                    href={d.editUrl}
                    className={BTN_CHIP}
                    title="Host: Edit ArtKey Portal"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Host Settings</span>
                  </a>
                  <button
                    onClick={() => copyToClipboard(d.portalUrl, d.id)}
                    className={BTN_ICON}
                    title="Copy Portal URL"
                  >
                    {copiedId === d.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => downloadPortalQr(d)}
                    disabled={downloadingQrId === d.id}
                    className={BTN_ICON}
                    title={`Download QR Code PNG (${qrDownloadSize}px)`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => printPortalQr({ title: d.title, portalUrl: d.portalUrl })}
                    className={BTN_ICON}
                    title="Print QR + Portal URL"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openExportTool(d)}
                    className={BTN_ICON}
                    title="Export template (PDF/SVG/PNG)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openUrlsAndQr(d)}
                    className={BTN_ICON}
                    title="View URLs + QR"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={d.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={BTN_ICON}
                    title="View Portal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDeleteDemo(d)}
                    disabled={deletingId === d.id}
                    className={BTN_DANGER_ICON}
                    title="Delete Demo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSendArchiveDigest(d)}
                    disabled={sendingArchiveFor === d.publicToken}
                    className={BTN_CHIP}
                    title="Send archive digest for this portal"
                  >
                    {sendingArchiveFor === d.publicToken ? "Sending..." : "Send PDF Digest"}
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
