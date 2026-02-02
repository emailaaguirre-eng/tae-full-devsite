"use client";

import { useState } from 'react';
import {
  Paintbrush,
  Droplets,
  Layers,
  Palette,
  Pencil,
  Smile,
  Film,
  Eraser,
  ZoomIn,
  ScanFace,
  Sparkles,
  Image as ImageIcon,
  Settings,
  X,
  ExternalLink,
  Check,
  Loader2,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface AIEffect {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'artistic' | 'cartoon' | 'sketch' | 'enhance';
  description: string;
  cssPreview: string;
  credits: number;
}

interface AIEffectsPanelProps {
  onApplyEffect: (effectId: string, imageDataUrl: string) => Promise<string | null>;
  currentImageDataUrl: string | null;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

// =============================================================================
// AI EFFECTS DEFINITIONS
// =============================================================================

const aiEffects: AIEffect[] = [
  // Artistic Styles
  { id: 'vangogh', name: 'Van Gogh', icon: <Paintbrush className="w-5 h-5" />, category: 'artistic', description: 'Swirling brushstrokes', cssPreview: 'saturate(1.4) contrast(1.2) sepia(0.3)', credits: 1 },
  { id: 'monet', name: 'Monet', icon: <Droplets className="w-5 h-5" />, category: 'artistic', description: 'Impressionist', cssPreview: 'saturate(0.9) brightness(1.1) blur(0.5px)', credits: 1 },
  { id: 'picasso', name: 'Picasso', icon: <Layers className="w-5 h-5" />, category: 'artistic', description: 'Cubist', cssPreview: 'contrast(1.4) saturate(1.3)', credits: 1 },
  { id: 'warhol', name: 'Pop Art', icon: <Palette className="w-5 h-5" />, category: 'artistic', description: 'Bold colors', cssPreview: 'saturate(2) contrast(1.5) brightness(1.1)', credits: 1 },
  { id: 'watercolor', name: 'Watercolor', icon: <Droplets className="w-5 h-5" />, category: 'artistic', description: 'Soft paint', cssPreview: 'saturate(0.8) brightness(1.1) blur(1px)', credits: 1 },
  { id: 'oilpainting', name: 'Oil Painting', icon: <Paintbrush className="w-5 h-5" />, category: 'artistic', description: 'Classical', cssPreview: 'saturate(1.3) contrast(1.2)', credits: 1 },
  
  // Cartoon & Anime
  { id: 'cartoon', name: 'Cartoon', icon: <Smile className="w-5 h-5" />, category: 'cartoon', description: 'Cartoon style', cssPreview: 'saturate(1.5) contrast(1.4)', credits: 1 },
  { id: 'anime', name: 'Anime', icon: <Sparkles className="w-5 h-5" />, category: 'cartoon', description: 'Anime style', cssPreview: 'saturate(1.3) contrast(1.2) brightness(1.05)', credits: 1 },
  { id: 'comic', name: 'Comic Book', icon: <Layers className="w-5 h-5" />, category: 'cartoon', description: 'Comic style', cssPreview: 'contrast(1.6) saturate(1.4)', credits: 1 },
  { id: 'pixar', name: 'Pixar 3D', icon: <Film className="w-5 h-5" />, category: 'cartoon', description: '3D animation', cssPreview: 'saturate(1.2) brightness(1.1)', credits: 1 },
  { id: 'caricature', name: 'Caricature', icon: <Smile className="w-5 h-5" />, category: 'cartoon', description: 'Exaggerated', cssPreview: 'contrast(1.3) saturate(1.2)', credits: 1 },
  
  // Sketch & Line Art
  { id: 'pencil', name: 'Pencil Sketch', icon: <Pencil className="w-5 h-5" />, category: 'sketch', description: 'Hand-drawn', cssPreview: 'grayscale(1) contrast(1.8) brightness(1.3)', credits: 1 },
  { id: 'lineart', name: 'Line Art', icon: <Pencil className="w-5 h-5" />, category: 'sketch', description: 'Clean lines', cssPreview: 'grayscale(1) contrast(2.5) brightness(1.5) invert(1)', credits: 1 },
  { id: 'rotoscope', name: 'Rotoscope', icon: <Film className="w-5 h-5" />, category: 'sketch', description: 'Animation style', cssPreview: 'contrast(2) saturate(0.5)', credits: 1 },
  { id: 'charcoal', name: 'Charcoal', icon: <Pencil className="w-5 h-5" />, category: 'sketch', description: 'Dramatic', cssPreview: 'grayscale(1) contrast(1.8)', credits: 1 },
  
  // AI Enhancement
  { id: 'removebg', name: 'Remove BG', icon: <Eraser className="w-5 h-5" />, category: 'enhance', description: 'Remove background', cssPreview: '', credits: 1 },
  { id: 'upscale', name: 'Upscale 4x', icon: <ZoomIn className="w-5 h-5" />, category: 'enhance', description: 'Enhance resolution', cssPreview: '', credits: 1 },
  { id: 'facefix', name: 'Face Enhance', icon: <ScanFace className="w-5 h-5" />, category: 'enhance', description: 'Fix faces', cssPreview: 'contrast(1.05) brightness(1.02)', credits: 1 },
  { id: 'colorize', name: 'Colorize', icon: <Palette className="w-5 h-5" />, category: 'enhance', description: 'Add color to B&W', cssPreview: 'sepia(0.4) saturate(1.6)', credits: 1 },
  { id: 'denoise', name: 'Denoise', icon: <Sparkles className="w-5 h-5" />, category: 'enhance', description: 'Remove noise', cssPreview: 'blur(0.3px)', credits: 1 },
  { id: 'sharpen', name: 'AI Sharpen', icon: <ZoomIn className="w-5 h-5" />, category: 'enhance', description: 'Enhance details', cssPreview: 'contrast(1.15)', credits: 1 },
];

const categories = [
  { id: 'artistic', name: 'Artistic', icon: <Paintbrush className="w-4 h-4" /> },
  { id: 'cartoon', name: 'Cartoon', icon: <Smile className="w-4 h-4" /> },
  { id: 'sketch', name: 'Sketch', icon: <Pencil className="w-4 h-4" /> },
  { id: 'enhance', name: 'Enhance', icon: <Sparkles className="w-4 h-4" /> },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function AIEffectsPanel({
  onApplyEffect,
  currentImageDataUrl,
  isProcessing,
  setIsProcessing,
}: AIEffectsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string>('artistic');
  const [previewEffect, setPreviewEffect] = useState<AIEffect | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Check if API is configured
  useState(() => {
    checkApiStatus();
  });

  const checkApiStatus = async () => {
    try {
      const res = await fetch('/api/ai-effects/status');
      const data = await res.json();
      setApiConfigured(data.configured);
    } catch {
      setApiConfigured(false);
    }
  };

  const handleEffectClick = (effect: AIEffect) => {
    if (!currentImageDataUrl) {
      alert('Please add an image to the canvas first');
      return;
    }
    setPreviewEffect(effect);
  };

  const handleApplyEffect = async () => {
    if (!previewEffect || !currentImageDataUrl) return;

    if (!apiConfigured) {
      setShowSettings(true);
      return;
    }

    setIsProcessing(true);
    setProcessingStatus(`Applying ${previewEffect.name}...`);

    try {
      const result = await onApplyEffect(previewEffect.id, currentImageDataUrl);
      if (result) {
        setProcessingStatus(`${previewEffect.name} applied successfully!`);
        setTimeout(() => {
          setPreviewEffect(null);
          setProcessingStatus('');
        }, 1500);
      } else {
        setProcessingStatus('Failed to apply effect. Please try again.');
      }
    } catch (error) {
      setProcessingStatus('Error applying effect');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredEffects = aiEffects.filter(e => e.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Effects
        </h3>
        <button
          onClick={() => setShowSettings(true)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          title="API Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs">
        <Sparkles className="w-4 h-4 flex-shrink-0" />
        <span>Preview is FREE! Only &quot;Apply&quot; uses AI credits.</span>
      </div>

      {/* API Status */}
      {!apiConfigured && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
          <Settings className="w-4 h-4 flex-shrink-0" />
          <span>Configure API keys to enable AI effects</span>
          <button
            onClick={() => setShowSettings(true)}
            className="ml-auto text-amber-800 font-medium hover:underline"
          >
            Setup
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.icon}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Effects Grid */}
      <div className="grid grid-cols-3 gap-2">
        {filteredEffects.map(effect => (
          <button
            key={effect.id}
            onClick={() => handleEffectClick(effect)}
            disabled={isProcessing}
            className={`p-3 border rounded-xl text-center transition-all flex flex-col items-center gap-1.5 disabled:opacity-50 ${
              previewEffect?.id === effect.id
                ? 'border-gray-900 bg-gray-50 shadow-md'
                : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <span className="text-gray-700">{effect.icon}</span>
            <span className="text-[10px] text-gray-600 font-medium leading-tight">{effect.name}</span>
          </button>
        ))}
      </div>

      {/* Preview Modal */}
      {previewEffect && currentImageDataUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold text-gray-900">
                Preview: {previewEffect.name}
              </h4>
              <button
                onClick={() => setPreviewEffect(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Image */}
            <div className="p-4 bg-gray-100">
              <div className="relative aspect-square max-h-[300px] mx-auto overflow-hidden rounded-xl bg-white shadow-inner">
                <img
                  src={currentImageDataUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  style={{ filter: previewEffect.cssPreview || 'none' }}
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">{processingStatus}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            <div className="px-4 py-2 bg-gray-50 text-center">
              <p className="text-xs text-gray-500">
                ⚠️ Preview is a CSS approximation. Click Apply for full AI processing.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setPreviewEffect(null)}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyEffect}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Apply Effect
                    <span className="text-xs opacity-70">(1 credit)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                API Settings
              </h4>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                To use AI effects, you need API keys from these services:
              </p>

              {/* Replicate */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">Replicate API</h5>
                    <p className="text-xs text-gray-500">Powers most AI effects</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                    $5 free credit
                  </span>
                </div>
                <a
                  href="https://replicate.com/account/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Get Free API Key
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Remove.bg */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">Remove.bg API</h5>
                    <p className="text-xs text-gray-500">Better background removal (optional)</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                    50 free/month
                  </span>
                </div>
                <a
                  href="https://www.remove.bg/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Get Free API Key
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Add keys in your environment variables or admin settings
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowSettings(false);
                  checkApiStatus();
                }}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
