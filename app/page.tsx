export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white shadow rounded-2xl p-8 border border-brand-light">
        <h1 className="text-2xl font-bold mb-3 text-brand-dark">tAE ArtKey (Next.js)</h1>
        <p className="text-sm text-brand-darkest/80 mb-4">
          Scaffold ready to integrate the ArtKey editor and portal. WordPress is used only via REST.
        </p>
        <ul className="text-sm list-disc list-inside space-y-1 text-brand-darkest/80">
          <li>Routes to add: /art-key/[token] (public), /art-key/edit/[token] (editor)</li>
          <li>Import editor/portal from tae_wordpress_edition (templates incl. AZ themes)</li>
          <li>Next.js API: QR + composite + upload to WP media; save token/json/qr/print via REST</li>
          <li>Styling: derived site palette (brand colors in tailwind.config.ts)</li>
        </ul>
      </div>
    </main>
  );
}
