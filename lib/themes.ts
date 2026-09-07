export type ThemePresetId = 'blue' | 'green' | 'custom';

export interface ThemeVars {
  '--accent': string;
  '--accent-deep': string;
  '--accent-soft': string;
  '--accent-soft-2': string;
  '--accent-ring': string;
  '--accent-text': string;
}

export interface ThemePreset {
  id: Exclude<ThemePresetId, 'custom'>;
  name: string;
  description: string;
  swatch: string;
  vars: ThemeVars;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'blue',
    name: 'Blue (Original)',
    description: 'The original site theme with royal blue accents.',
    swatch: '#2563EB',
    vars: {
      '--accent': '#2563EB',
      '--accent-deep': '#1D4ED8',
      '--accent-soft': '#EFF6FF',
      '--accent-soft-2': '#DBEAFE',
      '--accent-ring': 'rgba(37, 99, 235, 0.35)',
      '--accent-text': '#1D4ED8',
    },
  },
  {
    id: 'green',
    name: 'Green (New)',
    description: 'Fresh green accents matching the profile page look.',
    swatch: '#16A34A',
    vars: {
      '--accent': '#16A34A',
      '--accent-deep': '#15803D',
      '--accent-soft': '#F0FDF4',
      '--accent-soft-2': '#DCFCE7',
      '--accent-ring': 'rgba(22, 163, 74, 0.35)',
      '--accent-text': '#15803D',
    },
  },
];

export function getThemePreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}

/** Build the CSS var map from a saved settings record (preset or custom hex). */
export function resolveThemeVars(preset: ThemePresetId, customColor?: string | null): ThemeVars {
  if (preset === 'custom' && customColor) {
    return customAccentVars(customColor);
  }
  const p = getThemePreset(preset) ?? THEME_PRESETS[0];
  return p.vars;
}

/** Derive a full accent palette from any single hex color (for the custom option). */
export function customAccentVars(hex: string): ThemeVars {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return THEME_PRESETS[0].vars;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const darken = (v: number, f: number) => Math.max(0, Math.round(v * f));
  const lighten = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.9));
  const toHex = (rr: number, gg: number, bb: number) =>
    '#' + [rr, gg, bb].map((v) => v.toString(16).padStart(2, '0')).join('');
  const deep = toHex(darken(r, 0.75), darken(g, 0.75), darken(b, 0.75));
  const soft = toHex(lighten(r), lighten(g), lighten(b));
  const soft2 = toHex(
    Math.min(255, Math.round(r + (255 - r) * 0.8)),
    Math.min(255, Math.round(g + (255 - g) * 0.8)),
    Math.min(255, Math.round(b + (255 - b) * 0.8))
  );
  return {
    '--accent': toHex(r, g, b),
    '--accent-deep': deep,
    '--accent-soft': soft,
    '--accent-soft-2': soft2,
    '--accent-ring': `rgba(${r}, ${g}, ${b}, 0.35)`,
    '--accent-text': deep,
  };
}
