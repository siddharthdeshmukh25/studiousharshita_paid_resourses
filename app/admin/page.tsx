'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package, Users, IndianRupee, Plus, Trash2, Edit, X, LogOut, MoreVertical } from 'lucide-react';
import PageSkeleton from '@/components/ui/PageSkeleton';

interface Resource {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount?: number;
  thumbnailUrl: string;
  category: string;
  linkType?: string;
  linkUrl?: string;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
}

interface Coupon {
  _id: string;
  code: string;
  title: string;
  expiresAt: string;
  discountPercentage: number;
  isActive: boolean;
}

interface Stats {
  totalRevenue: number;
  totalUsers: number;
  totalResources: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalUsers: 0, totalResources: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [addingResource, setAddingResource] = useState(false);
  const [editingResourceLoading, setEditingResourceLoading] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [deleteCouponLoading, setDeleteCouponLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteCategoryLoading, setDeleteCategoryLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    price: '',
    discount: '',
    thumbnailUrl: '',
    thumbnailFile: null as File | null,
    uploadingImage: false,
    linkType: 'google_drive' as 'google_drive' | 'notion' | 'docs',
    linkUrl: '',
    category: '',
  });

  const [editResource, setEditResource] = useState({
    title: '',
    description: '',
    price: '',
    discount: '',
    thumbnailUrl: '',
    linkType: 'google_drive' as 'google_drive' | 'notion' | 'docs',
    linkUrl: '',
    category: '',
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  });

  const [newCoupon, setNewCoupon] = useState({ code: '', title: '', expiresAt: '', discountPercentage: '' });

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin/login');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resourcesRes, statsRes, categoriesRes, couponsRes] = await Promise.all([
          fetch('/api/resources'),
          fetch('/api/admin/stats'),
          fetch('/api/categories'),
          fetch('/api/admin/coupons'),
        ]);

        const resourcesData = await resourcesRes.json();
        const statsData = await statsRes.json();
        const categoriesData = await categoriesRes.json();
        const couponsData = await couponsRes.json();

        setResources(resourcesData.resources || []);
        setStats(statsData || { totalRevenue: 0, totalUsers: 0, totalResources: 0 });
        setCategories(categoriesData.categories || []);
        setCoupons(couponsData.coupons || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    setAddingCoupon(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCoupon, discountPercentage: Number(newCoupon.discountPercentage) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create coupon.');
      setCoupons((current) => [data.coupon, ...current]);
      setNewCoupon({ code: '', title: '', expiresAt: '', discountPercentage: '' });
      setShowCouponModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create coupon.');
    } finally {
      setAddingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    setDeleteCouponLoading(id);
    try {
      const response = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete coupon.');
      setCoupons((current) => current.filter((coupon) => coupon._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete coupon.');
    } finally {
      setDeleteCouponLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    setDeleteLoading(id);
    setError(null);

    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete resource');
      }

      setResources(resources.filter((r) => r._id !== id));
      setStats((prev) => ({ ...prev, totalResources: prev.totalResources - 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setEditResource({
      title: resource.title,
      description: resource.description,
      price: resource.price.toString(),
      discount: resource.discount?.toString() || '',
      thumbnailUrl: resource.thumbnailUrl,
      linkType: (resource.linkType || 'google_drive') as 'google_drive' | 'notion' | 'docs',
      linkUrl: resource.linkUrl || '',
      category: resource.category,
    });
    setShowEditModal(true);
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;

    setEditingResourceLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/resources/${editingResource._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editResource,
          price: parseFloat(editResource.price),
          discount: editResource.discount ? parseFloat(editResource.discount) : 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update resource');
      }

      const data = await response.json();
      setResources(resources.map((r) => (r._id === editingResource._id ? data.resource : r)));
      setShowEditModal(false);
      setEditingResource(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resource');
    } finally {
      setEditingResourceLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    setDeleteCategoryLoading(id);
    setError(null);

    try {
      console.log('Deleting category with ID:', id);
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      console.log('Delete response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category');
      }

      setCategories(categories.filter((c) => c._id !== id));
      setShowCategoryDropdown(false);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setDeleteCategoryLoading(null);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({ name: category.name, description: category.description || '' });
    setShowEditCategoryModal(true);
    setShowCategoryDropdown(false);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCategory(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${editingCategory?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update category');
      }

      const data = await response.json();
      setCategories(categories.map((c) => c._id === editingCategory?._id ? data.category : c));
      setShowEditCategoryModal(false);
      setEditingCategory(null);
      setNewCategory({ name: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCategory(true);
    setError(null);

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create category');
      }

      const data = await response.json();
      setCategories([...categories, data.category]);
      setShowCategoryModal(false);
      setNewCategory({ name: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setNewResource({ ...newResource, uploadingImage: true });
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
      setNewResource({ 
        ...newResource, 
        thumbnailUrl: data.secure_url, 
        uploadingImage: false 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setNewResource({ ...newResource, uploadingImage: false });
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingResource(true);
    setError(null);

    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newResource,
          thumbnailUrl: newResource.thumbnailUrl,
          price: parseFloat(newResource.price),
          discount: newResource.discount ? parseFloat(newResource.discount) : 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create resource');
      }

      const data = await response.json();
      setResources([data.resource, ...resources]);
      setStats((prev) => ({ ...prev, totalResources: prev.totalResources + 1 }));
      setShowAddModal(false);
      setNewResource({
        title: '',
        description: '',
        price: '',
        discount: '',
        thumbnailUrl: '',
        thumbnailFile: null,
        uploadingImage: false,
        linkType: 'google_drive',
        linkUrl: '',
        category: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resource');
    } finally {
      setAddingResource(false);
    }
  };

  if (loading) {
    return <PageSkeleton cards={6} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="flex-1 py-6 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-3 sm:mb-8 sm:items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-3xl mb-1 sm:mb-2">
                Admin Dashboard
              </h1>
              <p className="text-xs text-gray-600 sm:text-base">
                Manage your resources and users
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex shrink-0 items-center justify-center space-x-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 sm:px-4 sm:text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="mb-5 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-6">
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:rounded-xl sm:p-6 sm:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-medium leading-tight text-gray-500 sm:text-sm">Resources</p>
                  <p className="text-lg font-bold text-gray-900 sm:text-3xl">{stats.totalResources}</p>
                </div>
                <Package className="h-5 w-5 text-blue-600 sm:h-12 sm:w-12" />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:rounded-xl sm:p-6 sm:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-medium leading-tight text-gray-500 sm:text-sm">Users</p>
                  <p className="text-lg font-bold text-gray-900 sm:text-3xl">{stats.totalUsers}</p>
                </div>
                <Users className="h-5 w-5 text-green-600 sm:h-12 sm:w-12" />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:rounded-xl sm:p-6 sm:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-medium leading-tight text-gray-500 sm:text-sm">Revenue</p>
                  <p className="text-lg font-bold text-gray-900 sm:text-3xl">₹{stats.totalRevenue}</p>
                </div>
                <IndianRupee className="h-5 w-5 text-purple-600 sm:h-12 sm:w-12" />
              </div>
            </div>
          </div>

          {/* Add Resource Button with Dropdown */}
          <div className="mb-5 grid grid-cols-3 gap-2 sm:mb-6 sm:flex sm:items-center sm:gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto sm:gap-2 sm:px-6 sm:py-3 sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sm:hidden">Resource</span><span className="hidden sm:inline">Add New Resource</span>
            </button>
            <div className="relative sm:w-auto">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex w-full items-center justify-center gap-1 rounded-lg bg-gray-600 px-2 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-gray-700 sm:w-auto sm:gap-2 sm:px-6 sm:py-3 sm:text-base"
              >
                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Categories</span>
              </button>
              {showCategoryDropdown && (
                <div className="mobile-category-sheet fixed inset-0 z-40 flex flex-col overflow-y-auto bg-[#F8FAFC] sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:block sm:max-h-80 sm:w-64 sm:rounded-xl sm:border sm:border-gray-200 sm:bg-white sm:shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-white px-5 py-4 sm:hidden">
                    <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2563EB]">Admin tools</p><h2 className="mt-1 text-xl font-bold text-[#0F172A]">Manage categories</h2></div>
                    <button onClick={() => setShowCategoryDropdown(false)} className="grid h-10 w-10 place-items-center rounded-full bg-[#EFF6FF] text-[#2563EB]" aria-label="Close categories"><X className="h-5 w-5" /></button>
                  </div>
                  <button
                    onClick={() => {
                      setShowCategoryModal(true);
                      setShowCategoryDropdown(false);
                    }}
                    className="mx-4 mt-5 flex w-auto items-center justify-center space-x-2 rounded-xl bg-[#2563EB] px-4 py-3 text-left font-semibold text-white shadow-sm hover:bg-[#1D4ED8] sm:m-0 sm:w-full sm:justify-start sm:rounded-none sm:bg-transparent sm:px-4 sm:text-gray-700 sm:shadow-none sm:hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Add New Category</span>
                  </button>
                  {categories.length > 0 && (
                    <>
                      <div className="mt-5 border-b border-[#E2E8F0] bg-white px-5 py-3 sm:mt-0 sm:px-4 sm:py-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Categories</span>
                      </div>
                      {categories.map((category) => (
                        <div
                          key={category._id}
                          className="mx-4 flex items-center justify-between border-b border-[#E2E8F0] bg-white px-4 py-4 last:border-b-0 sm:mx-0 sm:px-4 sm:py-3 sm:hover:bg-gray-50"
                        >
                          <span className="text-sm text-gray-700 flex-1">{category.name}</span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category._id)}
                              disabled={deleteCategoryLoading === category._id}
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50"
                            >
                              {deleteCategoryLoading === category._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowCouponModal(true)}
              className="flex items-center justify-center gap-1 rounded-lg bg-purple-600 px-2 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-purple-700 sm:w-auto sm:gap-2 sm:px-6 sm:py-3 sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sm:hidden">Coupon</span><span className="hidden sm:inline">Create Coupon</span>
            </button>
          </div>

          {/* Resources Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Resources</h2>
            </div>

            {resources.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No resources found</p>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-auto">
                <table className="min-w-[720px] w-full">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resources.map((resource) => (
                      <tr key={resource._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={resource.thumbnailUrl}
                              alt={resource.title}
                              className="h-10 w-10 rounded-lg object-cover mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {resource.title}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {resource.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {resource.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {resource.discount && resource.discount > 0 ? (
                            <div>
                              <span className="line-through text-gray-400 mr-2">₹{resource.price}</span>
                              <span className="text-green-600 font-semibold">₹{(resource.price * (1 - resource.discount / 100)).toFixed(2)}</span>
                              <span className="text-xs text-red-500 ml-1">({resource.discount}% off)</span>
                            </div>
                          ) : (
                            <span>₹{resource.price}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditResource(resource)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(resource._id)}
                            disabled={deleteLoading === resource._id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
      </main>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="admin-mobile-modal fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="admin-modal-card bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Add New Resource</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddResource} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
                  placeholder="Enter resource title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={newResource.description}
                  onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all resize-none"
                  placeholder="Enter resource description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={newResource.price}
                    onChange={(e) => setNewResource({ ...newResource, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newResource.discount}
                    onChange={(e) => setNewResource({ ...newResource, discount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Thumbnail
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="thumbnailType"
                        checked={!newResource.thumbnailFile}
                        onChange={() => setNewResource({ ...newResource, thumbnailFile: null })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">URL</span>
                    </label>
                    <input
                      type="url"
                      required={!newResource.thumbnailFile}
                      disabled={!!newResource.thumbnailFile}
                      value={newResource.thumbnailUrl}
                      onChange={(e) => setNewResource({ ...newResource, thumbnailUrl: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all disabled:bg-gray-100"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="thumbnailType"
                        checked={!!newResource.thumbnailFile}
                        onChange={() => {}}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Upload File</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required={!!newResource.thumbnailFile}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewResource({ ...newResource, thumbnailFile: file });
                          handleImageUpload(file);
                        }
                      }}
                      disabled={newResource.uploadingImage}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all disabled:bg-gray-100"
                    />
                    {newResource.uploadingImage && (
                      <p className="text-sm text-blue-600 mt-2">Uploading image...</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Link Type
                </label>
                <select
                  required
                  value={newResource.linkType}
                  onChange={(e) => setNewResource({ ...newResource, linkType: e.target.value as 'google_drive' | 'notion' | 'docs' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all bg-white"
                >
                  <option value="google_drive">Google Drive</option>
                  <option value="notion">Notion</option>
                  <option value="docs">Google Docs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {newResource.linkType === 'google_drive' ? 'Google Drive File Link' : newResource.linkType === 'notion' ? 'Notion Page Link' : 'Google Docs Link'}
                </label>
                <input
                  type="url"
                  required
                  value={newResource.linkUrl}
                  onChange={(e) => setNewResource({ ...newResource, linkUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
                  placeholder={newResource.linkType === 'google_drive' ? 'https://drive.google.com/file/d/...' : newResource.linkType === 'notion' ? 'https://notion.so/...' : 'https://docs.google.com/document/d/...'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category
                </label>
                <select
                  required
                  value={newResource.category}
                  onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all bg-white"
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingResource}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center space-x-2 transition-all font-medium shadow-lg"
                >
                  {addingResource ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Resource</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {showEditModal && editingResource && (
        <div className="admin-mobile-modal fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="admin-modal-card bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Edit Resource</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingResource(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateResource} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editResource.title}
                  onChange={(e) => setEditResource({ ...editResource, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
                  placeholder="Enter resource title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={editResource.description}
                  onChange={(e) => setEditResource({ ...editResource, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all resize-none"
                  placeholder="Enter resource description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editResource.price}
                    onChange={(e) => setEditResource({ ...editResource, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editResource.discount}
                    onChange={(e) => setEditResource({ ...editResource, discount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Link Type
                </label>
                <select
                  required
                  value={editResource.linkType}
                  onChange={(e) => setEditResource({ ...editResource, linkType: e.target.value as 'google_drive' | 'notion' | 'docs' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all bg-white"
                >
                  <option value="google_drive">Google Drive</option>
                  <option value="notion">Notion</option>
                  <option value="docs">Google Docs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {editResource.linkType === 'google_drive' ? 'Google Drive File Link' : editResource.linkType === 'notion' ? 'Notion Page Link' : 'Google Docs Link'}
                </label>
                <input
                  type="url"
                  required
                  value={editResource.linkUrl}
                  onChange={(e) => setEditResource({ ...editResource, linkUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
                  placeholder={editResource.linkType === 'google_drive' ? 'https://drive.google.com/file/d/...' : editResource.linkType === 'notion' ? 'https://notion.so/...' : 'https://docs.google.com/document/d/...'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category
                </label>
                <select
                  required
                  value={editResource.category}
                  onChange={(e) => setEditResource({ ...editResource, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all bg-white"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingResource(null);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingResourceLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {editingResourceLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Resource</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="mx-auto mb-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Coupons</h2>
              <p className="mt-1 text-sm text-gray-500">Active coupons can be applied to any resource.</p>
            </div>
            <button onClick={() => setShowCouponModal(true)} className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 sm:w-auto">Create Coupon</button>
          </div>
          {coupons.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">No coupons created yet.</p>
          ) : (
            <div className="max-h-[320px] overflow-auto">
              <table className="min-w-[650px] w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-6 py-3">Code</th><th className="px-6 py-3">Title</th><th className="px-6 py-3">Discount</th><th className="px-6 py-3">Expires</th><th className="px-6 py-3 text-right">Action</th></tr></thead>
                <tbody>{coupons.map((coupon) => <tr key={coupon._id} className="border-t border-gray-100"><td className="px-6 py-4 font-bold tracking-wide text-purple-700">{coupon.code}</td><td className="px-6 py-4 text-gray-700">{coupon.title}</td><td className="px-6 py-4 font-semibold text-green-700">{coupon.discountPercentage}%</td><td className="px-6 py-4 text-gray-600">{new Date(coupon.expiresAt).toLocaleDateString()}</td><td className="px-6 py-4 text-right"><button onClick={() => handleDeleteCoupon(coupon._id)} disabled={deleteCouponLoading === coupon._id} className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50">{deleteCouponLoading === coupon._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Edit Category Modal */}
      {showEditCategoryModal && (
        <div className="admin-mobile-modal fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="admin-modal-card bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Edit Category</h2>
                <button
                  onClick={() => {
                    setShowEditCategoryModal(false);
                    setEditingCategory(null);
                    setNewCategory({ name: '', description: '' });
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateCategory} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 transition-all"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 transition-all resize-none"
                  placeholder="Enter category description"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCategoryModal(false);
                    setEditingCategory(null);
                    setNewCategory({ name: '', description: '' });
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCategory}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 flex items-center space-x-2 transition-all font-medium shadow-lg"
                >
                  {addingCategory ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Category</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCouponModal && (
        <div className="admin-mobile-modal fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 p-4 backdrop-blur-sm">
          <div className="admin-modal-card w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
              <div><h2 className="text-xl font-semibold text-white">Create Coupon</h2><p className="mt-1 text-sm text-purple-100">Applies to every resource purchase.</p></div>
              <button onClick={() => setShowCouponModal(false)} className="text-white hover:text-purple-100"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleAddCoupon} className="space-y-5 p-6">
              <div><label className="mb-2 block text-sm font-semibold text-gray-900">Coupon code</label><input required maxLength={30} value={newCoupon.code} onChange={(event) => setNewCoupon({ ...newCoupon, code: event.target.value.toUpperCase() })} placeholder="WELCOME20" className="w-full rounded-xl border border-gray-300 px-4 py-3 font-bold uppercase text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></div>
              <div><label className="mb-2 block text-sm font-semibold text-gray-900">Coupon title</label><input required value={newCoupon.title} onChange={(event) => setNewCoupon({ ...newCoupon, title: event.target.value })} placeholder="Welcome discount" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="mb-2 block text-sm font-semibold text-gray-900">Expiry date</label><input required type="date" value={newCoupon.expiresAt} onChange={(event) => setNewCoupon({ ...newCoupon, expiresAt: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-3 text-gray-900 outline-none focus:border-purple-500" /></div><div><label className="mb-2 block text-sm font-semibold text-gray-900">Discount %</label><input required type="number" min="1" max="100" value={newCoupon.discountPercentage} onChange={(event) => setNewCoupon({ ...newCoupon, discountPercentage: event.target.value })} placeholder="20" className="w-full rounded-xl border border-gray-300 px-3 py-3 text-gray-900 outline-none focus:border-purple-500" /></div></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowCouponModal(false)} className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50">Cancel</button><button type="submit" disabled={addingCoupon} className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-medium text-white hover:bg-purple-700 disabled:opacity-50">{addingCoupon && <Loader2 className="h-4 w-4 animate-spin" />}Create Coupon</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="admin-mobile-modal fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="admin-modal-card bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-teal-600 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Add New Category</h2>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all resize-none"
                  placeholder="Enter category description"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCategory}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 disabled:opacity-50 flex items-center space-x-2 transition-all font-medium shadow-lg"
                >
                  {addingCategory ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Category</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
