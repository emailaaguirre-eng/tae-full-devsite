"use client";

import { useState, useEffect } from "react";

type SiteMediaMap = Record<string, string>;

let _cache: SiteMediaMap | null = null;
let _promise: Promise<SiteMediaMap> | null = null;

function fetchSiteMedia(): Promise<SiteMediaMap> {
  if (_promise) return _promise;
  _promise = fetch("/api/site-media")
    .then((r) => r.json())
    .then((data) => {
      const map: SiteMediaMap = {};
      if (data.success && Array.isArray(data.data)) {
        for (const item of data.data) {
          map[item.key] = item.url;
        }
      }
      _cache = map;
      return map;
    })
    .catch(() => {
      _cache = {};
      return {} as SiteMediaMap;
    });
  return _promise;
}

/**
 * Client-side hook: returns the override URL for a given key,
 * falling back to defaultUrl until (and if) the override loads.
 *
 * Fetches /api/site-media once per page load, shared across all hook instances.
 */
export function useSiteMedia(key: string, defaultUrl: string): string {
  const [url, setUrl] = useState(() => _cache?.[key] || defaultUrl);

  useEffect(() => {
    if (_cache) {
      if (_cache[key]) setUrl(_cache[key]);
      return;
    }
    fetchSiteMedia().then((map) => {
      if (map[key]) setUrl(map[key]);
    });
  }, [key, defaultUrl]);

  return url;
}

/**
 * Client-side: get all overrides as a map (async, cached).
 */
export async function getSiteMediaClient(): Promise<SiteMediaMap> {
  if (_cache) return _cache;
  return fetchSiteMedia();
}
