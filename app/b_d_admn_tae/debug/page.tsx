"use client";

import { useEffect, useState } from 'react';
import { isAdminAuthenticated, getAdminToken } from '@/lib/admin-auth';

export default function DebugPage() {
  const [authState, setAuthState] = useState<any>(null);

  useEffect(() => {
    const token = getAdminToken();
    const isAuth = isAdminAuthenticated();
    
    setAuthState({
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
      isAuthenticated: isAuth,
      localStorageAvailable: typeof window !== 'undefined' && typeof localStorage !== 'undefined',
      timestamp: new Date().toISOString(),
    });
  }, []);

  const testLogin = async () => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      });
      const data = await res.json();
      alert(`Login test: ${res.ok ? 'SUCCESS' : 'FAILED'}\n${JSON.stringify(data, null, 2)}`);
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
        window.location.reload();
      }
    } catch (err: any) {
      alert(`Login test error: ${err.message}`);
    }
  };

  const clearToken = () => {
    localStorage.removeItem('admin_token');
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Auth Debug</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Current Auth State:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(authState, null, 2)}
          </pre>
        </div>

        <div className="space-y-4">
          <button
            onClick={testLogin}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Login (admin/admin123)
          </button>
          
          <button
            onClick={clearToken}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear Token
          </button>

          <a
            href="/manage/dashboard"
            className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to Dashboard
          </a>

          <a
            href="/manage/login"
            className="block w-full text-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
}
