import Link from "next/link";
import { brand } from "@/lib/theme";

// TODO: Replace with real editor UI imported from tae_wordpress_edition
export default function ArtKeyEditorPage({ params }: { params: { token: string } }) {
  const { token } = params;
  return (
    <main className="min-h-screen" style={{ background: brand.lightest }}>
      <div className="max-w-6xl mx-auto p-6 flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div className="text-xs text-brand-darkest/70">Editing token: {token}</div>
          <Link href="/" className="text-sm text-brand-dark underline">Home</Link>
        </header>
        <div className="rounded-2xl bg-white shadow border border-brand-light p-6">
          <h1 className="text-xl font-bold text-brand-dark mb-2">ArtKey Editor</h1>
          <p className="text-sm text-brand-darkest/80 mb-4">
            Placeholder for the full editor UI (from tae_wordpress_edition) with templates, colors, AZ themes,
            backgrounds, drag/reorder, uploads, guestbook settings, etc.
          </p>
          <ul className="text-sm list-disc list-inside text-brand-darkest/80 space-y-1">
            <li>Load existing data by token via WP REST; prefill editor</li>
            <li>Allow updates post-purchase (magic-link/password option)</li>
            <li>On save: push json + template/theme to WP; trigger QR/composite route</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
