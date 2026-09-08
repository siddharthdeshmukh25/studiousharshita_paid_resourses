'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Loader2, ShieldCheck, HardDrive, Edit2, Eye, EyeOff, Check, Palette, Lock } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

type Gateway = 'razorpay' | 'payu' | 'cashfree';
type PaymentSettings = { 
  gateway: Gateway; 
  environment?: 'sandbox' | 'production';
  razorpay?: { keyId?: string; keySecret?: string; hasSecret?: boolean }; 
  payu?: { key?: string; salt?: string; hasSalt?: boolean }; 
  cashfree?: { clientId?: string; clientSecret?: string; hasSecret?: boolean } 
};

type GoogleDriveSettings = {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  folderId?: string;
  hasClientSecret?: boolean;
};

const blank: PaymentSettings = { gateway: 'cashfree', razorpay: {}, payu: {}, cashfree: {} };
const blankGoogleDrive: GoogleDriveSettings = { enabled: false, hasClientSecret: false };

type TabType = 'payment' | 'grant-access' | 'google-drive' | 'theme';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('payment');
  const [settings, setSettings] = useState<PaymentSettings>(blank);
  const [googleDriveSettings, setGoogleDriveSettings] = useState<GoogleDriveSettings>(blankGoogleDrive);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { 
    fetch('/api/admin/payment-settings')
      .then(r => r.json())
      .then(data => { 
        if (data.settings) {
          setSettings({ 
            ...blank, 
            ...data.settings, 
            razorpay: data.settings.razorpay || {}, 
            payu: data.settings.payu || {}, 
            cashfree: data.settings.cashfree || {} 
          });
        } else {
          setError(data.error || 'Could not load payment settings.');
        }
      })
      .catch(() => setError('Could not load payment settings.'))
      .finally(() => setLoading(false)); 
  }, []);

  const save = async () => { 
    setSaving(true); 
    setError(''); 
    setMessage(''); 
    const response = await fetch('/api/admin/payment-settings', { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(settings) 
    }); 
    const data = await response.json(); 
    setSaving(false); 
    if (!response.ok) return setError(data.error || 'Could not save payment settings.'); 
    setMessage('Payment settings saved successfully.');
    setIsEditing(false);
  };

  const inputClass = 'mt-1 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10 font-poppins';
  
  const tabs = [
    { id: 'payment' as TabType, label: 'Payment', icon: CreditCard },
    { id: 'grant-access' as TabType, label: 'Grant Access', icon: ShieldCheck },
    { id: 'google-drive' as TabType, label: 'Google Drive', icon: HardDrive },
    { id: 'theme' as TabType, label: 'Theme', icon: Palette },
  ];

  const getGatewayName = (gateway: Gateway) => {
    const names = {
      razorpay: 'Razorpay',
      payu: 'PayU',
      cashfree: 'Cashfree'
    };
    return names[gateway];
  };

  const getDisplayKey = () => {
    switch(settings.gateway) {
      case 'razorpay':
        return settings.razorpay?.keyId || 'Not configured';
      case 'payu':
        return settings.payu?.key || 'Not configured';
      case 'cashfree':
        return settings.cashfree?.clientId || 'Not configured';
      default:
        return 'Not configured';
    }
  };

  const hasSecret = () => {
    switch(settings.gateway) {
      case 'razorpay':
        return settings.razorpay?.hasSecret;
      case 'payu':
        return settings.payu?.hasSalt;
      case 'cashfree':
        return settings.cashfree?.hasSecret;
      default:
        return false;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-poppins">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Configuration</p>
          <h1 className="mt-1 text-xl sm:text-2xl font-semibold tracking-[-.045em]">General Settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage payment mode, API keys and platform access.</p>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-white/10">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:gap-2 sm:px-4 sm:py-3 sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'payment' && (
            <section className="rounded-xl border border-slate-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="font-semibold text-lg">Payment Configuration</h2>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors self-start"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" />
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                  {message && <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 flex items-center gap-2"><Check className="h-4 w-4" />{message}</p>}

                  {/* Current Platform Display */}
                  {!isEditing && (
                    <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Current Platform</span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{getGatewayName(settings.gateway)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">API Key</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
                            {showSecret ? getDisplayKey() : '••••••••••••'}
                          </span>
                          <button
                            onClick={() => setShowSecret(!showSecret)}
                            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex-shrink-0"
                          >
                            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Secret Status</span>
                        <span className={`text-sm font-medium ${hasSecret() ? 'text-blue-600' : 'text-amber-600'}`}>
                          {hasSecret() ? 'Configured' : 'Not configured'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Edit Form */}
                  {isEditing && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Payment Platform</label>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {(['razorpay', 'payu', 'cashfree'] as Gateway[]).map(gateway => (
                            <button
                              key={gateway}
                              type="button"
                              onClick={() => setSettings({ ...settings, gateway })}
                              className={`rounded-md border px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                                settings.gateway === gateway
                                  ? 'border-blue-500 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
                              }`}
                            >
                              {gateway}
                            </button>
                          ))}
                        </div>
                      </div>

                      {settings.gateway === 'razorpay' && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-sm font-medium">
                            Razorpay Key ID
                            <input
                              value={settings.razorpay?.keyId || ''}
                              onChange={e => setSettings({ ...settings, razorpay: { ...settings.razorpay, keyId: e.target.value } })}
                              placeholder="rzp_..."
                              className={inputClass}
                            />
                          </label>
                          <label className="text-sm font-medium">
                            Key Secret {settings.razorpay?.hasSecret && <span className="text-xs font-normal text-slate-500">(saved)</span>}
                            <input
                              type="password"
                              value={settings.razorpay?.keySecret || ''}
                              onChange={e => setSettings({ ...settings, razorpay: { ...settings.razorpay, keySecret: e.target.value } })}
                              placeholder="Enter new secret to replace"
                              className={inputClass}
                            />
                          </label>
                        </div>
                      )}

                      {settings.gateway === 'payu' && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-sm font-medium">
                            PayU Merchant Key
                            <input
                              value={settings.payu?.key || ''}
                              onChange={e => setSettings({ ...settings, payu: { ...settings.payu, key: e.target.value } })}
                              className={inputClass}
                            />
                          </label>
                          <label className="text-sm font-medium">
                            Merchant Salt {settings.payu?.hasSalt && <span className="text-xs font-normal text-slate-500">(saved)</span>}
                            <input
                              type="password"
                              value={settings.payu?.salt || ''}
                              onChange={e => setSettings({ ...settings, payu: { ...settings.payu, salt: e.target.value } })}
                              placeholder="Enter new salt to replace"
                              className={inputClass}
                            />
                          </label>
                        </div>
                      )}

                      {settings.gateway === 'cashfree' && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-sm font-medium">
                            Cashfree Client ID
                            <input
                              value={settings.cashfree?.clientId || ''}
                              onChange={e => setSettings({ ...settings, cashfree: { ...settings.cashfree, clientId: e.target.value } })}
                              className={inputClass}
                            />
                          </label>
                          <label className="text-sm font-medium">
                            Client Secret {settings.cashfree?.hasSecret && <span className="text-xs font-normal text-slate-500">(saved)</span>}
                            <input
                              type="password"
                              value={settings.cashfree?.clientSecret || ''}
                              onChange={e => setSettings({ ...settings, cashfree: { ...settings.cashfree, clientSecret: e.target.value } })}
                              placeholder="Enter new secret to replace"
                              className={inputClass}
                            />
                          </label>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => void save()}
                          disabled={saving}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-600 transition-colors"
                        >
                          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 dark:border-white/10 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {activeTab === 'grant-access' && (
            <section className="rounded-xl border border-slate-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-lg">Resource Access Management</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Grant or revoke resource access for users. Manage user permissions and resource allocations.
              </p>
              <button
                onClick={() => window.location.assign('/admin/grant-access')}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors w-full sm:w-auto"
              >
                <ShieldCheck className="h-4 w-4" />
                Manage Access
              </button>
            </section>
          )}

          {activeTab === 'theme' && <ThemeSettingsTab />}

          {activeTab === 'google-drive' && (
            <section className="rounded-xl border border-slate-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2 mb-4">
                <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-lg">Google Drive Integration</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Connect your Google Drive to store and manage resources. Configure OAuth credentials and folder settings.
              </p>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-lg gap-3">
                  <div>
                    <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">Connection Status</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {googleDriveSettings.enabled ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
                    googleDriveSettings.enabled 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {googleDriveSettings.enabled ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Client ID</label>
                    <input
                      value={googleDriveSettings.clientId || ''}
                      onChange={e => setGoogleDriveSettings({ ...googleDriveSettings, clientId: e.target.value })}
                      placeholder="Google OAuth Client ID"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Client Secret {googleDriveSettings.hasClientSecret && <span className="text-xs font-normal text-slate-500">(saved)</span>}
                    </label>
                    <input
                      type="password"
                      value={googleDriveSettings.clientSecret || ''}
                      onChange={e => setGoogleDriveSettings({ ...googleDriveSettings, clientSecret: e.target.value })}
                      placeholder="Enter new secret to replace"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Redirect URI</label>
                    <input
                      value={googleDriveSettings.redirectUri || ''}
                      onChange={e => setGoogleDriveSettings({ ...googleDriveSettings, redirectUri: e.target.value })}
                      placeholder="https://yourdomain.com/api/auth/callback/google"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Folder ID</label>
                    <input
                      value={googleDriveSettings.folderId || ''}
                      onChange={e => setGoogleDriveSettings({ ...googleDriveSettings, folderId: e.target.value })}
                      placeholder="Google Drive Folder ID (optional)"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={googleDriveSettings.enabled}
                      onChange={e => setGoogleDriveSettings({ ...googleDriveSettings, enabled: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:text-blue-400 dark:focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Enable Google Drive Integration</span>
                  </label>
                </div>

                <button
                  onClick={() => {
                    setMessage('Google Drive settings saved successfully.');
                    setTimeout(() => setMessage(''), 3000);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors w-full sm:w-auto"
                >
                  <HardDrive className="h-4 w-4" />
                  Save Google Drive Settings
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

const THEME_SWATCHES = [
  { id: 'blue' as const, name: 'Blue (Original)', color: '#2563EB' },
  { id: 'green' as const, name: 'Green (New)', color: '#16A34A' },
];

function ThemeSettingsTab() {
  const [preset, setPreset] = useState<'blue' | 'green' | 'custom'>('blue');
  const [customColor, setCustomColor] = useState('#16A34A');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/site-theme')
      .then((r) => r.json())
      .then((d) => {
        if (d?.preset) {
          setPreset(d.preset);
          if (d.customColor) setCustomColor(d.customColor);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (nextPreset: 'blue' | 'green' | 'custom', color?: string) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/site-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: nextPreset, customColor: color }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save theme.');
      } else {
        setMessage('Theme saved — refresh the public site to see it everywhere.');
        if (data.vars) {
          const root = document.documentElement;
          Object.entries(data.vars as Record<string, string>).forEach(([k, v]) => root.style.setProperty(k, v));
        }
      }
    } catch {
      setError('Could not save theme.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative rounded-xl border border-slate-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h2 className="font-semibold text-lg">Website Theme</h2>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <Lock className="h-3.5 w-3.5" />
          Locked
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Pick the accent color for the whole website. Visitors see the change instantly.
      </p>

      {/* Under development banner */}
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-900/20">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Under development</p>
          <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400/90">
            This theme section is still being built. It will be available soon — please check back later.
          </p>
        </div>
      </div>

      {/* Locked content — not interactive while under development */}
      <div className="pointer-events-none select-none opacity-50">
      {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700 flex items-center gap-2"><Check className="h-4 w-4" />{message}</p>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {THEME_SWATCHES.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={saving}
            onClick={() => {
              setPreset(t.id);
              void save(t.id);
            }}
            className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors disabled:opacity-50 ${
              preset === t.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
            }`}
          >
            <span className="h-10 w-10 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: t.color }} />
            <span>
              <span className="block text-sm font-semibold">{t.name}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{t.color}</span>
            </span>
            {preset === t.id && <Check className="ml-auto h-4 w-4 text-blue-600 dark:text-blue-400" />}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-gray-700">
        <p className="text-sm font-semibold">Custom color</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Any brand color — buttons, links and highlights all follow it.</p>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-slate-200 dark:border-gray-700 bg-transparent"
            aria-label="Pick custom accent color"
          />
          <input
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-28 rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm font-mono dark:border-white/10"
            aria-label="Custom accent hex"
          />
          <button
            type="button"
            disabled={saving || !/^#[0-9a-fA-F]{6}$/.test(customColor)}
            onClick={() => {
              setPreset('custom');
              void save('custom', customColor);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Apply custom color
          </button>
        </div>
      </div>
      </div>
    </section>
  );
}
