import Link from "next/link";
import { brand } from "@/lib/theme";

// ArtKey landing page - redirects or shows info about ArtKeys
export default function ArtKeyPage() {
  return (
    <main className="min-h-screen" style={{ background: brand.lightest }}>
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-dark">ArtKey</h1>
          <Link href="/" className="text-sm text-brand-dark underline">Home</Link>
        </header>
        <div className="rounded-2xl bg-white shadow border border-brand-light p-6">
          <h2 className="text-xl font-bold text-brand-dark mb-4">Create Your ArtKey</h2>
          <p className="text-sm text-brand-darkest/80 mb-4">
            ArtKeys are personalized digital experiences that combine images, videos, links, and more into a beautiful, shareable portal.
          </p>
          <div className="mt-6">
            <Link 
              href="/customize" 
              className="inline-block px-6 py-3 bg-brand-dark text-white rounded-lg hover:bg-brand-darkest transition-colors"
            >
              Shop ArtKey Products
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
