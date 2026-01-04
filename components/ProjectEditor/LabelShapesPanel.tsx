"use client";

import { LABEL_SHAPES, type LabelShape } from '@/lib/labelShapes';
import type { EditorObject } from './types';

interface LabelShapesPanelProps {
  onAddLabelShape: (shape: LabelShape) => void;
}

export default function LabelShapesPanel({ onAddLabelShape }: LabelShapesPanelProps) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Label Shapes</h3>
      <p className="text-xs text-gray-500 mb-4">
        Click a shape to add it to the canvas. You can add text inside it.
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {LABEL_SHAPES.map((shape) => (
          <button
            key={shape.id}
            onClick={() => onAddLabelShape(shape)}
            className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
            title={shape.description}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded"
                style={{
                  backgroundColor: shape.previewColor,
                  borderRadius: shape.type === 'circle' ? '50%' : shape.type === 'oval' ? '50%' : shape.cornerRadius ? `${shape.cornerRadius}px` : '4px',
                }}
              />
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-900">{shape.name}</div>
                <div className="text-xs text-gray-500">{shape.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

