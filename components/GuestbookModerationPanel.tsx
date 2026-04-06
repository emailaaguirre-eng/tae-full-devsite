"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type GuestbookModerationEntry = {
  id: string;
  name: string;
  shareEmailWithHost: boolean;
  email: string | null;
  message: string;
  role: string;
  approved: boolean;
  createdAt: string;
};

type Filter = "all" | "pending" | "approved";

function isApproved(v: unknown): boolean {
  return v === true || v === 1;
}

function isShareEmail(v: unknown): boolean {
  return v === true || v === 1;
}

export function GuestbookModerationPanel({
  publicToken,
  ownerToken,
}: {
  publicToken: string;
  ownerToken: string;
}) {
  const [entries, setEntries] = useState<GuestbookModerationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = publicToken.trim();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const qs = ownerToken.trim() ? `?owner=${encodeURIComponent(ownerToken.trim())}` : "";
      const res = await fetch(`/api/portal/${encodeURIComponent(token)}/guestbook${qs}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(typeof data.error === "string" ? data.error : `Failed to load (${res.status})`);
        setEntries([]);
        return;
      }
      const list = Array.isArray(data.entries) ? data.entries : [];
      setEntries(
        list.map((e: GuestbookModerationEntry) => ({
          ...e,
          approved: isApproved(e.approved),
          shareEmailWithHost: isShareEmail((e as GuestbookModerationEntry).shareEmailWithHost),
        }))
      );
    } catch {
      setError("Failed to load guestbook");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [publicToken, ownerToken]);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (entryId: string, action: "approve" | "reject") => {
    const token = publicToken.trim();
    if (!token) return;
    setBusyId(entryId);
    setError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (ownerToken.trim()) headers["X-Owner-Token"] = ownerToken.trim();
      const res = await fetch(`/api/portal/${encodeURIComponent(token)}/moderate`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ type: "guestbook", entryId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(typeof data.error === "string" ? data.error : "Moderation failed");
        return;
      }
      await load();
    } catch {
      setError("Moderation failed");
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    const pending = entries.filter((e) => !e.approved).length;
    return { total: entries.length, pending, approved: entries.length - pending };
  }, [entries]);

  const filtered = useMemo(() => {
    if (filter === "pending") return entries.filter((e) => !e.approved);
    if (filter === "approved") return entries.filter((e) => e.approved);
    return entries;
  }, [entries, filter]);

  if (!publicToken.trim()) {
    return (
      <p className="text-xs text-gray-500 mt-3">
        Save your ArtKey to receive a portal link. Then you can view and moderate guestbook entries here.
      </p>
    );
  }

  return (
    <div className="mt-4 pt-3 border-t border-gray-200">
      <div className="text-sm font-semibold text-gray-800 mb-2">Guestbook moderation</div>
      <p className="text-xs text-gray-500 mb-2">
        Uses your owner access (link token or saved session). Approve to publish; reject removes the entry.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {(
          [
            ["all", "All", counts.total],
            ["pending", "Pending", counts.pending],
            ["approved", "Approved", counts.approved],
          ] as const
        ).map(([key, label, n]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              filter === key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label} ({n})
          </button>
        ))}
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
      {loading && entries.length === 0 ? (
        <p className="text-xs text-gray-500">Loading entries…</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-500">No entries in this view.</p>
      ) : (
        <ul className="space-y-3 max-h-72 overflow-y-auto">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="p-3 rounded-lg border border-gray-200 bg-white text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="font-medium text-gray-900">{e.name}</span>
                <span
                  className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                    e.approved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {e.approved ? "Approved" : "Pending"}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mb-1 space-y-0.5">
                <div>{e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}</div>
                <div>
                  <span className="font-medium text-gray-600">Email shared with host: </span>
                  {e.shareEmailWithHost ? "Yes" : "No"}
                </div>
                <div>
                  <span className="font-medium text-gray-600">Guest email: </span>
                  {!e.shareEmailWithHost
                    ? "Email not shared"
                    : e.email
                      ? e.email
                      : "No email provided"}
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap break-words">{e.message}</p>
              {!e.approved && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    disabled={busyId === e.id}
                    onClick={() => moderate(e.id, "approve")}
                    className="px-3 py-1 rounded-md text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === e.id}
                    onClick={() => moderate(e.id, "reject")}
                    className="px-3 py-1 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
