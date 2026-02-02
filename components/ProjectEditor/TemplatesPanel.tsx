"use client";

import { useState } from 'react';
import { Layout, X, ZoomIn, ZoomOut, RotateCw, Move, Maximize2 } from 'lucide-react';
import { getAllCollageTemplates, getCollageTemplate, type CollageTemplate } from '@/lib/collageTemplates';
import type { TemplateState, FrameFillState } from './types';

interface TemplatesPanelProps {
  templateMode: boolean;
  templateState: TemplateState | undefined;
  activeSideId: string;
  onToggleTemplateMode: () => void;
  onSelectTemplate: (templateId: string) => void;
  onClearTemplate: () => void;
  onSelectFrame: (frameId: string) => void;
  onFillFrame: (assetSrc: string) => void;
  onUpdateFrameFill: (frameId: string, updates: Partial<FrameFillState>) => void;
}

export default function TemplatesPanel({
  templateMode,
  templateState,
  activeSideId,
  onToggleTemplateMode,
  onSelectTemplate,
  onClearTemplate,
  onSelectFrame,
  onFillFrame,
  onUpdateFrameFill,
}: TemplatesPanelProps) {
  const templates = getAllCollageTemplates();
  const activeTemplate = templateState ? getCollageTemplate(templateState.templateId) : null;
  const activeFrame = templateState?.activeFrameId 
    ? templateState.frames.find(f => f.frameId === templateState.activeFrameId)
    : null;

  return (
    <div className="bg-white border-t border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Layout className="w-4 h-4" />
          Templates
        </h3>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={templateMode}
            onChange={onToggleTemplateMode}
            className="w-4 h-4"
          />
          <span>Template mode</span>
        </label>
      </div>

      {templateMode ? (
        <>
          {/* Template Selector */}
          {!activeTemplate ? (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Choose Template</label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => onSelectTemplate(template.id)}
                    className="p-2 border-2 border-gray-200 rounded-md hover:border-blue-500 transition-colors text-left"
                  >
                    <p className="text-xs font-semibold text-gray-900">{template.name}</p>
                    {template.description && (
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{template.frames.length} frame{template.frames.length !== 1 ? 's' : ''}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Active Template Info */}
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                <div>
                  <p className="text-xs font-semibold text-gray-900">{activeTemplate.name}</p>
                  <p className="text-xs text-gray-500">Click frames to fill with images</p>
                </div>
                <button
                  onClick={onClearTemplate}
                  className="p-1 hover:bg-blue-100 rounded"
                  title="Clear template"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Frame Controls */}
              {activeFrame && (
                <div className="p-3 bg-gray-50 rounded-md space-y-3">
                  <p className="text-xs font-semibold text-gray-900">Frame: {activeFrame.frameId}</p>
                  
                  {activeFrame.assetSrc ? (
                    <>
                      {/* Zoom Control */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Zoom: {activeFrame.zoom.toFixed(2)}x
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateFrameFill(activeFrame.frameId, { zoom: Math.max(0.8, activeFrame.zoom - 0.1) })}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </button>
                          <input
                            type="range"
                            min="0.8"
                            max="3.0"
                            step="0.1"
                            value={activeFrame.zoom}
                            onChange={(e) => onUpdateFrameFill(activeFrame.frameId, { zoom: parseFloat(e.target.value) })}
                            className="flex-1"
                          />
                          <button
                            onClick={() => onUpdateFrameFill(activeFrame.frameId, { zoom: Math.min(3.0, activeFrame.zoom + 0.1) })}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateFrameFill(activeFrame.frameId, { offsetX: 0, offsetY: 0 })}
                          className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded text-xs font-semibold hover:bg-gray-300 flex items-center justify-center gap-1"
                        >
                          <Move className="w-3 h-3" />
                          Center
                        </button>
                        <button
                          onClick={() => onUpdateFrameFill(activeFrame.frameId, { zoom: 1.0, offsetX: 0, offsetY: 0 })}
                          className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded text-xs font-semibold hover:bg-gray-300 flex items-center justify-center gap-1"
                        >
                          <Maximize2 className="w-3 h-3" />
                          Fit
                        </button>
                        <button
                          onClick={() => onUpdateFrameFill(activeFrame.frameId, { rotation: (activeFrame.rotation + 90) % 360 })}
                          className="px-3 py-2 bg-gray-200 text-gray-800 rounded text-xs font-semibold hover:bg-gray-300 flex items-center justify-center"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Click an image thumbnail to fill this frame</p>
                  )}
                </div>
              )}

              {!activeFrame && (
                <p className="text-xs text-gray-500 text-center py-2">
                  Click a frame on the canvas to select it
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-500 text-center py-4">
          Enable Template mode to use collage templates
        </p>
      )}
    </div>
  );
}

