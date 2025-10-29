import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, authAPI } from '../api/api';
import { getGoogleDriveImageUrl } from '../utils/imageHelper';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      console.log('Orders fetched:', response.data);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error('Error response:', error.response?.data);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openCancelModal = (order) => {
    setSelectedOrder(order);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      setCancelling(true);
      await ordersAPI.cancel(selectedOrder._id, cancelReason);
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === selectedOrder._id 
          ? { 
              ...order, 
              orderStatus: 'Cancelled',
              cancellation: {
                reason: cancelReason,
                cancelledAt: new Date(),
                cancelledBy: 'user'
              }
            } 
          : order
      ));
      
      setShowCancelModal(false);
      alert('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const openAddressModal = (address = null, index = null) => {
    if (address) {
      setEditingAddress(index);
      setAddressForm(address);
    } else {
      setEditingAddress(null);
      setAddressForm({
        fullName: user?.name || '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
      });
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    // Validate form
    if (!addressForm.fullName || !addressForm.phone || !addressForm.addressLine1 || 
        !addressForm.city || !addressForm.state || !addressForm.zipCode) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const updatedAddresses = [...(user.addresses || [])];
      
      if (editingAddress !== null) {
        updatedAddresses[editingAddress] = addressForm;
      } else {
        updatedAddresses.push(addressForm);
      }

      console.log('Sending addresses to backend:', updatedAddresses);
      const response = await authAPI.updateAddresses(updatedAddresses);
      console.log('Backend response:', response.data);
      
      updateUser(response.data.data);
      setShowAddressModal(false);
      alert(editingAddress !== null ? 'Address updated successfully' : 'Address added successfully');
    } catch (error) {
      console.error('Error saving address:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(error.response?.data?.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (index) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const updatedAddresses = user.addresses.filter((_, i) => i !== index);
      const response = await authAPI.updateAddresses(updatedAddresses);
      updateUser(response.data.data);
      alert('Address deleted successfully');
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Processing: 'bg-blue-100 text-blue-800',
      Shipped: 'bg-purple-100 text-purple-800',
      Delivered: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canCancelOrder = (order) => {
    return order.orderStatus !== 'Cancelled' && 
           order.orderStatus !== 'Delivered' && 
           order.orderStatus !== 'Shipped';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Welcome, {user?.name}!
              </h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            <div className="flex gap-3">
              {user?.email === 'adminalok@gmail.com' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Orders
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'addresses'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Addresses
            </button>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg
                  className="w-20 h-20 mx-auto text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Orders Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  You haven't placed any orders. Start shopping now!
                </p>
                <button
                  onClick={() => navigate('/shopping')}
                  className="btn-primary"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">
                          Order #{order._id.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.orderDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3 mb-4">
                      {order.items && order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          {item.image && (
                            <img
                              src={getGoogleDriveImageUrl(item.image)}
                              alt={item.name || 'Product'}
                              className="w-16 h-16 object-cover rounded"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/products/placeholder.svg';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × ₹{(item.price || 0).toFixed(2)}
                              {item.size && ` (${item.size})`}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            ₹{(item.subtotal || 0).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Total Items:</span>
                        <span className="font-medium">
                          {order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium">{order.paymentMethod || 'COD'}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Grand Total:</span>
                        <span className="text-primary-600">₹{(order.grandTotal || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="font-medium text-gray-700 mb-1">
                        Shipping Address:
                      </p>
                      {order.shippingAddress && (
                        <p className="text-sm text-gray-600">
                          {order.shippingAddress.fullName},{' '}
                          {order.shippingAddress.phone}
                          <br />
                          {order.shippingAddress.addressLine1}
                          {order.shippingAddress.addressLine2 &&
                            `, ${order.shippingAddress.addressLine2}`}
                          <br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                          {order.shippingAddress.zipCode}
                        </p>
                      )}
                    </div>

                    {/* Cancellation Info */}
                    {order.cancellation && (
                      <div className="mt-4 pt-4 border-t bg-red-50 -mx-6 px-6 py-4">
                        <p className="font-medium text-red-900 mb-2">
                          ❌ Order Cancelled
                        </p>
                        <p className="text-sm text-red-700 mb-1">
                          <span className="font-medium">Reason:</span> {order.cancellation.reason}
                        </p>
                        <p className="text-sm text-red-600">
                          Cancelled on {new Date(order.cancellation.cancelledAt).toLocaleDateString('en-IN')} by {order.cancellation.cancelledBy}
                        </p>
                      </div>
                    )}

                    {/* Delivery Information */}
                    {(order.deliveryAgent || order.estimatedDeliveryDate) && order.orderStatus !== 'Cancelled' && (
                      <div className="mt-4 pt-4 border-t bg-blue-50 px-6 py-4 -mx-6">
                        <p className="font-medium text-gray-900 mb-2">
                          🚚 Delivery Information
                        </p>
                        {order.deliveryAgent && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Delivery Agent:</span> {order.deliveryAgent.name}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Contact:</span> {order.deliveryAgent.phone}
                            </p>
                          </div>
                        )}
                        {order.estimatedDeliveryDate && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Estimated Delivery:</span>{' '}
                            {new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Cancel Order Button */}
                    {canCancelOrder(order) && (
                      <div className="mt-4 pt-4 border-t">
                        <button
                          onClick={() => openCancelModal(order)}
                          className="w-full sm:w-auto px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Saved Addresses</h2>
              <button
                onClick={() => openAddressModal()}
                className="btn-primary"
              >
                + Add New Address
              </button>
            </div>
            {user?.addresses && user.addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.addresses.map((addr, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:border-primary-500 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-900">{addr.fullName}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openAddressModal(addr, index)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {addr.phone}
                      <br />
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                      <br />
                      {addr.city}, {addr.state} - {addr.zipCode}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No saved addresses yet.</p>
                <button
                  onClick={() => openAddressModal()}
                  className="btn-primary"
                >
                  Add Your First Address
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {showCancelModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cancel Order</h2>
              <p className="text-gray-600 mb-4">
                Order #{selectedOrder._id.slice(-8)}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please tell us why you want to cancel this order..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling || !cancelReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddressModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingAddress !== null ? 'Edit Address' : 'Add New Address'}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})}
                    placeholder="House No., Building Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine2}
                    onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})}
                    placeholder="Road Name, Area, Colony"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAddress}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Save Address
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
