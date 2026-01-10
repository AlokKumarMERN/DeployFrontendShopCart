import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { filtersAPI } from '../api/api';
import { useToast } from '../context/ToastContext';

// Inline SVG icons
const FiArrowLeft = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const FiPlus = ({ size = 20 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

const FiX = ({ size = 20 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FiCheck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const FiChevronDown = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const FiChevronUp = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const AdminFilters = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);
  const [expandedFilter, setExpandedFilter] = useState(null);
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    key: '',
    type: 'radio',
    productField: 'tags',
    isActive: true,
    order: 0,
  });

  const [newOption, setNewOption] = useState({ label: '', value: '' });

  useEffect(() => {
    fetchFilters();

    // Auto-refresh every 10 seconds
    const intervalId = setInterval(() => {
      fetchFilters();
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchFilters = async () => {
    try {
      setLoading(true);
      const response = await filtersAPI.getAllAdmin();
      setFilters(response.data.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
      showError('Failed to load filters');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingFilter(null);
    setFormData({
      name: '',
      key: '',
      type: 'radio',
      productField: 'tags',
      isActive: true,
      order: filters.length,
    });
    setShowModal(true);
  };

  const openEditModal = (filter) => {
    setEditingFilter(filter);
    setFormData({
      name: filter.name,
      key: filter.key,
      type: filter.type,
      productField: filter.productField,
      isActive: filter.isActive,
      order: filter.order,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFilter) {
        await filtersAPI.update(editingFilter._id, formData);
        showSuccess('Filter updated successfully');
      } else {
        await filtersAPI.create(formData);
        showSuccess('Filter created successfully');
      }
      setShowModal(false);
      fetchFilters();
    } catch (error) {
      console.error('Error saving filter:', error);
      showError(error.response?.data?.message || 'Failed to save filter');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this filter?')) return;
    
    try {
      await filtersAPI.delete(id);
      showSuccess('Filter deleted successfully');
      fetchFilters();
    } catch (error) {
      console.error('Error deleting filter:', error);
      showError('Failed to delete filter');
    }
  };

  const handleToggleActive = async (filter) => {
    try {
      await filtersAPI.update(filter._id, { isActive: !filter.isActive });
      showSuccess(`Filter ${filter.isActive ? 'disabled' : 'enabled'}`);
      fetchFilters();
    } catch (error) {
      console.error('Error toggling filter:', error);
      showError('Failed to update filter');
    }
  };

  const handleAddOption = async (filterId) => {
    if (!newOption.label || !newOption.value) {
      showError('Please fill in both label and value');
      return;
    }

    try {
      await filtersAPI.addOption(filterId, newOption);
      showSuccess('Option added successfully');
      setNewOption({ label: '', value: '' });
      fetchFilters();
    } catch (error) {
      console.error('Error adding option:', error);
      showError(error.response?.data?.message || 'Failed to add option');
    }
  };

  const handleRemoveOption = async (filterId, optionId) => {
    try {
      await filtersAPI.removeOption(filterId, optionId);
      showSuccess('Option removed successfully');
      fetchFilters();
    } catch (error) {
      console.error('Error removing option:', error);
      showError('Failed to remove option');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Filters</h1>
          <p className="text-gray-600">Manage custom filters for the shopping page</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus /> Add Filter
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Filters List */}
      <div className="space-y-4">
        {filters.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">No custom filters yet</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Create your first filter
            </button>
          </div>
        ) : (
          filters.map((filter) => (
            <motion.div
              key={filter._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border shadow-sm overflow-hidden"
            >
              {/* Filter Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setExpandedFilter(expandedFilter === filter._id ? null : filter._id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedFilter === filter._id ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                  <div>
                    <h3 className="font-semibold text-gray-900">{filter.name}</h3>
                    <p className="text-sm text-gray-500">
                      Key: {filter.key} | Field: {filter.productField} | Options: {filter.options?.length || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(filter)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      filter.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {filter.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => openEditModal(filter)}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDelete(filter._id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              {/* Expanded Options Section */}
              {expandedFilter === filter._id && (
                <div className="border-t bg-gray-50 p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Filter Options</h4>
                  
                  {/* Existing Options */}
                  <div className="space-y-2 mb-4">
                    {filter.options?.length === 0 ? (
                      <p className="text-sm text-gray-500">No options added yet</p>
                    ) : (
                      filter.options?.map((option) => (
                        <div
                          key={option._id}
                          className="flex items-center justify-between bg-white p-2 rounded border"
                        >
                          <span className="text-sm">
                            <strong>{option.label}</strong>
                            <span className="text-gray-500 ml-2">({option.value})</span>
                          </span>
                          <button
                            onClick={() => handleRemoveOption(filter._id, option._id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add New Option */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Label (e.g., 'Red')"
                      value={newOption.label}
                      onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g., 'red')"
                      value={newOption.value}
                      onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded text-sm"
                    />
                    <button
                      onClick={() => handleAddOption(filter._id)}
                      className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm flex items-center gap-1"
                    >
                      <FiPlus size={16} /> Add
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">
                {editingFilter ? 'Edit Filter' : 'Create New Filter'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Color, Size, Brand"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Key
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., color, size, brand"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier (lowercase, no spaces)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Field to Filter
                </label>
                <select
                  value={formData.productField}
                  onChange={(e) => setFormData({ ...formData, productField: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="tags">Tags</option>
                  <option value="brand">Brand</option>
                  <option value="color">Color</option>
                  <option value="material">Material</option>
                  <option value="category">Category</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Which product field this filter will match against</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active (visible on shopping page)
                </label>
              </div>

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
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
                >
                  <FiCheck /> {editingFilter ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminFilters;
