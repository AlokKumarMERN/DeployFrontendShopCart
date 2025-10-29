import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { productsAPI } from '../api/api';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);

  const offerBanners = [
    {
      title: 'Mega Sale!',
      subtitle: 'Up to 50% off on all perfumes',
      bg: 'bg-gradient-to-r from-purple-600 to-pink-600',
    },
    {
      title: 'New Arrivals',
      subtitle: 'Check out our latest collection',
      bg: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    },
    {
      title: 'Gift Season',
      subtitle: 'Perfect gifts for your loved ones',
      bg: 'bg-gradient-to-r from-orange-600 to-red-600',
    },
    {
      title: 'Special Offers',
      subtitle: 'Free delivery on orders above ₹999',
      bg: 'bg-gradient-to-r from-green-600 to-teal-600',
    },
  ];

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  // Auto-rotate offer banners
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % offerBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching featured products...');
      const response = await productsAPI.getAll({ featured: true, limit: 18 });
      console.log('Featured products response:', response.data);
      console.log('Number of products:', response.data.data?.length);
      setFeaturedProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[30vh] bg-gradient-to-r from-primary-700 via-primary-600 to-secondary-600 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('/images/hero-pattern.png')] bg-repeat opacity-30" />
        </div>
        <div className="container-custom h-full flex items-center justify-center relative z-10">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-center text-white"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Welcome to Alok General Store
            </h1>
            <p className="text-xl md:text-2xl mb-6 opacity-90">
              Your Trusted Shopping Destination
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/shopping'}
              className="bg-white text-primary-600 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Shop Now
            </motion.button>
          </motion.div>
        </div>

        {/* Animated circles */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-10 right-10 w-32 h-32 bg-white opacity-10 rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute bottom-10 left-10 w-24 h-24 bg-white opacity-10 rounded-full"
        />
      </motion.section>

      {/* Offer Banners Slider */}
      <section className="bg-white py-8">
        <div className="container-custom">
          <div className="relative overflow-hidden rounded-xl">
            <motion.div
              className="flex"
              animate={{ x: `-${currentBanner * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              {offerBanners.map((banner, index) => (
                <div
                  key={index}
                  className={`min-w-full ${banner.bg} text-white py-12 px-6 text-center`}
                >
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-4xl font-bold mb-2"
                  >
                    {banner.title}
                  </motion.h2>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg md:text-xl opacity-90"
                  >
                    {banner.subtitle}
                  </motion.p>
                </div>
              ))}
            </motion.div>

            {/* Banner indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {offerBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentBanner
                      ? 'bg-white w-6'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Horizontal Sliding Offer Cards */}
          <div className="mt-8 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-4">
              {offerBanners.slice(0, 4).map((banner, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex-shrink-0 w-[300px] ${banner.bg} text-white rounded-lg p-6 shadow-lg`}
                >
                  <h3 className="text-2xl font-bold mb-2">{banner.title}</h3>
                  <p className="opacity-90">{banner.subtitle}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Featured Products
            </h2>
            <p className="text-gray-600 text-lg">
              Handpicked items just for you
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(18)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            >
              {featuredProducts.map((product) => (
                <motion.div
                  key={product._id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && featuredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No featured products available</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-10"
          >
            Why Shop With Us?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '🚚',
                title: 'Fast Delivery',
                desc: 'Quick and reliable shipping',
              },
              {
                icon: '💳',
                title: 'Cash on Delivery',
                desc: 'Pay when you receive',
              },
              {
                icon: '🔒',
                title: 'Secure Shopping',
                desc: 'Your data is safe with us',
              },
              {
                icon: '⭐',
                title: 'Quality Products',
                desc: '100% authentic items',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="text-center p-6 card"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
