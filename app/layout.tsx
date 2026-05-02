import "./globals.css"
import { CartProvider } from "@/contexts/CartContext"
import { LayoutShell } from "@/components/LayoutShell"
import { headers } from "next/headers"

export const metadata = {
  title: 'The Artful Experience — Custom Prints, Cards & Digital Portals',
  description: 'Create custom greeting cards, prints, and canvas art with a digital twist. Every product includes an ArtKey\u2122 portal — a scannable QR experience for your recipients.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const requestHeaders = headers()
  const hostHeader =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || ""
  const hostname = hostHeader.toLowerCase().split(":")[0]
  const suppressSiteChrome = hostname === "artkey.theartfulexperience.com"

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen flex flex-col"
        style={suppressSiteChrome ? { backgroundColor: "#1a1a2e" } : undefined}
      >
        <CartProvider>
          <LayoutShell suppressSiteChrome={suppressSiteChrome}>
            {children}
          </LayoutShell>
        </CartProvider>
      </body>
    </html>
  )
}
