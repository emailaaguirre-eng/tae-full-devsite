"use client";

import { useState } from 'react';

export default function AdminUsersPage() {
  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');

  const handleAddUser = () => {
    if (!newUser.username || !newUser.password) {
      setMessage('Please fill in both username and password');
      return;
    }

    // This is just for display - actual admin users are managed via environment variables
    setMessage(`To add "${newUser.username}", update the ADMIN_USERS environment variable in Vercel with this format:

JSON Format:
[
  {"username": "${newUser.username}", "password": "${newUser.password}"},
  ...other admins...
]

Or comma-separated:
${newUser.username}:${newUser.password},...other admins...`);
    
    setNewUser({ username: '', password: '' });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Users</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Add New Admin User</h2>
        <p className="text-sm text-gray-600 mb-4">
          Admin users are managed via environment variables. Use the format below to add new admins.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter password"
            />
          </div>

          <button
            onClick={handleAddUser}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate Environment Variable Format
          </button>
        </div>

        {message && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{message}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(message);
                setMessage('Copied to clipboard!');
                setTimeout(() => setMessage(''), 2000);
              }}
              className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">How to Add Admins</h2>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold mb-2">1. Go to Vercel Project Settings</h3>
            <p>Navigate to your project → Settings → Environment Variables</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Update ADMIN_USERS Variable</h3>
            <p className="mb-2">Use one of these formats:</p>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-2">
              <p className="font-mono text-xs mb-2">JSON Format (Recommended):</p>
              <pre className="text-xs overflow-x-auto">
{`[
  {"username": "admin1", "password": "pass1"},
  {"username": "admin2", "password": "pass2"}
]`}
              </pre>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-mono text-xs mb-2">Comma-Separated Format:</p>
              <pre className="text-xs overflow-x-auto">
{`admin1:pass1,admin2:pass2`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Redeploy</h3>
            <p>After updating the environment variable, redeploy your application for changes to take effect.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
