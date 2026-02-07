"use client";

import { useState } from 'react';
import ArtKeyPortal from "@/components/ArtKeyPortal";

export default function DemoPreviewPage() {
  const [token, setToken] = useState('691e3d09ef58e');
  const [deviceView, setDeviceView] = useState<'mobile' | 'desktop'>('mobile');

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">ArtKey Demo Preview</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ArtKey Token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter token (e.g., 691e3d09ef58e)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device View
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    deviceView === 'mobile'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📱 Mobile
                </button>
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    deviceView === 'desktop'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🖥️ Desktop
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <a
              href={`/demo/artkey-${token}`}
              target="_blank"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Open Full Demo
            </a>
            <a
              href={`/art-key/${token}`}
              target="_blank"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Portal
            </a>
          </div>
        </div>

        {/* Preview Container */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Live Preview</h2>
            <p className="text-sm text-gray-600">
              Token: <code className="bg-gray-100 px-2 py-1 rounded">{token}</code>
            </p>
          </div>

          {/* Device Frame */}
          {deviceView === 'mobile' ? (
            <div className="flex justify-center">
              <div className="w-full max-w-sm border-4 border-gray-800 rounded-[2rem] p-2 bg-gray-800 shadow-2xl">
                <div className="bg-white rounded-[1.5rem] overflow-hidden" style={{ minHeight: '600px' }}>
                  <ArtKeyPortal token={token} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-[32px] p-2 shadow-2xl" style={{ width: 'min(380px, 100%)' }}>
                <div className="bg-white rounded-[28px] overflow-hidden relative" style={{ height: 'min(700px, 75vh)', width: '100%' }}>
                  <ArtKeyPortal token={token} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
