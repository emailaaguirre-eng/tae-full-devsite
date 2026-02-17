"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Grid3X3,
  Users,
  ShoppingCart,
  QrCode,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/b_d_admn_tae/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/b_d_admn_tae/catalog/products", label: "Products", icon: Package },
  { href: "/b_d_admn_tae/catalog/categories", label: "Categories", icon: Grid3X3 },
  { href: "/b_d_admn_tae/customers", label: "Customers", icon: Users },
  { href: "/b_d_admn_tae/orders", label: "Orders", icon: ShoppingCart },
  { href: "/b_d_admn_tae/artkey-demos", label: "ArtKey Demos", icon: QrCode },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/b_d_admn_tae/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/b_d_admn_tae/login");
  };

  const Sidebar = () => (
    <nav className="flex flex-col h-full">
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-lg font-bold font-playfair text-white">theAE</h1>
        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Admin Portal</p>
      </div>
      <div className="flex-1 py-4 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-brand-medium text-white font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </div>
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/40 hover:text-red-400 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-brand-lightest flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 bg-brand-dark flex-col flex-shrink-0 fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-brand-dark">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-brand-light px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-brand-dark"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-xs text-brand-medium uppercase tracking-wider">
            {NAV_ITEMS.find((i) => pathname.startsWith(i.href))?.label || "Admin"}
          </div>
          <Link href="/" className="text-xs text-brand-medium hover:text-brand-dark transition-colors">
            View Site
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
