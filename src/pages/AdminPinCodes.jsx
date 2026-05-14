import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pinCodesAPI } from '../api/api';
import { useToast } from '../context/ToastContext';

const AdminPinCodes = () => {
  const { addToast } = useToast();
  const [pinCodes, setPinCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPinCode, setEditingPinCode] = useState(null);
  const [formData, setFormData] = useState({
    pinCode: '',
    city: '',
    state: '',
    exactDeliveryAvailable: true,
    estimatedDeliveryDays: 3,
    exactDeliveryCharges: 0,
    normalDeliveryCharges: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchPinCodes();
  }, []);

  const fetchPinCodes = async () => {
    try {
      setLoading(true);
      const response = await pinCodesAPI.getAll();
      setPinCodes(response.data.data);
    } catch (error) {
      console.error('Error fetching pin codes:', error);
      addToast('Failed to load pin codes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPinCode) {
        await pinCodesAPI.update(editingPinCode._id, formData);
        addToast('Pin code updated successfully', 'success');
      } else {
        await pinCodesAPI.create(formData);
        addToast('Pin code added successfully', 'success');
      }
      setShowModal(false);
      resetForm();
      fetchPinCodes();
    } catch (error) {
      console.error('Error saving pin code:', error);
      addToast(error.response?.data?.message || 'Failed to save pin code', 'error');
    }
  };

  const handleEdit = (pinCode) => {
    setEditingPinCode(pinCode);
    setFormData({
      pinCode: pinCode.pinCode,
      city: pinCode.city,
      state: pinCode.state,
      exactDeliveryAvailable: pinCode.exactDeliveryAvailable,
      estimatedDeliveryDays: pinCode.estimatedDeliveryDays,
      exactDeliveryCharges: pinCode.exactDeliveryCharges,
      normalDeliveryCharges: pinCode.normalDeliveryCharges,
      isActive: pinCode.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this pin code?')) return;
    
    try {
      await pinCodesAPI.delete(id);
      addToast('Pin code deleted successfully', 'success');
      fetchPinCodes();
    } catch (error) {
      console.error('Error deleting pin code:', error);
      addToast(error.response?.data?.message || 'Failed to delete pin code', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      pinCode: '',
      city: '',
      state: '',
      exactDeliveryAvailable: true,
      estimatedDeliveryDays: 3,
      exactDeliveryCharges: 0,
      normalDeliveryCharges: 0,
      isActive: true,
    });
    setEditingPinCode(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pin Codes Management</h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary"
          >
            + Add Pin Code
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pin Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exact Delivery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Charges
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pinCodes.map((pinCode) => (
                    <tr key={pinCode._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{pinCode.pinCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{pinCode.city}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{pinCode.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          pinCode.exactDeliveryAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pinCode.exactDeliveryAvailable ? 'Available' : 'Not Available'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pinCode.estimatedDeliveryDays} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>Normal: ₹{pinCode.normalDeliveryCharges}</div>
                        <div>Exact: ₹{pinCode.exactDeliveryCharges}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          pinCode.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {pinCode.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(pinCode)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pinCode._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {pinCodes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No pin codes found. Add one to get started!</p>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-4">
                {editingPinCode ? 'Edit Pin Code' : 'Add Pin Code'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Pin Code *"
                  value={formData.pinCode}
                  onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                  className="input-field"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  disabled={!!editingPinCode}
                  required
                />

                <input
                  type="text"
                  placeholder="City *"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input-field"
                  required
                />

                <input
                  type="text"
                  placeholder="State *"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="input-field"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Delivery Days
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedDeliveryDays}
                    onChange={(e) => setFormData({ ...formData, estimatedDeliveryDays: parseInt(e.target.value) })}
                    className="input-field"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Normal Delivery Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.normalDeliveryCharges}
                    onChange={(e) => setFormData({ ...formData, normalDeliveryCharges: parseFloat(e.target.value) })}
                    className="input-field"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exact Delivery Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.exactDeliveryCharges}
                    onChange={(e) => setFormData({ ...formData, exactDeliveryCharges: parseFloat(e.target.value) })}
                    className="input-field"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.exactDeliveryAvailable}
                    onChange={(e) => setFormData({ ...formData, exactDeliveryAvailable: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Exact Delivery Available</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingPinCode ? 'Update' : 'Add'} Pin Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
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

export default AdminPinCodes;
