import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { getGoogleDriveImageUrl } from '../utils/imageHelper';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const discountedPrice = parseFloat((
    product.price - (product.price * product.discountPercent) / 100
  ).toFixed(2));

  // Calculate total stock
  const totalStock = product.sizes && product.sizes.length > 0
    ? product.sizes.reduce((total, size) => total + size.stock, 0)
    : product.stock;

  const isOutOfStock = totalStock === 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    
    if (isOutOfStock) {
      addToast('Product is out of stock', 'error');
      return;
    }
    
    // If product has size variants, redirect to detail page to select variant
    if (product.sizes && product.sizes.length > 0) {
      addToast('Please select size/variant', 'info');
      navigate(`/product/${product._id}`);
      return;
    }
    
    setIsAdding(true);
    
    try {
      addToCart(product, 1);
      addToast(`${product.name} added to cart!`, 'success');
    } catch (error) {
      console.error('Error adding to cart:', error);
      addToast('Failed to add to cart', 'error');
    }
    
    setTimeout(() => {
      setIsAdding(false);
    }, 1500);
  };

  const handleClick = () => {
    navigate(`/product/${product._id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="card overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={getGoogleDriveImageUrl(product.images[0])}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          loading="lazy"
          crossOrigin="anonymous"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/products/placeholder.svg';
          }}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg">
              OUT OF STOCK
            </span>
          </div>
        )}
        {!isOutOfStock && product.discountPercent > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {product.discountPercent}% OFF
          </div>
        )}
        {!isOutOfStock && product.featured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded">
            ★ Featured
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2">{product.category}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(product.averageRating || 0)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-600">
            {product.averageRating ? `${product.averageRating.toFixed(1)}` : '0.0'} ({product.totalReviews || 0})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-primary-600">
            ₹{discountedPrice.toFixed(2)}
          </span>
          {product.discountPercent > 0 && (
            <span className="text-sm text-gray-500 line-through">
              ₹{parseFloat(product.price).toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          className={`w-full py-2 rounded-lg font-medium transition-all ${
            isOutOfStock
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isAdding
              ? 'bg-green-500 text-white'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {isOutOfStock ? (
            'Out of Stock'
          ) : isAdding ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Added!
            </span>
          ) : product.sizes && product.sizes.length > 0 ? (
            'Select Options'
          ) : (
            'Add to Cart'
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
