"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/b_d_admn_tae/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-lightest flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-playfair text-brand-dark">theAE</h1>
          <p className="text-sm text-brand-medium mt-1">Admin Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-brand-light p-8">
          <h2 className="text-lg font-semibold text-brand-dark mb-6">Sign In</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-dark text-white py-3 text-sm font-semibold hover:bg-brand-dark/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
