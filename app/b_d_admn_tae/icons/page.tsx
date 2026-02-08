"use client";

import { useEffect, useState, useMemo } from 'react';
import { adminFetch } from '@/lib/admin-fetch';
import * as LucideIcons from 'lucide-react';

interface IconItem {
  id: string;
  label: string;
  category: string;
  type: 'builtin' | 'lucide' | 'upload';
  lucideName?: string;
  svgUrl?: string;
  svgFilename?: string;
  enabled: boolean;
}

// Get all Lucide icon names for the browser
const ALL_LUCIDE_NAMES = Object.keys(LucideIcons).filter(
  (k) => k !== 'default' && k !== 'createLucideIcon' && k !== 'icons' && typeof (LucideIcons as any)[k] === 'function' && /^[A-Z]/.test(k)
);

export default function IconsAdmin() {
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'builtin' | 'lucide' | 'upload'>('all');

  // Lucide browser state
  const [showLucide, setShowLucide] = useState(false);
  const [lucideSearch, setLucideSearch] = useState('');
  const [addingLucide, setAddingLucide] = useState('');

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadCategory, setUploadCategory] = useState('custom');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchIcons = async () => {
    try {
      const res = await adminFetch('/api/admin/icons');
      const data = await res.json();
      setIcons(data.icons || []);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => { fetchIcons(); }, []);

  const toggleEnabled = async (id: string, enabled: boolean) => {
    await adminFetch('/api/admin/icons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled }),
    });
    setIcons((prev) => prev.map((i) => (i.id === id ? { ...i, enabled } : i)));
  };

  const addLucideIcon = async (lucideName: string) => {
    setAddingLucide(lucideName);
    try {
      const res = await adminFetch('/api/admin/icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lucideName, label: lucideName, category: 'lucide' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchIcons();
      } else {
        alert(data.error || 'Failed to add icon');
      }
    } catch { /* handled */ }
    setAddingLucide('');
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadLabel) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('label', uploadLabel);
      formData.append('category', uploadCategory);

      const res = await adminFetch('/api/admin/icons', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setShowUpload(false);
        setUploadFile(null);
        setUploadLabel('');
        await fetchIcons();
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch { /* handled */ }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this icon?')) return;
    await adminFetch(`/api/admin/icons?id=${id}`, { method: 'DELETE' });
    await fetchIcons();
  };

  const filtered = icons.filter((i) => {
    if (filter === 'all') return true;
    return i.type === filter;
  });

  // Lucide browser: already-added names
  const addedLucideNames = useMemo(
    () => new Set(icons.filter((i) => i.type === 'lucide').map((i) => i.lucideName)),
    [icons]
  );

  const filteredLucide = useMemo(() => {
    if (!lucideSearch) return ALL_LUCIDE_NAMES.slice(0, 60);
    const q = lucideSearch.toLowerCase();
    return ALL_LUCIDE_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 60);
  }, [lucideSearch]);

  // Render a Lucide icon by name
  const LucidePreview = ({ name, size = 24 }: { name: string; size?: number }) => {
    const Icon = (LucideIcons as any)[name];
    if (!Icon) return <span className="text-xs text-gray-400">?</span>;
    return <Icon size={size} />;
  };

  if (loading) return <div className="p-8 text-gray-500">Loading icons...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Icon Management</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowLucide(!showLucide); setShowUpload(false); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
            Browse Lucide
          </button>
          <button onClick={() => { setShowUpload(!showUpload); setShowLucide(false); }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">
            Upload SVG
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'builtin', 'lucide', 'upload'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {f === 'all' ? `All (${icons.length})`
              : f === 'builtin' ? `Built-in (${icons.filter((i) => i.type === 'builtin').length})`
              : f === 'lucide' ? `Lucide (${icons.filter((i) => i.type === 'lucide').length})`
              : `Uploaded (${icons.filter((i) => i.type === 'upload').length})`}
          </button>
        ))}
      </div>

      {/* Lucide browser panel */}
      {showLucide && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-3">Browse Lucide Icons</h2>
          <input type="text" value={lucideSearch} onChange={(e) => setLucideSearch(e.target.value)}
            placeholder="Search icons (e.g., Star, Heart, Music...)"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4" />
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-80 overflow-y-auto">
            {filteredLucide.map((name) => {
              const added = addedLucideNames.has(name);
              return (
                <button key={name} onClick={() => !added && addLucideIcon(name)} disabled={added || addingLucide === name}
                  title={name}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-colors ${
                    added ? 'bg-green-50 border border-green-200 cursor-default'
                    : addingLucide === name ? 'bg-indigo-50 border border-indigo-200'
                    : 'hover:bg-gray-100 border border-transparent'
                  }`}>
                  <LucidePreview name={name} size={20} />
                  <span className="text-[10px] text-gray-500 truncate w-full">{name}</span>
                  {added && <span className="text-[9px] text-green-600 font-medium">Added</span>}
                </button>
              );
            })}
          </div>
          {filteredLucide.length === 0 && <p className="text-gray-400 text-sm">No icons match your search.</p>}
          <p className="text-xs text-gray-400 mt-3">Showing up to 60 results. Type to search the full Lucide library.</p>
        </div>
      )}

      {/* SVG upload panel */}
      {showUpload && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-3">Upload Custom SVG Icon</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
              <input type="text" value={uploadLabel} onChange={(e) => setUploadLabel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="My Icon" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input type="text" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="custom" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SVG File *</label>
              <input type="file" accept=".svg,image/svg+xml"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Max 100KB. Scripts and event handlers will be stripped for safety.</p>
          <div className="flex gap-3 mt-4">
            <button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadLabel}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button onClick={() => setShowUpload(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Icon grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {filtered.map((icon) => (
          <div key={icon.id}
            className={`rounded-xl border p-3 text-center transition-colors ${
              icon.enabled ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50 opacity-60'
            }`}>
            {/* Icon preview */}
            <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center text-gray-700">
              {icon.type === 'lucide' && icon.lucideName && <LucidePreview name={icon.lucideName} size={32} />}
              {icon.type === 'upload' && icon.svgUrl && (
                <img src={icon.svgUrl} alt={icon.label} className="w-8 h-8 object-contain" />
              )}
              {icon.type === 'builtin' && (
                <span className="text-2xl font-bold text-gray-400" title="Built-in (rendered by ElegantIcons component)">
                  {icon.label.charAt(0)}
                </span>
              )}
            </div>
            <p className="text-xs font-medium truncate mb-1">{icon.label}</p>
            <p className="text-[10px] text-gray-400 mb-2 capitalize">{icon.type}</p>

            {/* Actions */}
            <div className="flex gap-1 justify-center">
              <button onClick={() => toggleEnabled(icon.id, !icon.enabled)}
                className={`text-[10px] px-2 py-1 rounded font-medium ${
                  icon.enabled ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}>
                {icon.enabled ? 'Off' : 'On'}
              </button>
              {icon.type !== 'builtin' && (
                <button onClick={() => handleDelete(icon.id)}
                  className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 font-medium">
                  Del
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
