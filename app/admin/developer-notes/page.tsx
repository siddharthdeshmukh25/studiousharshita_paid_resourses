'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Circle,
  CheckCircle,
  Loader2,
  Search,
  Pencil,
  X,
  Check,
  Flag,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface DeveloperNote {
  _id: string;
  content: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
}

const STATUS_OPTIONS = ['todo', 'in_progress', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

const STATUS_META: Record<string, { label: string; className: string }> = {
  todo: { label: 'To do', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: 'In progress', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  done: { label: 'Done', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
};

const PRIORITY_META: Record<string, { label: string; className: string; rank: number }> = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', rank: 0 },
  medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', rank: 1 },
  high: { label: 'High', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', rank: 2 },
};

export default function DeveloperNotesPage() {
  const [notes, setNotes] = useState<DeveloperNote[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, todo: 0, in_progress: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newNote, setNewNote] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newTags, setNewTags] = useState('');
  const [adding, setAdding] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const response = await fetch(`/api/admin/developer-notes?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load notes');
      setNotes(data.notes || []);
      setStats(data.stats || { total: 0, todo: 0, in_progress: 0, done: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const tags = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6);
      const response = await fetch('/api/admin/developer-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote, priority: newPriority, tags }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add note');
      setNewNote('');
      setNewTags('');
      setNewPriority('medium');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setAdding(false);
    }
  };

  const toggleStatus = async (note: DeveloperNote) => {
    const nextStatus = note.status === 'done' ? 'todo' : note.status === 'todo' ? 'in_progress' : 'done';
    try {
      await fetch('/api/admin/developer-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note._id, status: nextStatus }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    }
  };

  const changePriority = async (note: DeveloperNote, priority: string) => {
    try {
      await fetch('/api/admin/developer-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note._id, priority }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update priority');
    }
  };

  const saveEdit = async (note: DeveloperNote) => {
    if (!editContent.trim()) return;
    try {
      await fetch('/api/admin/developer-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note._id, content: editContent }),
      });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await fetch('/api/admin/developer-notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Developer Tools</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-.045em] text-gray-900 dark:text-gray-100">Developer Notes</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Keep track of features, ideas and tasks for your project.
            </p>
          </div>
          <button
            onClick={() => document.getElementById('note-input')?.focus()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total notes', value: stats.total, className: 'text-gray-900 dark:text-gray-100' },
            { label: 'To do', value: stats.todo, className: 'text-gray-500 dark:text-gray-400' },
            { label: 'In progress', value: stats.in_progress, className: 'text-amber-600 dark:text-amber-400' },
            { label: 'Done', value: stats.done, className: 'text-blue-600 dark:text-blue-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#111111]">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold ${stat.className}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Create Note Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-[#111111]">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Create a new note</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">What would you like to add?</label>
              <textarea
                id="note-input"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Describe a feature, bug, idea or improvement..."
                className="w-full min-h-[90px] rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p} className="capitalize">{p} priority</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tags (comma separated, optional)</label>
                <input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="frontend, payment, ui"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={addNote}
                disabled={adding || !newNote.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {['all', ...STATUS_OPTIONS].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 dark:bg-[#111111] dark:text-gray-300 dark:border-gray-700'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_META[s].label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-full sm:w-56 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-100"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-[#111111]">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-[#111111]">
              <div className="h-2 w-2 rounded-full bg-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No developer notes yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Start capturing ideas, features and improvements for your project.
              </p>
              <button
                onClick={() => document.getElementById('note-input')?.focus()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add your first note
              </button>
            </div>
          ) : (
            notes.map((note) => {
              const statusMeta = STATUS_META[note.status];
              const priorityMeta = PRIORITY_META[note.priority] || PRIORITY_META.medium;
              const isEditing = editingId === note._id;
              return (
                <div
                  key={note._id}
                  className={`rounded-xl border p-5 transition-all ${
                    note.status === 'done'
                      ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/50'
                      : 'bg-white border-gray-200 dark:bg-[#111111] dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button onClick={() => toggleStatus(note)} className="mt-0.5 flex-shrink-0" title="Cycle status">
                        {note.status === 'done' ? (
                          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        ) : note.status === 'in_progress' ? (
                          <Loader2 className="h-5 w-5 text-amber-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={2}
                              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(note)}
                                className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                <Check className="h-3.5 w-3.5" /> Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                                <X className="h-3.5 w-3.5" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-sm leading-relaxed ${
                            note.status === 'done'
                              ? 'line-through text-gray-500 dark:text-gray-400'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {note.content}
                          </p>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${priorityMeta.className}`}>
                            <Flag className="h-3 w-3" />
                            {priorityMeta.label}
                          </span>
                          <select
                            value={note.priority}
                            onChange={(e) => changePriority(note, e.target.value)}
                            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-300 focus:outline-none"
                            title="Change priority"
                          >
                            {PRIORITY_OPTIONS.map((p) => (
                              <option key={p} value={p} className="capitalize">{p}</option>
                            ))}
                          </select>
                          {note.tags.map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {tag}
                            </span>
                          ))}
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex gap-1">
                        {!isEditing && (
                          <button
                            onClick={() => { setEditingId(note._id); setEditContent(note.content); }}
                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                            title="Edit note"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNote(note._id)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                          title="Delete note"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}