/**
 * Product Provider Interface
 * Abstracts product options (sizes, papers, etc.) from specific APIs (Mock, Gelato, etc.)
 */

import type { SelectionState, PrintSpec } from '../types';

// =============================================================================
// PROVIDER INTERFACE
// =============================================================================

export interface ProductOption {
  id: string;
  label: string; // Display name
  value: string; // Value to store in SelectionState
  price?: number; // Additional cost (if applicable)
  disabled?: boolean; // Option currently unavailable
  metadata?: Record<string, any>; // Provider-specific data
}

export interface ProductProvider {
  /** Provider identifier */
  readonly type: 'mock' | 'gelato';
  
  /** Provider display name */
  readonly name: string;
  
  /**
   * Get available product types
   * @returns List of product types (greeting-card, postcard, etc.)
   */
  getProductTypes(): Promise<ProductOption[]>;
  
  /**
   * Get available orientations for a product type
   * @param productType - Product type (e.g., 'greeting-card')
   * @returns List of orientations (portrait, landscape)
   */
  getOrientations(productType: string): Promise<ProductOption[]>;
  
  /**
   * Get available sizes for a product type + orientation
   * @param productType - Product type
   * @param orientation - Orientation
   * @returns List of sizes (e.g., "5x7", "A5")
   */
  getSizes(productType: string, orientation: string): Promise<ProductOption[]>;
  
  /**
   * Get available paper types
   * @param productType - Product type
   * @returns List of paper options (matte, glossy, etc.)
   */
  getPaperTypes(productType: string): Promise<ProductOption[]>;
  
  /**
   * Get available fold formats (for cards/invitations)
   * @param productType - Product type
   * @returns List of fold options (flat, bifold, etc.)
   */
  getFoldFormats(productType: string): Promise<ProductOption[]>;
  
  /**
   * Get available foil options
   * @param productType - Product type
   * @returns List of foil options (none, gold, silver, etc.)
   */
  getFoilOptions(productType: string): Promise<ProductOption[]>;
  
  /**
   * Get available envelope options (for cards)
   * @param productType - Product type
   * @returns List of envelope options
   */
  getEnvelopeOptions(productType: string): Promise<ProductOption[]>;
  
  /**
   * Generate print specification from selection
   * @param selection - Current selection state
   * @returns Print spec with dimensions, bleed, safe zones, sides
   */
  generatePrintSpec(selection: SelectionState): Promise<PrintSpec>;
  
  /**
   * Get price for current selection
   * @param selection - Partial or complete selection
   * @returns Price in USD, or null if price unavailable
   */
  getPrice(selection: Partial<SelectionState>): Promise<number | null>;
  
  /**
   * Validate selection (check if combination is valid)
   * @param selection - Selection to validate
   * @returns Validation result with errors
   */
  validateSelection(selection: Partial<SelectionState>): Promise<ValidationResult>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/** Cache entry for provider responses */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in ms
}

/** Provider configuration */
export interface ProviderConfig {
  cacheEnabled?: boolean;
  cacheTtl?: number; // Default cache TTL in ms
  apiKey?: string; // For Gelato, etc.
  apiUrl?: string;
}

