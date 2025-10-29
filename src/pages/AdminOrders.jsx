import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../api/api';

const AdminOrders = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    deliveryAgentName: '',
    deliveryAgentPhone: '',
    estimatedDeliveryDate: '',
  });

  useEffect(() => {
    if (!isAuthenticated || user?.email !== 'adminalok@gmail.com') {
      navigate('/profile');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      console.log('Orders response:', response.data);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (order) => {
    setSelectedOrder(order);
    setUpdateData({
      status: order.orderStatus,
      deliveryAgentName: order.deliveryAgent?.name || '',
      deliveryAgentPhone: order.deliveryAgent?.phone || '',
      estimatedDeliveryDate: order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        status: updateData.status,
      };

      if (updateData.deliveryAgentName || updateData.deliveryAgentPhone) {
        payload.deliveryAgent = {
          name: updateData.deliveryAgentName,
          phone: updateData.deliveryAgentPhone,
        };
      }

      if (updateData.estimatedDeliveryDate) {
        payload.estimatedDeliveryDate = updateData.estimatedDeliveryDate;
      }

      await ordersAPI.updateStatus(selectedOrder._id, payload);
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === selectedOrder._id 
          ? { 
              ...order, 
              orderStatus: updateData.status,
              deliveryAgent: payload.deliveryAgent || order.deliveryAgent,
              estimatedDeliveryDate: payload.estimatedDeliveryDate || order.estimatedDeliveryDate
            } 
          : order
      ));
      
      setShowModal(false);
      alert('Order updated successfully!');
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    }
  };

  const filteredOrders = statusFilter 
    ? orders.filter(order => order.orderStatus === statusFilter) 
    : orders;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Shipped': return 'bg-blue-100 text-blue-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated || user?.email !== 'adminalok@gmail.com') return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Orders</h1>
          <p className="text-gray-600">View and update order statuses, delivery details</p>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setStatusFilter('')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === '' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Orders ({orders.length})
            </button>
            <button 
              onClick={() => setStatusFilter('Pending')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'Pending' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Pending ({orders.filter(o => o.orderStatus === 'Pending').length})
            </button>
            <button 
              onClick={() => setStatusFilter('Processing')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'Processing' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Processing ({orders.filter(o => o.orderStatus === 'Processing').length})
            </button>
            <button 
              onClick={() => setStatusFilter('Shipped')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'Shipped' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Shipped ({orders.filter(o => o.orderStatus === 'Shipped').length})
            </button>
            <button 
              onClick={() => setStatusFilter('Delivered')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'Delivered' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Delivered ({orders.filter(o => o.orderStatus === 'Delivered').length})
            </button>
            <button 
              onClick={() => setStatusFilter('Cancelled')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'Cancelled' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Cancelled ({orders.filter(o => o.orderStatus === 'Cancelled').length})
            </button>
          </div>
        </motion.div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{order._id.slice(-8).toUpperCase()}</div>
                        <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.shippingAddress?.fullName}</div>
                        <div className="text-xs text-gray-500">{order.shippingAddress?.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.items?.length || 0} item(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{order.grandTotal?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.deliveryAgent?.name ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.deliveryAgent.name}</div>
                            <div className="text-xs text-gray-500">{order.deliveryAgent.phone}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openUpdateModal(order)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders found</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Update Order Modal */}
      <AnimatePresence>
        {showModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Update Order</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Order Details */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-600">Order ID:</span> <span className="font-medium">#{selectedOrder._id.slice(-8).toUpperCase()}</span></div>
                    <div><span className="text-gray-600">Total:</span> <span className="font-medium">₹{selectedOrder.grandTotal?.toFixed(2)}</span></div>
                    <div><span className="text-gray-600">Customer:</span> <span className="font-medium">{selectedOrder.shippingAddress?.fullName}</span></div>
                    <div><span className="text-gray-600">Phone:</span> <span className="font-medium">{selectedOrder.shippingAddress?.phone}</span></div>
                  </div>
                  {selectedOrder.cancellation && (
                    <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-sm font-semibold text-red-900 mb-1">❌ Cancelled Order</p>
                      <p className="text-sm text-red-700"><strong>Reason:</strong> {selectedOrder.cancellation.reason}</p>
                      <p className="text-xs text-red-600 mt-1">
                        Cancelled by {selectedOrder.cancellation.cancelledBy} on {new Date(selectedOrder.cancellation.cancelledAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Update Form */}
                <form onSubmit={handleUpdateOrder} className="space-y-4">
                  {/* Order Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Status *</label>
                    <select
                      value={updateData.status}
                      onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Delivery Agent Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Agent Name</label>
                    <input
                      type="text"
                      value={updateData.deliveryAgentName}
                      onChange={(e) => setUpdateData({ ...updateData, deliveryAgentName: e.target.value })}
                      placeholder="Enter delivery agent name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Delivery Agent Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Agent Phone</label>
                    <input
                      type="tel"
                      value={updateData.deliveryAgentPhone}
                      onChange={(e) => setUpdateData({ ...updateData, deliveryAgentPhone: e.target.value })}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Estimated Delivery Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery Date</label>
                    <input
                      type="date"
                      value={updateData.estimatedDeliveryDate}
                      onChange={(e) => setUpdateData({ ...updateData, estimatedDeliveryDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                    >
                      Update Order
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;