import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { couponsAPI, customersAPI } from '../api/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

// Inline SVG icons
const FiPlus = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const FiEdit2 = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const FiTrash2 = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const FiX = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FiArrowLeft = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const FiUsers = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const FiTarget = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <circle cx="12" cy="12" r="6" strokeWidth={2} />
    <circle cx="12" cy="12" r="2" strokeWidth={2} />
  </svg>
);

const AdminCoupons = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    usagePerUser: '1',
    startDate: '',
    endDate: '',
    isActive: true,
    // Targeting options
    targeting: {
      enabled: false,
      userType: 'all',
      minTotalPurchase: '',
      maxTotalPurchase: '',
      minOrderCount: '',
      maxOrderCount: '',
      registeredDaysAgo: '',
      hasWishlistItems: null,
    },
    notifyUsers: false,
    sendEmail: false,
  });
  const [matchingUsersCount, setMatchingUsersCount] = useState(null);
  const [checkingUsers, setCheckingUsers] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/profile');
      return;
    }
    fetchCoupons();

    // Auto-refresh every 10 seconds (only when modal is closed)
    const intervalId = setInterval(() => {
      if (!showModal) {
        fetchCoupons();
      }
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [isAuthenticated, user, navigate, showModal]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponsAPI.getAll();
      setCoupons(response.data.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      addToast('Failed to load coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      usageLimit: '',
      usagePerUser: '1',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
      targeting: {
        enabled: false,
        userType: 'all',
        minTotalPurchase: '',
        maxTotalPurchase: '',
        minOrderCount: '',
        maxOrderCount: '',
        registeredDaysAgo: '',
        hasWishlistItems: null,
      },
      notifyUsers: false,
      sendEmail: false,
    });
    setMatchingUsersCount(null);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      usagePerUser: coupon.usagePerUser?.toString() || '1',
      startDate: new Date(coupon.startDate).toISOString().split('T')[0],
      endDate: new Date(coupon.endDate).toISOString().split('T')[0],
      isActive: coupon.isActive,
      targeting: coupon.targeting || {
        enabled: false,
        userType: 'all',
        minTotalPurchase: '',
        maxTotalPurchase: '',
        minOrderCount: '',
        maxOrderCount: '',
        registeredDaysAgo: '',
        hasWishlistItems: null,
      },
      notifyUsers: false,
      sendEmail: false,
      sendSMS: false,
    });
    setMatchingUsersCount(coupon.eligibleUsers?.length || null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.discountValue || !formData.endDate) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        usagePerUser: formData.usagePerUser ? parseInt(formData.usagePerUser) : 1,
        targeting: formData.targeting.enabled ? {
          enabled: true,
          userType: formData.targeting.userType,
          minTotalPurchase: formData.targeting.minTotalPurchase ? parseFloat(formData.targeting.minTotalPurchase) : null,
          maxTotalPurchase: formData.targeting.maxTotalPurchase ? parseFloat(formData.targeting.maxTotalPurchase) : null,
          minOrderCount: formData.targeting.minOrderCount ? parseInt(formData.targeting.minOrderCount) : null,
          maxOrderCount: formData.targeting.maxOrderCount ? parseInt(formData.targeting.maxOrderCount) : null,
          registeredDaysAgo: formData.targeting.registeredDaysAgo ? parseInt(formData.targeting.registeredDaysAgo) : null,
          hasWishlistItems: formData.targeting.hasWishlistItems,
        } : { enabled: false },
        notifyUsers: formData.notifyUsers,
        sendEmail: formData.sendEmail,
        sendSMS: formData.sendSMS,
      };

      if (editingCoupon) {
        await couponsAPI.update(editingCoupon._id, payload);
        addToast('Coupon updated successfully', 'success');
      } else {
        const response = await couponsAPI.create(payload);
        let message = 'Coupon created successfully';
        if (response.data.eligibleCount > 0) {
          message = `Coupon created! ${response.data.eligibleCount} users are eligible.`;
        }
        if (formData.sendEmail) {
          message += ' Emails are being sent.';
        }
        if (formData.sendSMS) {
          message += ' SMS notifications are being sent.';
        }
        addToast(message, 'success');
      }
      
      setShowModal(false);
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      addToast(error.response?.data?.message || 'Failed to save coupon', 'error');
    }
  };

  const checkMatchingUsers = async () => {
    if (!formData.targeting.enabled) return;
    
    try {
      setCheckingUsers(true);
      const criteria = {
        userType: formData.targeting.userType,
        minTotalPurchase: formData.targeting.minTotalPurchase ? parseFloat(formData.targeting.minTotalPurchase) : null,
        maxTotalPurchase: formData.targeting.maxTotalPurchase ? parseFloat(formData.targeting.maxTotalPurchase) : null,
        minOrderCount: formData.targeting.minOrderCount ? parseInt(formData.targeting.minOrderCount) : null,
        maxOrderCount: formData.targeting.maxOrderCount ? parseInt(formData.targeting.maxOrderCount) : null,
        registeredDaysAgo: formData.targeting.registeredDaysAgo ? parseInt(formData.targeting.registeredDaysAgo) : null,
        hasWishlistItems: formData.targeting.hasWishlistItems,
      };
      
      const response = await customersAPI.matchCriteria(criteria);
      setMatchingUsersCount(response.data.count);
    } catch (error) {
      console.error('Error checking users:', error);
    } finally {
      setCheckingUsers(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      await couponsAPI.delete(id);
      addToast('Coupon deleted successfully', 'success');
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      addToast('Failed to delete coupon', 'error');
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await couponsAPI.update(coupon._id, { isActive: !coupon.isActive });
      addToast(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`, 'success');
      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
      addToast('Failed to update coupon', 'error');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Coupons</h1>
            <p className="text-gray-600">Create and manage discount coupons</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add Coupon
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Coupons List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No coupons created yet</p>
              <button
                onClick={openCreateModal}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Create your first coupon
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min. Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Validity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Targeting
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coupons.map((coupon) => (
                    <motion.tr
                      key={coupon._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full font-mono font-bold text-sm">
                            {coupon.code}
                          </span>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-semibold text-green-600">
                          {coupon.discountType === 'percentage' 
                            ? `${coupon.discountValue}%` 
                            : `₹${coupon.discountValue}`}
                        </span>
                        {coupon.maxDiscountAmount && (
                          <p className="text-xs text-gray-500">Max: ₹{coupon.maxDiscountAmount}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : 'None'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm">
                          {coupon.usedCount} / {coupon.usageLimit || '∞'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>{formatDate(coupon.startDate)}</div>
                        <div className="text-gray-500">to {formatDate(coupon.endDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isExpired(coupon.endDate) ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Expired
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              coupon.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {coupon.targeting?.enabled ? (
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                              <FiTarget /> {coupon.eligibleUsers?.length || 0} users
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">All users</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon._id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                <h2 className="text-lg font-bold">
                  {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Coupon Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SAVE20"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., 20% off on first order"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      placeholder={formData.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 100'}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      min="0"
                      max={formData.discountType === 'percentage' ? '100' : undefined}
                      required
                    />
                  </div>
                </div>

                {/* Min Order & Max Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min. Order Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      placeholder="e.g., 500"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max. Discount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      placeholder="e.g., 200"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for no limit</p>
                  </div>
                </div>

                {/* Usage Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Usage Limit
                    </label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Per User Limit
                    </label>
                    <input
                      type="number"
                      value={formData.usagePerUser}
                      onChange={(e) => setFormData({ ...formData, usagePerUser: e.target.value })}
                      placeholder="1"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      min="1"
                    />
                  </div>
                </div>

                {/* Validity Period */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active (coupon can be used)
                  </label>
                </div>

                {/* Targeting Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="targetingEnabled"
                      checked={formData.targeting.enabled}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        targeting: { ...formData.targeting, enabled: e.target.checked }
                      })}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <label htmlFor="targetingEnabled" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FiTarget /> Enable Targeted Coupon
                    </label>
                  </div>

                  {formData.targeting.enabled && (
                    <div className="space-y-4 bg-purple-50 rounded-lg p-4">
                      {/* User Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User Type
                        </label>
                        <select
                          value={formData.targeting.userType}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            targeting: { ...formData.targeting, userType: e.target.value }
                          })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="all">All Users</option>
                          <option value="new">New Users (Never Ordered)</option>
                          <option value="existing">Existing Users (Has Ordered)</option>
                        </select>
                      </div>

                      {/* Purchase Amount Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Total Purchase (₹)
                          </label>
                          <input
                            type="number"
                            value={formData.targeting.minTotalPurchase}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              targeting: { ...formData.targeting, minTotalPurchase: e.target.value }
                            })}
                            placeholder="e.g., 1000"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Total Purchase (₹)
                          </label>
                          <input
                            type="number"
                            value={formData.targeting.maxTotalPurchase}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              targeting: { ...formData.targeting, maxTotalPurchase: e.target.value }
                            })}
                            placeholder="e.g., 10000"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            min="0"
                          />
                        </div>
                      </div>

                      {/* Order Count Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Order Count
                          </label>
                          <input
                            type="number"
                            value={formData.targeting.minOrderCount}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              targeting: { ...formData.targeting, minOrderCount: e.target.value }
                            })}
                            placeholder="e.g., 2"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Order Count
                          </label>
                          <input
                            type="number"
                            value={formData.targeting.maxOrderCount}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              targeting: { ...formData.targeting, maxOrderCount: e.target.value }
                            })}
                            placeholder="e.g., 10"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            min="0"
                          />
                        </div>
                      </div>

                      {/* Account Age */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Account Age (Days)
                        </label>
                        <input
                          type="number"
                          value={formData.targeting.registeredDaysAgo}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            targeting: { ...formData.targeting, registeredDaysAgo: e.target.value }
                          })}
                          placeholder="e.g., 30"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          min="0"
                        />
                      </div>

                      {/* Wishlist Items */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Wishlist Items
                        </label>
                        <select
                          value={formData.targeting.hasWishlistItems === null ? '' : formData.targeting.hasWishlistItems.toString()}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            targeting: { 
                              ...formData.targeting, 
                              hasWishlistItems: e.target.value === '' ? null : e.target.value === 'true'
                            }
                          })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">No Preference</option>
                          <option value="true">Has Wishlist Items</option>
                          <option value="false">No Wishlist Items</option>
                        </select>
                      </div>

                      {/* Check Matching Users */}
                      <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                        <div>
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <FiUsers /> Matching Users:
                          </span>
                          {matchingUsersCount !== null && (
                            <span className="text-lg font-bold text-purple-600 ml-2">
                              {matchingUsersCount}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={checkMatchingUsers}
                          disabled={checkingUsers}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                        >
                          {checkingUsers ? 'Checking...' : 'Check'}
                        </button>
                      </div>

                      {/* Notification Options */}
                      <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">📢 Notification Options</h4>
                        
                        {/* In-App Notification */}
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            id="notifyUsers"
                            checked={formData.notifyUsers}
                            onChange={(e) => setFormData({ ...formData, notifyUsers: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <label htmlFor="notifyUsers" className="text-sm text-gray-700">
                            🔔 In-app notification (Profile → Notifications)
                          </label>
                        </div>

                        {/* Email Notification */}
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            id="sendEmail"
                            checked={formData.sendEmail}
                            onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <label htmlFor="sendEmail" className="text-sm text-gray-700">
                            📧 Send email to registered email addresses
                          </label>
                        </div>

                        {formData.sendEmail && (
                          <p className="text-xs text-amber-600 mt-3 bg-amber-50 p-2 rounded">
                            ⚠️ Emails will be sent in background after coupon creation.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};


export default AdminCoupons;
