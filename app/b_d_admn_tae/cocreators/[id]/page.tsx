"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
} from "lucide-react";

interface CoCreator {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  description: string | null;
  thumbnailImage: string | null;
  heroImage: string | null;
  active: boolean;
  featured: boolean;
  sortOrder: number;
}

export default function AdminCoCreatorEditPage() {
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<CoCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchItem = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/cocreators");
      const data = await res.json();
      if (data.success) {
        const found = data.data.find((c: CoCreator) => c.id === id);
        if (found) setItem(found);
        else setError("CoCreator not found");
      }
    } catch {
      setError("Failed to load cocreator");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/cocreators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Saved successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Save failed");
      }
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (field: "thumbnailFile" | "heroImageFile", file: File) => {
    if (!item) return;
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("id", item.id);
      formData.append("name", item.name);
      formData.append("slug", item.slug);
      formData.append(field, file);
      const res = await fetch("/api/admin/cocreators", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        await fetchItem();
        setSuccess("Image uploaded");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = async (field: "thumbnailImage" | "heroImage") => {
    if (!item) return;
    const updated = { ...item, [field]: "" };
    setItem(updated);
    setSaving(true);
    try {
      await fetch("/api/admin/cocreators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      await fetchItem();
    } catch {
      setError("Failed to remove image");
    } finally {
      setSaving(false);
    }
  };

  const slugify = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">CoCreator not found</p>
        <Link href="/b_d_admn_tae/cocreators" className="text-blue-600 hover:underline">
          Back to CoCreators
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link
          href="/b_d_admn_tae/cocreators"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Edit CoCreator</h1>
          <p className="text-sm text-gray-500">{item.name}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">dismiss</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{success}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Info</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => {
                const name = e.target.value;
                setItem((c) =>
                  c ? { ...c, name, slug: c.slug === slugify(c.name) ? slugify(name) : c.slug } : c
                );
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={item.slug}
              onChange={(e) => setItem((c) => (c ? { ...c, slug: e.target.value } : c))}
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title / Subtitle</label>
          <input
            type="text"
            value={item.title || ""}
            onChange={(e) => setItem((c) => (c ? { ...c, title: e.target.value } : c))}
            placeholder="e.g. ADAPTIVE ALPINE CLIMBER | ATHLETE | EDUCATOR"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={item.bio || ""}
            onChange={(e) => setItem((c) => (c ? { ...c, bio: e.target.value } : c))}
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Extended Description</label>
          <textarea
            value={item.description || ""}
            onChange={(e) => setItem((c) => (c ? { ...c, description: e.target.value } : c))}
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={item.active}
              onChange={(e) => setItem((c) => (c ? { ...c, active: e.target.checked } : c))}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">Active (visible on public page)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={item.featured}
              onChange={(e) => setItem((c) => (c ? { ...c, featured: e.target.checked } : c))}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">Featured</span>
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Images</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail (card image)</label>
            {item.thumbnailImage ? (
              <div className="relative group">
                <Image
                  src={item.thumbnailImage}
                  alt="Thumbnail"
                  width={200}
                  height={200}
                  className="w-full h-48 object-cover rounded-lg border"
                  unoptimized={item.thumbnailImage.startsWith("http")}
                />
                <button
                  onClick={() => handleRemoveImage("thumbnailImage")}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Upload thumbnail</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload("thumbnailFile", f);
                  }}
                />
              </label>
            )}
            {item.thumbnailImage && (
              <label className="mt-2 flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:underline">
                <Upload className="w-3 h-3" /> Replace
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload("thumbnailFile", f);
                  }}
                />
              </label>
            )}
            <div className="mt-1">
              <label className="text-xs text-gray-500">Or paste URL:</label>
              <input
                type="text"
                value={item.thumbnailImage || ""}
                onChange={(e) => setItem((c) => (c ? { ...c, thumbnailImage: e.target.value } : c))}
                placeholder="https://..."
                className="w-full border rounded px-2 py-1 text-xs mt-0.5"
              />
            </div>
          </div>

          {/* Hero Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hero / Action Image</label>
            {item.heroImage ? (
              <div className="relative group">
                <Image
                  src={item.heroImage}
                  alt="Hero image"
                  width={200}
                  height={200}
                  className="w-full h-48 object-cover rounded-lg border"
                  unoptimized={item.heroImage.startsWith("http")}
                />
                <button
                  onClick={() => handleRemoveImage("heroImage")}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Upload hero image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload("heroImageFile", f);
                  }}
                />
              </label>
            )}
            {item.heroImage && (
              <label className="mt-2 flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:underline">
                <Upload className="w-3 h-3" /> Replace
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload("heroImageFile", f);
                  }}
                />
              </label>
            )}
            <div className="mt-1">
              <label className="text-xs text-gray-500">Or paste URL:</label>
              <input
                type="text"
                value={item.heroImage || ""}
                onChange={(e) => setItem((c) => (c ? { ...c, heroImage: e.target.value } : c))}
                placeholder="https://..."
                className="w-full border rounded px-2 py-1 text-xs mt-0.5"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Link
          href="/b_d_admn_tae/cocreators"
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back to CoCreators List
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
