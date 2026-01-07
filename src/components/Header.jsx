import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productsAPI } from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { getGoogleDriveImageUrl } from '../utils/imageHelper';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getCartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const debounceTimer = useRef(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target) &&
          mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search - starts from 1 character
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim().length >= 1) {
      debounceTimer.current = setTimeout(async () => {
        try {
          const response = await productsAPI.search(searchQuery);
          setSearchResults(response.data.data);
          setShowSearchResults(true);
        } catch (error) {
          console.error('Search error:', error);
        }
      }, 200);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const handleSearchResultClick = (productId) => {
    setShowSearchResults(false);
    setSearchQuery('');
    // Scroll to top when navigating to product
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    navigate(`/product/${productId}`);
  };

  const cartCount = getCartCount();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0" onClick={() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          }}>
            <img
              src="https://i.ibb.co/tpNrNrTp/alokgeneralstorelogo.png"
              alt="Logo"
              className="h-9 w-13 object-contain rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/logo/logo.svg';
              }}
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-primary-700">
                Alok General Store
              </h1>
              <p className="text-xs text-gray-600">Your Shopping Destination</p>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-xl relative" ref={searchRef}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50"
                >
                  <div className="px-3 py-2 border-b bg-gray-50">
                    <p className="text-xs text-gray-500">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                    </p>
                  </div>
                  {searchResults.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => handleSearchResultClick(product._id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    >
                      <img
                        src={getGoogleDriveImageUrl(product.images[0])}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/products/placeholder.svg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                        {product.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {product.description.substring(0, 50)}...
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-primary-600">
                          ₹
                          {Math.round(
                            product.price -
                              (product.price * product.discountPercent) / 100
                          )}
                        </p>
                        {product.discountPercent > 0 && (
                          <p className="text-xs text-gray-500 line-through">
                            ₹{product.price}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
              {showSearchResults && searchResults.length === 0 && searchQuery.trim().length >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50"
                >
                  <p className="text-sm text-gray-500 text-center">No products found for "{searchQuery}"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 font-medium transition-all duration-300 hover:scale-110 relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              to="/shopping"
              className="text-gray-700 hover:text-primary-600 font-medium transition-all duration-300 hover:scale-110 relative group"
            >
              Shopping
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-primary-600 font-medium transition-all duration-300 hover:scale-110 relative group"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              to="/profile"
              className="text-gray-700 hover:text-primary-600 font-medium transition-all duration-300 hover:scale-110 relative group"
            >
              Profile
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/cart" className="relative group">
              <svg
                className="w-6 h-6 text-gray-700 hover:text-primary-600 transition-all duration-300 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {/* User Login Indicator - Show for both logged in and not logged in */}
            <div className="flex items-center gap-2 pl-4 border-l border-gray-300">
              {isAuthenticated && user ? (
                <Link to="/profile" className="flex items-center hover:opacity-80 transition-all duration-300 hover:scale-110" title={user.name}>
                  <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </Link>
              ) : (
                <Link to="/login" className="flex items-center hover:opacity-80 transition-all duration-300 hover:scale-110" title="Login">
                  <svg
                    className="w-8 h-8 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile Profile Button - Direct link to profile */}
          {isAuthenticated && user ? (
            <Link
              to="/profile"
              className="lg:hidden flex items-center"
              title={user.name}
            >
              <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </Link>
          ) : (
            <Link
              to="/login"
              className="lg:hidden"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>
          )}
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4 relative" ref={mobileSearchRef}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Mobile Search Results Dropdown */}
          <AnimatePresence>
            {showSearchResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50"
              >
                <div className="px-3 py-2 border-b bg-gray-50">
                  <p className="text-xs text-gray-500">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                </div>
                {searchResults.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => handleSearchResultClick(product._id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                  >
                    <img
                      src={getGoogleDriveImageUrl(product.images[0])}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/products/placeholder.svg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                      {product.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {product.description.substring(0, 40)}...
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-primary-600">
                        ₹
                        {Math.round(
                          product.price -
                            (product.price * product.discountPercent) / 100
                        )}
                      </p>
                      {product.discountPercent > 0 && (
                        <p className="text-xs text-gray-500 line-through">
                          ₹{product.price}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
            {showSearchResults && searchResults.length === 0 && searchQuery.trim().length >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50"
              >
                <p className="text-sm text-gray-500 text-center">No products found for "{searchQuery}"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
