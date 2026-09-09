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

type DriveStatus = {
  connected: boolean;
  email?: string;
  scope?: string | null;
  tokenExpiry?: string | null;
  accessTokenExpired?: boolean | null;
  hasRefreshToken?: boolean;
  clientId?: string;
  redirectUri?: string;
};

const DRIVE_ERROR_MESSAGES: Record<string, string> = {
  login_required: 'Please log in before connecting Google Drive.',
  missing_credentials: 'Google OAuth credentials are not configured on the server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment.',
  no_user: 'No user found. Please log in again.',
  user_mismatch: 'The Google account you signed in with does not match your session. Please try again.',
  token_exchange_failed: 'Could not exchange the Google authorization code. Please try again.',
  oauth_error: 'Google Drive connection was cancelled or failed.',
};

const blank: PaymentSettings = { gateway: 'cashfree', razorpay: {}, payu: {}, cashfree: {} };

type TabType = 'payment' | 'grant-access' | 'google-drive' | 'theme';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('payment');
  const [settings, setSettings] = useState<PaymentSettings>(blank);
  const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState('');
  const [driveMessage, setDriveMessage] = useState('');
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

  // ---- Google Drive ----

  const fetchDriveStatus = async () => {
    try {
      setDriveLoading(true);
      setDriveError('');
      const response = await fetch('/api/google-drive/status');
      const data = await response.json();
      if (response.ok && data.connected !== undefined) {
        setDriveStatus(data);
      } else {
        setDriveError(data.error || 'Could not load Google Drive status.');
      }
    } catch {
      setDriveError('Could not load Google Drive status.');
    } finally {
      setDriveLoading(false);
    }
  };

  const connectDrive = () => {
    const returnTo = encodeURIComponent('/admin/settings?tab=google-drive');
    window.location.href = `/api/google-drive/auth?returnTo=${returnTo}`;
  };

  const disconnectDrive = async () => {
    try {
      setDriveLoading(true);
      setDriveError('');
      const response = await fetch('/api/google-drive/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected: false }),
      });
      if (response.ok) {
        setDriveStatus(prev => (prev ? { ...prev, connected: false, hasRefreshToken: false } : prev));
        setDriveMessage('Google Drive disconnected successfully.');
      } else {
        const data = await response.json();
        setDriveError(data.error || 'Failed to disconnect Google Drive.');
      }
    } catch {
      setDriveError('Failed to disconnect Google Drive.');
    } finally {
      setDriveLoading(false);
    }
  };

  // Fetch status whenever the Google Drive tab is opened
  useEffect(() => {
    if (activeTab === 'google-drive') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: refetch on tab open
      void fetchDriveStatus();
    }
  }, [activeTab]);

  // Handle the OAuth callback landing back on this page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const connected = urlParams.get('google_drive_connected') === 'true';
    const err = urlParams.get('error');

    if (tab === 'google-drive') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: restore tab after OAuth redirect
      setActiveTab('google-drive');
    }
    if (connected) {
      void fetchDriveStatus();
      setDriveMessage('Google Drive connected successfully.');
      setTimeout(() => setDriveMessage(''), 5000);
    }
    if (err) {
      setDriveError(DRIVE_ERROR_MESSAGES[err] || 'Google Drive connection failed. Please try again.');
    }
    if (tab || connected || err) {
      window.history.replaceState({}, '', window.location.pathname);
    }
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
                Connect your Google Drive to store and manage resources. Sign in with Google — the server manages OAuth credentials automatically.
              </p>
              
              {driveError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 mb-4">{driveError}</p>}
              {driveMessage && <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 flex items-center gap-2 mb-4"><Check className="h-4 w-4" />{driveMessage}</p>}

              {driveLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" />
                </div>
              ) : (
                <>
                  {/* Connection Status */}
                  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border ${
                    driveStatus?.connected
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-500/30'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-gray-700'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${driveStatus?.connected ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {driveStatus?.connected ? 'Google Drive Connected' : 'Google Drive Not Connected'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {driveStatus?.connected
                            ? `Connected as ${driveStatus.email || 'your Google account'}`
                            : 'Connect your Google Drive to enable secure file sharing'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
                      driveStatus?.connected
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {driveStatus?.connected ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {driveStatus?.connected && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2 mt-4">
                        <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Connected account</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100 break-all">{driveStatus.email}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Access token</p>
                          <p className={`mt-1 text-sm font-semibold ${driveStatus.hasRefreshToken ? 'text-gray-900 dark:text-gray-100' : 'text-amber-600'}`}>
                            {driveStatus.hasRefreshToken ? 'Auto-refresh enabled' : 'Refresh token missing — reconnect needed'}
                          </p>
                        </div>
                      </div>

                      {driveStatus.scope && (
                        <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 mt-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Granted permissions</p>
                          <p className="mt-1 text-xs font-mono text-slate-600 dark:text-slate-300 break-all">{driveStatus.scope}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-5">
                    {!driveStatus?.connected ? (
                      <button
                        onClick={connectDrive}
                        className="inline-flex items-center justify-center gap-2.5 rounded-md border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 001 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        Connect with Google
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={connectDrive}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                        >
                          <HardDrive className="h-4 w-4" />
                          Reconnect
                        </button>
                        <button
                          onClick={disconnectDrive}
                          disabled={driveLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          Disconnect
                        </button>
                      </>
                    )}
                  </div>

                  {/* Server configuration */}
                  <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-4 mt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Server configuration</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Client ID (managed by server)</p>
                        <p className="mt-1 text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
                          {driveStatus?.clientId || 'Not configured — add GOOGLE_CLIENT_ID to your environment'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Authorized redirect URI</p>
                        <p className="mt-1 text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
                          {driveStatus?.redirectUri || 'Loading…'}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-900/20">
                      <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                        <span className="font-semibold">Keep your connection alive:</span> add the redirect URI above to your Google Cloud Console OAuth client, enable the Google Drive API, and set the OAuth consent screen publishing status to{' '}
                        <span className="font-semibold">In production</span>. Testing-mode apps get refresh tokens that expire after 7 days.
                      </p>
                    </div>
                  </div>
                </>
              )}
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
