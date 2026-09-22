'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  UserCircle,
  BarChart3,
  Link2,
  Type,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { BRAND_PROFILE_DEFAULTS, mergeBrandProfile } from '@/lib/brand-profile';

interface StatRow {
  value: string;
  label: string;
}

interface ProfileForm {
  photoUrl: string;
  eyebrow: string;
  headline: string;
  tagline: string;
  bio: string;
  portraitCaption: string;
  socials: {
    instagram: string;
    tiktok: string;
    facebook: string;
    threads: string;
    youtube: string;
    pinterest: string;
    linkedin: string;
    snapchat: string;
  };
  emails: { support: string; contact: string; brand: string };
  stats: StatRow[];
}

// Form starts from the shipped defaults, so "Save" with untouched fields keeps
// the site copy instead of wiping it to empty strings.
const EMPTY_FORM: ProfileForm = {
  photoUrl: '',
  eyebrow: BRAND_PROFILE_DEFAULTS.eyebrow,
  headline: BRAND_PROFILE_DEFAULTS.headline,
  tagline: BRAND_PROFILE_DEFAULTS.tagline,
  bio: BRAND_PROFILE_DEFAULTS.bio,
  portraitCaption: BRAND_PROFILE_DEFAULTS.portraitCaption,
  socials: { ...BRAND_PROFILE_DEFAULTS.socials },
  emails: { ...BRAND_PROFILE_DEFAULTS.emails },
  stats: BRAND_PROFILE_DEFAULTS.stats.map((stat) => ({ ...stat })),
};

