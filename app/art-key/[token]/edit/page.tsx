"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function PortalEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = params.token as string;

  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

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
          sessionStorage.setItem(`portal_owner_${token}`, ot);
          if (urlOwner) {
            router.replace(`/art-key/${token}/edit`);
            return;
          }
        }

        setAuthed(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, searchParams, router]);

  useEffect(() => {
    if (!loading && authed) {
      router.replace(`/artkey-editor?portal_token=${encodeURIComponent(token)}`);
    }
  }, [authed, loading, router, token]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse text-gray-500">Opening editor...</div>
    </div>
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
