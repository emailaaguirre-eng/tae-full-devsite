"use client";

import { useState, useEffect, useMemo } from 'react';
import { ALL_TEMPLATES, TEMPLATE_CATEGORIES, type ArtKeyTemplate, type TemplateCategory } from '@/components/artkey/templates';
import { ELEGANT_ICONS, type ElegantIconKey } from '@/components/artkey/ElegantIcons';

// ---- Templates ----

interface ApiTemplate extends ArtKeyTemplate {
  id: string;
  builtin: boolean;
}

/**
 * Fetch enabled templates from the API, falling back to hardcoded arrays.
 * Returns templates grouped by category + a flat list of all.
 */
export function useTemplates() {
  const [apiTemplates, setApiTemplates] = useState<ApiTemplate[] | null>(null);

  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.templates && Array.isArray(data.templates)) {
          setApiTemplates(data.templates);
        }
      })
      .catch(() => {
        // Fallback: use hardcoded templates
        console.warn('[useTemplates] API unavailable, using hardcoded templates');
      });
  }, []);

  const templates = useMemo(() => {
    if (apiTemplates) return apiTemplates;
    // Fallback to hardcoded
    return ALL_TEMPLATES.map((t) => ({ ...t, id: t.value, builtin: true }));
  }, [apiTemplates]);

  const getByCategory = (category: TemplateCategory): ApiTemplate[] =>
    templates.filter((t) => t.category === category);

  const findByValue = (value: string): ApiTemplate | undefined =>
    templates.find((t) => t.value === value);

  return {
    templates,
    categories: TEMPLATE_CATEGORIES,
    getByCategory,
    findByValue,
    loaded: apiTemplates !== null,
  };
}

// ---- Icons ----

interface ApiIcon {
  id: string;
  label: string;
  category: string;
  type: 'builtin' | 'lucide' | 'upload';
  lucideName?: string;
  svgUrl?: string;
}

/**
 * Fetch enabled icons from the API, falling back to the hardcoded ElegantIcons.
 */
export function useIcons() {
  const [apiIcons, setApiIcons] = useState<ApiIcon[] | null>(null);

  useEffect(() => {
    fetch('/api/icons')
      .then((res) => res.json())
      .then((data) => {
        if (data.icons && Array.isArray(data.icons)) {
          setApiIcons(data.icons);
        }
      })
      .catch(() => {
        console.warn('[useIcons] API unavailable, using hardcoded icons');
      });
  }, []);

  const icons = useMemo(() => {
    if (apiIcons) return apiIcons;
    // Fallback to hardcoded elegant icons
    return Object.entries(ELEGANT_ICONS).map(([key, data]) => ({
      id: key,
      label: data.label,
      category: data.category,
      type: 'builtin' as const,
    }));
  }, [apiIcons]);

  return {
    icons,
    loaded: apiIcons !== null,
  };
}
