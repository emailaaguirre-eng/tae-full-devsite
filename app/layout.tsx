import type { Metadata } from "next";
import { 
  Playfair_Display, 
  Nunito_Sans,
  Cormorant_Garamond,
  Libre_Baskerville,
  Lora,
  Cinzel,
  Montserrat,
  Inter,
  Poppins,
  Raleway,
  Dancing_Script,
  Great_Vibes,
  Pacifico,
} from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "600", "700"],
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["400", "600", "700"],
});

// Editor fonts - Serif
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

// Editor fonts - Sans
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "600"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "600"],
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
  weight: ["400", "600"],
});

// Editor fonts - Script
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
  display: "swap",
  weight: ["400"],
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-great-vibes",
  display: "swap",
  weight: ["400"],
});

const pacifico = Pacifico({
  subsets: ["latin"],
  variable: "--font-pacifico",
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
      ${nunitoSans.variable}
      ${cormorantGaramond.variable}
      ${libreBaskerville.variable}
      ${lora.variable}
      ${cinzel.variable}
      ${montserrat.variable}
      ${inter.variable}
      ${poppins.variable}
      ${raleway.variable}
      ${dancingScript.variable}
      ${greatVibes.variable}
      ${pacifico.variable}
    `}>
      <body className="antialiased">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
