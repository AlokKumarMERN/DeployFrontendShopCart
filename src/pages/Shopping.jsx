import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productsAPI } from '../api/api';
import ProductCard from '../components/ProductCard';

const Shopping = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  const categories = [
    'Perfumes',
    'Gifts',
    'Cosmetics',
    'Toys',
    'Bangles',
    'Belts',
    'Watches',
    'Caps',
    'Birthday Items',
  ];

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      fetchProductsByCategory(category);
    } else {
      fetchAllProducts();
    }
  }, [searchParams]);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const categoryData = {};

      console.log('Fetching products for all categories...');
      
      // Fetch initial products for each category (limit 12 for better display)
      await Promise.all(
        categories.map(async (category) => {
          const response = await productsAPI.getByCategory(category, 12);
          console.log(`${category}:`, response.data.data?.length, 'products');
          categoryData[category] = {
            products: response.data.data,
            total: response.data.total,
            hasMore: response.data.hasMore,
          };
        })
      );

      console.log('All category products:', categoryData);
      setCategoryProducts(categoryData);
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByCategory = async (category) => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll({ category, limit: 50 });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = async (category) => {
    try {
      const response = await productsAPI.getByCategory(category, 100);
      setCategoryProducts((prev) => ({
        ...prev,
        [category]: {
          products: response.data.data,
          total: response.data.total,
          hasMore: false,
        },
      }));
      setExpandedCategories((prev) => ({ ...prev, [category]: true }));
    } catch (error) {
      console.error('Error loading more products:', error);
    }
  };

  const selectedCategory = searchParams.get('category');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
    );
  }

  // If specific category selected
  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedCategory}
            </h1>
            <p className="text-gray-600">{products.length} products found</p>
          </motion.div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No products found in this category
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {products.map((product) => (
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
        </div>
      </div>
    );
  }

  // All categories view
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Shop by Category
          </h1>
          <p className="text-gray-600">Explore our wide range of products</p>
        </motion.div>

        {/* Category Sections */}
        {categories.map((category, index) => {
          const categoryData = categoryProducts[category];
          if (!categoryData || categoryData.products.length === 0) return null;

          return (
            <motion.section
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="mb-12"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                <button
                  onClick={() =>
                    (window.location.href = `/shopping?category=${category}`)
                  }
                  className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  View All
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {categoryData.products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* More Button */}
              {categoryData.hasMore && !expandedCategories[category] && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => loadMoreProducts(category)}
                    className="btn-secondary"
                  >
                    More from {category}
                  </button>
                </div>
              )}
            </motion.section>
          );
        })}

        {Object.keys(categoryProducts).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shopping;
