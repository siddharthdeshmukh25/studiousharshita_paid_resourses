'use client';

import { FormEvent, useState, useRef, useEffect } from 'react';
import { Check, Loader2, UserCheck, Search, X, User, FileText } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

type User = { _id: string; email: string; name?: string };
type Resource = { _id: string; title: string; category?: string };
type Form = { userId: string; resourceId: string; orderId: string; userEmail: string; resourceTitle: string };
const emptyForm: Form = { userId: '', resourceId: '', orderId: '', userEmail: '', resourceTitle: '' };

export default function GrantAccessPage() {
  const [mode, setMode] = useState<'grant' | 'revoke'>('grant');
  const [form, setForm] = useState<Form>(emptyForm);
  const [users, setUsers] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const resourceDropdownRef = useRef<HTMLDivElement>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showResourceDropdown, setShowResourceDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (resourceDropdownRef.current && !resourceDropdownRef.current.contains(event.target as Node)) {
        setShowResourceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchUsers = async (email: string) => {
    if (email.trim().length < 2) {
      setUsers([]);
      setShowUserDropdown(false);
      return;
    }
    const response = await fetch(`/api/admin/users/search?email=${encodeURIComponent(email)}`);
    const data = await response.json(); 
    setUsers(data.users || []);
    setShowUserDropdown((data.users || []).length > 0 && !form.userId);
  };
  
  const searchResources = async (title: string) => {
    if (title.trim().length < 2) {
      setResources([]);
      setShowResourceDropdown(false);
      return;
    }
    const response = await fetch(`/api/admin/resources/search?title=${encodeURIComponent(title)}`);
    const data = await response.json(); 
    setResources(data.resources || []);
    setShowResourceDropdown((data.resources || []).length > 0 && !form.resourceId);
  };

  const selectUser = (user: User) => {
    setForm({ ...form, userId: user._id, userEmail: user.email });
    setUsers([]);
    setShowUserDropdown(false);
  };

  const selectResource = (resource: Resource) => {
    setForm({ ...form, resourceId: resource._id, resourceTitle: resource.title });
    setResources([]);
    setShowResourceDropdown(false);
  };

  const clearUser = () => {
    setForm({ ...form, userId: '', userEmail: '' });
    setUsers([]);
    setShowUserDropdown(false);
  };

  const clearResource = () => {
    setForm({ ...form, resourceId: '', resourceTitle: '' });
    setResources([]);
    setShowResourceDropdown(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    const response = await fetch('/api/admin/grant-access', { method: mode === 'grant' ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: form.userId, resourceId: form.resourceId, ...(mode === 'grant' ? { orderId: form.orderId } : {}) }) });
    const data = await response.json(); setSaving(false);
    if (!response.ok) return setError(data.error || 'Could not grant access.');
    setMessage(data.message || (mode === 'grant' ? 'Access granted successfully.' : 'Access revoked successfully.')); setForm(emptyForm); setUsers([]); setResources([]);
  };

  const inputClass = 'w-full rounded-md border border-slate-200 bg-transparent px-3 py-2.5 text-sm dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all';
  const dropdownClass = 'absolute z-50 mt-2 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 custom-scrollbar';

  return <AdminLayout><div className="mx-auto max-w-3xl space-y-6 font-poppins"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Access control</p><h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-[-.045em] text-gray-900 dark:text-gray-100">Resource Access</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Grant or revoke an existing user's access to a resource.</p></div>
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex gap-2 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
        <button type="button" onClick={() => { setMode('grant'); setError(''); setMessage(''); }} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === 'grant' ? 'bg-blue-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'}`}>Grant access</button>
        <button type="button" onClick={() => { setMode('revoke'); setError(''); setMessage(''); }} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === 'revoke' ? 'bg-red-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'}`}>Revoke access</button>
      </div>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="flex items-center gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700"><Check className="h-4 w-4" />{message}</p>}
      
      {/* User Search with Improved Dropdown */}
      <div className="relative" ref={userDropdownRef}>
        <label className="mb-2 block text-sm font-medium">User email</label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              required 
              value={form.userEmail} 
              onChange={e => { const userEmail = e.target.value; setForm({ ...form, userEmail, userId: '' }); void searchUsers(userEmail); }} 
              onFocus={() => users.length > 0 && setShowUserDropdown(true)}
              placeholder="Search by email" 
              className={`${inputClass} pl-10 pr-10`}
            />
            {form.userEmail && (
              <button
                type="button"
                onClick={clearUser}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Enhanced User Dropdown */}
          {showUserDropdown && users.length > 0 && (
            <div className={dropdownClass}>
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 px-3 py-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {users.length} user{users.length !== 1 ? 's' : ''} found
                </p>
              </div>
              {users.map(user => (
                <button
                  type="button"
                  key={user._id}
                  onClick={() => selectUser(user)}
                  className="flex items-center gap-3 w-full px-3 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{user.email}</p>
                    {user.name && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.name}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resource Search with Improved Dropdown */}
      <div className="relative" ref={resourceDropdownRef}>
        <label className="mb-2 block text-sm font-medium">Resource</label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              required 
              value={form.resourceTitle} 
              onChange={e => { const resourceTitle = e.target.value; setForm({ ...form, resourceTitle, resourceId: '' }); void searchResources(resourceTitle); }}
              onFocus={() => resources.length > 0 && setShowResourceDropdown(true)}
              placeholder="Search by resource title" 
              className={`${inputClass} pl-10 pr-10`}
            />
            {form.resourceTitle && (
              <button
                type="button"
                onClick={clearResource}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Enhanced Resource Dropdown */}
          {showResourceDropdown && resources.length > 0 && (
            <div className={dropdownClass}>
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 px-3 py-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {resources.length} resource{resources.length !== 1 ? 's' : ''} found
                </p>
              </div>
              {resources.map(resource => (
                <button
                  type="button"
                  key={resource._id}
                  onClick={() => selectResource(resource)}
                  className="flex items-center gap-3 w-full px-3 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{resource.title}</p>
                    {resource.category && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{resource.category}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {mode === 'grant' && <div><label className="mb-2 block text-sm font-medium">Order ID <span className="font-normal text-slate-500">(optional)</span></label><input value={form.orderId} onChange={e => setForm({ ...form, orderId: e.target.value })} placeholder="Payment order ID, if available" className={inputClass} /></div>}
      
      <button 
        disabled={saving || !form.userId || !form.resourceId} 
        className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 transition-colors w-full sm:w-auto ${mode === 'grant' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
        {saving ? (mode === 'grant' ? 'Granting...' : 'Revoking...') : mode === 'grant' ? 'Grant Access' : 'Revoke Access'}
      </button>
    </form>
  </div></AdminLayout>;
}