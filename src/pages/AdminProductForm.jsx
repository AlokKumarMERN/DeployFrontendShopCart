import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../api/api';

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
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
  });
  const [hasSizes, setHasSizes] = useState(false);

  const categories = ['Perfumes', 'Gifts', 'Cosmetics', 'Toys', 'Bangles', 'Belts', 'Watches', 'Caps', 'Birthday Items'];

  useEffect(() => {
    if (!isAuthenticated || user?.email !== 'adminalok@gmail.com') {
      navigate('/profile');
      return;
    }
    if (id) fetchProduct();
  }, [id, isAuthenticated, user, navigate]);

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

  if (!isAuthenticated || user?.email !== 'adminalok@gmail.com') return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{id ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-gray-600">{id ? 'Update product details' : 'Create a new product listing'}</p>
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
                <select id="category" name="category" value={formData.category} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="">Select Category</option>
                  {categories.map((category) => (<option key={category} value={category}>{category}</option>))}
                </select>
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
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button type="button" onClick={() => navigate('/admin/products')} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3">{loading ? 'Saving...' : (id ? 'Update Product' : 'Create Product')}</button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default AdminProductForm;