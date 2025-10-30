import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productsAPI } from '../api/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getGoogleDriveImageUrl } from '../utils/imageHelper';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Reset quantity when selected size changes or when stock becomes unavailable
  useEffect(() => {
    if (selectedSize && selectedSize.stock === 0) {
      setQuantity(1);
    } else if (selectedSize && quantity > selectedSize.stock) {
      setQuantity(Math.max(1, selectedSize.stock));
    }
  }, [selectedSize]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(id);
      setProduct(response.data.data);
      
      // Set default size if sizes exist
      if (response.data.data.sizes?.length > 0) {
        setSelectedSize(response.data.data.sizes[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg" />
            <div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
              <div className="h-20 bg-gray-200 rounded mb-6" />
              <div className="h-12 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Product Not Found
          </h2>
          <button onClick={() => navigate('/shopping')} className="btn-primary">
            Back to Shopping
          </button>
        </div>
      </div>
    );
  }

  const currentPrice = selectedSize ? selectedSize.price : product.price;
  const discountedPrice = Math.round(
    currentPrice - (currentPrice * product.discountPercent) / 100
  );
  const savings = currentPrice - discountedPrice;

  // Calculate available stock - FIXED to properly check variant stock
  const availableStock = selectedSize 
    ? selectedSize.stock  // Use the selected variant's stock
    : product.sizes && product.sizes.length > 0
      ? product.sizes.reduce((total, size) => total + size.stock, 0) // Total of all variants
      : product.stock; // Use main stock if no variants

  const isOutOfStock = availableStock === 0 || (selectedSize && selectedSize.stock === 0);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      addToast('Product is out of stock', 'error');
      return;
    }
    setIsAdding(true);
    addToCart(product, quantity, selectedSize);
    addToast(`${quantity} ${product.name} added to cart!`, 'success');
    setTimeout(() => setIsAdding(false), 1500);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      addToast('Product is out of stock', 'error');
      return;
    }
    addToCart(product, quantity, selectedSize);
    addToast(`${quantity} ${product.name} added to cart!`, 'success');
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-8 bg-white rounded-lg shadow-lg p-6"
        >
          {/* Image Gallery */}
          <div>
            {/* Main Image */}
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4"
            >
              <img
                src={getGoogleDriveImageUrl(product.images[selectedImage])}
                alt={product.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/products/placeholder.svg';
                }}
              />
            </motion.div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-primary-600 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={getGoogleDriveImageUrl(image)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/products/placeholder.svg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-gray-600 mb-2">{product.category}</p>

              {/* Rating */}
              {product.averageRating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(product.averageRating)
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
                  <span className="text-gray-600">
                    {product.averageRating.toFixed(1)} ({product.totalReviews}{' '}
                    reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl font-bold text-primary-600">
                  ₹{discountedPrice}
                </span>
                {product.discountPercent > 0 && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{currentPrice}
                    </span>
                    <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                      {product.discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>

              {product.discountPercent > 0 && (
                <p className="text-green-600 font-medium mb-4">
                  You save ₹{savings}!
                </p>
              )}

              {/* Stock Availability */}
              <div className="mb-4">
                {isOutOfStock ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 font-semibold">
                      ⚠️ Out of Stock (0 items available)
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-700 font-medium">
                      ✓ In Stock ({availableStock} items available)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Size/Weight Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">
                  Select Size/Variant
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSize(size)}
                      disabled={size.stock === 0}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                        selectedSize?.label === size.label
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : size.stock === 0
                          ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-primary-400'
                      }`}
                    >
                      <div>{size.label}</div>
                      <div className="text-xs">₹{size.price}</div>
                      {size.stock > 0 ? (
                        <div className="text-xs text-green-600">{size.stock} in stock</div>
                      ) : (
                        <div className="text-xs text-red-500">Out of stock</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Quantity</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    disabled={quantity >= availableStock}
                    className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600">
                    (Max: {availableStock})
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isOutOfStock ? (
              <div className="flex gap-4 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    isAdding
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {isAdding ? '✓ Added to Cart' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition-colors"
                >
                  Buy Now (COD)
                </button>
              </div>
            ) : (
              <div className="mb-6">
                <button
                  disabled
                  className="w-full py-3 rounded-lg font-bold bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  Currently Unavailable
                </button>
                <p className="text-center text-sm text-gray-600 mt-2">
                  This item is out of stock. Please check back later.
                </p>
              </div>
            )}

            {/* Offers */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-green-800 mb-2">🎉 Special Offers</h3>
              <ul className="space-y-1 text-sm text-green-700">
                <li>✓ Cash on Delivery available</li>
                <li>✓ Free delivery on orders above ₹999</li>
                <li>✓ Easy returns within 7 days</li>
                {product.discountPercent > 0 && (
                  <li>✓ Get {product.discountPercent}% off on this product</li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Customer Reviews */}
        {product.reviews && product.reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
            <div className="space-y-4">
              {product.reviews.map((review, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
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
                    <span className="font-semibold">{review.userName}</span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
