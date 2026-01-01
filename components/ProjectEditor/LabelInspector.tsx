"use client";

import { useState, useEffect } from 'react';
import { EDITOR_FONTS, DEFAULT_FONT, DEFAULT_FONT_WEIGHT, isScriptFont, type EditorFont } from '@/lib/editorFonts';
import type { EditorObject } from './ProjectEditor';

interface LabelInspectorProps {
  selectedObject: EditorObject | null;
  onUpdate: (updates: Partial<EditorObject>) => void;
}

export default function LabelInspector({ selectedObject, onUpdate }: LabelInspectorProps) {
  const [text, setText] = useState(selectedObject?.text || '');
  const [fontFamily, setFontFamily] = useState(selectedObject?.fontFamily || DEFAULT_FONT);
  const [fontSize, setFontSize] = useState(selectedObject?.fontSize || 24);
  const [fontWeight, setFontWeight] = useState(selectedObject?.fontWeight || DEFAULT_FONT_WEIGHT);
  const [fill, setFill] = useState(selectedObject?.fill || '#000000');
  const [showScriptWarning, setShowScriptWarning] = useState(false);

  // Update local state when selected object changes
  useEffect(() => {
    if (selectedObject && selectedObject.type === 'text') {
      setText(selectedObject.text || '');
      setFontFamily(selectedObject.fontFamily || DEFAULT_FONT);
      setFontSize(selectedObject.fontSize || 24);
      setFontWeight(selectedObject.fontWeight || DEFAULT_FONT_WEIGHT);
      setFill(selectedObject.fill || '#000000');
    }
  }, [selectedObject]);

  // Check for script font warning
  useEffect(() => {
    if (isScriptFont(fontFamily) && text.length > 40) {
      setShowScriptWarning(true);
    } else {
      setShowScriptWarning(false);
    }
  }, [fontFamily, text]);

  // Get available weights for selected font
  const selectedFont = EDITOR_FONTS.find(f => f.family === fontFamily);
  const availableWeights = selectedFont?.weights || [400, 600];

  const handleTextChange = (newText: string) => {
    setText(newText);
    onUpdate({ text: newText });
  };

  const handleFontFamilyChange = (newFamily: string) => {
    setFontFamily(newFamily);
    const newFont = EDITOR_FONTS.find(f => f.family === newFamily);
    // Reset weight if new font doesn't support current weight
    const newWeight = newFont?.weights.includes(fontWeight) ? fontWeight : (newFont?.weights[0] || 400);
    setFontWeight(newWeight);
    onUpdate({ fontFamily: newFamily, fontWeight: newWeight });
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    onUpdate({ fontSize: newSize });
  };

  const handleFontWeightChange = (newWeight: number) => {
    setFontWeight(newWeight);
    onUpdate({ fontWeight: newWeight });
  };

  const handleFillChange = (newFill: string) => {
    setFill(newFill);
    onUpdate({ fill: newFill });
  };

  if (!selectedObject || selectedObject.type !== 'text') {
    return null;
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Text Properties</h3>
      
      {/* Text Input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Enter text..."
        />
      </div>

      {/* Font Family Dropdown */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
        <select
          value={fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ fontFamily: fontFamily }}
        >
          {EDITOR_FONTS.map((font) => (
            <option key={font.family} value={font.family} style={{ fontFamily: font.family }}>
              {font.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Script Font Warning */}
      {showScriptWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
          <p className="text-xs text-yellow-800">
            ⚠️ Script fonts work best for short phrases.
          </p>
        </div>
      )}

      {/* Font Size */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Font Size: {fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="120"
          value={fontSize}
          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Font Weight */}
      {availableWeights.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Font Weight</label>
          <select
            value={fontWeight}
            onChange={(e) => handleFontWeightChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableWeights.map((weight) => (
              <option key={weight} value={weight}>
                {weight === 400 ? 'Regular' : weight === 600 ? 'Semi-Bold' : 'Bold'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Text Color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={fill}
            onChange={(e) => handleFillChange(e.target.value)}
            className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={fill}
            onChange={(e) => handleFillChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
}

