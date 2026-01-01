"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Transformer } from 'react-konva';
import { Image as KonvaImageType } from 'konva';
import useImage from 'use-image';
import React from 'react';
import { projectEditorStore, type UploadedAsset, type KonvaObject } from '@/lib/projectEditorStore';
import { getPrintSpec, type PrintSide } from '@/lib/printSpecs';
import { X, Undo2, Redo2, Trash2, Eye, EyeOff } from 'lucide-react';
import AssetPanel from './AssetPanel';
import ImageObject from './ImageObject';

interface ProjectEditorProps {
  printSpecId?: string;
  initialAssets?: UploadedAsset[];
  onComplete?: (exportData: { side: string; dataUrl: string; blob: Blob }[]) => void;
  onClose?: () => void;
}

export default function ProjectEditor({
  printSpecId = 'poster_simple',
  initialAssets = [],
  onComplete,
  onClose,
}: ProjectEditorProps) {
  const [state, setState] = useState(projectEditorStore.getState());
  const [stageScale, setStageScale] = useState(1);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const imageRefs = useRef<Record<string, KonvaImageType>>({});


  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = projectEditorStore.subscribe(() => {
      setState(projectEditorStore.getState());
    });

    // Initialize with print spec
    projectEditorStore.setPrintSpec(printSpecId);

    // Add initial assets
    initialAssets.forEach((asset) => {
      projectEditorStore.addAsset(asset);
    });

    return () => {
      unsubscribe();
      projectEditorStore.cleanup();
    };
  }, [printSpecId, initialAssets]);

  // Get current side spec
  const printSpec = getPrintSpec(state.printSpecId);
  const currentSideSpec = printSpec?.sides.find((s) => s.id === state.currentSide);

  // Calculate stage size and scale for display
  useEffect(() => {
    if (!currentSideSpec) return;

    const maxDisplayWidth = window.innerWidth * 0.7; // 70% of screen width
    const maxDisplayHeight = window.innerHeight * 0.8; // 80% of screen height

    const scaleX = maxDisplayWidth / currentSideSpec.canvasPx.w;
    const scaleY = maxDisplayHeight / currentSideSpec.canvasPx.h;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up

    setStageScale(scale);
  }, [currentSideSpec]);

  // Handle image load
  const handleImageLoad = useCallback((objectId: string, image: KonvaImageType) => {
    imageRefs.current[objectId] = image;
  }, []);

  // Handle object selection
  const handleSelect = useCallback((objectId: string) => {
    projectEditorStore.setSelectedObject(objectId);
  }, []);

  // Handle object drag end
  const handleDragEnd = useCallback((objectId: string, e: any) => {
    const node = e.target;
    projectEditorStore.updateObject(objectId, {
      x: node.x(),
      y: node.y(),
    });
  }, []);

  // Handle object transform end
  const handleTransformEnd = useCallback((objectId: string, e: any) => {
    const node = e.target;
    projectEditorStore.updateObject(objectId, {
      x: node.x(),
      y: node.y(),
      width: node.width() * node.scaleX(),
      height: node.height() * node.scaleY(),
      scaleX: 1,
      scaleY: 1,
      rotation: node.rotation(),
    });
  }, []);

  // Delete selected object
  const handleDelete = useCallback(() => {
    if (state.selectedObjectId) {
      projectEditorStore.removeObject(state.selectedObjectId);
    }
  }, [state.selectedObjectId]);

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current) return;

    const selectedNode = state.selectedObjectId
      ? imageRefs.current[state.selectedObjectId]
      : null;

    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [state.selectedObjectId]);

  // Export current side
  const handleExport = useCallback(async () => {
    if (!stageRef.current || !currentSideSpec) return;

    const stage = stageRef.current.getStage();
    const dataUrl = stage.toDataURL({
      pixelRatio: 1,
      width: currentSideSpec.canvasPx.w,
      height: currentSideSpec.canvasPx.h,
    });

    const response = await fetch(dataUrl);
    const blob = await response.blob();

    if (onComplete) {
      onComplete([
        {
          side: state.currentSide,
          dataUrl,
          blob,
        },
      ]);
    }
  }, [currentSideSpec, state.currentSide, onComplete]);

  if (!printSpec || !currentSideSpec) {
    return <div>Invalid print spec</div>;
  }

  const currentObjects = state.sides[state.currentSide];

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Project Editor</h2>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => projectEditorStore.undo()}
            disabled={!projectEditorStore.canUndo()}
            className="p-2 hover:bg-gray-700 rounded disabled:opacity-50"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => projectEditorStore.redo()}
            disabled={!projectEditorStore.canRedo()}
            className="p-2 hover:bg-gray-700 rounded disabled:opacity-50"
          >
            <Redo2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={!state.selectedObjectId}
            className="p-2 hover:bg-gray-700 rounded disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => projectEditorStore.setShowBleed(!state.showBleed)}
            className={`p-2 rounded ${state.showBleed ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            title="Toggle Bleed"
          >
            {state.showBleed ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => projectEditorStore.setShowTrim(!state.showTrim)}
            className={`p-2 rounded ${state.showTrim ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            title="Toggle Trim"
          >
            {state.showTrim ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => projectEditorStore.setShowSafe(!state.showSafe)}
            className={`p-2 rounded ${state.showSafe ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            title="Toggle Safe Zone"
          >
            {state.showSafe ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
          >
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <AssetPanel />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-8 overflow-auto">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <Stage
              ref={stageRef}
              width={currentSideSpec.canvasPx.w * stageScale}
              height={currentSideSpec.canvasPx.h * stageScale}
              scaleX={stageScale}
              scaleY={stageScale}
            >
              <Layer>
                {/* Print Area Background */}
                <Rect
                  x={0}
                  y={0}
                  width={currentSideSpec.canvasPx.w}
                  height={currentSideSpec.canvasPx.h}
                  fill="#ffffff"
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />

                {/* Bleed Guide */}
                {state.showBleed && (
                  <Rect
                    x={-currentSideSpec.bleedPx}
                    y={-currentSideSpec.bleedPx}
                    width={currentSideSpec.canvasPx.w + currentSideSpec.bleedPx * 2}
                    height={currentSideSpec.canvasPx.h + currentSideSpec.bleedPx * 2}
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth={1}
                    dash={[5, 5]}
                  />
                )}

                {/* Trim Guide */}
                {state.showTrim && (
                  <Rect
                    x={-currentSideSpec.trimPx}
                    y={-currentSideSpec.trimPx}
                    width={currentSideSpec.canvasPx.w + currentSideSpec.trimPx * 2}
                    height={currentSideSpec.canvasPx.h + currentSideSpec.trimPx * 2}
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth={1}
                    dash={[3, 3]}
                  />
                )}

                {/* Safe Zone Guide */}
                {state.showSafe && (
                  <Rect
                    x={currentSideSpec.safePx}
                    y={currentSideSpec.safePx}
                    width={currentSideSpec.canvasPx.w - currentSideSpec.safePx * 2}
                    height={currentSideSpec.canvasPx.h - currentSideSpec.safePx * 2}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth={1}
                    dash={[2, 2]}
                  />
                )}

                {/* Objects */}
                {currentObjects.map((obj) => {
                  if (obj.type === 'image' && obj.assetId) {
                    const asset = state.assets.find((a) => a.id === obj.assetId);
                    if (!asset) return null;

                    return (
                      <ImageObject
                        key={obj.id}
                        obj={obj}
                        asset={asset}
                        isSelected={state.selectedObjectId === obj.id}
                        onSelect={() => handleSelect(obj.id)}
                        onDragEnd={(e) => handleDragEnd(obj.id, e)}
                        onTransformEnd={(e) => handleTransformEnd(obj.id, e)}
                        onImageLoad={(image) => handleImageLoad(obj.id, image)}
                        imageRefs={imageRefs}
                      />
                    );
                  }
                  return null;
                })}

                {/* Transformer */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Limit resize to keep aspect ratio (optional)
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
}

