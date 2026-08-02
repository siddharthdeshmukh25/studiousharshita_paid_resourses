'use client';

import { useEffect, useState } from 'react';
import { Loader2, Package, Users, IndianRupee, Plus, Trash2, Edit, X, LogOut, MoreVertical, Settings } from 'lucide-react';
import PageSkeleton from '@/components/ui/PageSkeleton';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false });

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
  minimumPurchaseAmount?: number;
  isActive: boolean;
}

interface Stats {
  totalRevenue: number;
  totalUsers: number;
  totalResources: number;
}

export default function AdminPage() {
  const createEmptyNewResource = () => ({
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
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalUsers: 0, totalResources: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [addingResource, setAddingResource] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showGatewaySelection, setShowGatewaySelection] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [tempPaymentSettings, setTempPaymentSettings] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deleteCouponLoading, setDeleteCouponLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteCategoryLoading, setDeleteCategoryLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [couponModalError, setCouponModalError] = useState<string | null>(null);
  const [newThumbnailInputType, setNewThumbnailInputType] = useState<'url' | 'upload'>('url');
  const [newResource, setNewResource] = useState(createEmptyNewResource());
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'resource' | 'category' | 'coupon', id: string } | null>(null);
  const [logoutConfirmModal, setLogoutConfirmModal] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  });

  const [newCoupon, setNewCoupon] = useState({ code: '', title: '', expiresAt: '', discountPercentage: '', minimumPurchaseAmount: '' });
  const hasNewThumbnailPreview = Boolean(newResource.thumbnailUrl.trim());

  const handleLogout = async () => {
    setLogoutConfirmModal(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to logout.');
      }

      window.location.replace('/admin/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout.');
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resourcesRes, statsRes, categoriesRes, couponsRes, paymentSettingsRes] = await Promise.all([
          fetch('/api/resources'),
          fetch('/api/admin/stats'),
          fetch('/api/categories'),
          fetch('/api/admin/coupons'),
          fetch('/api/admin/payment-settings'),
        ]);

        const resourcesData = await resourcesRes.json();
        const statsData = await statsRes.json();
        const categoriesData = await categoriesRes.json();
        const couponsData = await couponsRes.json();
        const paymentSettingsData = await paymentSettingsRes.json();

        setResources(resourcesData.resources || []);
        setStats(statsData || { totalRevenue: 0, totalUsers: 0, totalResources: 0 });
        setCategories(categoriesData.categories || []);
        setCoupons(couponsData.coupons || []);
        setPaymentSettings(paymentSettingsData.settings || null);
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
    setCouponModalError(null);
    try {
      const discountPercentage = Number(newCoupon.discountPercentage);
      
      const isEditing = editingCoupon !== null;
      const url = isEditing ? `/api/admin/coupons?id=${editingCoupon._id}` : '/api/admin/coupons';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: newCoupon.code,
          title: newCoupon.title,
          expiresAt: newCoupon.expiresAt,
          discountPercentage,
          minimumPurchaseAmount: newCoupon.minimumPurchaseAmount ? Number(newCoupon.minimumPurchaseAmount) : 0 
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (isEditing ? 'Failed to update coupon.' : 'Failed to create coupon.'));

      if (isEditing) {
        setCoupons((current) => current.map((c) => c._id === editingCoupon._id ? data.coupon : c));
      } else {
        setCoupons((current) => [data.coupon, ...current]);
      }
      setNewCoupon({ code: '', title: '', expiresAt: '', discountPercentage: '', minimumPurchaseAmount: '' });
      setShowCouponModal(false);
      setEditingCoupon(null);
    } catch (err) {
      setCouponModalError(err instanceof Error ? err.message : (editingCoupon ? 'Failed to update coupon.' : 'Failed to create coupon.'));
    } finally {
      setAddingCoupon(false);
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponModalError(null);
    setNewCoupon({
      code: coupon.code,
      title: coupon.title,
      expiresAt: new Date(coupon.expiresAt).toISOString().split('T')[0],
      discountPercentage: coupon.discountPercentage.toString(),
      minimumPurchaseAmount: coupon.minimumPurchaseAmount?.toString() || '',
    });
    setShowCouponModal(true);
  };

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/admin/payment-settings');
      const data = await response.json();
      if (response.ok) {
        setPaymentSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch payment settings:', err);
    }
  };

  const handleSavePaymentSettings = async () => {
    setSavingSettings(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempPaymentSettings || paymentSettings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save settings');
      setShowPaymentModal(false);
      setShowGatewaySelection(false);
      setTempPaymentSettings(null);
      await fetchPaymentSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    if (showPaymentModal) {
      fetchPaymentSettings();
    }
  }, [showPaymentModal]);

  const handleDeleteCoupon = async (id: string) => {
    setItemToDelete({ type: 'coupon', id });
    setDeleteConfirmModal(true);
  };

  const handleDeleteResource = async (id: string) => {
    setItemToDelete({ type: 'resource', id });
    setDeleteConfirmModal(true);
  };

  const handleDeleteCategory = async (id: string) => {
    setItemToDelete({ type: 'category', id });
    setDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'coupon') {
        setDeleteCouponLoading(itemToDelete.id);
        const response = await fetch(`/api/admin/coupons?id=${itemToDelete.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete coupon.');
        setCoupons((current) => current.filter((c) => c._id !== itemToDelete.id));
      } else if (itemToDelete.type === 'resource') {
        setDeleteLoading(itemToDelete.id);
        const response = await fetch(`/api/resources/${itemToDelete.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete resource.');
        setResources(resources.filter((r) => r._id !== itemToDelete.id));
        setStats((prev) => ({ ...prev, totalResources: prev.totalResources - 1 }));
      } else if (itemToDelete.type === 'category') {
        setDeleteCategoryLoading(itemToDelete.id);
        const response = await fetch(`/api/categories/${itemToDelete.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete category.');
        setCategories((current) => current.filter((c) => c._id !== itemToDelete.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    } finally {
      setDeleteCouponLoading(null);
      setDeleteLoading(null);
      setDeleteCategoryLoading(null);
      setItemToDelete(null);
      setDeleteConfirmModal(false);
    }
  };

  const getDeleteMessage = () => {
    if (!itemToDelete) return '';
    switch (itemToDelete.type) {
      case 'coupon':
        return 'Are you sure you want to delete this coupon? This action cannot be undone.';
      case 'resource':
        return 'Are you sure you want to delete this resource? This action cannot be undone.';
      case 'category':
        return 'Are you sure you want to delete this category? This action cannot be undone.';
      default:
        return 'Are you sure you want to delete this item? This action cannot be undone.';
    }
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setNewResource({
      title: resource.title,
      description: resource.description,
      price: resource.price.toString(),
      discount: resource.discount?.toString() || '',
      thumbnailUrl: resource.thumbnailUrl,
      thumbnailFile: null,
      uploadingImage: false,
      linkType: (resource.linkType || 'google_drive') as 'google_drive' | 'notion' | 'docs',
      linkUrl: resource.linkUrl || '',
      category: resource.category,
    });
    setDiscountType('percentage');
    setShowAddModal(true);
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
        thumbnailUrl: data.secure_url,
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
      setError('Please wait for the thumbnail upload to finish.');
      return;
    }
    if (!newResource.thumbnailUrl.trim()) {
      setError(newThumbnailInputType === 'upload' ? 'Please upload a thumbnail image.' : 'Please add a thumbnail URL.');
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
          ...newResource,
          thumbnailUrl: newResource.thumbnailUrl,
          price: parseFloat(newResource.price),
          discount: newResource.discount ? parseFloat(newResource.discount) : 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || (isEditing ? 'Failed to update resource' : 'Failed to create resource'));
      }

      const data = await response.json();
      if (isEditing) {
        setResources(resources.map((r) => (r._id === editingResource._id ? data.resource : r)));
      } else {
        setResources([data.resource, ...resources]);
        setStats((prev) => ({ ...prev, totalResources: prev.totalResources + 1 }));
      }
      setShowAddModal(false);
      setEditingResource(null);
      setNewResource(createEmptyNewResource());
      setNewThumbnailInputType('url');
    } catch (err) {
      setError(err instanceof Error ? err.message : (editingResource ? 'Failed to update resource' : 'Failed to create resource'));
    } finally {
      setAddingResource(false);
    }
  };

  if (loading) {
    return <PageSkeleton cards={6} />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">

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
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex shrink-0 items-center justify-center space-x-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-gray-200 z-50">
                    <button
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        setShowPaymentModal(true);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <img
                        src={
                          paymentSettings?.gateway === 'razorpay' ? 'https://razorpay.com/favicon.png' :
                          paymentSettings?.gateway === 'payu' ? 'https://payu.in/favicon.ico' :
                          paymentSettings?.gateway === 'cashfree' ? 'https://cashfree.com/favicon.ico' :
                          'https://cashfree.com/favicon.ico'
                        }
                        alt="Payment"
                        className="h-5 w-5"
                      />
                      <span>Payment</span>
                    </button>
                    <button
                      onClick={() => setShowSettingsDropdown(false)}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span>General</span>
                    </button>
                    <button
                      onClick={() => setShowSettingsDropdown(false)}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      <span>Notifications</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex shrink-0 items-center justify-center space-x-1.5 rounded-lg bg-red-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2 sm:text-sm"
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                <span className="hidden sm:inline">{loggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="mb-5 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-6">
            <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm sm:rounded-xl sm:p-6 sm:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium leading-tight text-gray-500 sm:text-sm">Resources</p>
                  <p className="text-lg font-bold text-gray-900 sm:text-3xl">{stats.totalResources}</p>
                </div>
                <Package className="h-5 w-5 text-blue-600 sm:h-12 sm:w-12" />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm sm:rounded-xl sm:p-6 sm:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium leading-tight text-gray-500 sm:text-sm">Users</p>
                  <p className="text-lg font-bold text-gray-900 sm:text-3xl">{stats.totalUsers}</p>
                </div>
                <Users className="h-5 w-5 text-green-600 sm:h-12 sm:w-12" />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm sm:rounded-xl sm:p-6 sm:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium leading-tight text-gray-500 sm:text-sm">Revenue</p>
                  <p className="text-lg font-bold text-gray-900 sm:text-3xl">₹{stats.totalRevenue}</p>
                </div>
                <IndianRupee className="h-5 w-5 text-purple-600 sm:h-12 sm:w-12" />
              </div>
            </div>
          </div>

          {/* Add Resource Button with Dropdown */}
          <div className="mb-5 grid grid-cols-3 gap-2 sm:relative sm:z-20 sm:mb-6 sm:flex sm:items-center sm:gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto sm:gap-2 sm:px-6 sm:py-3 sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sm:hidden">Resource</span><span className="hidden sm:inline">Add New Resource</span>
            </button>
            <div className="relative sm:w-auto">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-gray-700 sm:w-auto sm:gap-2 sm:px-6 sm:py-3 sm:text-base"
              >
                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Categories</span>
              </button>
              {showCategoryDropdown && (
                <div className="mobile-category-sheet fixed inset-0 z-40 flex flex-col overflow-y-auto bg-[#F8FAFC] sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:z-50 sm:mt-2 sm:max-h-80 sm:w-64 sm:overflow-y-auto sm:rounded-xl sm:border sm:border-gray-200 sm:bg-white sm:shadow-xl">
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
              className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-purple-700 sm:w-auto sm:gap-2 sm:px-6 sm:py-3 sm:text-base"
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
              <div className="max-h-[420px] overflow-x-auto overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                              <div 
                                className="text-sm text-gray-500 truncate max-w-xs"
                                dangerouslySetInnerHTML={{ 
                                  __html: resource.description.replace(/<[^>]*>/g, '').substring(0, 100) 
                                }}
                              />
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
                              <span className="text-xs text-red-500 ml-1">({Math.round(resource.discount)}% off)</span>
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
                            onClick={() => handleDeleteResource(resource._id)}
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
        <div className="admin-mobile-modal fixed inset-0 z-50 bg-slate-950/75 p-0 backdrop-blur-sm sm:bg-slate-900/45 sm:p-6">
          <div className="mx-auto flex h-full max-w-5xl items-center justify-center">
            <div className="admin-modal-card h-full w-full overflow-y-auto rounded-b-[28px] rounded-t-none border border-white/20 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)] sm:max-h-[92vh] sm:rounded-[28px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="border-b border-white/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 sm:p-6 sm:rounded-t-[28px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-blue-100 sm:block">Admin</p>
                  <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{editingResource ? 'Edit Resource' : 'Add New Resource'}</h2>
                  <p className="mt-1 text-sm text-blue-100/90">{editingResource ? 'Update resource details and information.' : 'Create a polished listing with thumbnail, price and delivery link.'}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingResource(null);
                    setNewResource(createEmptyNewResource());
                    setNewThumbnailInputType('url');
                  }}
                  className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddResource} className="bg-slate-50/80 p-4 sm:p-6 overflow-x-hidden">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.95fr)]">
              <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <RichTextEditor
                  value={newResource.description}
                  onChange={(value) => setNewResource({ ...newResource, description: value })}
                  placeholder="Enter resource description with formatting..."
                  className="w-full"
                  maxLength={1000}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Discount Type
                  </label>
                  <div className="flex gap-1 mb-3 relative bg-gray-200 rounded-md p-0.5">
                    <div className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-blue-500 rounded-sm transition-all duration-300 ease-in-out ${discountType === 'percentage' ? 'left-0.5' : 'left-[calc(50%+1px)]'}`} />
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('percentage');
                        setNewResource({ ...newResource, discount: '' });
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-sm transition-all duration-300 z-10 text-xs font-medium ${discountType === 'percentage' ? 'text-white' : 'text-gray-700'}`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('fixed');
                        setNewResource({ ...newResource, discount: '' });
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-sm transition-all duration-300 z-10 text-xs font-medium ${discountType === 'fixed' ? 'text-white' : 'text-gray-700'}`}
                    >
                      Fixed Price (₹)
                    </button>
                  </div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? 100 : undefined}
                    step="0.01"
                    value={newResource.discount}
                    onChange={(e) => setNewResource({ ...newResource, discount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
                    placeholder={discountType === 'percentage' ? 'No discount' : 'No discount'}
                  />
                </div>
              </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900">Thumbnail</h3>
                    <p className="mt-1 text-sm text-slate-500">Desktop card ko cleaner look dene ke liye yahan live preview dikh raha hai.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium transition-all ${newThumbnailInputType === 'url' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="thumbnailType"
                        checked={newThumbnailInputType === 'url'}
                        onChange={() => {
                          setNewThumbnailInputType('url');
                          setNewResource((current) => ({ ...current, thumbnailFile: null }));
                        }}
                        className="sr-only"
                      />
                      <span>URL</span>
                    </label>
                    <label className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium transition-all ${newThumbnailInputType === 'upload' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="thumbnailType"
                        checked={newThumbnailInputType === 'upload'}
                        onChange={() => setNewThumbnailInputType('upload')}
                        className="sr-only"
                      />
                      <span>Upload</span>
                    </label>
                  </div>

                  {newThumbnailInputType === 'url' ? (
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium text-slate-700">Image URL</label>
                      <input
                        type="url"
                        required={newThumbnailInputType === 'url'}
                        value={newResource.thumbnailUrl}
                        onChange={(e) => setNewResource({ ...newResource, thumbnailUrl: e.target.value, thumbnailFile: null })}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  ) : (
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium text-slate-700">Upload image</label>
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewResource((current) => ({ ...current, thumbnailFile: file }));
                          handleImageUpload(file);
                        }
                      }}
                      disabled={newResource.uploadingImage}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:font-medium file:text-white hover:file:bg-blue-700 disabled:cursor-not-allowed"
                    />
                    {newResource.uploadingImage && (
                          <p className="mt-3 text-sm font-medium text-blue-600">Uploading image...</p>
                    )}
                  </div>
                    </div>
                  )}

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">Preview</p>
                      <span className="text-xs font-medium text-slate-500">16:10 recommended</span>
                    </div>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200">
                      {hasNewThumbnailPreview ? (
                        <img
                          src={newResource.thumbnailUrl}
                          alt="Thumbnail preview"
                          className="aspect-[16/10] h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[16/10] items-center justify-center px-6 text-center text-sm text-slate-500">
                          Add a thumbnail URL or upload an image to preview it here.
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      {newResource.uploadingImage ? 'Image upload in progress.' : hasNewThumbnailPreview ? 'Thumbnail ready for desktop card preview.' : 'PNG or JPG image works best.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">Quick Tips</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
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
                  className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
            <div className="max-h-[320px] overflow-x-auto overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="min-w-[650px] w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-6 py-3">Code</th><th className="px-6 py-3">Title</th><th className="px-6 py-3">Discount</th><th className="px-6 py-3">Min Purchase</th><th className="px-6 py-3">Expires</th><th className="px-6 py-3 text-right">Action</th></tr></thead>
                <tbody>{coupons.map((coupon) => <tr key={coupon._id} className="border-t border-gray-100"><td className="px-6 py-4 font-bold tracking-wide text-purple-700">{coupon.code}</td><td className="px-6 py-4 text-gray-700">{coupon.title}</td><td className="px-6 py-4 font-semibold text-green-700">{coupon.discountPercentage}%</td><td className="px-6 py-4 text-gray-600">{coupon.minimumPurchaseAmount ? `₹${coupon.minimumPurchaseAmount}` : 'No limit'}</td><td className="px-6 py-4 text-gray-600">{new Date(coupon.expiresAt).toLocaleDateString()}</td><td className="px-6 py-4 text-right"><button onClick={() => handleEditCoupon(coupon)} className="mr-2 rounded p-1 text-blue-600 hover:bg-blue-50"><Edit className="h-4 w-4" /></button><button onClick={() => handleDeleteCoupon(coupon._id)} disabled={deleteCouponLoading === coupon._id} className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50">{deleteCouponLoading === coupon._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Edit Category Modal */}
      {showEditCategoryModal && (
        <div className="admin-mobile-modal fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4">
          <div className="admin-modal-card bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-t-none md:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Edit Category</h2>
                <button
                  onClick={() => {
                    setShowEditCategoryModal(false);
                    setEditingCategory(null);
                    setNewCategory({ name: '', description: '' });
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateCategory} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 transition-all text-sm"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  maxLength={200}
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 transition-all resize-none text-sm"
                  placeholder="Enter category description"
                />
              </div>

              <div className="flex justify-end space-x-2 sm:space-x-3 pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCategoryModal(false);
                    setEditingCategory(null);
                    setNewCategory({ name: '', description: '' });
                  }}
                  className="px-3 py-1.5 sm:px-6 sm:py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCategory}
                  className="px-3 py-1.5 sm:px-6 sm:py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 flex items-center space-x-2 transition-all font-medium shadow-lg text-xs sm:text-sm"
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
        <div className="admin-mobile-modal fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4 sm:p-4">
          <div className="admin-modal-card max-h-[90vh] w-full overflow-y-auto bg-white rounded-2xl shadow-2xl sm:max-w-lg sm:mx-4 sm:rounded-xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 p-6 sm:rounded-t-xl">
              <div><h2 className="text-xl font-semibold text-white">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2><p className="mt-1 text-sm text-purple-100">{editingCoupon ? 'Update coupon details and discount.' : 'Applies to every resource purchase.'}</p></div>
              <button onClick={() => {
                setShowCouponModal(false);
                setEditingCoupon(null);
                setNewCoupon({ code: '', title: '', expiresAt: '', discountPercentage: '', minimumPurchaseAmount: '' });
                setCouponModalError(null);
              }} className="text-white hover:text-purple-100"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleAddCoupon} className="space-y-5 p-6">
              {couponModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {couponModalError}
                </div>
              )}
              <div><label className="mb-2 block text-sm font-semibold text-gray-900">Coupon code</label><input required minLength={3} maxLength={30} value={newCoupon.code} onChange={(event) => setNewCoupon({ ...newCoupon, code: event.target.value.toUpperCase() })} placeholder="WELCOME20" className="w-full rounded-xl border border-gray-300 px-4 py-3 font-bold uppercase text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 sm:rounded-lg sm:border-gray-200 sm:px-3 sm:py-2.5" /></div>
              <div><label className="mb-2 block text-sm font-semibold text-gray-900">Coupon title</label><input required maxLength={50} value={newCoupon.title} onChange={(event) => setNewCoupon({ ...newCoupon, title: event.target.value })} placeholder="Welcome discount" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 sm:rounded-lg sm:border-gray-200 sm:px-3 sm:py-2.5" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="mb-2 block text-sm font-semibold text-gray-900">Expiry date</label><input required type="date" value={newCoupon.expiresAt} onChange={(event) => setNewCoupon({ ...newCoupon, expiresAt: event.target.value })} className="w-full rounded-xl border border-gray-300 px-3 py-3 text-gray-900 outline-none focus:border-purple-500 sm:rounded-lg sm:border-gray-200 sm:px-3 sm:py-2.5" /></div><div><label className="mb-2 block text-sm font-semibold text-gray-900">Discount %</label><input required type="number" min="1" max="100" value={newCoupon.discountPercentage} onChange={(event) => setNewCoupon({ ...newCoupon, discountPercentage: event.target.value })} placeholder="20" className="w-full rounded-xl border border-gray-300 px-3 py-3 text-gray-900 outline-none focus:border-purple-500 sm:rounded-lg sm:border-gray-200 sm:px-3 sm:py-2.5" /></div></div>
              <div><label className="mb-2 block text-sm font-semibold text-gray-900">Minimum purchase amount (₹) <span className="text-gray-400 font-normal">(Optional - coupon only works above this amount)</span></label><input type="number" min="0" step="0.01" value={newCoupon.minimumPurchaseAmount} onChange={(event) => setNewCoupon({ ...newCoupon, minimumPurchaseAmount: event.target.value })} placeholder="0" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 sm:rounded-lg sm:border-gray-200 sm:px-3 sm:py-2.5" /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => {
                setShowCouponModal(false);
                setEditingCoupon(null);
                setNewCoupon({ code: '', title: '', expiresAt: '', discountPercentage: '', minimumPurchaseAmount: '' });
              }} className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50 sm:rounded-lg sm:px-4 sm:py-2.5">Cancel</button><button type="submit" disabled={addingCoupon} className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-medium text-white hover:bg-purple-700 disabled:opacity-50 sm:rounded-lg sm:px-4 sm:py-2.5">{addingCoupon && <Loader2 className="h-4 w-4 animate-spin" />}{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal - Shows current configured gateway */}
      {showPaymentModal && !showGatewaySelection && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/30 p-0 md:p-4">
          <div className="h-full w-full md:max-h-[80vh] md:max-w-lg md:rounded-2xl bg-white shadow-2xl overflow-y-auto rounded-t-none md:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-none md:rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-white">Payment Settings</h2>
                <p className="mt-1 text-sm text-blue-100">Current payment configuration</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-white hover:text-blue-100 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {paymentSettings && (
                <div className="space-y-4">
                  {/* Current Gateway Display */}
                  <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-3">
                          <img
                            src={
                              paymentSettings.gateway === 'razorpay' ? 'https://razorpay.com/favicon.png' :
                              paymentSettings.gateway === 'payu' ? 'https://payu.in/favicon.ico' :
                              paymentSettings.gateway === 'cashfree' ? 'https://cashfree.com/favicon.ico' :
                              'https://cashfree.com/favicon.ico'
                            }
                            alt={paymentSettings.gateway}
                            className="h-8 w-8"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 capitalize">
                            {paymentSettings.gateway === 'razorpay' ? 'Razorpay' :
                             paymentSettings.gateway === 'payu' ? 'PayU' :
                             paymentSettings.gateway === 'cashfree' ? 'Cashfree' :
                             paymentSettings.gateway}
                          </h3>
                          <p className="text-sm text-gray-500">Active Payment Gateway</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-blue-100">
                        <span className="text-sm text-gray-600">Client ID / Key</span>
                        <span className="text-sm font-mono font-semibold text-gray-900">
                          {paymentSettings[paymentSettings.gateway]?.clientId ||
                           paymentSettings[paymentSettings.gateway]?.keyId ||
                           paymentSettings[paymentSettings.gateway]?.key || 'Not configured'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-100">
                        <span className="text-sm text-gray-600">Secret Key</span>
                        <span className="text-sm font-mono font-semibold text-gray-900">
                          {paymentSettings[paymentSettings.gateway]?.hasSecret ||
                           paymentSettings[paymentSettings.gateway]?.hasSalt ? '••••••••••••' : 'Not configured'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Other Payment Mode Button */}
                  <button
                    onClick={() => {
                      // Convert old format to new format if needed
                      const convertedSettings = {
                        gateway: paymentSettings.gateway,
                        razorpay: {
                          keyId: paymentSettings.razorpay?.keyId || paymentSettings.razorpay?.testKeyId || paymentSettings.razorpay?.productionKeyId || '',
                          keySecret: '', // Don't copy secret for security
                        },
                        payu: {
                          key: paymentSettings.payu?.key || paymentSettings.payu?.testKey || paymentSettings.payu?.productionKey || '',
                          salt: '', // Don't copy salt for security
                        },
                        cashfree: {
                          clientId: paymentSettings.cashfree?.clientId || paymentSettings.cashfree?.testClientId || paymentSettings.cashfree?.productionClientId || '',
                          clientSecret: '', // Don't copy secret for security
                        },
                      };
                      setTempPaymentSettings(convertedSettings);
                      setShowGatewaySelection(true);
                    }}
                    className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      <span className="font-semibold text-gray-700">Switch to other payment mode</span>
                    </div>
                  </button>
                </div>
              )}

              {!paymentSettings && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No payment gateway configured yet</p>
                  <button
                    onClick={() => {
                      setTempPaymentSettings({
                        gateway: 'cashfree',
                        razorpay: { keyId: '', keySecret: '' },
                        payu: { key: '', salt: '' },
                        cashfree: { clientId: '', clientSecret: '' }
                      });
                      setShowGatewaySelection(true);
                    }}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Setup Payment Gateway
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gateway Selection Modal */}
      {showGatewaySelection && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/30 p-0 md:p-4">
          <div className="h-full w-full md:max-h-[80vh] md:max-w-2xl md:rounded-2xl bg-white shadow-2xl overflow-y-auto rounded-t-none md:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-none md:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowGatewaySelection(false);
                    setTempPaymentSettings(null);
                  }}
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-white">Select Payment Gateway</h2>
                  <p className="mt-1 text-sm text-blue-100">Choose your preferred payment provider</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowGatewaySelection(false);
                  setShowPaymentModal(false);
                  setTempPaymentSettings(null);
                }}
                className="text-white hover:text-blue-100 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Gateway Selection */}
              <div>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setTempPaymentSettings({ ...tempPaymentSettings, gateway: 'razorpay' })}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      tempPaymentSettings?.gateway === 'razorpay'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="rounded-full bg-blue-100 p-3">
                        <img src="https://razorpay.com/favicon.png" alt="Razorpay" className="h-8 w-8" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">Razorpay</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempPaymentSettings({ ...tempPaymentSettings, gateway: 'payu' })}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      tempPaymentSettings?.gateway === 'payu'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="rounded-full bg-green-100 p-3">
                        <img src="https://payu.in/favicon.ico" alt="PayU" className="h-8 w-8" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">PayU</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempPaymentSettings({ ...tempPaymentSettings, gateway: 'cashfree' })}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      tempPaymentSettings?.gateway === 'cashfree'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="rounded-full bg-purple-100 p-3">
                        <img src="https://cashfree.com/favicon.ico" alt="Cashfree" className="h-8 w-8" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">Cashfree</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Razorpay Settings */}
              {tempPaymentSettings?.gateway === 'razorpay' && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Razorpay Configuration</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Key ID</label>
                      <input
                        type="text"
                        value={tempPaymentSettings?.razorpay?.keyId || ''}
                        onChange={(e) => setTempPaymentSettings({
                          ...tempPaymentSettings,
                          razorpay: { ...tempPaymentSettings.razorpay, keyId: e.target.value }
                        })}
                        placeholder="rzp_..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Key Secret</label>
                      <input
                        type="password"
                        value={tempPaymentSettings?.razorpay?.keySecret || ''}
                        onChange={(e) => setTempPaymentSettings({
                          ...tempPaymentSettings,
                          razorpay: { ...tempPaymentSettings.razorpay, keySecret: e.target.value }
                        })}
                        placeholder="Enter key secret"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PayU Settings */}
              {tempPaymentSettings?.gateway === 'payu' && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">PayU Configuration</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Merchant Key</label>
                      <input
                        type="text"
                        value={tempPaymentSettings?.payu?.key || ''}
                        onChange={(e) => setTempPaymentSettings({
                          ...tempPaymentSettings,
                          payu: { ...tempPaymentSettings.payu, key: e.target.value }
                        })}
                        placeholder="Enter merchant key"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Merchant Salt</label>
                      <input
                        type="password"
                        value={tempPaymentSettings?.payu?.salt || ''}
                        onChange={(e) => setTempPaymentSettings({
                          ...tempPaymentSettings,
                          payu: { ...tempPaymentSettings.payu, salt: e.target.value }
                        })}
                        placeholder="Enter merchant salt"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Cashfree Settings */}
              {tempPaymentSettings?.gateway === 'cashfree' && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Cashfree Configuration</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Client ID</label>
                      <input
                        type="text"
                        value={tempPaymentSettings?.cashfree?.clientId || ''}
                        onChange={(e) => setTempPaymentSettings({
                          ...tempPaymentSettings,
                          cashfree: { ...tempPaymentSettings.cashfree, clientId: e.target.value }
                        })}
                        placeholder="Enter client ID"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Client Secret</label>
                      <input
                        type="password"
                        value={tempPaymentSettings?.cashfree?.clientSecret || ''}
                        onChange={(e) => setTempPaymentSettings({
                          ...tempPaymentSettings,
                          cashfree: { ...tempPaymentSettings.cashfree, clientSecret: e.target.value }
                        })}
                        placeholder="Enter client secret"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowGatewaySelection(false);
                    setTempPaymentSettings(null);
                  }}
                  className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePaymentSettings}
                  disabled={savingSettings}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Settings</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="admin-mobile-modal fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4">
          <div className="admin-modal-card bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-teal-600 rounded-t-none md:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Add New Category</h2>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all text-sm"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  maxLength={200}
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all resize-none text-sm"
                  placeholder="Enter category description"
                />
              </div>

              <div className="flex justify-end space-x-2 sm:space-x-3 pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3 py-1.5 sm:px-6 sm:py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCategory}
                  className="px-3 py-1.5 sm:px-6 sm:py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 disabled:opacity-50 flex items-center space-x-2 transition-all font-medium shadow-lg text-xs sm:text-sm"
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

      {/* Universal Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmModal}
        onClose={() => {
          setDeleteConfirmModal(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Item"
        message={getDeleteMessage()}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={logoutConfirmModal}
        onClose={() => setLogoutConfirmModal(false)}
        onConfirm={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout? You will need to login again with ID and password."
        confirmText="Logout"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
}
