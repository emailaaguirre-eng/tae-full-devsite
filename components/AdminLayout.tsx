"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthenticated, removeAdminToken } from '@/lib/admin-auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      const auth = isAdminAuthenticated();
      const token = localStorage.getItem('admin_token');
      console.log('AdminLayout: Checking auth', { auth, hasToken: !!token, pathname });
      setAuthenticated(auth);
      setLoading(false);
      
      // Only redirect if we're not already on the login page
      if (!auth && pathname !== '/b_d_admn_tae/login') {
        console.log('AdminLayout: Not authenticated, redirecting to login');
        // Use window.location for reliable redirect
        window.location.href = '/b_d_admn_tae/login';
      } else if (auth && pathname === '/b_d_admn_tae/login') {
        console.log('AdminLayout: Already authenticated, redirecting to dashboard');
        window.location.href = '/b_d_admn_tae/dashboard';
      }
    };

    // Check immediately, then again after a short delay to catch token updates
    checkAuth();
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleLogout = () => {
    removeAdminToken();
    router.push('/b_d_admn_tae/login');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If on login page and authenticated, redirect to dashboard
  if (pathname === '/b_d_admn_tae/login' && authenticated) {
    console.log('AdminLayout: On login page but authenticated, redirecting');
    window.location.href = '/b_d_admn_tae/dashboard';
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If not authenticated and not on login page, show nothing (will redirect)
  if (!authenticated && pathname !== '/b_d_admn_tae/login') {
    console.log('AdminLayout: Not authenticated, showing nothing (redirect in progress)');
    return null;
  }

  // If on login page and not authenticated, show login form
  if (pathname === '/b_d_admn_tae/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">ArtKey Admin</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                href="/b_d_admn_tae/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/b_d_admn_tae/dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/b_d_admn_tae/demos"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/b_d_admn_tae/demos'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Demos
              </Link>
              <Link
                href="/b_d_admn_tae/artkeys"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/b_d_admn_tae/artkeys'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                ArtKeys
              </Link>
              <Link
                href="/b_d_admn_tae/users"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/b_d_admn_tae/users'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Users
              </Link>
              <Link
                href="/b_d_admn_tae/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/b_d_admn_tae/settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
