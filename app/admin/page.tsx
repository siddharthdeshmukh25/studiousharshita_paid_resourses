'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Users, IndianRupee, Plus, Trash2, Edit, X, LogOut, MoreVertical, Settings, UserCheck, Package } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import AdminLayout from '@/components/admin/AdminLayout';
import KPICard from '@/components/admin/KPICard';

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
  totalOrders?: number;
}

function AdminPageContent() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalUsers: 0, totalResources: 0 });
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showGatewaySelection, setShowGatewaySelection] = useState(false);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [showGrantAccessModal, setShowGrantAccessModal] = useState(false);
  const [showGeneralSettingsModal, setShowGeneralSettingsModal] = useState(false);
  const [activeGeneralTab, setActiveGeneralTab] = useState<string | null>(null);
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [loadingDriveStatus, setLoadingDriveStatus] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [tempPaymentSettings, setTempPaymentSettings] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [captureData, setCaptureData] = useState<any>(null);
  const [captureLoading, setCaptureLoading] = useState(false);

  // Prevent body scroll when any modal is open
  useEffect(() => {
    const anyModalOpen = showCategoryModal || showEditCategoryModal || 
                        showCategoryDropdown || showCouponModal || showPaymentModal || 
                        showGatewaySelection || showCaptureModal || showGrantAccessModal || 
                        showGeneralSettingsModal;
    
    if (anyModalOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '';
    };
  }, [showCategoryModal, showEditCategoryModal, showCategoryDropdown, 
      showCouponModal, showPaymentModal, showGatewaySelection, showCaptureModal, 
      showGrantAccessModal, showGeneralSettingsModal]);
  const [retryingCapture, setRetryingCapture] = useState<string | null>(null);
  const [deleteCouponLoading, setDeleteCouponLoading] = useState<string | null>(null);
  const [deleteCategoryLoading, setDeleteCategoryLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [couponModalError, setCouponModalError] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'coupon', id: string } | null>(null);
  const [logoutConfirmModal, setLogoutConfirmModal] = useState(false);
  const [grantAccessForm, setGrantAccessForm] = useState({ userId: '', resourceId: '', orderId: '', userEmail: '', resourceTitle: '' });
  const [grantingAccess, setGrantingAccess] = useState(false);
  const [revokingAccess, setRevokingAccess] = useState(false);
  const [showRevokeSection, setShowRevokeSection] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [resourceSearchResults, setResourceSearchResults] = useState<any[]>([]);
  const [searchingResources, setSearchingResources] = useState(false);
  const [showResourceDropdown, setShowResourceDropdown] = useState(false);

  useEffect(() => {
    const performNavigation = (action: string) => {
      if (action === 'grant-access') window.location.assign('/admin/grant-access');
      if (action === 'settings') window.location.assign('/admin/settings');
      if (action === 'categories') window.location.assign('/admin/categories');
      if (action === 'coupons') setShowCouponModal(true);
      if (action === 'revenue') document.getElementById('dashboard-overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const onAdminNavigate = (event: Event) => performNavigation((event as CustomEvent<string>).detail);
    window.addEventListener('admin:navigate', onAdminNavigate);
    const action = searchParams.get('action');
    if (action) {
      performNavigation(action);
      window.history.replaceState({}, '', '/admin');
    }
    return () => window.removeEventListener('admin:navigate', onAdminNavigate);
  }, [searchParams]);

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  });

  const [newCoupon, setNewCoupon] = useState({ code: '', title: '', expiresAt: '', discountPercentage: '', minimumPurchaseAmount: '' });

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
    // Check if Google Drive connection was successful
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google_drive_connected') === 'true') {
      fetchGoogleDriveStatus(); // Refresh status from database
      // Remove the parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchGoogleDriveStatus = async () => {
    try {
      setLoadingDriveStatus(true);
      const response = await fetch('/api/google-drive/status');
      const data = await response.json();
      console.log('Google Drive status response:', data);
      if (data.connected !== undefined) {
        setGoogleDriveConnected(data.connected);
        console.log('Set googleDriveConnected to:', data.connected);
      }
    } catch (error) {
      console.error('Failed to fetch Google Drive status:', error);
    } finally {
      setLoadingDriveStatus(false);
    }
  };

  useEffect(() => {
    fetchGoogleDriveStatus();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, categoriesRes, couponsRes, paymentSettingsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/categories'),
          fetch('/api/admin/coupons'),
          fetch('/api/admin/payment-settings'),
        ]);

        const statsData = await statsRes.json();
        const categoriesData = await categoriesRes.json();
        const couponsData = await couponsRes.json();
        const paymentSettingsData = await paymentSettingsRes.json();

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

  const handleDeleteCategory = async (id: string) => {
    setItemToDelete({ type: 'category', id });
    setDeleteConfirmModal(true);
  };

  const fetchCaptureData = async () => {
    setCaptureLoading(true);
    try {
      const [failedRes, pendingRes] = await Promise.all([
        fetch('/api/admin/payment-captures?type=failed'),
        fetch('/api/admin/payment-captures?type=pending'),
      ]);
      const failedData = await failedRes.json();
      const pendingData = await pendingRes.json();
      setCaptureData({
        failed: failedData.orders || [],
        pending: pendingData.orders || [],
      });
    } catch (err) {
      console.error('Failed to fetch capture data:', err);
    } finally {
      setCaptureLoading(false);
    }
  };

  const handleRetryCapture = async (orderId: string) => {
    setRetryingCapture(orderId);
    try {
      const response = await fetch('/api/admin/payment-captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'retry' }),
      });
      const data = await response.json();
      if (response.ok) {
        await fetchCaptureData();
      } else {
        setError(data.error || 'Failed to retry capture');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry capture');
    } finally {
      setRetryingCapture(null);
    }
  };

  const handleBatchRetry = async () => {
    setCaptureLoading(true);
    try {
      const response = await fetch('/api/admin/payment-captures/retry', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        await fetchCaptureData();
      } else {
        setError(data.error || 'Failed to batch retry');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to batch retry');
    } finally {
      setCaptureLoading(false);
    }
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
      case 'category':
        return 'Are you sure you want to delete this category? This action cannot be undone.';
      default:
        return 'Are you sure you want to delete this item? This action cannot be undone.';
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrantingAccess(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/grant-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grantAccessForm),
      });

      const data = await response.json();
      
      // If user already has access, treat it as success and close modal
      if (!response.ok) {
        if (data.error === 'User already has access to this resource.') {
          // Close modal and reset form
          setShowGrantAccessModal(false);
          setGrantAccessForm({ userId: '', resourceId: '', orderId: '', userEmail: '', resourceTitle: '' });
          setUserSearchResults([]);
          setResourceSearchResults([]);
          setGrantingAccess(false);
          return;
        }
        throw new Error(data.error || 'Failed to grant access.');
      }

      setShowGrantAccessModal(false);
      setGrantAccessForm({ userId: '', resourceId: '', orderId: '', userEmail: '', resourceTitle: '' });
      setUserSearchResults([]);
      setResourceSearchResults([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant access');
    } finally {
      setGrantingAccess(false);
    }
  };

  const handleRevokeAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevokingAccess(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/grant-access', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: grantAccessForm.userId, resourceId: grantAccessForm.resourceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke access.');
      }

      setShowGrantAccessModal(false);
      setGrantAccessForm({ userId: '', resourceId: '', orderId: '', userEmail: '', resourceTitle: '' });
      setUserSearchResults([]);
      setResourceSearchResults([]);
      setShowRevokeSection(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access');
    } finally {
      setRevokingAccess(false);
    }
  };

  const searchUsersByEmail = async (email: string) => {
    if (email.length < 3) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await fetch(`/api/admin/users/search?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (response.ok) {
        setUserSearchResults(data.users || []);
        setShowUserDropdown(true);
      } else {
        setUserSearchResults([]);
        setShowUserDropdown(false);
      }
    } catch (err) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
    } finally {
      setSearchingUsers(false);
    }
  };

  const selectUser = (user: any) => {
    setGrantAccessForm({ 
      ...grantAccessForm, 
      userId: user._id, 
      userEmail: user.email 
    });
    setShowUserDropdown(false);
    setUserSearchResults([]);
  };

  const searchResourcesByTitle = async (title: string) => {
    if (title.length < 2) {
      setResourceSearchResults([]);
      setShowResourceDropdown(false);
      return;
    }

    setSearchingResources(true);
    try {
      const response = await fetch(`/api/admin/resources/search?title=${encodeURIComponent(title)}`);
      const data = await response.json();
      if (response.ok) {
        setResourceSearchResults(data.resources || []);
        setShowResourceDropdown(true);
      } else {
        setResourceSearchResults([]);
        setShowResourceDropdown(false);
      }
    } catch (err) {
      setResourceSearchResults([]);
      setShowResourceDropdown(false);
    } finally {
      setSearchingResources(false);
    }
  };

  const selectResource = (resource: any) => {
    setGrantAccessForm({ 
      ...grantAccessForm, 
      resourceId: resource._id, 
      resourceTitle: resource.title 
    });
    setShowResourceDropdown(false);
    setResourceSearchResults([]);
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading admin dashboard">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 dark:text-green-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div id="dashboard-overview" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-green-600 dark:text-green-400">Workspace overview</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.045em] text-gray-900 dark:text-gray-100">Admin Dashboard</h1><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">A quick view of how your store is performing today.</p></div>
          <button onClick={handleLogout} disabled={loggingOut} className="inline-flex items-center gap-2 self-start rounded-md border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"><LogOut className="h-4 w-4" />{loggingOut ? 'Logging out…' : 'Logout'}</button>
        </div>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KPICard title="Total revenue" value={`₹${stats.totalRevenue}`} icon={<IndianRupee className="h-5 w-5" />} /><KPICard title="Registered users" value={stats.totalUsers} icon={<Users className="h-5 w-5" />} /><KPICard title="Live resources" value={stats.totalResources} icon={<Package className="h-5 w-5" />} /><KPICard title="Orders" value={stats.totalOrders ?? 0} icon={<UserCheck className="h-5 w-5" />} /></div>
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900"><div><h2 className="font-semibold text-gray-900 dark:text-gray-100">Manage workspace</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Open a focused section to manage your store.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><button onClick={() => window.location.href = '/admin/resources'} className="rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-green-500/70 dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-all"><Package className="h-5 w-5 text-green-600 dark:text-green-400" /><p className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Resources</p><p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Add and edit products</p></button><button onClick={() => window.location.href = '/admin/users'} className="rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-green-500/70 dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-all"><Users className="h-5 w-5 text-green-600 dark:text-green-400" /><p className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Users</p><p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Profiles and activity</p></button><button onClick={() => window.location.href = '/admin/analytics'} className="rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-green-500/70 dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-all"><IndianRupee className="h-5 w-5 text-green-600 dark:text-green-400" /><p className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Analytics</p><p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Revenue and traffic</p></button><button onClick={() => setShowCouponModal(true)} className="rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-green-500/70 dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-all"><Plus className="h-5 w-5 text-green-600 dark:text-green-400" /><p className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Create coupon</p><p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Create a promotion</p></button></div></section>
      </div>
      <div className="hidden">
          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 font-normal">
                Manage your resources and users
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                <span className="hidden sm:inline">{loggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <KPICard
              title="Users"
              value={stats.totalUsers}
              icon={<Users className="h-5 w-5 lg:h-6 lg:w-6" />}
            />
            <KPICard
              title="Revenue"
              value={`₹${stats.totalRevenue}`}
              icon={<IndianRupee className="h-5 w-5 lg:h-6 lg:w-6" />}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-all"
              >
                <MoreVertical className="h-4 w-4" />
                <span>Categories</span>
              </button>
              {showCategoryDropdown && (
                <div className="mobile-category-sheet fixed inset-0 z-40 flex flex-col overflow-y-auto bg-gray-50 dark:bg-gray-900 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:z-50 sm:mt-2 sm:max-h-80 sm:w-64 sm:overflow-y-auto sm:rounded-xl sm:border sm:border-gray-200 dark:sm:border-gray-700 sm:bg-white dark:sm:bg-gray-900 sm:shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 sm:hidden">
                    <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-green-600 dark:text-green-400">Admin tools</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">Manage categories</h2></div>
                    <button onClick={() => setShowCategoryDropdown(false)} className="grid h-10 w-10 place-items-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" aria-label="Close categories"><X className="h-5 w-5" /></button>
                  </div>
                  <button
                    onClick={() => {
                      setShowCategoryModal(true);
                      setShowCategoryDropdown(false);
                    }}
                    className="mx-4 mt-5 flex w-auto items-center justify-center space-x-2 rounded-xl bg-green-500 px-4 py-3 text-left font-semibold text-white shadow-sm hover:bg-green-600 sm:m-0 sm:w-full sm:justify-start sm:rounded-none sm:bg-transparent sm:px-4 sm:text-gray-700 dark:sm:text-gray-300 sm:shadow-none sm:hover:bg-gray-100 dark:sm:hover:bg-gray-800"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Add New Category</span>
                  </button>
                  {categories.length > 0 && (
                    <>
                      <div className="mt-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-3 sm:mt-0 sm:px-4 sm:py-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Categories</span>
                      </div>
                      {categories.map((category) => (
                        <div
                          key={category._id}
                          className="mx-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 last:border-b-0 sm:mx-0 sm:px-4 sm:py-3 sm:hover:bg-gray-100 dark:sm:hover:bg-gray-800"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{category.name}</span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category._id)}
                              disabled={deleteCategoryLoading === category._id}
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Coupon</span>
            </button>
          </div>

          {/* Resources Quick Link */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Resources</h2>
              <button
                onClick={() => window.location.href = '/admin/resources'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium text-sm transition-all"
              >
                <Package className="h-4 w-4" />
                <span>Manage Resources</span>
              </button>
            </div>
            <div className="p-6 text-center text-gray-600 dark:text-gray-400 text-sm">
              <p>Go to Resources page to manage your resources</p>
            </div>
          </div>
      </div>

      <section id="coupons" className="hidden mx-auto mb-8 max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Coupons</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Active coupons can be applied to any resource.</p>
            </div>
            <button onClick={() => setShowCouponModal(true)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 sm:w-auto">Create Coupon</button>
          </div>
          {coupons.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-600 dark:text-gray-400">No coupons created yet.</p>
          ) : (
            <div className="max-h-[320px] overflow-x-auto overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="min-w-[650px] w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"><tr><th className="px-6 py-3">Code</th><th className="px-6 py-3">Title</th><th className="px-6 py-3">Discount</th><th className="px-6 py-3">Min Purchase</th><th className="px-6 py-3">Expires</th><th className="px-6 py-3 text-right">Action</th></tr></thead>
                <tbody>{coupons.map((coupon) => <tr key={coupon._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"><td className="px-6 py-4 font-bold tracking-wide text-green-600 dark:text-green-400">{coupon.code}</td><td className="px-6 py-4 text-gray-700 dark:text-gray-300">{coupon.title}</td><td className="px-6 py-4 font-semibold text-green-700 dark:text-green-400">{coupon.discountPercentage}%</td><td className="px-6 py-4 text-gray-600 dark:text-gray-400">{coupon.minimumPurchaseAmount ? `₹${coupon.minimumPurchaseAmount}` : 'No limit'}</td><td className="px-6 py-4 text-gray-600 dark:text-gray-400">{new Date(coupon.expiresAt).toLocaleDateString()}</td><td className="px-6 py-4 text-right"><button onClick={() => handleEditCoupon(coupon)} className="mr-2 rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit className="h-4 w-4" /></button><button onClick={() => handleDeleteCoupon(coupon._id)} disabled={deleteCouponLoading === coupon._id} className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50">{deleteCouponLoading === coupon._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Edit Category Modal */}
      {showEditCategoryModal && (
        <div className="admin-mobile-modal fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4">
          <div className="admin-modal-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm max-w-sm w-full mx-4">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-none md:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Category</h2>
                <button
                  onClick={() => {
                    setShowEditCategoryModal(false);
                    setEditingCategory(null);
                    setNewCategory({ name: '', description: '' });
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateCategory} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#84CC16] focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 transition-all text-sm"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  maxLength={200}
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#84CC16] focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 transition-all resize-none text-sm"
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
                  className="px-3 py-1.5 sm:px-6 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCategory}
                  className="px-3 py-1.5 sm:px-6 sm:py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl disabled:opacity-50 flex items-center space-x-2 transition-all font-medium text-xs sm:text-sm"
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
          <div className="admin-modal-card max-h-[90vh] w-full overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm sm:max-w-lg sm:mx-4 sm:rounded-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 sm:rounded-t-xl">
              <div><h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{editingCoupon ? 'Update coupon details and discount.' : 'Applies to every resource purchase.'}</p></div>
              <button onClick={() => {
                setShowCouponModal(false);
                setEditingCoupon(null);
                setNewCoupon({ code: '', title: '', expiresAt: '', discountPercentage: '', minimumPurchaseAmount: '' });
                setCouponModalError(null);
              }} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleAddCoupon} className="space-y-5 p-6">
              {couponModalError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {couponModalError}
                </div>
              )}
              <div><label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">Coupon code</label><input required minLength={3} maxLength={30} value={newCoupon.code} onChange={(event) => setNewCoupon({ ...newCoupon, code: event.target.value.toUpperCase() })} placeholder="WELCOME20" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 font-bold uppercase text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 sm:rounded-lg sm:border-gray-200 dark:sm:border-gray-700 sm:px-3 sm:py-2.5" /></div>
              <div><label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">Coupon title</label><input required maxLength={50} value={newCoupon.title} onChange={(event) => setNewCoupon({ ...newCoupon, title: event.target.value })} placeholder="Welcome discount" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 sm:rounded-lg sm:border-gray-200 dark:sm:border-gray-700 sm:px-3 sm:py-2.5" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">Expiry date</label><input required type="date" value={newCoupon.expiresAt} onChange={(event) => setNewCoupon({ ...newCoupon, expiresAt: event.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 sm:rounded-lg sm:border-gray-200 dark:sm:border-gray-700 sm:px-3 sm:py-2.5" /></div><div><label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">Discount %</label><input required type="number" min="1" max="100" value={newCoupon.discountPercentage} onChange={(event) => setNewCoupon({ ...newCoupon, discountPercentage: event.target.value })} placeholder="20" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 sm:rounded-lg sm:border-gray-200 dark:sm:border-gray-700 sm:px-3 sm:py-2.5" /></div></div>
              <div><label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">Minimum purchase amount (₹) <span className="text-gray-400 dark:text-gray-500 font-normal">(Optional - coupon only works above this amount)</span></label><input type="number" min="0" step="0.01" value={newCoupon.minimumPurchaseAmount} onChange={(event) => setNewCoupon({ ...newCoupon, minimumPurchaseAmount: event.target.value })} placeholder="0" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 sm:rounded-lg sm:border-gray-200 dark:sm:border-gray-700 sm:px-3 sm:py-2.5" /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => {
                setShowCouponModal(false);
                setEditingCoupon(null);
                setNewCoupon({ code: '', title: '', expiresAt: '', discountPercentage: '', minimumPurchaseAmount: '' });
              }} className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-3 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 sm:rounded-lg sm:px-4 sm:py-2.5">Cancel</button><button type="submit" disabled={addingCoupon} className="flex items-center gap-2 rounded-xl bg-green-500 hover:bg-green-600 px-5 py-3 font-medium text-white disabled:opacity-50 sm:rounded-lg sm:px-4 sm:py-2.5">{addingCoupon && <Loader2 className="h-4 w-4 animate-spin" />}{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal - Shows current configured gateway */}
      {showPaymentModal && !showGatewaySelection && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/30 p-0 md:p-4">
          <div className="h-full w-full md:max-h-[80vh] md:max-w-lg md:rounded-2xl bg-white shadow-2xl overflow-y-auto rounded-t-none md:rounded-2xl">
            <div className="flex items-center justify-between border-b border-blue-500 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-none md:rounded-t-2xl">
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
                  <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
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
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
                            {paymentSettings.gateway === 'razorpay' ? 'Razorpay' :
                             paymentSettings.gateway === 'payu' ? 'PayU' :
                             paymentSettings.gateway === 'cashfree' ? 'Cashfree' :
                             paymentSettings.gateway}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Active Payment Gateway</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">

                      <div className="flex justify-between items-center py-2 border-b border-blue-100 dark:border-blue-800">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Client ID / Key</span>
                        <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                          {paymentSettings[paymentSettings.gateway]?.clientId ||
                           paymentSettings[paymentSettings.gateway]?.keyId ||
                           paymentSettings[paymentSettings.gateway]?.key || 'Not configured'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-100 dark:border-blue-800">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Secret Key</span>
                        <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
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
            <div className="flex items-center justify-between border-b border-blue-500 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-none md:rounded-t-2xl">
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
                        : 'border-gray-200 bg-white hover:bg-gray-100'
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
                        : 'border-gray-200 bg-white hover:bg-gray-100'
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
                        : 'border-gray-200 bg-white hover:bg-gray-100'
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
                <div className="rounded-xl border-none bg-gray-50 p-4 space-y-4">
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
                <div className="rounded-xl border-none bg-gray-50 p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">PayU Configuration</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Merchant Key</label>
                      <input
                        type="text"
                        value={tempPaymentSettings?.payu?.key || ''}
                        onChange={(e) => setTempPaymentSettings({
                          ...tempPaymentSettings,
                          payu: { ...tempPaymentSettings.payu, key: e.target.value, salt: tempPaymentSettings.payu?.salt || '' }
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
                          payu: { ...tempPaymentSettings.payu, salt: e.target.value, key: tempPaymentSettings.payu?.key || '' }
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
                <div className="rounded-xl border-none bg-gray-50 p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Cashfree Configuration</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Client ID</label>
                      <input
                        type="text"
                        value={tempPaymentSettings?.cashfree?.clientId || ''}
                        onChange={(e) => setTempPaymentSettings({
                          ...tempPaymentSettings,
                          cashfree: { ...tempPaymentSettings.cashfree, clientId: e.target.value, clientSecret: tempPaymentSettings.cashfree?.clientSecret || '' }
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
                          cashfree: { ...tempPaymentSettings.cashfree, clientSecret: e.target.value, clientId: tempPaymentSettings.cashfree?.clientId || '' }
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
                  className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

      {/* Payment Capture Modal */}
      {showCaptureModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/30 p-0 md:p-4">
          <div className="h-full w-full md:max-h-[80vh] md:max-w-4xl md:rounded-2xl bg-white shadow-2xl overflow-y-auto rounded-t-none md:rounded-2xl">
            <div className="flex items-center justify-between border-b border-purple-500 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-none md:rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-white">Razorpay Payment Capture Status</h2>
                <p className="mt-1 text-sm text-purple-100">Monitor and retry Razorpay payment captures</p>
              </div>
              <button
                onClick={() => setShowCaptureModal(false)}
                className="text-white hover:text-purple-100 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {captureLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <>
                  <div className="flex gap-4">
                    <button
                      onClick={handleBatchRetry}
                      disabled={captureLoading}
                      className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {captureLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Retrying...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          <span>Batch Retry All</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={fetchCaptureData}
                      disabled={captureLoading}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* Failed Captures */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Failed Captures</h3>
                    {captureData?.failed?.length === 0 ? (
                      <div className="rounded-lg border-none bg-gray-50 p-6 text-center text-gray-500">
                        No failed captures
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {captureData?.failed?.map((order: any) => (
                          <div key={order._id} className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{order.resourceId?.title || 'Unknown Resource'}</p>
                                <p className="text-sm text-gray-600">Custom Order: {order.cashfreeOrderId}</p>
                                {order.razorpayOrderId && (
                                  <p className="text-sm text-gray-600">Razorpay Order: {order.razorpayOrderId}</p>
                                )}
                                <p className="text-sm text-gray-600">User: {order.userId?.email || 'Unknown'}</p>
                                <p className="text-sm text-gray-600">Amount: ₹{order.amount}</p>
                                <p className="text-sm text-red-600 mt-1">Error: {order.captureFailureReason || 'Unknown error'}</p>
                                <p className="text-xs text-gray-500 mt-1">Attempts: {order.captureAttempts?.length || 0}</p>
                              </div>
                              <button
                                onClick={() => handleRetryCapture(order.cashfreeOrderId)}
                                disabled={retryingCapture === order.cashfreeOrderId}
                                className="ml-4 flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {retryingCapture === order.cashfreeOrderId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    <span>Retry</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pending Captures */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Pending Captures</h3>
                    {captureData?.pending?.length === 0 ? (
                      <div className="rounded-lg border-none bg-gray-50 p-6 text-center text-gray-500">
                        No pending captures
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {captureData?.pending?.map((order: any) => (
                          <div key={order._id} className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{order.resourceId?.title || 'Unknown Resource'}</p>
                                <p className="text-sm text-gray-600">Custom Order: {order.cashfreeOrderId}</p>
                                {order.razorpayOrderId && (
                                  <p className="text-sm text-gray-600">Razorpay Order: {order.razorpayOrderId}</p>
                                )}
                                <p className="text-sm text-gray-600">User: {order.userId?.email || 'Unknown'}</p>
                                <p className="text-sm text-gray-600">Amount: ₹{order.amount}</p>
                                <p className="text-xs text-gray-500 mt-1">Created: {new Date(order.createdAt).toLocaleString()}</p>
                              </div>
                              <button
                                onClick={() => handleRetryCapture(order.cashfreeOrderId)}
                                disabled={retryingCapture === order.cashfreeOrderId}
                                className="ml-4 flex items-center gap-1 rounded-lg bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                              >
                                {retryingCapture === order.cashfreeOrderId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    <span>Retry</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grant Access Modal */}
      {showGrantAccessModal && (
        <div className="admin-mobile-modal fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4">
          <div className="admin-modal-card bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-none md:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Grant Resource Access</h2>
                <button
                  onClick={() => {
                    setShowGrantAccessModal(false);
                    setGrantAccessForm({ userId: '', resourceId: '', orderId: '', userEmail: '', resourceTitle: '' });
                    setUserSearchResults([]);
                    setResourceSearchResults([]);
                    setShowUserDropdown(false);
                    setShowResourceDropdown(false);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleGrantAccess} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="relative">
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  User Email
                </label>
                <input
                  type="text"
                  required
                  value={grantAccessForm.userEmail}
                  onChange={(e) => {
                    setGrantAccessForm({ ...grantAccessForm, userEmail: e.target.value, userId: '' });
                    searchUsersByEmail(e.target.value);
                  }}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all text-sm"
                  placeholder="Search user by email"
                />
                {showUserDropdown && userSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {userSearchResults.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => selectUser(user)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500">{user.name || 'No name'}</div>
                      </div>
                    ))}
                  </div>
                )}
                {searchingUsers && (
                  <div className="absolute right-3 top-8">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  User ID (Auto-filled)
                </label>
                <input
                  type="text"
                  required
                  value={grantAccessForm.userId}
                  readOnly
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 text-sm"
                  placeholder="Select user from email search"
                />
              </div>

              <div className="relative">
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  Resource Title
                </label>
                <input
                  type="text"
                  required
                  value={grantAccessForm.resourceTitle}
                  onChange={(e) => {
                    setGrantAccessForm({ ...grantAccessForm, resourceTitle: e.target.value, resourceId: '' });
                    searchResourcesByTitle(e.target.value);
                  }}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all text-sm"
                  placeholder="Search resource by title"
                />
                {showResourceDropdown && resourceSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {resourceSearchResults.map((resource) => (
                      <div
                        key={resource._id}
                        onClick={() => selectResource(resource)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <div className="text-sm font-medium text-gray-900 truncate">{resource.title}</div>
                        <div className="text-xs text-gray-500">{resource.category}</div>
                      </div>
                    ))}
                  </div>
                )}
                {searchingResources && (
                  <div className="absolute right-3 top-8">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  Resource ID (Auto-filled)
                </label>
                <input
                  type="text"
                  required
                  value={grantAccessForm.resourceId}
                  readOnly
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 text-sm"
                  placeholder="Select resource from title search"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  Order ID (Optional)
                </label>
                <input
                  type="text"
                  value={grantAccessForm.orderId}
                  onChange={(e) => setGrantAccessForm({ ...grantAccessForm, orderId: e.target.value })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all text-sm"
                  placeholder="Enter payment order ID if available"
                />
                <p className="text-xs text-gray-500 mt-1">Use this if payment was completed but webhook failed</p>
              </div>

              <div className="flex justify-end space-x-2 sm:space-x-3 pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowGrantAccessModal(false);
                    setGrantAccessForm({ userId: '', resourceId: '', orderId: '', userEmail: '', resourceTitle: '' });
                    setUserSearchResults([]);
                    setResourceSearchResults([]);
                    setShowUserDropdown(false);
                    setShowResourceDropdown(false);
                  }}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grantingAccess}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {grantingAccess ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Granting...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      <span>Grant Access</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* General Settings Modal */}
      {showGeneralSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/30 p-0 md:p-4">
          <div className="h-full w-full md:max-h-[80vh] md:max-w-4xl md:rounded-2xl bg-white shadow-2xl overflow-y-auto rounded-t-none md:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-6 rounded-t-none md:rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
                <p className="mt-1 text-sm text-gray-600">Manage your general platform settings</p>
              </div>
              <button
                onClick={() => setShowGeneralSettingsModal(false)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Show list when no tab is selected */}
              {!activeGeneralTab && (
                <div className="space-y-2">
                  {/* Razorpay Payment Capture */}
                  <button
                    onClick={() => {
                      setActiveGeneralTab('razorpay');
                      fetchCaptureData();
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 border border-gray-200 rounded-lg"
                  >
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Razorpay Payment Capture</span>
                  </button>

                  {/* Grant Access */}
                  <button
                    onClick={() => setActiveGeneralTab('grant')}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 border border-gray-200 rounded-lg"
                  >
                    <UserCheck className="h-5 w-5 text-gray-600" />
                    <span>Grant Access</span>
                  </button>

                  {/* Google Drive Access */}
                  <button
                    onClick={() => setActiveGeneralTab('drive')}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 border border-gray-200 rounded-lg"
                  >
                    <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    <span>Google Drive Access</span>
                  </button>
                </div>
              )}

              {/* Tab Content with back button */}
              {activeGeneralTab === 'razorpay' && (
                <div>
                  <button
                    onClick={() => setActiveGeneralTab(null)}
                    className="flex items-center gap-2 mb-4 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Settings</span>
                  </button>
                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={handleBatchRetry}
                      disabled={captureLoading}
                      className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {captureLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Retrying...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          <span>Batch Retry All</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={fetchCaptureData}
                      disabled={captureLoading}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      <span>Refresh</span>
                    </button>
                  </div>

                  {captureLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Failed Captures</h3>
                        {captureData?.failed?.length === 0 ? (
                          <div className="rounded-lg border-none bg-gray-50 p-6 text-center text-gray-500">
                            No failed captures
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {captureData?.failed?.map((order: any) => (
                              <div key={order._id} className="rounded-lg border border-red-200 bg-red-50 p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{order.resourceId?.title || 'Unknown Resource'}</p>
                                    <p className="text-sm text-gray-600">Custom Order: {order.cashfreeOrderId}</p>
                                    {order.razorpayOrderId && (
                                      <p className="text-sm text-gray-600">Razorpay Order: {order.razorpayOrderId}</p>
                                    )}
                                    <p className="text-sm text-gray-600">User: {order.userId?.email || 'Unknown'}</p>
                                    <p className="text-sm text-gray-600">Amount: ₹{order.amount}</p>
                                    <p className="text-sm text-red-600 mt-1">Error: {order.captureFailureReason || 'Unknown error'}</p>
                                    <p className="text-xs text-gray-500 mt-1">Attempts: {order.captureAttempts?.length || 0}</p>
                                  </div>
                                  <button
                                    onClick={() => handleRetryCapture(order.cashfreeOrderId)}
                                    disabled={retryingCapture === order.cashfreeOrderId}
                                    className="ml-4 flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                                  >
                                    {retryingCapture === order.cashfreeOrderId ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        <span>Retry</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Pending Captures</h3>
                        {captureData?.pending?.length === 0 ? (
                          <div className="rounded-lg border-none bg-gray-50 p-6 text-center text-gray-500">
                            No pending captures
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {captureData?.pending?.map((order: any) => (
                              <div key={order._id} className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{order.resourceId?.title || 'Unknown Resource'}</p>
                                    <p className="text-sm text-gray-600">Custom Order: {order.cashfreeOrderId}</p>
                                    {order.razorpayOrderId && (
                                      <p className="text-sm text-gray-600">Razorpay Order: {order.razorpayOrderId}</p>
                                    )}
                                    <p className="text-sm text-gray-600">User: {order.userId?.email || 'Unknown'}</p>
                                    <p className="text-sm text-gray-600">Amount: ₹{order.amount}</p>
                                    <p className="text-xs text-gray-500 mt-1">Created: {new Date(order.createdAt).toLocaleString()}</p>
                                  </div>
                                  <button
                                    onClick={() => handleRetryCapture(order.cashfreeOrderId)}
                                    disabled={retryingCapture === order.cashfreeOrderId}
                                    className="ml-4 flex items-center gap-1 rounded-lg bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                                  >
                                    {retryingCapture === order.cashfreeOrderId ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        <span>Retry</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeGeneralTab === 'grant' && (
                <div>
                  <button
                    onClick={() => setActiveGeneralTab(null)}
                    className="flex items-center gap-2 mb-4 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Settings</span>
                  </button>
                  
                  {/* Toggle between Grant and Revoke */}
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setShowRevokeSection(false)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${!showRevokeSection ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      Grant Access
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRevokeSection(true)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${showRevokeSection ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      Revoke Access
                    </button>
                  </div>

                  <form onSubmit={showRevokeSection ? handleRevokeAccess : handleGrantAccess} className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      User Email
                    </label>
                    <input
                      type="text"
                      required
                      value={grantAccessForm.userEmail}
                      onChange={(e) => {
                        setGrantAccessForm({ ...grantAccessForm, userEmail: e.target.value, userId: '' });
                        searchUsersByEmail(e.target.value);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 transition-all text-sm"
                      placeholder="Search user by email"
                    />
                    {showUserDropdown && userSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {userSearchResults.map((user) => (
                          <div
                            key={user._id}
                            onClick={() => selectUser(user)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                          >
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                            <div className="text-xs text-gray-500">{user.name || 'No name'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchingUsers && (
                      <div className="absolute right-3 top-8">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      User ID (Auto-filled)
                    </label>
                    <input
                      type="text"
                      required
                      value={grantAccessForm.userId}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 text-sm"
                      placeholder="Select user from email search"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Resource Title
                    </label>
                    <input
                      type="text"
                      required
                      value={grantAccessForm.resourceTitle}
                      onChange={(e) => {
                        setGrantAccessForm({ ...grantAccessForm, resourceTitle: e.target.value, resourceId: '' });
                        searchResourcesByTitle(e.target.value);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 transition-all text-sm"
                      placeholder="Search resource by title"
                    />
                    {showResourceDropdown && resourceSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {resourceSearchResults.map((resource) => (
                          <div
                            key={resource._id}
                            onClick={() => selectResource(resource)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                          >
                            <div className="text-sm font-medium text-gray-900 truncate">{resource.title}</div>
                            <div className="text-xs text-gray-500">{resource.category}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchingResources && (
                      <div className="absolute right-3 top-8">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Resource ID (Auto-filled)
                    </label>
                    <input
                      type="text"
                      required
                      value={grantAccessForm.resourceId}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 text-sm"
                      placeholder="Select resource from title search"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Order ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={grantAccessForm.orderId}
                      onChange={(e) => setGrantAccessForm({ ...grantAccessForm, orderId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 transition-all text-sm"
                      placeholder="Enter payment order ID if available"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use this if payment was completed but webhook failed</p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={grantingAccess || revokingAccess}
                      className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white disabled:opacity-50 transition-colors ${showRevokeSection ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                    >
                      {showRevokeSection ? (
                        revokingAccess ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Revoking...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Revoke Access</span>
                          </>
                        )
                      ) : (
                        grantingAccess ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Granting...</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" />
                            <span>Grant Access</span>
                          </>
                        )
                      )}
                    </button>
                  </div>
                </form>
                </div>
              )}

              {activeGeneralTab === 'drive' && (
                <div>
                  <button
                    onClick={() => setActiveGeneralTab(null)}
                    className="flex items-center gap-2 mb-4 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Settings</span>
                  </button>
                  
                  {/* Connection Status */}
                  <div className={`mb-6 p-5 rounded-xl border ${googleDriveConnected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${googleDriveConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <div className="flex-1">
                        <p className={`font-semibold text-lg ${googleDriveConnected ? 'text-green-900' : 'text-gray-900'}`}>
                          {googleDriveConnected ? 'Google Drive Connected' : 'Google Drive Not Connected'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {googleDriveConnected ? 'Your Google Drive account is connected and ready' : 'Connect your Google Drive to enable secure file sharing'}
                        </p>
                      </div>
                      {googleDriveConnected && (
                        <div className="text-green-600">
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5 mb-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">What is Google Drive Access?</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Securely share purchased resources with users through Google Drive integration.
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="font-semibold text-gray-900 mb-3">How it works:</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">Upload files to Google Drive</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">Automatic user access</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">Private & secure sharing</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">Revoke access anytime</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4">
                    {!googleDriveConnected ? (
                      <button
                        onClick={() => {
                          window.location.href = '/api/google-drive/auth';
                        }}
                        className="flex items-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-8 py-4 rounded-xl transition-all shadow-sm hover:shadow-md"
                      >
                        <svg className="h-7 w-7 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                        <span className="font-semibold text-gray-800">Connect Google Drive</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/google-drive/status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ connected: false }),
                              });
                              if (response.ok) {
                                setGoogleDriveConnected(false);
                                alert('Google Drive disconnected successfully');
                              }
                            } catch (error) {
                              console.error('Failed to disconnect Google Drive');
                              alert('Failed to disconnect Google Drive');
                            }
                          }}
                          className="flex items-center gap-3 bg-red-50 border-2 border-red-200 hover:border-red-300 hover:bg-red-100 px-6 py-4 rounded-xl transition-all shadow-sm hover:shadow-md"
                        >
                          <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="font-semibold text-red-700">Disconnect</span>
                        </button>
                        <button
                          onClick={() => {
                            window.location.href = '/api/google-drive/auth';
                          }}
                          className="flex items-center gap-3 bg-blue-50 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-100 px-6 py-4 rounded-xl transition-all shadow-sm hover:shadow-md"
                        >
                          <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                          </svg>
                          <span className="font-semibold text-blue-700">Reconnect</span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="text-center text-sm text-gray-500 mt-5">
                    <p>{googleDriveConnected ? '✓ Your Google Drive is connected and ready for secure file sharing' : 'Connect your Google Drive to enable secure file sharing for purchased resources'}</p>
                  </div>
                </div>
              )}
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
                  className="px-3 py-1.5 sm:px-6 sm:py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium text-xs sm:text-sm"
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
    </AdminLayout>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-white dark:bg-[#0a0a0a]" />}>
      <AdminPageContent />
    </Suspense>
  );
}
