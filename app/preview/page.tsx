"use client";

/**
 * Site Preview Index
 * Quick navigation to all pages for review before deployment
 */

import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "600", "700"],
});

export default function PreviewPage() {
  const pages = [
    {
      category: "Main Site Pages",
      items: [
        { name: "Home", path: "/", description: "Main landing page" },
        { name: "Shop", path: "/shop", description: "Product catalog" },
        { name: "Gallery", path: "/gallery", description: "Artist gallery" },
        { name: "CoCreators", path: "/cocreators", description: "CoCreator showcase" },
        { name: "About Us", path: "/about", description: "About page" },
        { name: "Contact", path: "/contact", description: "Contact page" },
      ]
    },
    {
      category: "Product Pages",
      items: [
        { name: "Design Studio", path: "/design", description: "Product design editor" },
        { name: "ArtKey Editor", path: "/art-key/editor", description: "ArtKey portal editor" },
        { name: "Editor (Product)", path: "/editor/artprints", description: "Product-specific editor" },
      ]
    },
    {
      category: "ArtKey & QR Code",
      items: [
        { name: "ArtKey Placeholder (Simple)", path: "/artkey-simple", description: "Simple ArtKey preview" },
        { name: "ArtKey Placeholder (Full)", path: "/artkey-preview", description: "Full ArtKey preview with examples" },
        { name: "ArtKey Placeholder (Original)", path: "/art-key/placeholder", description: "Original placeholder demo" },
      ]
    },
    {
      category: "Design & Icons",
      items: [
        { name: "Design Authenticity Demo", path: "/design-demo", description: "Custom icons & organic shapes" },
      ]
    },
    {
      category: "Admin Portal",
      items: [
        { name: "Admin Login", path: "/b_d_admn_tae/login", description: "Admin authentication" },
        { name: "Products Management", path: "/b_d_admn_tae/catalog/products", description: "Manage store products" },
        { name: "Artists Management", path: "/b_d_admn_tae/catalog/artists", description: "Manage artists & assets" },
      ]
    },
  ];

  return (
    <main className={`min-h-screen bg-gray-100 ${playfairDisplay.variable}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-playfair">
            Site Preview Index
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Review all pages before deploying to server
          </p>
          <p className="text-sm text-gray-500">
            Current accent color: <span className="font-mono bg-gray-200 px-2 py-1 rounded">#475569</span> (Deep Slate)
          </p>
        </div>

        <div className="space-y-8">
          {pages.map((category, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-playfair border-b-2 border-gray-200 pb-2">
                {category.category}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((page, pageIdx) => (
                  <Link
                    key={pageIdx}
                    href={page.path}
                    className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600">
                      {page.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{page.description}</p>
                    <code className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                      {page.path}
                    </code>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3 font-playfair">
            Recent Changes to Review:
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>✅ Replaced beige accent (#e0c9af) with Deep Slate (#475569)</li>
            <li>✅ Created custom icon system (replacing emojis)</li>
            <li>✅ Added organic shapes component</li>
            <li>✅ Updated ArtKey placeholder to match mockup</li>
            <li>✅ Enhanced ArtKey editor with template categories & button customization</li>
            <li>✅ Integrated ArtKey placeholder into design editor</li>
          </ul>
        </div>

        <div className="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3 font-playfair">
            ⚠️ Known Issues:
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Design demo page may have build errors (can be disabled if needed)</li>
            <li>• Some pages may need refresh after color changes</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
