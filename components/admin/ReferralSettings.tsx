'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check, Gift } from 'lucide-react';
import ReferralAnalytics from '@/components/admin/ReferralAnalytics';

type ReferralResource = {
  id: string;
  title: string;
  price: number;
  isFree: boolean;
  referralEnabled: boolean;
  referralPercent: number | null;
};

const inputClass = 'mt-1 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10 font-poppins';

export default function ReferralSettings() {
  const [enabled, setEnabled] = useState(true);
  const [defaultPercent, setDefaultPercent] = useState(10);
  const [resources, setResources] = useState<ReferralResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/referral-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setEnabled(data.settings.enabled);
          setDefaultPercent(data.settings.defaultPercent);
          setResources(data.resources || []);
        } else {
          setError(data.error || 'Could not load referral settings.');
        }
      })
      .catch(() => setError('Could not load referral settings.'))
      .finally(() => setLoading(false));
  }, []);

  const updateResource = (id: string, patch: Partial<ReferralResource>) => {
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    const response = await fetch('/api/admin/referral-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled,
        defaultPercent,
        resources: resources.map((r) => ({
          id: r.id,
          referralEnabled: r.referralEnabled,
          referralPercent: r.referralPercent,
        })),
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error || 'Could not save referral settings.');
    setMessage('Referral settings saved.');
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 mb-2">
        <Gift className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h2 className="font-semibold text-lg">Refer &amp; Earn</h2>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Set how much a referrer earns when a buyer purchases through their link. Set a resource-specific percentage to override the default, or turn referrals off for a resource.
      </p>

      <ReferralAnalytics />

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      ) : (
        <div className="space-y-5">
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 flex items-center gap-2"><Check className="h-4 w-4" />{message}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-gray-700 p-4 text-sm font-medium">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4" />
              Referral program enabled
            </label>
            <label className="text-sm font-medium">
              Default commission (%)
              <input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={defaultPercent}
                onChange={(e) => setDefaultPercent(Number(e.target.value))}
                className={inputClass}
              />
            </label>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Per resource</h3>
            <div className="space-y-2">
              {resources.map((resource) => (
                <div key={resource.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-slate-200 dark:border-gray-700 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{resource.title}</p>
                    <p className="text-xs text-slate-500">{resource.isFree ? 'Free · referral clicks promote eligible paid resources' : `₹${resource.price}`}</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={resource.referralEnabled}
                      onChange={(e) => updateResource(resource.id, { referralEnabled: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Referral on
                  </label>
                  {!resource.isFree && <label className="text-xs font-medium flex items-center gap-2">
                    Commission %
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      placeholder={`${defaultPercent} (default)`}
                      value={resource.referralPercent ?? ''}
                      disabled={!resource.referralEnabled}
                      onChange={(e) =>
                        updateResource(resource.id, { referralPercent: e.target.value === '' ? null : Number(e.target.value) })
                      }
                      className="w-28 rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-sm dark:border-white/10 disabled:opacity-50"
                    />
                  </label>}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save referral settings'}
          </button>
        </div>
      )}
    </section>
  );
}
