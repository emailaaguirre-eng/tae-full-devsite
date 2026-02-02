"use client";

import { useState, useEffect } from 'react';
import { EDITOR_FONTS, DEFAULT_FONT, DEFAULT_FONT_WEIGHT, isScriptFont, type EditorFont } from '@/lib/editorFonts';
import { ALL_BORDER_DESIGNS, BORDER_CATEGORIES, getBordersByCategory, type BorderDesign } from '@/lib/borderDesigns';
import type { EditorObject } from './types';

// Foil color options with gradients for preview
const FOIL_COLORS = [
  { id: 'gold', name: 'Gold', gradient: 'linear-gradient(135deg, #FFD700 0%, #FFF8DC 30%, #DAA520 70%, #B8860B 100%)' },
  { id: 'silver', name: 'Silver', gradient: 'linear-gradient(135deg, #C0C0C0 0%, #FFFFFF 30%, #A9A9A9 70%, #808080 100%)' },
  { id: 'rose-gold', name: 'Rose Gold', gradient: 'linear-gradient(135deg, #E8B4B8 0%, #FFE4E1 30%, #DDA0A0 70%, #C48888 100%)' },
  { id: 'copper', name: 'Copper', gradient: 'linear-gradient(135deg, #B87333 0%, #DA8A47 30%, #CD7F32 70%, #A05A2C 100%)' },
];

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
  
  // Border state
  const [borderEnabled, setBorderEnabled] = useState(selectedObject?.borderEnabled || false);
  const [borderStyle, setBorderStyle] = useState(selectedObject?.borderStyle || 'solid');
  const [borderWidth, setBorderWidth] = useState(selectedObject?.borderWidth || 2);
  const [borderColor, setBorderColor] = useState(selectedObject?.borderColor || '#000000');
  const [borderPadding, setBorderPadding] = useState(selectedObject?.borderPadding || 10);
  const [borderDesignId, setBorderDesignId] = useState(selectedObject?.borderDesignId || '');
  const [selectedBorderCategory, setSelectedBorderCategory] = useState<string>('classic');
  
  // Foil state
  const [foilEnabled, setFoilEnabled] = useState(selectedObject?.foilEnabled || false);
  const [foilColor, setFoilColor] = useState(selectedObject?.foilColor || 'gold');
  const [foilTarget, setFoilTarget] = useState(selectedObject?.foilTarget || 'text');

  // Update local state when selected object changes
  useEffect(() => {
    if (selectedObject && selectedObject.type === 'text') {
      setText(selectedObject.text || '');
      setFontFamily(selectedObject.fontFamily || DEFAULT_FONT);
      setFontSize(selectedObject.fontSize || 24);
      setFontWeight(selectedObject.fontWeight || DEFAULT_FONT_WEIGHT);
      setFill(selectedObject.fill || '#000000');
      // Border
      setBorderEnabled(selectedObject.borderEnabled || false);
      setBorderStyle(selectedObject.borderStyle || 'solid');
      setBorderWidth(selectedObject.borderWidth || 2);
      setBorderColor(selectedObject.borderColor || '#000000');
      setBorderPadding(selectedObject.borderPadding || 10);
      setBorderDesignId(selectedObject.borderDesignId || '');
      // Foil
      setFoilEnabled(selectedObject.foilEnabled || false);
      setFoilColor(selectedObject.foilColor || 'gold');
      setFoilTarget(selectedObject.foilTarget || 'text');
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

      {/* Divider */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h4 className="text-xs font-semibold text-gray-900 mb-3">Border Options</h4>
      </div>

      {/* Border Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">Enable Border</label>
        <button
          onClick={() => {
            const newValue = !borderEnabled;
            setBorderEnabled(newValue);
            onUpdate({ borderEnabled: newValue });
          }}
          className={`w-10 h-6 rounded-full transition-colors ${borderEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${borderEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      {borderEnabled && (
        <>
          {/* Border Style */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Border Style</label>
            <select
              value={borderStyle}
              onChange={(e) => {
                const newStyle = e.target.value as 'solid' | 'double' | 'dashed' | 'ornate';
                setBorderStyle(newStyle);
                onUpdate({ borderStyle: newStyle });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="solid">Solid</option>
              <option value="double">Double</option>
              <option value="dashed">Dashed</option>
              <option value="ornate">Ornate (Decorative)</option>
            </select>
          </div>

          {/* Ornate Border Design Picker */}
          {borderStyle === 'ornate' && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-3">
              <label className="block text-xs font-semibold text-gray-800">Choose Design</label>
              
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-1">
                {BORDER_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedBorderCategory(cat.id)}
                    className={`px-2 py-1 text-[10px] rounded transition-colors ${
                      selectedBorderCategory === cat.id
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>

              {/* Border Design Grid */}
              <div className="grid grid-cols-3 gap-2">
                {getBordersByCategory(selectedBorderCategory as BorderDesign['category']).map((design) => (
                  <button
                    key={design.id}
                    onClick={() => {
                      setBorderDesignId(design.id);
                      setBorderColor(design.previewColor);
                      onUpdate({ borderDesignId: design.id, borderColor: design.previewColor });
                    }}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      borderDesignId === design.id
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    title={design.description}
                  >
                    {/* Preview box with border style */}
                    <div 
                      className="w-full h-10 rounded flex items-center justify-center text-[8px] text-gray-500"
                      style={{ 
                        border: `2px solid ${design.previewColor}`,
                        borderStyle: design.cssStyle?.borderStyle === 'double' ? 'double' : 'solid',
                      }}
                    >
                      Aa
                    </div>
                    <span className="text-[9px] text-gray-600 mt-1 block truncate">{design.name}</span>
                  </button>
                ))}
              </div>

              {/* Selected design info */}
              {borderDesignId && (
                <div className="text-[10px] text-gray-500 italic">
                  {ALL_BORDER_DESIGNS.find(d => d.id === borderDesignId)?.description}
                </div>
              )}
            </div>
          )}

          {/* Border Width */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Border Width: {borderWidth}px
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={borderWidth}
              onChange={(e) => {
                const newWidth = Number(e.target.value);
                setBorderWidth(newWidth);
                onUpdate({ borderWidth: newWidth });
              }}
              className="w-full"
            />
          </div>

          {/* Border Color */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Border Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={borderColor}
                onChange={(e) => {
                  setBorderColor(e.target.value);
                  onUpdate({ borderColor: e.target.value });
                }}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={borderColor}
                onChange={(e) => {
                  setBorderColor(e.target.value);
                  onUpdate({ borderColor: e.target.value });
                }}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Border Padding */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Padding: {borderPadding}px
            </label>
            <input
              type="range"
              min="5"
              max="40"
              value={borderPadding}
              onChange={(e) => {
                const newPadding = Number(e.target.value);
                setBorderPadding(newPadding);
                onUpdate({ borderPadding: newPadding });
              }}
              className="w-full"
            />
          </div>
        </>
      )}

      {/* Foil Section */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h4 className="text-xs font-semibold text-gray-900 mb-3">✨ Foil Accent</h4>
      </div>

      {/* Foil Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">Apply Foil</label>
        <button
          onClick={() => {
            const newValue = !foilEnabled;
            setFoilEnabled(newValue);
            onUpdate({ foilEnabled: newValue });
          }}
          className={`w-10 h-6 rounded-full transition-colors ${foilEnabled ? 'bg-amber-500' : 'bg-gray-300'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${foilEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      {foilEnabled && (
        <>
          {/* Foil Color Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Foil Color</label>
            <div className="grid grid-cols-4 gap-2">
              {FOIL_COLORS.map((foil) => (
                <button
                  key={foil.id}
                  onClick={() => {
                    setFoilColor(foil.id as any);
                    onUpdate({ foilColor: foil.id as any });
                  }}
                  className={`p-1 rounded-lg border-2 transition-all ${
                    foilColor === foil.id ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  <div
                    className="w-full h-8 rounded"
                    style={{ background: foil.gradient }}
                    title={foil.name}
                  />
                  <span className="text-[10px] text-gray-600">{foil.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Foil Target */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Apply Foil To</label>
            <select
              value={foilTarget}
              onChange={(e) => {
                const newTarget = e.target.value as 'text' | 'border' | 'both';
                setFoilTarget(newTarget);
                onUpdate({ foilTarget: newTarget });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="text">Text Only</option>
              <option value="border">Border Only</option>
              <option value="both">Text + Border</option>
            </select>
          </div>

          {/* Foil Preview Indicator */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
            <p className="text-xs text-amber-800">
              ✨ This element will be printed with {foilColor} foil on the {foilTarget === 'both' ? 'text and border' : foilTarget}.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