const SOCIAL_FIELDS: { key: keyof ProfileForm['socials']; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/username' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@username' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/username' },
  { key: 'threads', label: 'Threads', placeholder: 'https://www.threads.net/@username' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@username' },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://www.pinterest.com/username' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/in/username' },
  { key: 'snapchat', label: 'Snapchat', placeholder: 'https://www.snapchat.com/add/username' },
];

const EMAIL_FIELDS: { key: keyof ProfileForm['emails']; label: string; hint: string }[] = [
  { key: 'support', label: 'Support inbox', hint: 'Order/access/payment/refund help' },
  { key: 'contact', label: 'General inbox', hint: 'Normal queries' },
  { key: 'brand', label: 'Brand-deals inbox', hint: 'Collaborations & sponsorships' },
];

const MAX_STATS = 8;

export default function AdminProfilePage() {
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/brand-profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          // Same merge as the public site: before the first save, empty stored
          // fields show the shipped defaults in the form instead of blanks.
          const merged = mergeBrandProfile(data.profile);
          setForm({
            ...merged,
            socials: { ...merged.socials },
            emails: { ...merged.emails },
            stats: merged.stats.map((stat) => ({ ...stat })),
          });
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch(() => setError('Could not load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateSocial = (key: keyof ProfileForm['socials'], value: string) =>
    setForm((prev) => ({ ...prev, socials: { ...prev.socials, [key]: value } }));

  const updateEmail = (key: keyof ProfileForm['emails'], value: string) =>
    setForm((prev) => ({ ...prev, emails: { ...prev.emails, [key]: value } }));

  const updateStat = (index: number, patch: Partial<StatRow>) =>
    setForm((prev) => ({
      ...prev,
      stats: prev.stats.map((stat, i) => (i === index ? { ...stat, ...patch } : stat)),
    }));

  const removeStat = (index: number) =>
    setForm((prev) => ({ ...prev, stats: prev.stats.filter((_, i) => i !== index) }));

  const addStat = () =>
    setForm((prev) => (prev.stats.length >= MAX_STATS ? prev : { ...prev, stats: [...prev.stats, { value: '', label: '' }] }));

  const save = async (override?: ProfileForm) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/brand-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(override ?? form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not save profile.');
      } else {
        setMessage('Profile saved — the website is updated.');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch {
      setError('Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  /** Confirmation modal se gaye bina reset nahi hoga. */
  const resetToDefaults = async () => {
    setShowResetConfirm(false);
    const defaultsForm: ProfileForm = {
      ...EMPTY_FORM,
      socials: { ...EMPTY_FORM.socials },
      emails: { ...EMPTY_FORM.emails },
      stats: EMPTY_FORM.stats.map((stat) => ({ ...stat })),
    };
    setForm(defaultsForm);
    await save(defaultsForm);
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok || !data.secure_url) throw new Error(data.error || 'Upload failed.');
      update('photoUrl', data.secure_url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10 font-poppins';

  return (
    <AdminLayout>
      <div className="space-y-6 font-poppins">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Website content</p>
            <h1 className="mt-1 text-xl sm:text-2xl font-semibold tracking-[-.045em]">Brand Profile</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Photo, bio, social links, emails and homepage stats — everything editable without touching code.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={saving || loading}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to defaults
            </button>
            <button
              onClick={() => void save()}
              disabled={saving || loading}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-600 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
        {message && (
          <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 flex items-center gap-2 dark:bg-blue-900/20 dark:text-blue-300">
            <Check className="h-4 w-4" />
            {message}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* ---------- Profile photo ---------- */}
            <section className="rounded-xl border border-slate-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-lg">Profile photo</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Shown in the homepage &ldquo;{form.headline || BRAND_PROFILE_DEFAULTS.headline}&rdquo; section. Leave empty to keep
                the styled text card.
              </p>
              <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  {form.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.photoUrl} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-md border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-blue-500"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    {uploading ? 'Uploading…' : form.photoUrl ? 'Replace photo' : 'Upload photo'}
                  </button>
                  {form.photoUrl && (
                    <button
                      onClick={() => update('photoUrl', '')}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors dark:border-red-500/30 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* ---------- About-section copy ---------- */}
            <section className="rounded-xl border border-slate-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-lg">About-section text</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Eyebrow (small line above the heading)
                  <input value={form.eyebrow} onChange={(e) => update('eyebrow', e.target.value)} placeholder="the girl behind the notes" className={inputClass} />
                </label>
                <label className="text-sm font-medium">
                  Heading
                  <input value={form.headline} onChange={(e) => update('headline', e.target.value)} placeholder="Hi, I'm Harshita." className={inputClass} />
                </label>
                <label className="text-sm font-medium">
                  Tagline (under the name)
                  <input value={form.tagline} onChange={(e) => update('tagline', e.target.value)} placeholder="student · creator · maker" className={inputClass} />
                </label>
                <label className="text-sm font-medium">
                  Portrait caption (handwritten note)
                  <input value={form.portraitCaption} onChange={(e) => update('portraitCaption', e.target.value)} placeholder="that's me →" className={inputClass} />
                </label>
                <label className="text-sm font-medium sm:col-span-2">
                  Bio paragraph
                  <textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} rows={4} placeholder="Tell your story…" className={inputClass} />
                </label>
              </div>
            </section>

            {/* ---------- Social links ---------- */}
            <section className="rounded-xl border border-slate-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-lg">Social media links</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Shown in the website footer. Leave a field empty to hide that link.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                  <label key={key} className="text-sm font-medium">
                    {label}
                    <input
                      type="url"
                      value={form.socials[key]}
                      onChange={(e) => updateSocial(key, e.target.value)}
                      placeholder={placeholder}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>
            </section>

            {/* ---------- Emails ---------- */}
            <section className="rounded-xl border border-slate-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-lg">Contact emails</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Shown in the footer &ldquo;Say hello&rdquo; column.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {EMAIL_FIELDS.map(({ key, label, hint }) => (
                  <label key={key} className="text-sm font-medium">
                    {label}
                    <input
                      type="email"
                      value={form.emails[key]}
                      onChange={(e) => updateEmail(key, e.target.value)}
                      placeholder="hello@example.com"
                      className={inputClass}
                    />
                    <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">{hint}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* ---------- Homepage stats ---------- */}
            <section className="rounded-xl border border-slate-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="font-semibold text-lg">Homepage stats</h2>
                </div>
                <button
                  onClick={addStat}
                  disabled={form.stats.length >= MAX_STATS}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add stat
                </button>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                The little number cards in the &ldquo;{form.headline || BRAND_PROFILE_DEFAULTS.headline}&rdquo; section.
              </p>
              <div className="mt-4 space-y-2">
                {form.stats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      value={stat.value}
                      onChange={(e) => updateStat(index, { value: e.target.value })}
                      placeholder="30K+"
                      className="w-24 rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10"
                    />
                    <input
                      value={stat.label}
                      onChange={(e) => updateStat(index, { label: e.target.value })}
                      placeholder="community"
                      className="flex-1 rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10"
                    />
                    <button
                      onClick={() => removeStat(index)}
                      aria-label={`Remove stat ${index + 1}`}
                      className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {form.stats.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No stats — the section will show none.</p>
                )}
              </div>
            </section>

            {/* Bottom save for long-page convenience */}
            <div className="flex justify-end">
              <button
                onClick={() => void save()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-600 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Reset confirmation modal ---------- */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Confirm reset">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-gray-900">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <RotateCcw className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Reset everything?</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Photo, text, social links, emails and stats will all go back to the defaults and save immediately. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => void resetToDefaults()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {saving ? 'Resetting…' : 'Yes, reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
