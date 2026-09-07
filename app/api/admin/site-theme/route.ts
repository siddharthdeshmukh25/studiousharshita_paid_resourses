import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { SiteSettings } from '@/models/SiteSettings';
import { hasAdminSession } from '@/lib/auth/admin';
import { resolveThemeVars } from '@/lib/themes';

export async function POST(req: NextRequest) {
  if (!(await hasAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectDB();
    const body = await req.json();
    const preset = body?.preset as 'blue' | 'green' | 'custom';
    if (!['blue', 'green', 'custom'].includes(preset)) {
      return NextResponse.json({ error: 'Invalid preset' }, { status: 400 });
    }
    let customColor: string | null = null;
    if (preset === 'custom') {
      customColor = typeof body?.customColor === 'string' ? body.customColor.trim() : '';
      if (!/^#[0-9a-fA-F]{6}$/.test(customColor ?? '')) {
        return NextResponse.json({ error: 'Custom color must be a 6-digit hex like #16A34A' }, { status: 400 });
      }
    }
    const doc = await SiteSettings.findOneAndUpdate(
      { key: 'site' },
      { $set: { theme: { preset, customColor } } },
      { new: true, upsert: true }
    ).lean();
    const vars = resolveThemeVars(doc?.theme?.preset ?? 'blue', doc?.theme?.customColor ?? null);
    return NextResponse.json({ ok: true, preset: doc?.theme?.preset, customColor: doc?.theme?.customColor, vars });
  } catch (e) {
    void e;
    return NextResponse.json({ error: 'Failed to save theme' }, { status: 500 });
  }
}
