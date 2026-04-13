"use client";

import { useCallback, useEffect, useState } from "react";

type PayPalMode = "sandbox" | "live";

type ModePayload = {
  effectiveMode: PayPalMode;
  databaseMode: PayPalMode | null;
  envMode: PayPalMode | null;
  databaseOverridesEnv: boolean;
};

export default function PayPalSettingsPage() {
  const [data, setData] = useState<ModePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingMode, setPendingMode] = useState<PayPalMode | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/paypal-mode", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to load PayPal mode");
        setData(null);
        return;
      }
      setData(json.data as ModePayload);
    } catch {
      setError("Failed to load PayPal mode");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const effective = data?.effectiveMode ?? "sandbox";

  const applyMode = async () => {
    if (!pendingMode) return;
    const need = pendingMode === "live" ? "LIVE" : "SANDBOX";
    if (confirmText !== need) {
      setError(`Type ${need} exactly to confirm.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/paypal-mode", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: pendingMode, confirm: need }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Save failed");
        return;
      }
      setPendingMode(null);
      setConfirmText("");
      await load();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-brand-darkest">
      <h1 className="text-2xl font-playfair font-normal text-brand-dark mb-2">PayPal</h1>
      <p className="text-sm text-brand-medium mb-8">
        Control sandbox vs live for PayPal. The server uses{" "}
        <code className="text-xs bg-brand-light/30 px-1 rounded">PAYPAL_SANDBOX_*</code> or{" "}
        <code className="text-xs bg-brand-light/30 px-1 rounded">PAYPAL_LIVE_*</code> client ID and secret with the
        matching API host; checkout loads the public client ID from{" "}
        <code className="text-xs bg-brand-light/30 px-1 rounded">/api/paypal/public-mode</code> (no rebuild when you
        switch mode here). See{" "}
        <code className="text-xs bg-brand-light/30 px-1 rounded">lib/paypal-effective-mode.ts</code>.
      </p>

      {loading && <p className="text-sm text-brand-medium">Loading…</p>}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {!loading && data && (
        <>
          <div
            className={`rounded-xl border-2 p-6 mb-8 ${
              effective === "live"
                ? "border-red-400 bg-red-50/80"
                : "border-amber-300 bg-amber-50/80"
            }`}
          >
            <p className="text-xs uppercase tracking-wider text-brand-medium mb-1">Current server mode</p>
            <p className="text-3xl font-semibold tracking-tight">
              {effective === "live" ? "LIVE" : "SANDBOX"}
            </p>
            <p className="text-sm text-brand-darkest/80 mt-3">
              {data.databaseOverridesEnv ? (
                <>
                  Source: <strong>database</strong> ({data.databaseMode}).{" "}
                  <code className="text-xs">PAYPAL_MODE</code> env is ignored while a DB value exists.
                </>
              ) : (
                <>
                  Source: <strong>environment</strong>
                  {data.envMode ? (
                    <>
                      {" "}
                      (<code className="text-xs">PAYPAL_MODE={data.envMode}</code>)
                    </>
                  ) : (
                    <> (no <code className="text-xs">PAYPAL_MODE</code> set — default sandbox)</>
                  )}
                </>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-brand-light bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-brand-dark mb-4">Switch mode</h2>
            <p className="text-sm text-brand-medium mb-4">
              Choose the target mode, then type the confirmation word exactly. Live mode sends real charges — ensure{" "}
              <code className="text-xs">PAYPAL_LIVE_CLIENT_ID</code> /{" "}
              <code className="text-xs">PAYPAL_LIVE_CLIENT_SECRET</code> are set on the server (and sandbox vars for
              sandbox).
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setPendingMode("sandbox");
                  setConfirmText("");
                  setError(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                  pendingMode === "sandbox"
                    ? "border-amber-500 bg-amber-100 text-brand-darkest"
                    : "border-brand-light bg-white text-brand-dark hover:bg-brand-light/20"
                }`}
              >
                Set Sandbox
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingMode("live");
                  setConfirmText("");
                  setError(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                  pendingMode === "live"
                    ? "border-red-500 bg-red-100 text-red-900"
                    : "border-brand-light bg-white text-brand-dark hover:bg-brand-light/20"
                }`}
              >
                Set Live
              </button>
            </div>

            {pendingMode && (
              <div className="border-t border-brand-light pt-4 mt-4 space-y-3">
                <p className="text-sm font-medium text-brand-dark">
                  Confirm: type{" "}
                  <strong className="font-mono">{pendingMode === "live" ? "LIVE" : "SANDBOX"}</strong>
                </p>
                <input
                  type="text"
                  autoComplete="off"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full max-w-xs border border-brand-light rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder={pendingMode === "live" ? "LIVE" : "SANDBOX"}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={applyMode}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-dark text-white disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save mode to database"}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setPendingMode(null);
                      setConfirmText("");
                      setError(null);
                    }}
                    className="px-4 py-2 rounded-lg text-sm border border-brand-light"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
