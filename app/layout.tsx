import "./globals.css"

export const metadata = {
  title: 'theAE - Customization Studio',
  description: 'Create custom greeting cards with theAE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
