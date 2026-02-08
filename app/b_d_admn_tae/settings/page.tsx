'use client';

import { useEffect, useState } from 'react';
import { Settings, MessageCircle, ShoppingCart, Save, RefreshCw, QrCode } from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';

interface SiteSettings {
  chatbotEnabled: boolean;
  purchasingEnabled: boolean;
  artKeyPlaceholderQrUrl: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    chatbotEnabled: false,
    purchasingEnabled: false,
    artKeyPlaceholderQrUrl: 'https://theartfulexperience.com/artkey-info',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await adminFetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof SiteSettings, value: any) => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await adminFetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600 mt-2">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8" />
          Site Settings
        </h1>
        <p className="text-gray-600">Manage site-wide features and configurations</p>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Settings Cards */}
      <div className="space-y-6">
        {/* Chatbot Settings */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              A.R.I. Chatbot
            </h2>
            <p className="text-sm text-white/80">Artful Responsive Intelligence - Customer assistant</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Enable Chatbot</h3>
                <p className="text-sm text-gray-500">
                  Show the A.R.I. chat widget on all public pages
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.chatbotEnabled}
                  onChange={(e) => updateSetting('chatbotEnabled', e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Current Status:</strong>{' '}
                <span className={settings.chatbotEnabled ? 'text-green-600' : 'text-red-600'}>
                  {settings.chatbotEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, the chatbot appears as a floating button in the bottom-right corner of all pages.
              </p>
            </div>
          </div>
        </div>

        {/* Purchasing Settings */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Purchasing
            </h2>
            <p className="text-sm text-white/80">Enable or disable product purchasing</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Enable Purchasing</h3>
                <p className="text-sm text-gray-500">
                  Allow customers to add items to cart and checkout
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.purchasingEnabled}
                  onChange={(e) => updateSetting('purchasingEnabled', e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Current Status:</strong>{' '}
                <span className={settings.purchasingEnabled ? 'text-green-600' : 'text-red-600'}>
                  {settings.purchasingEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                When disabled, the "Add to Cart" button will be hidden and prices will show "Coming Soon" instead.
              </p>
            </div>
          </div>
        </div>

        {/* ArtKey QR Code Settings */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              ArtKey QR Code
            </h2>
            <p className="text-sm text-white/80">Configure the placeholder QR code shown in the Customization Studio</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="artkey-qr-url" className="block font-medium text-gray-900 mb-1">
                Placeholder QR URL
              </label>
              <p className="text-sm text-gray-500 mb-2">
                This URL is encoded into the placeholder QR code shown on products in the editor.
                It is replaced with the customer&apos;s unique ArtKey portal URL at checkout.
              </p>
              <div className="flex gap-2">
                <input
                  id="artkey-qr-url"
                  type="url"
                  value={settings.artKeyPlaceholderQrUrl || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, artKeyPlaceholderQrUrl: e.target.value }))}
                  disabled={saving}
                  placeholder="https://theartfulexperience.com/artkey-info"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none"
                />
                <button
                  onClick={() => updateSetting('artKeyPlaceholderQrUrl', settings.artKeyPlaceholderQrUrl)}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Current URL:</strong>{' '}
                <a
                  href={settings.artKeyPlaceholderQrUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {settings.artKeyPlaceholderQrUrl || 'Not set'}
                </a>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tip: Point this to an informational page about ArtKeys. This page should not appear in the main navigation.
                During checkout, this placeholder is automatically swapped with the customer&apos;s unique ArtKey portal link.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
