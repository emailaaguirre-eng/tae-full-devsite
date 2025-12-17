"use client";

import { useState, useEffect } from 'react';

interface PDFViewerProps {
  url: string;
  onClose: () => void;
  title?: string;
}

export default function PDFViewer({ url, onClose, title }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle escape key to close
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle links within PDF by intercepting clicks
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle messages from PDF iframe (if using PDF.js)
      if (event.data && event.data.type === 'pdf-link-click') {
        const linkUrl = event.data.url;
        if (linkUrl) {
          // Open link in new tab/window
          window.open(linkUrl, '_blank', 'noopener,noreferrer');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {title || 'PDF Viewer'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PDF Container */}
        <div className="flex-1 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center p-6">
                <p className="text-red-600 mb-4">{error}</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Open PDF in New Tab
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Try multiple PDF viewer methods for best compatibility */}
              {/* Method 1: Google Docs Viewer (best for mobile, handles links well) */}
              <iframe
                key="google-viewer"
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                className="w-full h-full border-0"
                onLoad={() => setLoading(false)}
                onError={() => {
                  // If Google viewer fails, try direct embed
                  setLoading(false);
                }}
                title={title || 'PDF Viewer'}
              />
            </>
          )}
        </div>

        {/* Footer with instructions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-gray-600 text-center sm:text-left">
              💡 Tip: Links in PDFs open in new tabs. Close this viewer to return to your ArtKey.
            </p>
            <div className="flex gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
              >
                Open in New Tab
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
