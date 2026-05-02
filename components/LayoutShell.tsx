"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FULL_SCREEN_ROUTES = [
  "/studio",
  "/b_d_admn_tae",
  "/art-key",
  "/artkey-editor",
  "/preview",
];

export function LayoutShell({
  children,
  suppressSiteChrome = false,
}: {
  children: React.ReactNode;
  suppressSiteChrome?: boolean;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // `usePathname()` can disagree between server HTML and the first client render,
  // which triggers hydration failure and may leave a blank page. Only apply
  // route-based fullscreen after mount so SSR + first client paint match.
  const routeFullScreen =
    mounted &&
    FULL_SCREEN_ROUTES.some((route) =>
      (pathname || "").startsWith(route)
    );

  const isFullScreen = suppressSiteChrome || routeFullScreen;

  if (isFullScreen) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </>
  );
}
