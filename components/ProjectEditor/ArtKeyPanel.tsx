"use client";

import { QrCode, CheckCircle2, AlertTriangle, Move, Lock } from 'lucide-react';

// Define types inline to avoid circular dependency
interface EditorObject {
  id: string;
  type: 'image' | 'text' | 'skeletonKey' | 'qr';
  src?: string;
  text?: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  width?: number;
  height?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fill?: string;
  keyId?: string;
  opacity?: number;
  locked?: boolean;
  sideId?: 'front' | 'inside' | 'back';
  url?: string;
  size?: number;
}

interface ProjectEditorConfig {
  productSlug: string;
  printSpecId?: string;
  qrRequired: boolean;
  allowedSidesForQR: Array<'front' | 'inside' | 'back'>;
  qrPlacementMode: 'fixed' | 'flexible';
  defaultSkeletonKeyId?: string;
  artKeyUrlPlaceholder?: string;
}

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
  onRemoveQRTarget?: () => void;
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
  onRemoveQRTarget,
}: ArtKeyPanelProps) {
  // Check if QR exists on current side
  const qrOnCurrentSide = objects.find(
    obj => obj.type === 'qr' && obj.sideId === activeSideId
  );
  
  // Check if QR exists on ANY allowed side (for status indicator)
  const qrOnAnyAllowedSide = config.allowedSidesForQR.some(sideId => {
    return objects.some(obj => obj.type === 'qr' && obj.sideId === sideId);
  });
  
  // Check if QR target exists on current side
  const skeletonKeyOnCurrentSide = objects.find(
    obj => obj.type === 'skeletonKey'
  );
  
  // Check if QR is required (must exist on at least one allowed side)
  const isQRRequired = config.qrRequired;

  return (
    <div className="bg-white border-t border-gray-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <QrCode className="w-4 h-4" />
        ArtKey
      </h3>

      {/* Add QR Target Button */}
      <div>
        {!skeletonKeyOnCurrentSide ? (
          <button
            onClick={() => {
              // Add a default QR target (centered, bottom)
              const defaultKeyId = 'qr_target_bottom_center';
              onSelectSkeletonKey(defaultKeyId);
              onAddSkeletonKey(defaultKeyId);
            }}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Add QR Target
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-600">
              QR target is on canvas. Click and drag to reposition it.
            </p>
            <button
              onClick={() => {
                onSelectSkeletonKey(null);
                if (onRemoveQRTarget) {
                  onRemoveQRTarget();
                }
              }}
              className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors"
            >
              Remove QR Target
            </button>
          </div>
        )}
      </div>

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
            {skeletonKeyOnCurrentSide && (
              <button
                onClick={onSnapQRToTarget}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
              >
                <Move className="w-4 h-4" />
                Snap QR to Target
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

