import Link from "next/link";
import { brand } from "@/lib/theme";

// TODO: Replace with real data fetch (WP REST) and portal rendering
export default async function ArtKeyPortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="min-h-screen" style={{ background: brand.lightest }}>
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div className="text-xs text-brand-darkest/70">Token: {token}</div>
          <Link href="/" className="text-sm text-brand-dark underline">Home</Link>
        </header>
        <div className="rounded-2xl bg-white shadow border border-brand-light p-6">
          <h1 className="text-xl font-bold text-brand-dark mb-2">ArtKey Portal</h1>
          <p className="text-sm text-brand-darkest/80 mb-4">
            Placeholder for public view. Will render the recipient portal (mobile fullscreen, desktop phone-frame)
            using data from WordPress via REST (json/template/bg/buttons/links/media/etc.).
          </p>
          <ul className="text-sm list-disc list-inside text-brand-darkest/80 space-y-1">
            <li>Load portal data by token via WP REST</li>
            <li>Show links/buttons, media modals, guestbook, Spotify, etc.</li>
            <li>Mobile: fullscreen; Desktop: phone-frame presentation</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
