'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Package, Plus, Trash2, Edit, BarChart3 } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/admin/AdminLayout';
import KPICard from '@/components/admin/KPICard';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false });

interface Resource {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount?: number;
  images?: string[];
  thumbnail?: string;
  thumbnailUrl?: string;
  image?: string;
  imageUrl?: string;
  category: string;
  linkType?: string;
  linkUrl?: string;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
}

interface ResourceMetrics { totalOpens: number; uniqueUsers: number; buyers: number; }
interface ResourceAnalytics {
  resource: { title: string; isFree: boolean };
  summary: { totalOpens: number; uniqueUsers: number; buyers: number; buyersWhoOpened: number };
  accesses: { userId: string; name?: string; email?: string; opens: number; firstOpenedAt: string; lastOpenedAt: string; sources?: string[] }[];
  buyers: { _id: string; name?: string; email?: string; purchasedAt?: string; amount?: number }[];
}

function ResourcesPageContent() {
  const searchParams = useSearchParams();
  const createEmptyNewResource = () => ({
    title: '',
    description: '',
    price: '',
    discount: '',
    images: [] as string[],
    imageFiles: [] as File[],
    tempImageUrl: '',
    uploadingImage: false,
    linkType: 'google_drive' as 'google_drive' | 'notion' | 'docs',
    linkUrl: '',
    category: '',
  });
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceMetrics, setResourceMetrics] = useState<Record<string, ResourceMetrics>>({});
  const [resourceAnalytics, setResourceAnalytics] = useState<ResourceAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsResourceId, setAnalyticsResourceId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [addingResource, setAddingResource] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newImageInputType, setNewImageInputType] = useState<'url' | 'upload'>('url');
  const [newResource, setNewResource] = useState(createEmptyNewResource());
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'resource', id: string } | null>(null);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [resourceAccess, setResourceAccess] = useState<'free' | 'paid'>('paid');
  const [analyticsTimeFilter, setAnalyticsTimeFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();
  const filteredResources = searchQuery
    ? resources.filter((resource) => `${resource.title} ${resource.category} ${resource.description}`.toLowerCase().includes(searchQuery))
    : resources;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resourcesRes, categoriesRes, analyticsRes] = await Promise.all([
          fetch('/api/resources'),
          fetch('/api/categories'),
          fetch('/api/admin/resources/analytics'),
        ]);

        const resourcesData = await resourcesRes.json();
        const categoriesData = await categoriesRes.json();
        const analyticsData = await analyticsRes.json();

        setResources(resourcesData.resources || []);
        setCategories(categoriesData.categories || []);
        setResourceMetrics(analyticsRes.ok ? analyticsData.metrics || {} : {});
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteResource = async (id: string) => {
    setItemToDelete({ type: 'resource', id });
    setDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleteLoading(itemToDelete.id);
      const response = await fetch(`/api/resources/${itemToDelete.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete resource.');
      setResources(resources.filter((r) => r._id !== itemToDelete.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
    } finally {
      setDeleteLoading(null);
      setItemToDelete(null);
      setDeleteConfirmModal(false);
    }
  };

  const handleEditResource = (resource: Resource) => {
    console.log('Editing resource:', resource);
    setEditingResource(resource);
    setResourceAccess(resource.price === 0 ? 'free' : 'paid');
    
    // Initialize images with backward compatibility - check multiple possible field names
    const initialImages = resource.images && resource.images.length > 0 
      ? resource.images 
      : (resource.thumbnail 
        ? [resource.thumbnail] 
        : (resource.thumbnailUrl 
          ? [resource.thumbnailUrl] 
          : (resource.image 
            ? [resource.image] 
            : (resource.imageUrl ? [resource.imageUrl] : []))));
    
    console.log('Initial images loaded:', initialImages);
    
    setNewResource({
      title: resource.title,
      description: resource.description,
      price: resource.price.toString(),
      discount: resource.discount?.toString() || '',
      images: initialImages,
      imageFiles: [],
      tempImageUrl: '',
      uploadingImage: false,
      linkType: (resource.linkType || 'google_drive') as 'google_drive' | 'notion' | 'docs',
      linkUrl: resource.linkUrl || '',
      category: resource.category,
    });
    setDiscountType('percentage');
    setShowAddModal(true);
  };

  const viewResourceAnalytics = async (resourceId: string) => {
    setAnalyticsLoading(true);
    setAnalyticsResourceId(resourceId);
    setResourceAnalytics(null);
    setAnalyticsTimeFilter('all');
    try {
      const response = await fetch(`/api/admin/resources/${resourceId}/analytics`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load analytics');
      setResourceAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const viewResourceAnalyticsWithFilter = async (resourceId: string, filter: 'all' | '7days' | '30days' | '90days') => {
    setAnalyticsLoading(true);
    setAnalyticsTimeFilter(filter);
    try {
      const url = `/api/admin/resources/${resourceId}/analytics${filter !== 'all' ? `?filter=${filter}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load analytics');
      setResourceAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setNewResource((current) => ({ ...current, uploadingImage: true }));
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await response.json();
      setNewResource((current) => ({
        ...current,
        images: [...current.images, data.secure_url],
        uploadingImage: false,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setNewResource((current) => ({ ...current, uploadingImage: false }));
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newResource.uploadingImage) {
      setError('Please wait for the image upload to finish.');
      return;
    }
    if (newResource.images.length === 0) {
      setError('Please add at least one image.');
      return;
    }
    if (newResource.images.length > 5) {
      setError('Maximum 5 images allowed.');
      return;
    }
    setAddingResource(true);
    setError(null);

    try {
      const isEditing = editingResource !== null;
      const url = isEditing ? `/api/resources/${editingResource._id}` : '/api/resources';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newResource.title,
          description: newResource.description,
          images: newResource.images,
          price: resourceAccess === 'free' ? 0 : parseFloat(newResource.price),
          discount: resourceAccess === 'free' ? 0 : (newResource.discount ? parseFloat(newResource.discount) : 0),
          linkType: newResource.linkType,
          linkUrl: newResource.linkUrl,
          category: newResource.category,
        }),
      });

      console.log('Sending images:', newResource.images);

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || (isEditing ? 'Failed to update resource' : 'Failed to create resource'));
        throw new Error(data.error || (isEditing ? 'Failed to update resource' : 'Failed to create resource'));
      }

      const data = await response.json();
      console.log('Response data:', data.resource);
      if (isEditing) {
        setResources(resources.map((r) => (r._id === editingResource._id ? data.resource : r)));
        console.log('Updated local resources state');
      } else {
        setResources([data.resource, ...resources]);
      }
      setShowAddModal(false);
      setEditingResource(null);
      setNewResource(createEmptyNewResource());
      setResourceAccess('paid');
      setNewImageInputType('url');
    } catch (err) {
      setError(err instanceof Error ? err.message : (editingResource ? 'Failed to update resource' : 'Failed to create resource'));
    } finally {
      setAddingResource(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading resources">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
              Resources
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 font-normal">
              Manage your resources
            </p>
          </div>
          <button
            onClick={() => { setEditingResource(null); setNewResource(createEmptyNewResource()); setResourceAccess('paid'); setShowAddModal(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs px-3 py-2 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Add Resource</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Stats Card */}
        <div className="grid max-w-sm grid-cols-1 gap-4">
          <KPICard
            title="Total Resources"
            value={resources.length}
            icon={<Package className="h-5 w-5 lg:h-6 lg:w-6" />}
          />
        </div>

        {/* Resources Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-1 border-b border-gray-200 px-5 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">All resources</h2><p className="text-sm text-gray-600 dark:text-gray-400">Manage content, access and engagement in one place.</p></div>
            {searchQuery && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{filteredResources.length} result{filteredResources.length === 1 ? '' : 's'} for “{searchParams.get('search')}”</p>}
          </div>

          {filteredResources.length === 0 ? (
            <div className="p-16 text-center">
              <Package className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-base text-gray-600 dark:text-gray-400">No resources found</p>
            </div>
          ) : (
            <div className="max-h-[620px] overflow-auto">
              <table className="w-full min-w-[900px]">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Opens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Buyers</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredResources.map((resource) => (
                    <tr key={resource._id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={resource.images?.[0] || resource.thumbnail || resource.thumbnailUrl || resource.image || resource.imageUrl || '/placeholder.png'}
                            alt={resource.title}
                            className="h-10 w-10 rounded-lg object-cover mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                              {resource.title}
                            </div>
                            <div 
                              className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]"
                              dangerouslySetInnerHTML={{ 
                                __html: resource.description.replace(/<[^>]*>/g, '').substring(0, 60) 
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          {resource.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {resource.price === 0 ? (
                          <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Free</span>
                        ) : resource.discount && resource.discount > 0 ? (
                          <div>
                            <span className="line-through text-gray-400 dark:text-gray-500 mr-1 text-xs">₹{resource.price}</span>
                            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">₹{(resource.price * (1 - resource.discount / 100)).toFixed(2)}</span>
                            <span className="text-xs text-red-500 ml-1">({Math.round(resource.discount)}% off)</span>
                          </div>
                        ) : (
                          <span className="text-sm">₹{resource.price}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {resourceMetrics[resource._id]?.totalOpens ? <><span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{resourceMetrics[resource._id].totalOpens}</span><span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({resourceMetrics[resource._id].uniqueUsers} users)</span></> : <span className="text-sm text-gray-400 dark:text-gray-500">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {resource.price === 0 ? <span className="text-gray-400 dark:text-gray-500">—</span> : resourceMetrics[resource._id]?.buyers ? <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{resourceMetrics[resource._id].buyers}</span> : <span className="text-gray-400 dark:text-gray-500">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => viewResourceAnalytics(resource._id)} className="mr-3 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300" title="View analytics"><BarChart3 className="h-4 w-4" /><span className="hidden lg:inline">Analytics</span></button>
                        <button
                          onClick={() => handleEditResource(resource)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource._id)}
                          disabled={deleteLoading === resource._id}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          {deleteLoading === resource._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Modal */}
      {(analyticsLoading || resourceAnalytics) && (
        <div className="fixed inset-0 z-[70] flex items-end bg-gray-900/45 p-0 sm:items-center sm:justify-center sm:p-6">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl sm:max-w-4xl sm:rounded-3xl border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-5 sm:px-7">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Resource analytics</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{resourceAnalytics?.resource.title || 'Loading analytics...'}</h2></div>
              <div className="flex items-center gap-2"><button onClick={() => { setResourceAnalytics(null); setAnalyticsLoading(false); setAnalyticsResourceId(null); }} className="rounded-full p-2 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white" aria-label="Close analytics"><Package className="h-5 w-5" /></button></div>
            </div>
            {analyticsLoading || !resourceAnalytics ? <div className="grid min-h-72 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-blue-600 dark:text-blue-400" /></div> : <div className="p-5 sm:p-7 space-y-6">
              {/* Time Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time filter:</span>
                {(['all', '7days', '30days', '90days'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => analyticsResourceId && viewResourceAnalyticsWithFilter(analyticsResourceId, filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${analyticsTimeFilter === filter ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    {filter === 'all' ? 'All time' : filter === '7days' ? '7 days' : filter === '30days' ? '30 days' : '90 days'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[['Total opens', resourceAnalytics.summary.totalOpens], ['Unique users', resourceAnalytics.summary.uniqueUsers], ['Buyers', resourceAnalytics.resource.isFree ? null : resourceAnalytics.summary.buyers], ['Buyers opened', resourceAnalytics.resource.isFree ? null : resourceAnalytics.summary.buyersWhoOpened]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border-none bg-gray-50 dark:bg-slate-800 p-4"><p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p><p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value ?? '—'}</p></div>)}
              </div>

              {/* User Access List */}
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Users Who Clicked ({resourceAnalytics.accesses.length})</h3>
                </div>
                {resourceAnalytics.accesses.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No clicks recorded yet</div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clicks</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">First Click</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Click</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {resourceAnalytics.accesses.map((access, idx) => (
                          <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-slate-800">
                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{access.name || 'Anonymous'}</td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{access.email || '—'}</td>
                            <td className="px-5 py-3 font-semibold text-blue-600 dark:text-blue-400">{access.opens}</td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">{new Date(access.firstOpenedAt).toLocaleDateString()}</td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">{new Date(access.lastOpenedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Buyers List */}
              {!resourceAnalytics.resource.isFree && resourceAnalytics.buyers.length > 0 && (
                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Buyers ({resourceAnalytics.buyers.length})</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Buyer</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Purchased</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {resourceAnalytics.buyers.map((buyer, idx) => (
                          <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-slate-800">
                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{buyer.name || '—'}</td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{buyer.email || '—'}</td>
                            <td className="px-5 py-3 font-semibold text-blue-600 dark:text-blue-400">₹{buyer.amount}</td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">{buyer.purchasedAt ? new Date(buyer.purchasedAt).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>}
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="admin-mobile-modal fixed inset-0 z-50 bg-slate-950/75 p-0 sm:bg-slate-900/45 sm:p-6">
          <div className="mx-auto flex h-full max-w-5xl items-center justify-center">
            <div className="admin-modal-card h-full w-full overflow-y-auto rounded-b-[28px] rounded-t-none border border-gray-200 bg-white dark:bg-slate-900 shadow-xl sm:max-h-[92vh] sm:rounded-[28px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="border-b border-gray-200 bg-gradient-to-r from-[#60A5FA] via-[#3B82F6] to-[#60A5FA] p-5 sm:p-6 sm:rounded-t-[28px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-white/80 sm:block">Admin</p>
                  <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{editingResource ? 'Edit Resource' : 'Add New Resource'}</h2>
                  <p className="mt-1 text-sm text-white/90">{editingResource ? 'Update resource details and information.' : 'Create a polished listing with thumbnail, price and delivery link.'}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingResource(null);
                    setNewResource(createEmptyNewResource());
                    setNewImageInputType('url');
                    setResourceAccess('paid');
                  }}
                  className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                >
                  <Package className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddResource} className="bg-gray-50 dark:bg-slate-800/50 p-4 sm:p-6 overflow-x-hidden">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.95fr)]">
              <div className="space-y-5">
              <div className="rounded-2xl border-none bg-white dark:bg-slate-900 p-5 shadow-sm">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800 transition-all"
                  placeholder="Enter resource title"
                />
              </div>

              <div className="rounded-2xl border-none bg-white dark:bg-slate-900 p-5 shadow-sm">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Description
                </label>
                <RichTextEditor
                  value={newResource.description}
                  onChange={(value) => setNewResource({ ...newResource, description: value })}
                  placeholder="Enter resource description with formatting..."
                  className="w-full"
                  maxLength={10000}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-none bg-white dark:bg-slate-900 px-4 py-3 shadow-sm">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Resource type</label>
                <div role="tablist" aria-label="Choose whether this resource is free or paid" className="relative grid h-10 w-44 grid-cols-2 rounded-xl bg-gray-100 dark:bg-slate-800 p-1">
                  <span aria-hidden="true" className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-lg bg-white dark:bg-slate-700 shadow-sm transition-transform duration-300 ease-out ${resourceAccess === 'free' ? 'translate-x-1' : 'translate-x-[calc(100%+3px)]'}`} />
                  <button type="button" role="tab" aria-selected={resourceAccess === 'free'} onClick={() => { setResourceAccess('free'); setNewResource({ ...newResource, price: '0', discount: '' }); }} className={`relative z-10 rounded-lg text-sm font-bold transition-colors ${resourceAccess === 'free' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>Free</button>
                  <button type="button" role="tab" aria-selected={resourceAccess === 'paid'} onClick={() => { setResourceAccess('paid'); }} className={`relative z-10 rounded-lg text-sm font-bold transition-colors ${resourceAccess === 'paid' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>Paid</button>
                </div>
              </div>

              {resourceAccess === 'paid' && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border-none bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={newResource.price}
                    onChange={(e) => setNewResource({ ...newResource, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800 transition-all"
                    placeholder="0.00"
                  />
                </div>
                </div>

                <div className="rounded-2xl border-none bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Discount Type
                  </label>
                  <div className="flex gap-1 mb-3 relative bg-gray-200 dark:bg-slate-700 rounded-md p-0.5">
                    <div className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-blue-500 rounded-sm transition-all duration-300 ease-in-out ${discountType === 'percentage' ? 'left-0.5' : 'left-[calc(50%+1px)]'}`} />
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('percentage');
                        setNewResource({ ...newResource, discount: '' });
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-sm transition-all duration-300 z-10 text-xs font-medium whitespace-nowrap flex items-center justify-center ${discountType === 'percentage' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('fixed');
                        setNewResource({ ...newResource, discount: '' });
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-sm transition-all duration-300 z-10 text-xs font-medium whitespace-nowrap flex items-center justify-center ${discountType === 'fixed' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      Fixed Price (₹)
                    </button>
                  </div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? 100 : undefined}
                    step="0.01"
                    value={newResource.discount}
                    onChange={(e) => setNewResource({ ...newResource, discount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800 transition-all placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder={discountType === 'percentage' ? 'No discount' : 'No discount'}
                  />
                </div>
              </div>
              </div>}

              <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Link Type
                </label>
                <select
                  required
                  value={newResource.linkType}
                  onChange={(e) => setNewResource({ ...newResource, linkType: e.target.value as 'google_drive' | 'notion' | 'docs' })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-all bg-white dark:bg-slate-800"
                >
                  <option value="google_drive">Google Drive</option>
                  <option value="notion">Notion</option>
                  <option value="docs">Google Docs</option>
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {newResource.linkType === 'google_drive' ? 'Google Drive File Link' : newResource.linkType === 'notion' ? 'Notion Page Link' : 'Google Docs Link'}
                </label>
                <input
                  type="url"
                  required
                  value={newResource.linkUrl}
                  onChange={(e) => setNewResource({ ...newResource, linkUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-all bg-white dark:bg-slate-800"
                  placeholder={newResource.linkType === 'google_drive' ? 'https://drive.google.com/file/d/...' : newResource.linkType === 'notion' ? 'https://notion.so/...' : 'https://docs.google.com/document/d/...'}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Category
                </label>
                <select
                  required
                  value={newResource.category}
                  onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-all bg-white dark:bg-slate-800"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">No categories available. Please add a category first.</p>
                )}
              </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-gray-100">Resource Images (Up to 5)</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">Add up to 5 images to showcase your resource.</p>
                  </div>

                  {/* Image Grid */}
                  {newResource.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {newResource.images.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Image ${index + 1}`}
                            className="aspect-square w-full rounded-lg object-cover border border-slate-200 dark:border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setNewResource({
                                ...newResource,
                                images: newResource.images.filter((_, i) => i !== index),
                              });
                            }}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Image Section */}
                  {newResource.images.length < 5 && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <label className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium transition-all ${newImageInputType === 'url' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-gray-400 hover:border-slate-300 dark:hover:border-gray-600'}`}>
                          <input
                            type="radio"
                            name="imageType"
                            checked={newImageInputType === 'url'}
                            onChange={() => setNewImageInputType('url')}
                            className="sr-only"
                          />
                          <span>URL</span>
                        </label>
                        <label className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium transition-all ${newImageInputType === 'upload' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-gray-400 hover:border-slate-300 dark:hover:border-gray-600'}`}>
                          <input
                            type="radio"
                            name="imageType"
                            checked={newImageInputType === 'upload'}
                            onChange={() => setNewImageInputType('upload')}
                            className="sr-only"
                          />
                          <span>Upload</span>
                        </label>
                      </div>

                      {newImageInputType === 'url' ? (
                        <div className="mt-4">
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">Image URL</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={newResource.tempImageUrl || ''}
                              onChange={(e) => setNewResource({ ...newResource, tempImageUrl: e.target.value })}
                              className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                              placeholder="https://example.com/image.jpg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newResource.tempImageUrl?.trim()) {
                                  setNewResource({
                                    ...newResource,
                                    images: [...newResource.images, newResource.tempImageUrl.trim()],
                                    tempImageUrl: '',
                                  });
                                }
                              }}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">Upload image</label>
                          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-gray-600 bg-slate-50 dark:bg-slate-800/50 p-4">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(file);
                                }
                              }}
                              disabled={newResource.uploadingImage}
                              className="block w-full text-sm text-slate-600 dark:text-gray-400 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:font-medium file:text-white hover:file:bg-blue-700 disabled:cursor-not-allowed"
                            />
                            {newResource.uploadingImage && (
                              <p className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">Uploading image...</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {newResource.images.length === 5 && (
                    <p className="mt-4 text-sm text-amber-600 dark:text-amber-400 font-medium">Maximum 5 images reached. Remove an image to add another.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-gray-100">Quick Tips</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-gray-400">
                    <li>Use a bright thumbnail so the resource card stands out.</li>
                    <li>Keep title short and description crisp for better readability.</li>
                    <li>Check the delivery link before saving the resource.</li>
                  </ul>
                </div>
              </div>
                </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingResource}
                  className="flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {addingResource ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>{editingResource ? 'Save' : 'Add Resource'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmModal}
        onClose={() => {
          setDeleteConfirmModal(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Resource"
        message="Are you sure you want to delete this resource? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </AdminLayout>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-white dark:bg-[#0a0a0a]" />}>
      <ResourcesPageContent />
    </Suspense>
  );
}
