import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { replacementsAPI } from '../api/api';
import { getGoogleDriveImageUrl } from '../utils/imageHelper';

const AdminReplacements = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState('all');

  // Update form state
  const [updateForm, setUpdateForm] = useState({
    status: '',
    adminNotes: '',
    pickupScheduledDate: '',
    pickupAgent: '',
    refundAmount: '',
    refundMethod: 'Original Payment Method',
    refundTransactionId: '',
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchReplacements();
    fetchStats();
  }, [isAuthenticated, user]);

  const fetchReplacements = async () => {
    try {
      setLoading(true);
      const response = await replacementsAPI.getAll();
      setReplacements(response.data.data || []);
    } catch (error) {
      console.error('Error fetching replacements:', error);
      addToast('Failed to load replacements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await replacementsAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const openDetailModal = (replacement) => {
    setSelectedReplacement(replacement);
    setUpdateForm({
      status: replacement.status,
      adminNotes: replacement.adminNotes || '',
      pickupScheduledDate: replacement.pickup?.scheduledDate ? 
        new Date(replacement.pickup.scheduledDate).toISOString().split('T')[0] : '',
      pickupAgent: replacement.pickup?.agent || '',
      refundAmount: replacement.refund?.amount || '',
      refundMethod: replacement.refund?.method || 'Original Payment Method',
      refundTransactionId: replacement.refund?.transactionId || '',
    });
    setShowDetailModal(true);
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      
      const updateData = {
        status: updateForm.status,
        adminNotes: updateForm.adminNotes,
      };

      // Add pickup info if scheduling pickup
      if (updateForm.status === 'Pickup Scheduled' && updateForm.pickupScheduledDate) {
        updateData.pickupScheduledDate = updateForm.pickupScheduledDate;
        updateData.pickupAgent = updateForm.pickupAgent;
      }

      // Add refund info if initiating refund
      if (updateForm.status === 'Refund Initiated' || updateForm.status === 'Refunded') {
        updateData.refundAmount = parseFloat(updateForm.refundAmount);
        updateData.refundMethod = updateForm.refundMethod;
        if (updateForm.status === 'Refunded') {
          updateData.refundTransactionId = updateForm.refundTransactionId;
        }
      }

      await replacementsAPI.update(selectedReplacement._id, updateData);
      addToast('Replacement updated successfully', 'success');
      setShowDetailModal(false);
      fetchReplacements();
      fetchStats();
    } catch (error) {
      console.error('Error updating replacement:', error);
      addToast(error.response?.data?.message || 'Failed to update replacement', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Requested': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-blue-100 text-blue-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Pickup Scheduled': 'bg-purple-100 text-purple-800',
      'Picked Up': 'bg-indigo-100 text-indigo-800',
      'Replacement Shipped': 'bg-cyan-100 text-cyan-800',
      'Completed': 'bg-green-100 text-green-800',
      'Refund Initiated': 'bg-orange-100 text-orange-800',
      'Refunded': 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredReplacements = replacements.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status === 'Requested';
    if (filter === 'in-progress') return ['Approved', 'Pickup Scheduled', 'Picked Up', 'Replacement Shipped', 'Refund Initiated'].includes(r.status);
    if (filter === 'completed') return ['Completed', 'Refunded', 'Rejected'].includes(r.status);
    return true;
  });

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Replacement Requests</h1>
            <p className="text-gray-600">Manage product replacement and refund requests</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            {['all', 'pending', 'in-progress', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 min-w-max py-3 px-4 text-sm font-medium transition-colors ${
                  filter === f
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Replacements List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredReplacements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Replacement Requests</h3>
            <p className="text-gray-600">There are no replacement requests to display.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReplacements.map((replacement, index) => (
              <motion.div
                key={replacement._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openDetailModal(replacement)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Product Image */}
                  <img
                    src={getGoogleDriveImageUrl(replacement.productImage)}
                    alt={replacement.productName}
                    className="w-20 h-20 object-cover rounded-lg"
                    crossOrigin="anonymous"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/products/placeholder.svg'; }}
                  />

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{replacement.productName}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(replacement.status)}`}>
                        {replacement.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Customer:</span> {replacement.user?.name || 'N/A'} ({replacement.user?.email})
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Reason:</span> {replacement.reason}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Requested:</span>{' '}
                      {new Date(replacement.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex items-center">
                    <button className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1">
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedReplacement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Replacement Request Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Product & Customer Info */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Product Details</h3>
                    <div className="flex items-center gap-3">
                      <img
                        src={getGoogleDriveImageUrl(selectedReplacement.productImage)}
                        alt={selectedReplacement.productName}
                        className="w-16 h-16 object-cover rounded"
                        crossOrigin="anonymous"
                      />
                      <div>
                        <p className="font-medium">{selectedReplacement.productName}</p>
                        <p className="text-sm text-gray-600">Qty: {selectedReplacement.quantity}</p>
                        <p className="text-sm text-gray-600">₹{selectedReplacement.price?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Customer Details</h3>
                    <p className="font-medium">{selectedReplacement.user?.name}</p>
                    <p className="text-sm text-gray-600">{selectedReplacement.user?.email}</p>
                    <p className="text-sm text-gray-600">Order: #{selectedReplacement.order?._id?.slice(-8)}</p>
                  </div>
                </div>

                {/* Order Summary with Delivery Fee */}
                {selectedReplacement.order && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Order Summary</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-600">Items Total:</span>
                      <span className="text-right font-medium">₹{selectedReplacement.order.itemsTotal?.toFixed(2) || '0.00'}</span>
                      
                      <span className="text-gray-600">Delivery Fee:</span>
                      <span className="text-right font-medium">
                        {selectedReplacement.order.deliveryFee > 0 
                          ? `₹${selectedReplacement.order.deliveryFee.toFixed(2)}`
                          : <span className="text-green-600">FREE</span>
                        }
                      </span>
                      
                      {selectedReplacement.order.couponDiscount > 0 && (
                        <>
                          <span className="text-gray-600">Coupon ({selectedReplacement.order.couponCode}):</span>
                          <span className="text-right font-medium text-green-600">-₹{selectedReplacement.order.couponDiscount?.toFixed(2)}</span>
                        </>
                      )}
                      
                      <span className="text-gray-600 font-medium border-t pt-1">Grand Total:</span>
                      <span className="text-right font-bold text-primary-600 border-t pt-1">₹{selectedReplacement.order.grandTotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    
                    {/* Suggested refund note */}
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Item Value:</span> ₹{(selectedReplacement.price * selectedReplacement.quantity).toFixed(2)}
                        {selectedReplacement.order.deliveryFee > 0 && selectedReplacement.order.items?.length === 1 && (
                          <span className="ml-2 text-orange-600">
                            (+ ₹{selectedReplacement.order.deliveryFee.toFixed(2)} delivery fee if refunding entire order)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reason & Description */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Reason for Replacement</h3>
                  <p className="font-medium text-gray-900">{selectedReplacement.reason}</p>
                  <p className="text-sm text-gray-600 mt-2">{selectedReplacement.description}</p>
                </div>

                {/* Timeline */}
                {selectedReplacement.timeline && selectedReplacement.timeline.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Timeline</h3>
                    <div className="space-y-3">
                      {selectedReplacement.timeline.map((event, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
                          <div>
                            <p className="font-medium text-sm">{event.status}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleString('en-IN')}
                            </p>
                            {event.note && <p className="text-sm text-gray-600">{event.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Update Form */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Update Status</h3>
                  
                  {/* Status */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={updateForm.status}
                      onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Requested">Requested</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Pickup Scheduled">Pickup Scheduled</option>
                      <option value="Picked Up">Picked Up</option>
                      <option value="Replacement Shipped">Replacement Shipped</option>
                      <option value="Completed">Completed</option>
                      <option value="Refund Initiated">Refund Initiated</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>

                  {/* Pickup fields */}
                  {updateForm.status === 'Pickup Scheduled' && (
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                        <input
                          type="date"
                          value={updateForm.pickupScheduledDate}
                          onChange={(e) => setUpdateForm({ ...updateForm, pickupScheduledDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Agent</label>
                        <input
                          type="text"
                          value={updateForm.pickupAgent}
                          onChange={(e) => setUpdateForm({ ...updateForm, pickupAgent: e.target.value })}
                          placeholder="Agent name or contact"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Refund fields */}
                  {(updateForm.status === 'Refund Initiated' || updateForm.status === 'Refunded') && (
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (₹)</label>
                        <input
                          type="number"
                          value={updateForm.refundAmount}
                          onChange={(e) => setUpdateForm({ ...updateForm, refundAmount: e.target.value })}
                          placeholder="Enter refund amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Refund Method</label>
                        <select
                          value={updateForm.refundMethod}
                          onChange={(e) => setUpdateForm({ ...updateForm, refundMethod: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Original Payment Method">Original Payment Method</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Store Credit">Store Credit</option>
                          <option value="UPI">UPI</option>
                        </select>
                      </div>
                      {updateForm.status === 'Refunded' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                          <input
                            type="text"
                            value={updateForm.refundTransactionId}
                            onChange={(e) => setUpdateForm({ ...updateForm, refundTransactionId: e.target.value })}
                            placeholder="Enter transaction/reference ID"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                    <textarea
                      value={updateForm.adminNotes}
                      onChange={(e) => setUpdateForm({ ...updateForm, adminNotes: e.target.value })}
                      placeholder="Internal notes about this request..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {updating ? 'Updating...' : 'Update Request'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminReplacements;
