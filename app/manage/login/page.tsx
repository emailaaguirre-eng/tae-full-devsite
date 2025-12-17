"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('=== LOGIN ATTEMPT START ===');
    console.log('Username:', username);
    console.log('Password length:', password.length);

    try {
      console.log('Sending request to /api/admin/login...');
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      // Check if response is ok before parsing
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response text:', errorText);
        let errorMessage = 'Login failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          console.error('Parsed error:', errorData);
        } catch {
          errorMessage = errorText || `Server error: ${res.status}`;
        }
        setError(errorMessage);
        setLoading(false);
        console.log('=== LOGIN FAILED ===');
        return;
      }

      const data = await res.json();
      console.log('Login response data:', data);

      if (data.token) {
        // Store session token
        localStorage.setItem('admin_token', data.token);
        console.log('Token stored in localStorage:', data.token.substring(0, 10) + '...');
        console.log('Verifying token storage...');
        const storedToken = localStorage.getItem('admin_token');
        console.log('Token verification:', storedToken ? 'SUCCESS' : 'FAILED');
        console.log('Token length:', storedToken?.length);
        
        // Verify authentication check works
        const isAuth = localStorage.getItem('admin_token') !== null;
        console.log('isAdminAuthenticated check:', isAuth);
        
        // Longer delay to ensure everything is set, then redirect
        console.log('Redirecting to dashboard in 200ms...');
        setTimeout(() => {
          console.log('Redirecting now to /manage/dashboard...');
          // Force a full page reload to ensure AdminLayout picks up the token
          window.location.href = '/manage/dashboard';
        }, 200);
      } else {
        console.error('No token in response:', data);
        setError(data.error || 'Login failed. No token received.');
        setLoading(false);
        console.log('=== LOGIN FAILED (NO TOKEN) ===');
      }
    } catch (err: any) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('Full error:', err);
      setError(`Failed to connect to server: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 font-playfair">Admin Login</h1>
        <p className="text-gray-600 text-center mb-6">
          Access the ArtKey admin dashboard
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
