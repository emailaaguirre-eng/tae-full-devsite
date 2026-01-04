/**
 * Image Crop Controls
 * SPRINT 3: Fit/Fill buttons for image cropping
 */

import { Crop, Maximize2 } from 'lucide-react';
import type { CropMode } from '@/lib/imageCrop';

interface ImageCropControlsProps {
  cropMode?: CropMode;
  onCropModeChange: (mode: CropMode) => void;
}

export default function ImageCropControls({ cropMode = 'fit', onCropModeChange }: ImageCropControlsProps) {
  return (
    <div className="flex gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
      <span className="text-xs font-medium text-gray-700 self-center">Crop:</span>
      <button
        onClick={() => onCropModeChange('fit')}
        className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
          cropMode === 'fit'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
        }`}
        title="Fit - Image fits entirely within frame"
      >
        <Maximize2 className="w-3 h-3" />
        Fit
      </button>
      <button
        onClick={() => onCropModeChange('fill')}
        className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
          cropMode === 'fill'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
        }`}
        title="Fill - Image fills frame (may crop edges)"
      >
        <Crop className="w-3 h-3" />
        Fill
      </button>
    </div>
  );
}

