/**
 * ArtKey Informational Page
 * 
 * This page is NOT on the navbar. It serves as the landing page for
 * placeholder QR codes on products that haven't been activated yet.
 * When a customer scans a placeholder QR code, they land here to
 * learn about ArtKey and how to activate their portal.
 */

export const metadata = {
  title: 'What is an ArtKey? | The Artful Experience',
  description: 'Learn about ArtKey — your personal, interactive digital portal from The Artful Experience.',
};

export default function ArtKeyInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-indigo-600">ArtKey</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Your personal, interactive digital portal from The Artful Experience.
          </p>
        </div>

        {/* What is ArtKey */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">What is an ArtKey?</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            An ArtKey is a unique digital experience embedded in select products from The Artful Experience.
            Each ArtKey unlocks a personalized portal — a mini-website that you or the gift recipient
            can customize with photos, videos, a guestbook, music, and more.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Whether it&apos;s a greeting card, an invitation, or a piece of wall art, the ArtKey transforms
            a physical product into a living, interactive memory.
          </p>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Purchase a Product with ArtKey</h3>
                <p className="text-gray-600 mt-1">
                  Look for products marked with the ArtKey feature in our shop. These products
                  include a QR code that links to your personal portal.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Activate Your Portal</h3>
                <p className="text-gray-600 mt-1">
                  After purchase, your unique portal is created automatically. You&apos;ll receive a link
                  to customize it with your content — photos, videos, messages, and more.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Share the Experience</h3>
                <p className="text-gray-600 mt-1">
                  Recipients scan the QR code on the product and are taken to the personalized portal.
                  They can view content, sign the guestbook, and share their own memories.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-amber-800 mb-3">Scanned a QR Code?</h2>
          <p className="text-amber-700 leading-relaxed">
            If you scanned a QR code on a product and arrived here, this ArtKey hasn&apos;t been
            activated yet. This is the default landing page for products awaiting personalization.
            Once the product is purchased and the portal is set up, scanning the QR code will
            take you directly to the personalized experience.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Want to learn more about our products?</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          >
            Visit The Artful Experience
          </a>
        </div>
      </div>
    </div>
  );
}
