import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productsAPI, categoriesAPI, filtersAPI } from '../api/api';
import ProductCard from '../components/ProductCard';
import ProductFilters from '../components/ProductFilters';

const Shopping = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [customFilters, setCustomFilters] = useState([]);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    priceRange: '',
    sortBy: '',
    discount: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchAllProducts();
    fetchCustomFilters();
  }, []);

  // Update filters when URL category changes
  useEffect(() => {
    const category = searchParams.get('category');
    if (category !== filters.category) {
      setFilters(prev => ({ ...prev, category: category || '' }));
    }
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      const categoryNames = response.data.data.map(cat => cat.name);
      setCategories(categoryNames);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([
        'Perfumes',
        'Gifts',
        'Cosmetics',
        'Toys',
        'Bangles',
        'Belts',
        'Watches',
        'Caps',
        'Birthday Items',
      ]);
    }
  };

  const fetchCustomFilters = async () => {
    try {
      const response = await filtersAPI.getAll();
      setCustomFilters(response.data.data || []);
    } catch (error) {
      console.error('Error fetching custom filters:', error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll({ limit: 200 });
      setAllProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Update URL if category changes
    if (newFilters.category) {
      setSearchParams({ category: newFilters.category });
    } else {
      setSearchParams({});
    }
  };

  // Apply filters and sorting to products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Filter by category
    if (filters.category) {
      result = result.filter(p => p.category === filters.category);
    }

    // Filter by price range
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      result = result.filter(p => {
        const price = p.price - (p.price * (p.discountPercent || 0)) / 100;
        return price >= min && price <= max;
      });
    }

    // Filter by discount
    if (filters.discount) {
      const minDiscount = parseInt(filters.discount);
      result = result.filter(p => (p.discountPercent || 0) >= minDiscount);
    }

    // Apply custom filters from admin
    customFilters.forEach(customFilter => {
      const filterValue = filters[customFilter.key];
      if (filterValue) {
        result = result.filter(p => {
          const productField = p[customFilter.productField];
          if (Array.isArray(productField)) {
            // If product field is an array (like tags), check if it includes the value
            return productField.some(v => v.toLowerCase() === filterValue.toLowerCase());
          } else if (typeof productField === 'string') {
            // If product field is a string, do case-insensitive match
            return productField.toLowerCase() === filterValue.toLowerCase();
          }
          return false;
        });
      }
    });

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => {
          const priceA = a.price - (a.price * (a.discountPercent || 0)) / 100;
          const priceB = b.price - (b.price * (b.discountPercent || 0)) / 100;
          return priceA - priceB;
        });
        break;
      case 'price_desc':
        result.sort((a, b) => {
          const priceA = a.price - (a.price * (a.discountPercent || 0)) / 100;
          const priceB = b.price - (b.price * (b.discountPercent || 0)) / 100;
          return priceB - priceA;
        });
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'popular':
        result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      case 'discount':
        result.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
        break;
      default:
        break;
    }

    return result;
  }, [allProducts, filters, customFilters]);

  // Group filtered products by category for display
  const groupedProducts = useMemo(() => {
    if (filters.category) {
      return null; // Don't group when specific category is selected
    }
    
    const grouped = {};
    categories.forEach(category => {
      const categoryProducts = filteredProducts.filter(p => p.category === category);
      if (categoryProducts.length > 0) {
        grouped[category] = categoryProducts;
      }
    });
    return grouped;
  }, [filteredProducts, categories, filters.category]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
          <div className="flex gap-6">
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-gray-200 rounded-lg h-96 animate-pulse" />
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {filters.category || 'Shop All Products'}
          </h1>
          <p className="text-gray-600">
            {filteredProducts.length} products found
            {filters.category && ` in ${filters.category}`}
          </p>
        </motion.div>

        {/* Main Content with Filters */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <ProductFilters
            categories={categories}
            onFilterChange={handleFilterChange}
            initialFilters={filters}
            customFilters={customFilters}
          />

          {/* Products Grid */}
          <div className="flex-1">
            {filters.category || Object.values(filters).some(v => v !== '') ? (
              // Flat grid when filters are applied
              <>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-600 text-lg">No products match your filters</p>
                    <button
                      onClick={() => handleFilterChange({ category: '', priceRange: '', sortBy: '', discount: '' })}
                      className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: { staggerChildren: 0.03 },
                      },
                    }}
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  >
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product._id}
                        variants={{
                          hidden: { opacity: 0, scale: 0.9 },
                          visible: { opacity: 1, scale: 1 },
                        }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            ) : (
              // Grouped by category when no filters
              <>
                {Object.keys(groupedProducts || {}).length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-600 text-lg">No products available</p>
                  </div>
                ) : (
                  Object.entries(groupedProducts || {}).map(([category, products], index) => (
                    <motion.section
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="mb-10"
                    >
                      {/* Category Header */}
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                        <button
                          onClick={() => handleFilterChange({ ...filters, category })}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                        >
                          View All ({products.length})
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Products Grid - Show first 8 */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.slice(0, 8).map((product) => (
                          <ProductCard key={product._id} product={product} />
                        ))}
                      </div>
                    </motion.section>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shopping;
