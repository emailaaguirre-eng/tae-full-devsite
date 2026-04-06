"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface Artist {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  description: string | null;
  thumbnailImage: string | null;
  bioImage: string | null;
  active: boolean;
  featured: boolean;
  sortOrder: number;
}

export default function AdminGalleryPage() {
  const [items, setItems] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch {
      setError("Failed to load artists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleToggleActive = async (item: Artist) => {
    setSaving(true);
    try {
      await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, name: item.name, slug: item.slug, active: !item.active }),
      });
      await fetchItems();
    } catch {
      setError("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Artist) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/gallery?id=${item.id}`, { method: "DELETE" });
      await fetchItems();
    } catch {
      setError("Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newItems.length) return;
    [newItems[index], newItems[swapIdx]] = [newItems[swapIdx], newItems[index]];
    const reordered = newItems.map((it, i) => ({ ...it, sortOrder: i }));
    setItems(reordered);
    setSaving(true);
    try {
      await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reordered.map((it) => ({ id: it.id, sortOrder: it.sortOrder })) }),
      });
    } catch {
      setError("Failed to reorder");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Artist", sortOrder: items.length }),
      });
      const data = await res.json();
      if (data.success && data.id) {
        window.location.href = `/b_d_admn_tae/gallery/${data.id}`;
      }
    } catch {
      setError("Failed to create");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-gray-900">Gallery Artists</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage artists displayed on the /gallery page. {items.length} artist{items.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Artist
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <p className="text-gray-500 mb-4">No artists yet. The gallery page will use static JSON data as fallback.</p>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add First Artist
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3 w-16">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 w-20">Status</th>
                <th className="px-4 py-3 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMove(index, "up")}
                        disabled={index === 0 || saving}
                        className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <GripVertical className="w-3.5 h-3.5 text-gray-300 mx-auto" />
                      <button
                        onClick={() => handleMove(index, "down")}
                        disabled={index === items.length - 1 || saving}
                        className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.thumbnailImage ? (
                      <Image
                        src={item.thumbnailImage}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                        unoptimized={item.thumbnailImage.startsWith("http")}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="block text-xs text-gray-400">/{item.slug}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.title || "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(item)}
                      disabled={saving}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        item.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {item.active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/b_d_admn_tae/gallery/${item.id}`}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={saving}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
