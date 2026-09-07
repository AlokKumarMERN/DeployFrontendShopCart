import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { deliveryBoysAPI } from '../api/api';
import { useToast } from '../context/ToastContext';

const AdminDeliveryBoys = () => {
  const { addToast } = useToast();
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBoy, setEditingBoy] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    vehicleType: 'Bike',
    vehicleNumber: '',
    isActive: true,
  });

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const fetchDeliveryBoys = async () => {
    try {
      setLoading(true);
      const response = await deliveryBoysAPI.getAll();
      setDeliveryBoys(response.data.data);
    } catch (error) {
      console.error('Error fetching delivery boys:', error);
      addToast('Failed to load delivery boys', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBoy) {
        await deliveryBoysAPI.update(editingBoy._id, formData);
        addToast('Delivery boy updated successfully', 'success');
      } else {
        await deliveryBoysAPI.create(formData);
        addToast('Delivery boy added successfully', 'success');
      }
      setShowModal(false);
      resetForm();
      fetchDeliveryBoys();
    } catch (error) {
      console.error('Error saving delivery boy:', error);
      addToast(error.response?.data?.message || 'Failed to save delivery boy', 'error');
    }
  };

  const handleEdit = (boy) => {
    setEditingBoy(boy);
    setFormData({
      name: boy.name,
      phone: boy.phone,
      email: boy.email,
      address: boy.address,
      city: boy.city,
      state: boy.state,
      vehicleType: boy.vehicleType,
      vehicleNumber: boy.vehicleNumber,
      isActive: boy.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this delivery boy?')) return;
    
    try {
      await deliveryBoysAPI.delete(id);
      addToast('Delivery boy deleted successfully', 'success');
      fetchDeliveryBoys();
    } catch (error) {
      console.error('Error deleting delivery boy:', error);
      addToast(error.response?.data?.message || 'Failed to delete delivery boy', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      vehicleType: 'Bike',
      vehicleNumber: '',
      isActive: true,
    });
    setEditingBoy(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Delivery Boys</h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary"
          >
            + Add Delivery Boy
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {deliveryBoys.map((boy) => (
              <motion.div
                key={boy._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{boy.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        boy.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {boy.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ID: {boy.deliveryBoyId}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span> {boy.phone}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Email:</span> {boy.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Address:</span> {boy.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Location:</span> {boy.city}, {boy.state}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Vehicle:</span> {boy.vehicleType}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Vehicle No:</span> {boy.vehicleNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Total Deliveries:</span> {boy.totalDeliveries}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Assigned Orders:</span> {boy.assignedOrders?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(boy)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(boy._id)}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {deliveryBoys.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600">No delivery boys found. Add one to get started!</p>
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
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-4">
                {editingBoy ? 'Edit Delivery Boy' : 'Add Delivery Boy'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone *"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                />

                <input
                  type="text"
                  placeholder="Address *"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="Bike">Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Car">Car</option>
                    <option value="Van">Van</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Vehicle Number *"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

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
                    {editingBoy ? 'Update' : 'Add'} Delivery Boy
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

export default AdminDeliveryBoys;
