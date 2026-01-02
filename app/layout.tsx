import type { Metadata } from "next";
import { 
  Playfair_Display, 
  Cormorant_Garamond,
  Libre_Baskerville,
  Lora,
  Cinzel,
  EB_Garamond,
  Montserrat,
  Raleway,
  Josefin_Sans,
  Great_Vibes,
  Alex_Brush,
  Allura,
  Tangerine,
  Pinyon_Script,
  Sacramento,
  Satisfy,
} from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";

// Elegant Serif fonts
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "600", "700"],
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  display: "swap",
  weight: ["400", "600"],
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-libre-baskerville",
  display: "swap",
  weight: ["400", "700"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "600"],
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
  weight: ["400", "600"],
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
  weight: ["400", "600"],
});

// Clean Sans fonts
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "600", "700"],
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
  weight: ["400", "600"],
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin-sans",
  display: "swap",
  weight: ["400", "600"],
});

// Elegant Script/Calligraphy fonts (for wedding invitations)
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-great-vibes",
  display: "swap",
  weight: ["400"],
});

const alexBrush = Alex_Brush({
  subsets: ["latin"],
  variable: "--font-alex-brush",
  display: "swap",
  weight: ["400"],
});

const allura = Allura({
  subsets: ["latin"],
  variable: "--font-allura",
  display: "swap",
  weight: ["400"],
});

const tangerine = Tangerine({
  subsets: ["latin"],
  variable: "--font-tangerine",
  display: "swap",
  weight: ["400", "700"],
});

const pinyonScript = Pinyon_Script({
  subsets: ["latin"],
  variable: "--font-pinyon-script",
  display: "swap",
  weight: ["400"],
});

const sacramento = Sacramento({
  subsets: ["latin"],
  variable: "--font-sacramento",
  display: "swap",
  weight: ["400"],
});

const satisfy = Satisfy({
  subsets: ["latin"],
  variable: "--font-satisfy",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "TheAE - Every Image Has a Story",
  description: "Every image has a story. Embedded within is a treasure. Create custom photo products, personalized art, and unique gifts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`
      ${playfairDisplay.variable} 
      ${cormorantGaramond.variable}
      ${libreBaskerville.variable}
      ${lora.variable}
      ${cinzel.variable}
      ${ebGaramond.variable}
      ${montserrat.variable}
      ${raleway.variable}
      ${josefinSans.variable}
      ${greatVibes.variable}
      ${alexBrush.variable}
      ${allura.variable}
      ${tangerine.variable}
      ${pinyonScript.variable}
      ${sacramento.variable}
      ${satisfy.variable}
    `}>
      <body className="antialiased">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
