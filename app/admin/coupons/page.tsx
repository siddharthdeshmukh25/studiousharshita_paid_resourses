'use client';

import { FormEvent, useEffect, useState, useRef } from 'react';
import { Plus, Ticket, Trash2, IndianRupee, Percent, ToggleLeft, ToggleRight, Power, Loader2, X, Search, Edit2, Upload, Eye } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

type Coupon = { 
  _id: string; 
  code: string; 
  title: string;
  description?: string;
  expiresAt: string; 
  discountType: 'percentage' | 'fixed';
  discountPercentage?: number;
  discountAmount?: number;
  minimumPurchaseAmount?: number;
  maxUsesPerUser?: number;
  maxTotalUses?: number;
  currentUses?: number;
  applicableCategories?: string[];
  applicableResources?: string[];
  isActive: boolean;
  imageUrl?: string;
  imageTitle?: string;
  imageDescription?: string;
};

type Category = { _id: string; name: string };
type Resource = { _id: string; title: string; category?: string };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showResourceDropdown, setShowResourceDropdown] = useState(false);
  
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const resourceDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (resourceDropdownRef.current && !resourceDropdownRef.current.contains(event.target as Node)) {
        setShowResourceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountPercentage: '',
    discountAmount: '',
    expiresAt: '',
    minimumPurchaseAmount: '',
    maxUsesPerUser: '1',
    maxTotalUses: '',
    applicableCategories: [] as string[],
    applicableResources: [] as string[],
    isActive: true
  });

  const [error, setError] = useState('');

  // Image section state
  const [imageUrl, setImageUrl] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setImageError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      setImageUrl(data.secure_url);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const triggerFilePicker = () => fileInputRef.current?.click();

  const loadCoupons = () => 
    fetch('/api/admin/coupons')
      .then(r => r.json())
      .then(d => setCoupons(d.coupons || []));

  const loadCategories = () =>
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []));

  const loadResources = () =>
    fetch('/api/admin/resources/search?title=')
      .then(r => r.json())
      .then(d => setResources(d.resources || []));

  useEffect(() => { 
    setLoading(true);
    Promise.all([loadCoupons(), loadCategories(), loadResources()])
      .finally(() => setLoading(false));
  }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const r = await fetch('/api/admin/coupons', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          ...form, 
          discountPercentage: form.discountType === 'percentage' ? Number(form.discountPercentage) : undefined,
          discountAmount: form.discountType === 'fixed' ? Number(form.discountAmount) : undefined,
          minimumPurchaseAmount: Number(form.minimumPurchaseAmount || 0),
          maxUsesPerUser: Number(form.maxUsesPerUser),
          maxTotalUses: form.maxTotalUses ? Number(form.maxTotalUses) : undefined,
          imageUrl: imageUrl || undefined,
          imageTitle: imageTitle || undefined,
          imageDescription: imageDescription || undefined,
        }) 
      });
      const d = await r.json();
      if (!r.ok) return setError(d.error || 'Could not create coupon');
      setCoupons(v => [d.coupon, ...v]);
      setForm({
        code: '',
        title: '',
        description: '',
        discountType: 'percentage',
        discountPercentage: '',
        discountAmount: '',
        expiresAt: '',
        minimumPurchaseAmount: '',
        maxUsesPerUser: '1',
        maxTotalUses: '',
        applicableCategories: [],
        applicableResources: [],
        isActive: true
      });
      setCategorySearch('');
      setResourceSearch('');
      setShowCategoryDropdown(false);
      setShowResourceDropdown(false);
      setImageUrl('');
      setImageTitle('');
      setImageDescription('');
      setImageError('');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    if (editingCoupon) {
      updateCoupon(e);
    } else {
      create(e);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    const r = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
    if (r.ok) setCoupons(v => v.filter(c => c._id !== id));
  };

  const startEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountPercentage: coupon.discountPercentage?.toString() || '',
      discountAmount: coupon.discountAmount?.toString() || '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
      minimumPurchaseAmount: coupon.minimumPurchaseAmount?.toString() || '',
      maxUsesPerUser: coupon.maxUsesPerUser?.toString() || '1',
      maxTotalUses: coupon.maxTotalUses?.toString() || '',
      applicableCategories: coupon.applicableCategories || [],
      applicableResources: coupon.applicableResources || [],
      isActive: coupon.isActive
    });
    setImageUrl(coupon.imageUrl || '');
    setImageTitle(coupon.imageTitle || '');
    setImageDescription(coupon.imageDescription || '');
    setImageError('');
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingCoupon(null);
    setForm({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountPercentage: '',
      discountAmount: '',
      expiresAt: '',
      minimumPurchaseAmount: '',
      maxUsesPerUser: '1',
      maxTotalUses: '',
      applicableCategories: [],
      applicableResources: [],
      isActive: true
    });
    setCategorySearch('');
    setResourceSearch('');
    setShowCategoryDropdown(false);
    setShowResourceDropdown(false);
    setImageUrl('');
    setImageTitle('');
    setImageDescription('');
    setImageError('');
  };

  const updateCoupon = async (e: FormEvent) => {
    if (!editingCoupon) return;
    
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const r = await fetch(`/api/admin/coupons?id=${editingCoupon._id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          ...form, 
          discountPercentage: form.discountType === 'percentage' ? Number(form.discountPercentage) : undefined,
          discountAmount: form.discountType === 'fixed' ? Number(form.discountAmount) : undefined,
          minimumPurchaseAmount: Number(form.minimumPurchaseAmount || 0),
          maxUsesPerUser: Number(form.maxUsesPerUser),
          maxTotalUses: form.maxTotalUses ? Number(form.maxTotalUses) : undefined,
          imageUrl: imageUrl || undefined,
          imageTitle: imageTitle || undefined,
          imageDescription: imageDescription || undefined,
        }) 
      });
      const d = await r.json();
      if (!r.ok) return setError(d.error || 'Could not update coupon');
      
      // Update the coupon in the list
      setCoupons(v => v.map(c => c._id === editingCoupon._id ? d.coupon : c));
      
      // Reset form and exit edit mode
      cancelEdit();
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const r = await fetch(`/api/admin/coupons?id=${id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (r.ok) {
        setCoupons(v => v.map(c => c._id === id ? { ...c, isActive: !c.isActive } : c));
      }
    } catch (error) {
      console.error('Error toggling coupon:', error);
    }
  };

  const toggleCategory = (categoryName: string) => {
    setForm(prev => ({
      ...prev,
      applicableCategories: prev.applicableCategories.includes(categoryName)
        ? prev.applicableCategories.filter(c => c !== categoryName)
        : [...prev.applicableCategories, categoryName]
    }));
    setCategorySearch('');
  };

  const toggleResource = (resourceId: string) => {
    setForm(prev => ({
      ...prev,
      applicableResources: prev.applicableResources.includes(resourceId)
        ? prev.applicableResources.filter(r => r !== resourceId)
        : [...prev.applicableResources, resourceId]
    }));
    setResourceSearch('');
  };

  const removeCategory = (categoryName: string) => {
    setForm(prev => ({
      ...prev,
      applicableCategories: prev.applicableCategories.filter(c => c !== categoryName)
    }));
    setCategorySearch('');
  };

  const removeResource = (resourceId: string) => {
    setForm(prev => ({
      ...prev,
      applicableResources: prev.applicableResources.filter(r => r !== resourceId)
    }));
    setResourceSearch('');
  };

  const paidResources = resources.filter(r => r.title && r.title.length > 0);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredResources = paidResources.filter(res => 
    res.title.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  const inputClass = 'w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors font-poppins';
  const checkboxClass = 'w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:text-blue-400 dark:focus:ring-blue-500';

  return (
    <AdminLayout>
      <div className="space-y-6 font-poppins overflow-x-hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Promotions</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-[-.045em] text-gray-900 dark:text-gray-100">Coupons</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Create discounts and manage active offers.</p>
        </div>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              {editingCoupon ? <Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
              {editingCoupon ? 'Edit coupon' : 'Create coupon'}
            </h2>
            
            {editingCoupon && (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
          
          {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          
          <form onSubmit={handleSubmit} className="mt-3 space-y-4">
            {/* Section 1: Basic Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">Basic Information</h3>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="min-w-0">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Coupon Code</label>
                  <input
                    required
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    placeholder="SAVE20"
                    className={inputClass}
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Coupon Title</label>
                  <input
                    required
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Summer Sale"
                    className={inputClass}
                  />
                </div>

                <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description <span className="font-normal text-xs text-slate-400">(Optional)</span></label>
                  <div className="relative">
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Terms and conditions..."
                      rows={3}
                      maxLength={100}
                      className={inputClass}
                    />
                    <span className="absolute bottom-2 right-3 text-xs text-slate-400">{form.description.length}/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Discount Configuration */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">Discount Configuration</h3>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Type</label>
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, discountType: 'percentage' })}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors rounded-md ${
                      form.discountType === 'percentage'
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Percent className="h-3 w-3" />
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, discountType: 'fixed' })}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors rounded-md ${
                      form.discountType === 'fixed'
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <IndianRupee className="h-3 w-3" />
                    Fixed Amount
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {form.discountType === 'percentage' ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Percentage (%)</label>
                    <input 
                      required
                      type="number"
                      min="1"
                      max="100"
                      value={form.discountPercentage} 
                      onChange={e => setForm({ ...form, discountPercentage: e.target.value })} 
                      placeholder="20" 
                      className={inputClass}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Amount (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input 
                        required
                        type="number"
                        min="1"
                        value={form.discountAmount} 
                        onChange={e => setForm({ ...form, discountAmount: e.target.value })} 
                        placeholder="50" 
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors font-poppins"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date <span className="font-normal text-xs text-slate-400">(Optional)</span></label>
                  <input 
                    type="date"
                    value={form.expiresAt} 
                    onChange={e => setForm({ ...form, expiresAt: e.target.value })} 
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Minimum Purchase Amount (₹)
                  <span className="font-normal text-xs text-slate-400 ml-1">(Optional - Coupon only works above this amount)</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number"
                    min="0"
                    value={form.minimumPurchaseAmount} 
                    onChange={e => setForm({ ...form, minimumPurchaseAmount: e.target.value })} 
                    placeholder="0" 
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors font-poppins"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Usage Limits */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">Usage Limits</h3>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Maximum Uses Per User
                    <span className="font-normal text-xs text-slate-400 ml-1">(How many times can one user use this coupon)</span>
                  </label>
                  <input 
                    type="number"
                    min="1"
                    value={form.maxUsesPerUser} 
                    onChange={e => setForm({ ...form, maxUsesPerUser: e.target.value })} 
                    placeholder="1" 
                    className={inputClass}
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Usage Limit
                    <span className="font-normal text-xs text-slate-400 ml-1">(Optional - Maximum total uses across all users)</span>
                  </label>
                  <input 
                    type="number"
                    min="1"
                    value={form.maxTotalUses} 
                    onChange={e => setForm({ ...form, maxTotalUses: e.target.value })} 
                    placeholder="100" 
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Applicability */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">Applicability</h3>
              
              {/* Category Selection */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Applicable Categories
                  <span className="font-normal text-xs text-slate-400 ml-1">(Optional - Leave empty for all categories)</span>
                </label>
                
                {/* Selected Categories as Tags */}
                {form.applicableCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.applicableCategories.map(categoryName => (
                      <div key={categoryName} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-sm">
                        <span>{categoryName}</span>
                        <button
                          type="button"
                          onClick={() => removeCategory(categoryName)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Search Input */}
                <div className="relative" ref={categoryDropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={e => {
                        setCategorySearch(e.target.value);
                        setShowCategoryDropdown(true);
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      placeholder="Search categories..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors font-poppins"
                    />
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCategorySearch('');
                          setShowCategoryDropdown(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown */}
                  {showCategoryDropdown && categorySearch && filteredCategories.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 custom-scrollbar">
                      {filteredCategories.map(category => (
                        <button
                          key={category._id}
                          type="button"
                          onClick={() => {
                            if (!form.applicableCategories.includes(category.name)) {
                              toggleCategory(category.name);
                            }
                            setShowCategoryDropdown(false);
                          }}
                          disabled={form.applicableCategories.includes(category.name)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                            form.applicableCategories.includes(category.name) 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {category.name}
                          {form.applicableCategories.includes(category.name) && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Added)</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Resource Selection */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Specific Resources
                  <span className="font-normal text-xs text-slate-400 ml-1">(Optional - Leave empty for all paid resources)</span>
                </label>
                
                {/* Selected Resources as Tags */}
                {form.applicableResources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.applicableResources.map(resourceId => {
                      const resource = paidResources.find(r => r._id === resourceId);
                      return resource ? (
                        <div key={resourceId} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-sm max-w-[200px]">
                          <span className="truncate">{resource.title}</span>
                          <button
                            type="button"
                            onClick={() => removeResource(resourceId)}
                            className="hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                
                {/* Search Input */}
                <div className="relative" ref={resourceDropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={resourceSearch}
                      onChange={e => {
                        setResourceSearch(e.target.value);
                        setShowResourceDropdown(true);
                      }}
                      onFocus={() => setShowResourceDropdown(true)}
                      placeholder="Search resources..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors font-poppins"
                    />
                    {resourceSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setResourceSearch('');
                          setShowResourceDropdown(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown */}
                  {showResourceDropdown && resourceSearch && filteredResources.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 custom-scrollbar">
                      {filteredResources.map(resource => (
                        <button
                          key={resource._id}
                          type="button"
                          onClick={() => {
                            if (!form.applicableResources.includes(resource._id)) {
                              toggleResource(resource._id);
                            }
                            setShowResourceDropdown(false);
                          }}
                          disabled={form.applicableResources.includes(resource._id)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                            form.applicableResources.includes(resource._id) 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate flex-1">{resource.title}</span>
                            {form.applicableResources.includes(resource._id) && (
                              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 flex-shrink-0">(Added)</span>
                            )}
                          </div>
                          {resource.category && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{resource.category}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Status */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">Status</h3>
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className={checkboxClass}
                  />
                  <span className="text-sm font-medium">Activate coupon immediately after creation</span>
                </label>
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <button 
                type="submit" 
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 w-full sm:w-auto"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingCoupon ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
                {loading ? (editingCoupon ? 'Updating...' : 'Creating...') : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
            <Ticket className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Active coupons
          </h2>
          
          {coupons.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">No coupons created yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Code</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Title</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Discount</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Min. Amount</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Usage</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(coupon => (
                    <tr key={coupon._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <td className="px-3 py-3 font-medium">{coupon.code}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          {coupon.imageUrl && (
                            <img
                              src={coupon.imageUrl}
                              alt={coupon.imageTitle || coupon.title}
                              className="h-9 w-9 shrink-0 rounded-md border border-slate-200 object-cover dark:border-gray-700"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium">{coupon.title}</p>
                            {coupon.description && <p className="text-xs text-slate-500 truncate max-w-[200px]">{coupon.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {coupon.discountType === 'percentage' 
                          ? `${coupon.discountPercentage}%` 
                          : `₹${coupon.discountAmount}`}
                      </td>
                      <td className="px-3 py-3">
                        {coupon.minimumPurchaseAmount && coupon.minimumPurchaseAmount > 0 
                          ? `₹${coupon.minimumPurchaseAmount}` 
                          : 'No minimum'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs">
                          <p>{coupon.currentUses || 0} / {coupon.maxTotalUses || '∞'}</p>
                          <p className="text-slate-500">{coupon.maxUsesPerUser} per user</p>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleActive(coupon._id, coupon.isActive)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                            coupon.isActive
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                          }`}
                        >
                          {coupon.isActive ? <Power className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(coupon)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Edit coupon"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => remove(coupon._id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Image Section */}
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 mb-4">
            <Ticket className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Coupon Promotion Image
          </h2>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Image Box - Left Side */}
            <div className="lg:w-1/3 min-w-0">
              {imageUrl ? (
                <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <img src={imageUrl} alt={imageTitle || 'Coupon image'} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageUrl(''); setImageError(''); }}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md transition-colors hover:bg-red-600"
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white">
                    {imageTitle || 'Coupon image'}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={triggerFilePicker}
                  disabled={uploadingImage}
                  className="relative flex aspect-square w-full flex-col items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 transition-colors hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-10 w-10 animate-spin text-blue-500 dark:text-blue-400" />
                      <p className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">Uploading...</p>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Ticket className="h-12 w-12 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Upload Coupon Image</p>
                      <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">Click to choose a file · Recommended: 400x400px</p>
                    </div>
                  )}
                </button>
              )}
            </div>

            {/* Content - Right Side */}
            <div className="lg:w-2/3 min-w-0">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Image Title</label>
                  <input
                    type="text"
                    value={imageTitle}
                    onChange={(e) => setImageTitle(e.target.value)}
                    placeholder="Summer Sale Banner"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="Describe the promotion..."
                    rows={3}
                    className={inputClass}
                  />
                </div>

                {imageError && <p className="rounded-md bg-red-50 p-2.5 text-sm text-red-700">{imageError}</p>}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={triggerFilePicker}
                    disabled={uploadingImage}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </button>
                  <button
                    type="button"
                    onClick={() => imageUrl && window.open(imageUrl, '_blank')}
                    disabled={!imageUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  {imageUrl ? 'Image saved with the coupon when you create or update it.' : 'Upload an image to show with this coupon (max 10 MB, JPG/PNG/WebP).'}
                </p>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageUpload(file);
              e.target.value = '';
            }}
          />
        </section>
      </div>
    </AdminLayout>
  );
}