/**
 * Options Panel - Provider-Driven Product Options UI
 * Dynamically loads and displays product options from ProductProvider
 */

'use client';

import { useState, useEffect } from 'react';
import type { ProductProvider, ProductOption } from '@/lib/designer/providers/ProductProvider';
import type { SelectionState } from '@/lib/designer/types';

interface OptionsPanelProps {
  provider: ProductProvider;
  selection: Partial<SelectionState>;
  onSelectionChange: (updates: Partial<SelectionState>) => void;
  disabled?: boolean;
}

export function OptionsPanel({
  provider,
  selection,
  onSelectionChange,
  disabled = false,
}: OptionsPanelProps) {
  // Option states
  const [productTypes, setProductTypes] = useState<ProductOption[]>([]);
  const [orientations, setOrientations] = useState<ProductOption[]>([]);
  const [sizes, setSizes] = useState<ProductOption[]>([]);
  const [papers, setPapers] = useState<ProductOption[]>([]);
  const [folds, setFolds] = useState<ProductOption[]>([]);
  const [foils, setFoils] = useState<ProductOption[]>([]);
  const [envelopes, setEnvelopes] = useState<ProductOption[]>([]);
  
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Load product types on mount
  useEffect(() => {
    provider.getProductTypes().then(setProductTypes);
  }, [provider]);
  
  // Load orientations when product type changes
  useEffect(() => {
    if (selection.productType) {
      provider.getOrientations(selection.productType).then(setOrientations);
    } else {
      setOrientations([]);
    }
  }, [provider, selection.productType]);
  
  // Load sizes when product type + orientation changes
  useEffect(() => {
    if (selection.productType && selection.orientation) {
      setLoading(true);
      Promise.all([
        provider.getSizes(selection.productType, selection.orientation),
        provider.getPaperTypes(selection.productType),
        provider.getFoldFormats(selection.productType),
        provider.getFoilOptions(selection.productType),
        provider.getEnvelopeOptions(selection.productType),
      ]).then(([sizesData, papersData, foldsData, foilsData, envelopesData]) => {
        setSizes(sizesData);
        setPapers(papersData);
        setFolds(foldsData);
        setFoils(foilsData);
        setEnvelopes(envelopesData);
        setLoading(false);
      });
    } else {
      setSizes([]);
      setPapers([]);
      setFolds([]);
      setFoils([]);
      setEnvelopes([]);
    }
  }, [provider, selection.productType, selection.orientation]);
  
  // Update price when selection changes
  useEffect(() => {
    if (selection.productType && selection.size) {
      provider.getPrice(selection).then(setPrice);
    } else {
      setPrice(null);
    }
  }, [provider, selection]);
  
  return (
    <div className="space-y-6">
      {/* Product Type */}
      <OptionGroup label="Product Type" required>
        {productTypes.map((option) => (
          <OptionButton
            key={option.id}
            selected={selection.productType === option.value}
            onClick={() => onSelectionChange({ productType: option.value as any })}
            disabled={disabled || option.disabled}
          >
            {option.label}
          </OptionButton>
        ))}
      </OptionGroup>
      
      {/* Orientation */}
      {orientations.length > 0 && (
        <OptionGroup label="Orientation" required>
          {orientations.map((option) => (
            <OptionButton
              key={option.id}
              selected={selection.orientation === option.value}
              onClick={() => onSelectionChange({ orientation: option.value as any })}
              disabled={disabled || option.disabled}
            >
              {option.label}
            </OptionButton>
          ))}
        </OptionGroup>
      )}
      
      {/* Size */}
      {sizes.length > 0 && (
        <OptionGroup label="Size" required>
          {loading ? (
            <div className="text-sm text-gray-500">Loading sizes...</div>
          ) : (
            sizes.map((option) => (
              <OptionButton
                key={option.id}
                selected={selection.size === option.value}
                onClick={() => onSelectionChange({ size: option.value })}
                disabled={disabled || option.disabled}
              >
                {option.label}
              </OptionButton>
            ))
          )}
        </OptionGroup>
      )}
      
      {/* Paper Type */}
      {papers.length > 0 && (
        <OptionGroup label="Paper Type">
          {papers.map((option) => (
            <OptionButton
              key={option.id}
              selected={selection.paperType === option.value}
              onClick={() => onSelectionChange({ paperType: option.value })}
              disabled={disabled || option.disabled}
              price={option.price}
            >
              {option.label}
            </OptionButton>
          ))}
        </OptionGroup>
      )}
      
      {/* Fold Format (for cards) */}
      {folds.length > 0 && (
        <OptionGroup label="Card Format">
          {folds.map((option) => (
            <OptionButton
              key={option.id}
              selected={selection.foldFormat === option.value}
              onClick={() => onSelectionChange({ foldFormat: option.value as any })}
              disabled={disabled || option.disabled}
              price={option.price}
            >
              {option.label}
            </OptionButton>
          ))}
        </OptionGroup>
      )}
      
      {/* Foil Options */}
      {foils.length > 0 && (
        <OptionGroup label="Foil Accent">
          {foils.map((option) => (
            <OptionButton
              key={option.id}
              selected={selection.foilOption === option.value}
              onClick={() => onSelectionChange({ foilOption: option.value })}
              disabled={disabled || option.disabled}
              price={option.price}
            >
              {option.label}
            </OptionButton>
          ))}
        </OptionGroup>
      )}
      
      {/* Envelope Options */}
      {envelopes.length > 0 && (
        <OptionGroup label="Envelope">
          {envelopes.map((option) => (
            <OptionButton
              key={option.id}
              selected={selection.envelopeOption === option.value}
              onClick={() => onSelectionChange({ envelopeOption: option.value })}
              disabled={disabled || option.disabled}
              price={option.price}
            >
              {option.label}
            </OptionButton>
          ))}
        </OptionGroup>
      )}
      
      {/* Price Display */}
      {price !== null && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Estimated Price:</span>
            <span className="text-lg font-bold text-gray-900">${price.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function OptionGroup({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function OptionButton({
  children,
  selected,
  onClick,
  disabled = false,
  price,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  price?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-4 py-3 rounded-lg border-2 text-left transition-all
        ${selected
          ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        {price !== undefined && price > 0 && (
          <span className="text-sm text-gray-500">+${price.toFixed(2)}</span>
        )}
      </div>
    </button>
  );
}

