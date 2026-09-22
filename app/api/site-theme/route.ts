import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { SiteSettings } from '@/models/SiteSettings';
import { resolveThemeVars, THEME_PRESETS } from '@/lib/themes';

// Theme is editable at runtime from admin — never cache it (Next 16 would
// otherwise serve a stale response after the admin changes it).
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    let doc = await SiteSettings.findOne({ key: 'site' }).lean();
    if (!doc) {
      await SiteSettings.create({ key: 'site' });
      doc = { key: 'site', theme: { preset: 'blue', customColor: null }, createdAt: new Date(), updatedAt: new Date() } as never;
    }
    const theme = doc?.theme ?? { preset: 'blue', customColor: null };
    const preset = (theme.preset ?? 'blue') as 'blue' | 'green' | 'custom';
    const vars = resolveThemeVars(preset, theme.customColor ?? null);
    return NextResponse.json(
      { preset, customColor: theme.customColor ?? null, vars, presets: THEME_PRESETS },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    // Fail-safe: default blue theme if DB is unreachable.
    const vars = resolveThemeVars('blue');
    return NextResponse.json(
      { preset: 'blue', customColor: null, vars, presets: THEME_PRESETS },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
