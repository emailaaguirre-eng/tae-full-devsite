"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ErrorScreen,
  getButtonStyle,
  LoadingScreen,
  PortalScaffold,
  usePortal,
} from "../_shared";

export default function ArtKeyGuestbookPage() {
  const params = useParams();
  const token = params.token as string;
  const { portal, loading, error } = usePortal(token);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [shareEmailWithHost, setShareEmailWithHost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (loading) return <LoadingScreen />;
  if (error || !portal) return <ErrorScreen error={error || "Portal not found"} />;

  const textColor = portal.theme?.text_color || "#ffffff";
  const btnStyle = getButtonStyle(portal.theme || {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/portal/${token}/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
          email: email.trim() || undefined,
          shareEmailWithHost,
        }),
      });
      const data = await res.json();
      setStatus(data?.message || (data?.success ? "Submitted" : "Failed to submit"));
      if (data?.success) {
        setName("");
        setMessage("");
        setEmail("");
        setShareEmailWithHost(false);
      }
    } catch {
      setStatus("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalScaffold token={token} portal={portal} pageTitle="Guestbook">
      {status && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-sm mb-4" style={{ color: textColor }}>
          {status}
        </div>
      )}

      {portal.guestbook.length > 0 && (
        <div className="space-y-3 mb-6">
          {portal.guestbook.map((entry) => (
            <div key={entry.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm" style={{ color: textColor }}>{entry.message}</p>
              <p className="text-xs mt-2 opacity-50" style={{ color: textColor }}>
                &mdash; {entry.name}
                {entry.createdAt
                  ? ` · ${new Date(entry.createdAt).toLocaleDateString()}`
                  : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/20"
          style={{ color: textColor }}
        />
        <textarea
          placeholder="Leave a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={3}
          className="w-full bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
          style={{ color: textColor }}
        />
        <div>
          <label className="block text-xs opacity-80 mb-1" style={{ color: textColor }}>
            Email address (optional)
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/20"
            style={{ color: textColor }}
          />
        </div>
        <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: textColor }}>
          <input
            type="checkbox"
            checked={shareEmailWithHost}
            onChange={(e) => setShareEmailWithHost(e.target.checked)}
            className="mt-0.5 shrink-0"
          />
          <span>
            Share my email with the host so they can reply. If you leave this unchecked, your email is not
            stored or shown to the host.
          </span>
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 font-semibold text-sm transition-all disabled:opacity-50"
          style={btnStyle}
        >
          {submitting ? "Submitting..." : "Sign Guestbook"}
        </button>
      </form>
    </PortalScaffold>
  );
}
