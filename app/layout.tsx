import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "tAE ArtKey",
  description: "ArtKey editor and portal",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-brand-lightest text-brand-darkest">
        {children}
      </body>
    </html>
  );
}
