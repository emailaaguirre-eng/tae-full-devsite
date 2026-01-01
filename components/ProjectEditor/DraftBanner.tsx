"use client";

import { X, RotateCcw, Trash2 } from 'lucide-react';

interface DraftBannerProps {
  onRestore: () => void;
  onDismiss: () => void;
  onClear: () => void;
}

export default function DraftBanner({ onRestore, onDismiss, onClear }: DraftBannerProps) {
  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-blue-600" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900">Draft found</p>
          <p className="text-xs text-blue-700">You have unsaved work. Would you like to restore it?</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRestore}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Restore
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-colors"
        >
          Dismiss
        </button>
        <button
          onClick={onClear}
          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Clear draft"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

