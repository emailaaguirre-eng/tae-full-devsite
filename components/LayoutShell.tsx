"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FULL_SCREEN_ROUTES = ["/studio", "/b_d_admn_tae", "/art-key", "/artkey-editor"];

export function LayoutShell({
  children,
  suppressSiteChrome = false,
}: {
  children: React.ReactNode;
  suppressSiteChrome?: boolean;
}) {
  const pathname = usePathname();
  const isFullScreen = FULL_SCREEN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (suppressSiteChrome || isFullScreen) {
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
