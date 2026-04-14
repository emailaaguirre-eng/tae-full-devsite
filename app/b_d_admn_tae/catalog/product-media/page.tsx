"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Trash2 } from "lucide-react";
import { adminFetchJson, AdminUnauthorizedError } from "@/lib/admin/clientFetch";

type LibraryRow = {
  id: string;
  imageUrl: string;
  originalFilename: string | null;
  mimeType: string | null;
  byteSize: number | null;
  width: number | null;
  height: number | null;
  title: string | null;
  keywords: string | null;
  sourceType: string | null;
  createdAt: string | null;
};

export default function ProductMediaLibraryPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<LibraryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { res, data } = await adminFetchJson(
        "/api/admin/product-media-library",
        undefined,
        () => router.push("/b_d_admn_tae/login")
      );
      if (res.ok && data?.success) {
        setAssets(data.data || []);
      } else {
        setMessage({ type: "error", text: data?.error || `Failed to load library (${res.status})` });
      }
    } catch (err) {
      if (!(err instanceof AdminUnauthorizedError)) {
        setMessage({ type: "error", text: "Failed to load library" });
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);
    const fd = new FormData();
    fd.append("file", file);
    if (title.trim()) fd.append("title", title.trim());
    if (keywords.trim()) fd.append("keywords", keywords.trim());
    try {
      const { res, data } = await adminFetchJson(
        "/api/admin/product-media-library",
        { method: "POST", body: fd },
        () => router.push("/b_d_admn_tae/login")
      );
      if (res.ok && data?.success) {
        setMessage({ type: "success", text: "Image added to Product Media Library." });
        setTitle("");
        setKeywords("");
        load();
      } else {
        setMessage({ type: "error", text: data?.error || `Upload failed (${res.status})` });
      }
    } catch (err) {
      if (!(err instanceof AdminUnauthorizedError)) setMessage({ type: "error", text: "Upload failed" });
    }
    setUploading(false);
  };

  const handleDelete = async (a: LibraryRow) => {
    const label = a.title?.trim() || a.originalFilename || "this asset";
    if (
      !window.confirm(
        `Remove "${label}" from the Product Media Library?\n\nThe database entry will be deleted and the file removed from the server when possible.`
      )
    ) {
      return;
    }
    setDeletingId(a.id);
    setMessage(null);
    try {
      const { res, data } = await adminFetchJson(
        `/api/admin/product-media-library?id=${encodeURIComponent(a.id)}`,
        { method: "DELETE" },
        () => router.push("/b_d_admn_tae/login")
      );
      if (res.ok && data?.success) {
        setMessage({ type: "success", text: "Asset removed from the library." });
        setAssets((prev) => prev.filter((x) => x.id !== a.id));
      } else {
        setMessage({
          type: "error",
          text: data?.error || `Could not remove asset (${res.status}). It was not deleted.`,
        });
      }
    } catch (err) {
      if (!(err instanceof AdminUnauthorizedError)) {
        setMessage({ type: "error", text: "Could not remove asset. It was not deleted." });
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-medium text-sm">Loading product media library...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-brand-dark font-playfair">Product Media Library</h1>
        <p className="text-sm text-brand-medium mt-1 max-w-2xl">
          Shopper-facing images stored on tAE (heroes, galleries, variants later). This is not production
          artwork for Printful and not proof/mockup storage.
        </p>
      </div>

      {message && (
        <div
          className={`text-sm px-4 py-3 mb-4 flex items-center justify-between ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white border border-brand-light p-4 mb-6">
        <h2 className="text-sm font-medium text-brand-dark mb-3">Upload</h2>
        <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
          <label className="block text-xs text-brand-medium">
            Label / title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hero — taupe wall"
              className="mt-1 w-full border border-brand-light px-2 py-1.5 text-sm text-brand-dark"
            />
          </label>
          <label className="block text-xs text-brand-medium">
            Keywords / notes (optional)
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="comma-separated or short note"
              className="mt-1 w-full border border-brand-light px-2 py-1.5 text-sm text-brand-dark"
            />
          </label>
        </div>
        <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs border border-brand-dark text-brand-dark cursor-pointer hover:bg-brand-dark/10 transition-colors">
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "Uploading..." : "Choose image (JPEG, PNG, WebP, max 20 MB)"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <h2 className="text-sm font-medium text-brand-dark mb-3">
        Library ({assets.length} {assets.length === 1 ? "asset" : "assets"})
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((a) => (
          <div key={a.id} className="bg-white border border-brand-light overflow-hidden">
            <div className="aspect-video bg-gray-100 relative">
              <img
                src={a.imageUrl}
                alt={a.title || a.originalFilename || "Library asset"}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="px-4 py-3 text-xs text-brand-medium space-y-1">
              <div className="text-sm font-medium text-brand-dark">
                {a.title || "(no title)"}
              </div>
              <div className="break-all">{a.originalFilename}</div>
              {a.keywords && <div className="text-brand-medium/80">Notes: {a.keywords}</div>}
              <div>
                {a.mimeType}
                {a.byteSize != null && ` · ${(a.byteSize / 1024).toFixed(1)} KB`}
                {a.width != null && a.height != null && ` · ${a.width}×${a.height}`}
              </div>
              {a.createdAt && <div className="text-[10px] opacity-70">{a.createdAt}</div>}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleDelete(a)}
                  disabled={deletingId === a.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  {deletingId === a.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {assets.length === 0 && (
        <p className="text-sm text-brand-medium mt-4">No assets yet. Upload an image above.</p>
      )}
    </div>
  );
}
