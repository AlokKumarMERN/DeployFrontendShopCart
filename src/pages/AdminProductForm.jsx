import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { productsAPI, categoriesAPI } from '../api/api';

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    images: ['', ''],
    stock: '',
    featured: false,
    discountPercent: 0,
    sizes: [],
    replacementDays: 7,
    cashOnDelivery: true,
  });
  const [hasSizes, setHasSizes] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/profile');
      return;
    }
    fetchCategories();
    if (id) fetchProduct();
  }, [id, isAuthenticated, user, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getById(id);
      const product = response.data.data;
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        images: product.images && product.images.length > 0 ? product.images : ['', ''],
        stock: product.stock || '',
        featured: product.featured || false,
        discountPercent: product.discountPercent || 0,
        sizes: product.sizes || [],
        replacementDays: product.replacementDays ?? 7,
        cashOnDelivery: product.cashOnDelivery ?? true,
      });
      setHasSizes(product.sizes && product.sizes.length > 0);
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to load product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        images: formData.images.filter(img => img.trim() !== ''),
        featured: formData.featured,
        discountPercent: parseInt(formData.discountPercent) || 0,
        replacementDays: parseInt(formData.replacementDays) || 0,
        cashOnDelivery: formData.cashOnDelivery,
      };

      // If has sizes, add sizes array, otherwise add stock
      if (hasSizes && formData.sizes.length > 0) {
        dataToSend.sizes = formData.sizes.map(size => ({
          label: size.label,
          price: parseFloat(size.price),
          stock: parseInt(size.stock)
        }));
      } else {
        dataToSend.stock = formData.stock ? parseInt(formData.stock) : 0;
      }

      console.log('Sending data:', dataToSend);

      if (id) {
        await productsAPI.update(id, dataToSend);
        alert('Product updated successfully!');
      } else {
        await productsAPI.create(dataToSend);
        alert('Product created successfully!');
      }
      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to save product: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const removeImageField = (index) => {
    if (formData.images.length > 2) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData({ ...formData, images: newImages });
    }
  };

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setFormData({ ...formData, sizes: newSizes });
  };

  const addSize = () => {
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { label: '', price: '', stock: '' }]
    });
  };

  const removeSize = (index) => {
    const newSizes = formData.sizes.filter((_, i) => i !== index);
    setFormData({ ...formData, sizes: newSizes });
    if (newSizes.length === 0) {
      setHasSizes(false);
    }
  };

  const toggleSizes = () => {
    if (!hasSizes) {
      setFormData({ ...formData, sizes: [{ label: '', price: '', stock: '' }] });
    } else {
      setFormData({ ...formData, sizes: [] });
    }
    setHasSizes(!hasSizes);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const response = await categoriesAPI.create({ name: newCategory.trim() });
      setCategories([...categories, response.data.data]);
      setFormData({ ...formData, category: response.data.data.name });
      setNewCategory('');
      setShowCategoryModal(false);
      alert('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      alert(error.response?.data?.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    const confirmation = window.confirm(
      `Are you sure you want to delete "${categoryName}"?\n\nWARNING: All products in this category will also be permanently deleted!`
    );
    
    if (!confirmation) return;

    try {
      const response = await categoriesAPI.delete(categoryId);
      
      // Remove from local state
      setCategories(categories.filter(cat => cat._id !== categoryId));
      
      // Clear selected category if it was deleted
      if (formData.category === categoryName) {
        setFormData({ ...formData, category: '' });
      }
      
      const deletedCount = response.data.deletedProducts || 0;
      alert(`Category deleted successfully!\n${deletedCount} product(s) were also removed.`);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.message || 'Failed to delete category');
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{id ? 'Edit Product' : 'Add New Product'}</h1>
              <p className="text-gray-600">{id ? 'Update product details' : 'Create a new product listing'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
          >
            ← Back to Dashboard
          </button>
        </motion.div>
        
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Enter product name" />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Enter product description" />
            </div>

            {/* Category and Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <div className="flex gap-2">
                  <select id="category" name="category" value={formData.category} onChange={handleChange} required className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">Select Category</option>
                    {categories.map((category) => (<option key={category._id} value={category.name}>{category.name}</option>))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center"
                    title="Add New Category"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManageModal(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center"
                    title="Manage Categories"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="discountPercent" className="block text-sm font-medium text-gray-700 mb-2">Discount %</label>
                <input type="number" id="discountPercent" name="discountPercent" value={formData.discountPercent} onChange={handleChange} min="0" max="100" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="0" />
              </div>
            </div>

            {/* Product Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images * (Minimum 2)</label>
              <div className="space-y-3">
                {formData.images.map((image, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      required={index < 2}
                      placeholder={`Image URL ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {formData.images.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add More Images
                </button>
              </div>
            </div>

            {/* Size Variants Toggle */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
                  <p className="text-sm text-gray-600">Does this product have different sizes?</p>
                </div>
                <button
                  type="button"
                  onClick={toggleSizes}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasSizes ? 'bg-primary-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasSizes ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* If No Sizes - Show Price and Stock */}
              {!hasSizes && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                    <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="0.00" />
                  </div>
                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                    <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} required min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="0" />
                  </div>
                </div>
              )}

              {/* If Has Sizes - Show Size Variants */}
              {hasSizes && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Add different sizes with their own prices and stock levels</p>
                  {formData.sizes.map((size, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Size Variant {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeSize(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Size Label *</label>
                          <input
                            type="text"
                            value={size.label}
                            onChange={(e) => handleSizeChange(index, 'label', e.target.value)}
                            required
                            placeholder="e.g., Small, 100ml, XL"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                          <input
                            type="number"
                            value={size.price}
                            onChange={(e) => handleSizeChange(index, 'price', e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                          <input
                            type="number"
                            value={size.stock}
                            onChange={(e) => handleSizeChange(index, 'stock', e.target.value)}
                            required
                            min="0"
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSize}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Size Variant
                  </button>
                </div>
              )}
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center">
              <input type="checkbox" id="featured" name="featured" checked={formData.featured} onChange={handleChange} className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">Mark as Featured Product</label>
            </div>

            {/* Replacement Days & COD Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Replacement Days
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="replacementDays"
                    value={formData.replacementDays}
                    onChange={handleChange}
                    min="0"
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-gray-600">days</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Set to 0 for no replacement policy</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cashOnDelivery"
                  name="cashOnDelivery"
                  checked={formData.cashOnDelivery}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="cashOnDelivery" className="ml-2 block text-sm text-gray-700">
                  Cash on Delivery Available
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button type="button" onClick={() => navigate('/admin/products')} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3">{loading ? 'Saving...' : (id ? 'Update Product' : 'Create Product')}</button>
          </div>
        </motion.form>

        {/* Add Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Category</h2>
              <p className="text-gray-600 mb-4">Enter a name for the new product category.</p>
              
              <div className="mb-6">
                <label htmlFor="newCategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  id="newCategory"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="e.g., Electronics, Clothing"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategory('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                >
                  Add Category
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Manage Categories Modal */}
        {showManageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Manage Categories</h2>
                  <p className="text-gray-600 text-sm mt-1">Delete categories and their associated products</p>
                </div>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No categories available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                          <p className="text-sm text-gray-500">
                            Created {new Date(category.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(category._id, category.name)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowManageModal(false)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductForm;