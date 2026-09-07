'use client';

import { useEffect } from 'react';

interface ThemeResponse {
  preset: 'blue' | 'green' | 'custom';
  customColor: string | null;
  vars: Record<string, string>;
}

/**
 * Fetches the site theme (set by admin) and applies its accent CSS variables
 * to :root so the entire public site recolors without a rebuild.
 */
export default function SiteThemeApplier() {
  useEffect(() => {
    let cancelled = false;
    async function apply() {
      try {
        const res = await fetch('/api/site-theme', { cache: 'no-store' });
        if (!res.ok) return;
        const data: ThemeResponse = await res.json();
        if (cancelled || !data?.vars) return;
        const root = document.documentElement;
        Object.entries(data.vars).forEach(([k, v]) => root.style.setProperty(k, v));
      } catch {
        // ignore — fail-safe default theme stays
      }
    }
    apply();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
