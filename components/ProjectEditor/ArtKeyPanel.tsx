"use client";

import { useState } from 'react';
import { QrCode, CheckCircle2, AlertTriangle, Move, Lock } from 'lucide-react';
import { getAllSkeletonKeys, getSkeletonKey, type SkeletonKeyDefinition } from '@/lib/skeletonKeys';
import type { EditorObject } from './ProjectEditor';
import type { ProjectEditorConfig } from './ProjectEditor';

interface ArtKeyPanelProps {
  config: ProjectEditorConfig;
  activeSideId: string;
  selectedSkeletonKeyId: string | null;
  objects: EditorObject[];
  showQRTarget: boolean;
  onSelectSkeletonKey: (keyId: string | null) => void;
  onAddSkeletonKey: (keyId: string) => void;
  onAddQR: () => void;
  onSnapQRToTarget: () => void;
  onToggleQRTarget: () => void;
}

export default function ArtKeyPanel({
  config,
  activeSideId,
  selectedSkeletonKeyId,
  objects,
  showQRTarget,
  onSelectSkeletonKey,
  onAddSkeletonKey,
  onAddQR,
  onSnapQRToTarget,
  onToggleQRTarget,
}: ArtKeyPanelProps) {
  const skeletonKeys = getAllSkeletonKeys();
  
  // Check if QR exists on current side
  const qrOnCurrentSide = objects.find(
    obj => obj.type === 'qr' && obj.sideId === activeSideId
  );
  
  // Check if QR exists on ANY allowed side (for status indicator)
  const qrOnAnyAllowedSide = config.allowedSidesForQR.some(sideId => {
    return objects.some(obj => obj.type === 'qr' && obj.sideId === sideId);
  });
  
  // Check if skeleton key exists on current side
  const skeletonKeyOnCurrentSide = objects.find(
    obj => obj.type === 'skeletonKey'
  );
  
  // Check if QR is required (must exist on at least one allowed side)
  const isQRRequired = config.qrRequired;
  
  // Get selected skeleton key definition
  const selectedKey = selectedSkeletonKeyId ? getSkeletonKey(selectedSkeletonKeyId) : null;

  return (
    <div className="bg-white border-t border-gray-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <QrCode className="w-4 h-4" />
        ArtKey
      </h3>

      {/* Skeleton Key Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Skeleton Key Design</label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {skeletonKeys.map((key) => (
            <button
              key={key.id}
              onClick={() => {
                onSelectSkeletonKey(key.id);
                if (!skeletonKeyOnCurrentSide) {
                  onAddSkeletonKey(key.id);
                }
              }}
              className={`p-2 border-2 rounded-md transition-colors ${
                selectedSkeletonKeyId === key.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              title={key.description || key.name}
            >
              <div className="aspect-square bg-gray-50 rounded flex items-center justify-center mb-1">
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: key.svg }}
                  style={{ transform: 'scale(0.3)', transformOrigin: 'top left' }}
                />
              </div>
              <p className="text-xs text-gray-700 truncate">{key.name}</p>
            </button>
          ))}
        </div>
        {selectedSkeletonKeyId && (
          <button
            onClick={() => {
              onSelectSkeletonKey(null);
              // Remove skeleton key from canvas
              // This will be handled by parent component
            }}
            className="mt-2 text-xs text-red-600 hover:text-red-700"
          >
            Remove Key
          </button>
        )}
      </div>

      {/* QR Target Toggle */}
      {selectedKey && (
        <div>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={showQRTarget}
              onChange={onToggleQRTarget}
              className="w-4 h-4"
            />
            <span>Show QR target guide</span>
          </div>
        </div>
      )}

      {/* QR Actions */}
      <div className="space-y-2">
        {!qrOnCurrentSide ? (
          <>
            <button
              onClick={onAddQR}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Add QR
            </button>
            {/* Helper note for default placement */}
            {config.allowedSidesForQR.includes('inside') && config.qrPlacementMode === 'flexible' && (
              <p className="text-xs text-gray-500 text-center mt-1">
                Default placement: Inside (recommended). You can move it anywhere.
              </p>
            )}
          </>
        ) : (
          <>
            <button
              onClick={onAddQR}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Regenerate QR
            </button>
            {selectedKey && (
              <button
                onClick={onSnapQRToTarget}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
              >
                <Move className="w-4 h-4" />
                Snap QR to Key Target
              </button>
            )}
          </>
        )}
      </div>

      {/* Status Indicator */}
      {isQRRequired && (
        <div className={`p-3 rounded-md flex items-center gap-2 ${
          qrOnAnyAllowedSide
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          {qrOnAnyAllowedSide ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-800">ArtKey QR included</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-yellow-800">
                ArtKey QR required on at least one of: {config.allowedSidesForQR.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
              </span>
            </>
          )}
        </div>
      )}

      {/* Placement Mode Info */}
      {qrOnCurrentSide && config.qrPlacementMode === 'fixed' && (
        <div className="p-2 bg-gray-50 rounded-md flex items-center gap-2">
          <Lock className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-600">QR is locked to target position</span>
        </div>
      )}
    </div>
  );
}

