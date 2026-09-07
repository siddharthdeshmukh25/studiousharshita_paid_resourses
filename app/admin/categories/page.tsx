'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

type Category = { _id: string; name: string; description?: string };
const emptyForm = { name: '', description: '' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const response = await fetch('/api/categories');
    const data = await response.json();
    if (response.ok) setCategories(data.categories || []);
  };
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError('');
    const response = await fetch(editing ? `/api/categories/${editing._id}` : '/api/categories', {
      method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error || 'Could not save category.');
    setCategories(current => editing ? current.map(item => item._id === editing._id ? data.category : item) : [...current, data.category].sort((a, b) => a.name.localeCompare(b.name)));
    setEditing(null); setForm(emptyForm);
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) return setError(data.error || 'Could not delete category.');
    setCategories(current => current.filter(item => item._id !== id));
  };

  const startEdit = (category: Category) => { setEditing(category); setForm({ name: category.name, description: category.description || '' }); setError(''); };
  const cancel = () => { setEditing(null); setForm(emptyForm); setError(''); };

  return <AdminLayout><div className="space-y-6"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Catalog</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.045em] text-gray-900 dark:text-gray-100">Category Hub</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create, edit and remove resource categories from one page.</p></div>
    <section className="rounded-xl border border-slate-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900"><h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">{editing ? <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />}{editing ? 'Edit category' : 'Add category'}</h2><form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-[1fr_2fr_auto]"><input required maxLength={50} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Category name" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" /><input maxLength={200} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" /><div className="flex gap-2"><button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"><Save className="h-4 w-4" />{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</button>{editing && <button type="button" onClick={cancel} className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">{editing && <X className="h-4 w-4" />}</button>}</div></form>{error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}</section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"><div className="border-b border-slate-200 px-5 py-4 dark:border-gray-700"><h2 className="font-semibold text-gray-900 dark:text-gray-100">All categories</h2></div><div className="divide-y divide-slate-100 dark:divide-gray-800">{categories.map(category => <div key={category._id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-100 dark:hover:bg-gray-800"><div><p className="font-medium text-gray-900 dark:text-gray-100">{category.name}</p>{category.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{category.description}</p>}</div><div className="flex gap-2"><button onClick={() => startEdit(category)} className="rounded-md p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" aria-label={`Edit ${category.name}`}><Edit3 className="h-4 w-4" /></button><button onClick={() => void remove(category._id)} className="rounded-md p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label={`Delete ${category.name}`}><Trash2 className="h-4 w-4" /></button></div></div>)}{!categories.length && <p className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">No categories yet.</p>}</div></section>
  </div></AdminLayout>;
}
