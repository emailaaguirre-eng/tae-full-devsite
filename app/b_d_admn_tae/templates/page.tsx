"use client";

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-fetch';

interface Template {
  id: string;
  value: string;
  name: string;
  bg: string;
  button: string;
  text: string;
  title: string;
  category: string;
  buttonStyle?: string;
  buttonShape?: string;
  headerIcon?: string;
  titleFont?: string;
  buttonBorder?: string;
  builtin: boolean;
  enabled: boolean;
  createdAt?: string;
}

const EMPTY_FORM = {
  name: '', bg: '#FFFFFF', button: '#4f46e5', text: '#1d1d1f', title: '#4f46e5',
  category: 'classic', buttonStyle: 'solid', buttonShape: 'pill', headerIcon: '', titleFont: '', buttonBorder: '',
};

export default function TemplatesAdmin() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'builtin' | 'custom'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [cloneFrom, setCloneFrom] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    try {
      const res = await adminFetch('/api/admin/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch { /* handled by adminFetch */ }
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const toggleEnabled = async (id: string, enabled: boolean) => {
    await adminFetch('/api/admin/templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled }),
    });
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, enabled } : t));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        // Update existing custom template
        await adminFetch('/api/admin/templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...form }),
        });
      } else {
        // Create new
        await adminFetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, cloneFrom: cloneFrom || undefined }),
        });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setCloneFrom('');
      await fetchTemplates();
    } catch { /* handled */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this custom template? Existing ArtKeys using it will keep their saved colors.')) return;
    await adminFetch(`/api/admin/templates?id=${id}`, { method: 'DELETE' });
    await fetchTemplates();
  };

  const startEdit = (t: Template) => {
    setForm({
      name: t.name, bg: t.bg, button: t.button, text: t.text, title: t.title,
      category: t.category, buttonStyle: t.buttonStyle || 'solid', buttonShape: t.buttonShape || 'pill',
      headerIcon: t.headerIcon || '', titleFont: t.titleFont || '', buttonBorder: t.buttonBorder || '',
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const startClone = (t: Template) => {
    setForm({
      name: `${t.name} (Copy)`, bg: t.bg, button: t.button, text: t.text, title: t.title,
      category: t.category, buttonStyle: t.buttonStyle || 'solid', buttonShape: t.buttonShape || 'pill',
      headerIcon: t.headerIcon || '', titleFont: t.titleFont || '', buttonBorder: t.buttonBorder || '',
    });
    setCloneFrom(t.id);
    setEditingId(null);
    setShowForm(true);
  };

  const filtered = templates.filter((t) => {
    if (filter === 'builtin') return t.builtin;
    if (filter === 'custom') return !t.builtin;
    return true;
  });

  if (loading) return <div className="p-8 text-gray-500">Loading templates...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Template Management</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setCloneFrom(''); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          + New Template
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'builtin', 'custom'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? `All (${templates.length})` : f === 'builtin' ? `Built-in (${templates.filter(t => t.builtin).length})` : `Custom (${templates.filter(t => !t.builtin).length})`}
          </button>
        ))}
      </div>

      {/* Create/Edit form modal */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Edit Template' : cloneFrom ? 'Clone Template' : 'New Template'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="My Template" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="classic">Classic</option>
                <option value="elegant">Elegant</option>
                <option value="sports">Sports</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
              <div className="flex gap-2">
                <input type="color" value={form.bg.startsWith('#') ? form.bg : '#ffffff'}
                  onChange={(e) => setForm({ ...form, bg: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                <input type="text" value={form.bg} onChange={(e) => setForm({ ...form, bg: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="#FFFFFF or linear-gradient(...)" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.button} onChange={(e) => setForm({ ...form, button: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                <input type="text" value={form.button} onChange={(e) => setForm({ ...form, button: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                <input type="text" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Style</label>
              <select value={form.buttonStyle} onChange={(e) => setForm({ ...form, buttonStyle: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="solid">Solid</option>
                <option value="outline">Outline</option>
                <option value="glass">Glass</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Shape</label>
              <select value={form.buttonShape} onChange={(e) => setForm({ ...form, buttonShape: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="pill">Pill</option>
                <option value="rounded">Rounded</option>
                <option value="square">Square</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title Font (optional)</label>
              <input type="text" value={form.titleFont} onChange={(e) => setForm({ ...form, titleFont: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="g:Playfair Display" />
            </div>
          </div>

          {/* Live preview swatch */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div className="inline-block rounded-xl overflow-hidden shadow-md border border-gray-200"
              style={{ width: 200, height: 120, background: form.bg, padding: 16, position: 'relative' }}>
              <p style={{ color: form.title, fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>{form.name || 'Template'}</p>
              <p style={{ color: form.text, fontSize: 11 }}>Sample text content</p>
              <div style={{
                position: 'absolute', bottom: 12, left: 16, right: 16,
                background: form.buttonStyle === 'outline' ? 'transparent' : form.button,
                border: form.buttonStyle === 'outline' ? `2px solid ${form.buttonBorder || form.button}` : 'none',
                color: form.buttonStyle === 'outline' ? form.button : '#fff',
                borderRadius: form.buttonShape === 'pill' ? 9999 : form.buttonShape === 'square' ? 0 : 8,
                padding: '4px 0', textAlign: 'center', fontSize: 11, fontWeight: 600,
              }}>
                Button
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving || !form.name}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((t) => (
          <div key={t.id} className={`rounded-xl overflow-hidden shadow border ${t.enabled ? 'border-gray-200' : 'border-red-200 opacity-60'}`}>
            {/* Color swatch */}
            <div style={{ background: t.bg, height: 80 }} className="relative">
              <div className="absolute bottom-2 left-3 right-3 flex gap-2">
                <span className="inline-block w-5 h-5 rounded-full border border-white/40" style={{ background: t.button }} title="Button" />
                <span className="inline-block w-5 h-5 rounded-full border border-white/40" style={{ background: t.title }} title="Title" />
                <span className="inline-block w-5 h-5 rounded-full border border-white/40" style={{ background: t.text }} title="Text" />
              </div>
              {!t.enabled && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                  Disabled
                </div>
              )}
              {t.builtin && (
                <div className="absolute top-2 left-2 bg-black/30 text-white text-xs px-2 py-0.5 rounded font-medium">
                  Built-in
                </div>
              )}
            </div>
            {/* Info + actions */}
            <div className="bg-white p-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm truncate">{t.name}</h3>
                <span className="text-xs text-gray-400 capitalize">{t.category}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => toggleEnabled(t.id, !t.enabled)}
                  className={`flex-1 text-xs py-1.5 rounded font-medium ${
                    t.enabled ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {t.enabled ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => startClone(t)}
                  className="flex-1 text-xs py-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium">
                  Clone
                </button>
                {!t.builtin && (
                  <>
                    <button onClick={() => startEdit(t)}
                      className="text-xs py-1.5 px-2 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 font-medium">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(t.id)}
                      className="text-xs py-1.5 px-2 rounded bg-red-50 text-red-600 hover:bg-red-100 font-medium">
                      Del
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
