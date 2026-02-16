import "./globals.css"
import { CartProvider } from "@/contexts/CartContext"
import { LayoutShell } from "@/components/LayoutShell"

export const metadata = {
  title: 'The Artful Experience — Custom Prints, Cards & Digital Portals',
  description: 'Create custom greeting cards, prints, and canvas art with a digital twist. Every product includes an ArtKey portal — a scannable QR experience for your recipients.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <CartProvider>
          <LayoutShell>{children}</LayoutShell>
        </CartProvider>
      </body>
    </html>
  )
}
