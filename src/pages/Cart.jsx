import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, productsAPI, couponsAPI, pinCodesAPI } from '../api/api';
import { useToast } from '../context/ToastContext';
import { getGoogleDriveImageUrl } from '../utils/imageHelper';
import LocationPicker from '../components/LocationPicker';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } =
    useCart();
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const [productsStock, setProductsStock] = useState({});
  const [loadingStock, setLoadingStock] = useState(true);
  
  // Exact delivery states
  const [exactDeliveryAvailable, setExactDeliveryAvailable] = useState(false);
  const [useExactDelivery, setUseExactDelivery] = useState(false);
  const [checkingPinCode, setCheckingPinCode] = useState(false);
  const [pinCodeInfo, setPinCodeInfo] = useState(null);
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    houseNo: '',
    colony: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: '',
    longitude: '',
  });

  // Handle location detection for address
  const handleLocationSelect = (locationData) => {
    console.log('📍 Location detected in Cart:', locationData);
    setAddress(prev => {
      const updated = {
        ...prev,
        city: locationData.city || prev.city,
        state: locationData.state || prev.state,
        zipCode: locationData.zipCode || prev.zipCode,
        addressLine1: locationData.streetAddress || prev.addressLine1,
        latitude: locationData.latitude || prev.latitude,
        longitude: locationData.longitude || prev.longitude,
      };
      console.log('✅ Cart address updated:', updated);
      
      // Check pin code availability if zipCode is updated
      if (locationData.zipCode) {
        checkPinCodeAvailability(locationData.zipCode);
      }
      
      return updated;
    });
  };

  // Check if pin code supports exact delivery
  const checkPinCodeAvailability = async (pincode) => {
    if (!pincode || pincode.length < 6) {
      setExactDeliveryAvailable(false);
      setPinCodeInfo(null);
      return;
    }

    try {
      setCheckingPinCode(true);
      const response = await pinCodesAPI.check(pincode);
      
      if (response.data.success && response.data.data.exactDeliveryAvailable) {
        setExactDeliveryAvailable(true);
        setPinCodeInfo(response.data.data);
      } else {
        setExactDeliveryAvailable(false);
        setPinCodeInfo(null);
        setUseExactDelivery(false);
      }
    } catch (error) {
      console.error('Error checking pin code:', error);
      setExactDeliveryAvailable(false);
      setPinCodeInfo(null);
    } finally {
      setCheckingPinCode(false);
    }
  };

  // Auto-close thank you modal after 2 seconds and redirect
  useEffect(() => {
    if (showThankYouModal) {
      const timer = setTimeout(() => {
        setShowThankYouModal(false);
        setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          navigate('/shopping');
        }, 300); // Wait for modal exit animation
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showThankYouModal, navigate]);

  // Fetch real-time stock data for cart items
  useEffect(() => {
    const fetchProductsStock = async () => {
      if (cartItems.length === 0) {
        setLoadingStock(false);
        return;
      }

      try {
        setLoadingStock(true);
        const stockData = {};
        
        // Fetch each product's current data from database
        await Promise.all(
          cartItems.map(async (item) => {
            try {
              const response = await productsAPI.getById(item._id);
              const product = response.data.data;
              
              // Store stock info based on whether item has size variant
              if (item.selectedSize && item.selectedSize.label) {
                // Find the specific size variant stock
                const sizeVariant = product.sizes?.find(s => s.label === item.selectedSize.label);
                stockData[`${item._id}-${item.selectedSize.label}`] = {
                  stock: sizeVariant ? sizeVariant.stock : 0,
                  price: sizeVariant ? sizeVariant.price : product.price,
                  name: product.name,
                  hasVariants: true,
                  variantLabel: item.selectedSize.label,
                };
              } else {
                // No size variant, use main product stock
                stockData[item._id] = {
                  stock: product.stock || 0,
                  availableSizes: product.sizes || [],
                  price: product.price,
                  name: product.name,
                  hasVariants: false,
                };
              }
            } catch (error) {
              console.error(`Error fetching product ${item._id}:`, error);
              const key = item.selectedSize ? `${item._id}-${item.selectedSize.label}` : item._id;
              stockData[key] = {
                stock: 0,
                price: item.price,
                name: item.name,
                hasVariants: !!item.selectedSize,
              };
            }
          })
        );
        
        setProductsStock(stockData);
        setLoadingStock(false);
      } catch (error) {
        console.error('Error fetching products stock:', error);
        setLoadingStock(false);
      }
    };

    fetchProductsStock();
  }, [cartItems.length]);

  const itemsTotal = parseFloat(getCartTotal().toFixed(2));
  const deliveryFee = itemsTotal >= 999 ? 0 : 50;
  const otherCharges = 0;
  const grandTotal = parseFloat((itemsTotal + deliveryFee + otherCharges - couponDiscount).toFixed(2));

  // Apply coupon handler
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      addToast('Please enter a coupon code', 'error');
      return;
    }

    try {
      setApplyingCoupon(true);
      const response = await couponsAPI.apply(couponCode, itemsTotal);
      
      if (response.data.success) {
        setAppliedCoupon(response.data.data);
        setCouponDiscount(response.data.data.discount);
        addToast(`Coupon applied! You saved ₹${response.data.data.discount}`, 'success');
      }
    } catch (error) {
      console.error('Coupon error:', error);
      addToast(error.response?.data?.message || 'Invalid coupon code', 'error');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Remove coupon handler
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    addToast('Coupon removed', 'success');
  };

  // Check if product is available
  const isProductAvailable = (item) => {
    const key = item.selectedSize ? `${item._id}-${item.selectedSize.label}` : item._id;
    const productStock = productsStock[key];
    if (!productStock) return true; // If not loaded yet, assume available
    return productStock.stock > 0;
  };

  // Get available stock for a product
  const getAvailableStock = (item) => {
    const key = item.selectedSize ? `${item._id}-${item.selectedSize.label}` : item._id;
    const productStock = productsStock[key];
    return productStock ? productStock.stock : 0;
  };

  // Check if requested quantity is available
  const isQuantityAvailable = (item) => {
    const availableStock = getAvailableStock(item);
    return item.quantity <= availableStock;
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(item._id, item.selectedSize?.label);
      return;
    }

    // Check if requested quantity is available
    const availableStock = getAvailableStock(item);
    if (newQuantity > availableStock) {
      alert(`Only ${availableStock} items available in stock`);
      return;
    }

    updateQuantity(item._id, newQuantity, item.selectedSize?.label);
  };

  const handleRemove = (item) => {
    removeFromCart(item._id, item.selectedSize?.label);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/profile?redirect=cart');
      return;
    }

    if (cartItems.length === 0) {
      return;
    }

    // Check if all items are available in stock
    const outOfStockItems = cartItems.filter(item => !isProductAvailable(item));
    if (outOfStockItems.length > 0) {
      alert(`Some items are out of stock: ${outOfStockItems.map(item => item.name).join(', ')}`);
      return;
    }

    // Check if requested quantities are available
    const unavailableItems = cartItems.filter(item => !isQuantityAvailable(item));
    if (unavailableItems.length > 0) {
      const itemsList = unavailableItems.map(item => 
        `${item.name} (requested: ${item.quantity}, available: ${getAvailableStock(item)})`
      ).join('\n');
      alert(`Insufficient stock for:\n${itemsList}`);
      return;
    }

    // Check if user has saved addresses
    if (user?.addresses && user.addresses.length > 0) {
      setSelectedAddressIndex(0);
      setAddress(user.addresses[0]);
      setUseNewAddress(false);
    } else {
      setUseNewAddress(true);
      setAddress({
        fullName: user?.name || '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        houseNo: '',
        colony: '',
        city: '',
        state: '',
        zipCode: '',
        latitude: '',
        longitude: '',
      });
    }

    setShowAddressModal(true);
  };

  const handleAddressSelection = (index) => {
    setSelectedAddressIndex(index);
    setAddress(user.addresses[index]);
    setUseNewAddress(false);
  };

  const handleNewAddressToggle = () => {
    setUseNewAddress(true);
    setSelectedAddressIndex(null);
    setAddress({
      fullName: user?.name || '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      houseNo: '',
      colony: '',
      city: '',
      state: '',
      zipCode: '',
      latitude: '',
      longitude: '',
    });
  };

  const handlePlaceOrder = async () => {
    // Validate address
    if (
      !address.fullName ||
      !address.phone ||
      !address.addressLine1 ||
      !address.city ||
      !address.state ||
      !address.zipCode
    ) {
      alert('Please fill all required address fields');
      return;
    }

    // Validate exact delivery fields if exact delivery is selected
    if (useExactDelivery) {
      if (!address.houseNo || !address.colony) {
        alert('House number and colony are required for exact delivery');
        return;
      }
    }

    try {
      setPlacingOrder(true);

      const orderData = {
        items: cartItems.map((item) => ({
          product: item._id,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          size: item.selectedSize?.label || null,
          subtotal: item.price * item.quantity,
          category: item.category || null,
        })),
        shippingAddress: address,
        deliveryType: useExactDelivery ? 'exact' : 'normal',
        itemsTotal,
        deliveryFee,
        otherCharges,
        couponCode: appliedCoupon?.code || null,
        couponDiscount,
        grandTotal,
      };

      console.log('Placing order with data:', orderData);
      const response = await ordersAPI.create(orderData);
      console.log('Order placed successfully:', response);

      clearCart();
      setShowAddressModal(false);
      console.log('Setting showThankYouModal to true');
      setShowThankYouModal(true);
      console.log('showThankYouModal state should be true now');
    } catch (error) {
      console.error('Order placement error:', error);
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <svg
              className="w-32 h-32 mx-auto text-gray-300 mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your Cart is Empty
            </h2>
            <p className="text-gray-600 mb-8">
              Add some products to your cart to see them here!
            </p>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                navigate('/shopping');
              }}
              className="btn-primary"
            >
              Continue Shopping
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 mb-8"
        >
          Shopping Cart ({cartItems.length} items)
        </motion.h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {cartItems.map((item, index) => (
                <motion.div
                  key={`${item._id}-${item.selectedSize?.label || 'default'}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-lg shadow-md p-4 flex gap-4 ${
                    !loadingStock && !isProductAvailable(item) ? 'opacity-60 border-2 border-red-200' : ''
                  }`}
                >
                  {/* Product Image */}
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => navigate(`/product/${item._id}`)}
                  >
                    <img
                      src={getGoogleDriveImageUrl(item.image)}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0 hover:opacity-80 transition-opacity"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/products/placeholder.svg';
                      }}
                    />
                    {!loadingStock && !isProductAvailable(item) && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold px-2 py-1 bg-red-600 rounded">
                          OUT OF STOCK
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 
                      className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-primary-600 transition-colors"
                      onClick={() => navigate(`/product/${item._id}`)}
                    >
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.category}
                      {item.selectedSize && ` - ${item.selectedSize.label}`}
                    </p>
                    
                    {/* Stock Status */}
                    {!loadingStock && (() => {
                      const key = item.selectedSize ? `${item._id}-${item.selectedSize.label}` : item._id;
                      return productsStock[key];
                    })() && (
                      <div className="mb-2">
                        {isProductAvailable(item) ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ In Stock{item.selectedSize ? ` (${item.selectedSize.label})` : ''}
                            </span>
                            <span className="text-xs text-gray-600">
                              {getAvailableStock(item)} available
                            </span>
                            {!isQuantityAvailable(item) && (
                              <span className="text-xs text-red-600 font-medium">
                                (Only {getAvailableStock(item)} left!)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ✗ Out of Stock{item.selectedSize ? ` (${item.selectedSize.label})` : ''}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-primary-600">
                        ₹{parseFloat(item.price).toFixed(2)}
                      </span>
                      {item.originalPrice > item.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{parseFloat(item.originalPrice).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleQuantityChange(item, item.quantity - 1);
                        }}
                        disabled={item.quantity <= 1 || !isProductAvailable(item)}
                        className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleQuantityChange(item, item.quantity + 1);
                        }}
                        disabled={!isProductAvailable(item) || item.quantity >= getAvailableStock(item)}
                        className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Remove Button & Subtotal */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRemove(item);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                      title="Remove from cart"
                    >
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Subtotal</p>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{parseFloat(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 sticky top-24"
            >
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Items Total</span>
                  <span>₹{itemsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                {otherCharges > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Other Charges</span>
                    <span>₹{otherCharges.toFixed(2)}</span>
                  </div>
                )}
                {itemsTotal < 999 && (
                  <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    Add ₹{(999 - itemsTotal).toFixed(2)} more for free delivery!
                  </p>
                )}

                {/* Coupon Section */}
                <div className="border-t pt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Have a coupon code?
                  </label>
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm uppercase"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {applyingCoupon ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-green-700 font-medium">{appliedCoupon.code}</span>
                          <p className="text-xs text-green-600">
                            {appliedCoupon.discountType === 'percentage' 
                              ? `${appliedCoupon.discountValue}% off`
                              : `₹${appliedCoupon.discountValue} off`}
                          </p>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Coupon Discount */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span className="text-primary-600">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Stock Warnings */}
              {!loadingStock && cartItems.some(item => !isProductAvailable(item)) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Some items in your cart are out of stock
                  </p>
                </div>
              )}

              {!loadingStock && cartItems.some(item => isProductAvailable(item) && !isQuantityAvailable(item)) && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium">
                    ⚠️ Requested quantity not available for some items
                  </p>
                </div>
              )}

              <button 
                onClick={handleCheckout} 
                disabled={loadingStock || cartItems.some(item => !isProductAvailable(item) || !isQuantityAvailable(item))}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStock ? 'Checking Stock...' : 'Proceed to Checkout'}
              </button>

              <div className="mt-4 text-center text-sm text-gray-600">
                <p>💳 Cash on Delivery Available</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !placingOrder && setShowAddressModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6">Delivery Address</h2>

              {/* Saved Addresses Section */}
              {user?.addresses && user.addresses.length > 0 && !useNewAddress && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Select Saved Address</h3>
                    <button
                      onClick={handleNewAddressToggle}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      + Use New Address
                    </button>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {user.addresses.map((addr, index) => (
                      <div
                        key={index}
                        onClick={() => handleAddressSelection(index)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedAddressIndex === index
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{addr.fullName}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {addr.phone}
                              <br />
                              {addr.addressLine1}
                              {addr.addressLine2 && `, ${addr.addressLine2}`}
                              <br />
                              {addr.city}, {addr.state} - {addr.zipCode}
                            </p>
                          </div>
                          {selectedAddressIndex === index && (
                            <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Address Form */}
              {(useNewAddress || !user?.addresses || user.addresses.length === 0) && (
                <div className="mb-6">
                  {user?.addresses && user.addresses.length > 0 && (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Enter New Address</h3>
                      <button
                        onClick={() => {
                          setUseNewAddress(false);
                          if (user.addresses.length > 0) {
                            setSelectedAddressIndex(0);
                            setAddress(user.addresses[0]);
                          }
                        }}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        ← Back to Saved Addresses
                      </button>
                    </div>
                  )}

                  {/* Location Detection Button */}
                  <div className="mb-6 pb-6 border-b">
                    <LocationPicker 
                      onLocationSelect={handleLocationSelect}
                      buttonText="📍 Detect My Location"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Click to auto-fill city, state, and pincode from your current location
                    </p>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={address.fullName}
                      onChange={(e) =>
                        setAddress({ ...address, fullName: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={address.phone}
                      onChange={(e) =>
                        setAddress({ ...address, phone: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Address Line 1 *"
                      value={address.addressLine1}
                      onChange={(e) =>
                        setAddress({ ...address, addressLine1: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      value={address.addressLine2}
                      onChange={(e) =>
                        setAddress({ ...address, addressLine2: e.target.value })
                      }
                      className="input-field"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="City *"
                        value={address.city}
                        onChange={(e) =>
                          setAddress({ ...address, city: e.target.value })
                        }
                        className="input-field"
                        required
                      />
                      <input
                        type="text"
                        placeholder="State *"
                        value={address.state}
                        onChange={(e) =>
                          setAddress({ ...address, state: e.target.value })
                        }
                        className="input-field"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="ZIP Code *"
                      value={address.zipCode}
                      onChange={(e) => {
                        const zipCode = e.target.value;
                        setAddress({ ...address, zipCode });
                        // Check pin code availability when user types
                        if (zipCode.length === 6) {
                          checkPinCodeAvailability(zipCode);
                        } else {
                          setExactDeliveryAvailable(false);
                          setPinCodeInfo(null);
                          setUseExactDelivery(false);
                        }
                      }}
                      className="input-field"
                      required
                    />

                    {/* Pin Code Status */}
                    {address.zipCode.length === 6 && (
                      <div className="mt-2">
                        {checkingPinCode ? (
                          <p className="text-sm text-gray-600">Checking pin code...</p>
                        ) : exactDeliveryAvailable ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800 font-medium">
                              ✓ Exact delivery available for this pin code!
                            </p>
                            {pinCodeInfo && (
                              <p className="text-xs text-green-700 mt-1">
                                Estimated delivery: {pinCodeInfo.estimatedDeliveryDays} days
                                {pinCodeInfo.exactDeliveryCharges > 0 && ` • Extra charges: ₹${pinCodeInfo.exactDeliveryCharges}`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">
                            Normal delivery available for this pin code
                          </p>
                        )}
                      </div>
                    )}

                    {/* Exact Delivery Checkbox */}
                    {exactDeliveryAvailable && (
                      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useExactDelivery}
                            onChange={(e) => setUseExactDelivery(e.target.checked)}
                            className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <span className="font-medium text-gray-900">
                              Use Exact Delivery
                            </span>
                            <p className="text-sm text-gray-600 mt-1">
                              Get your order delivered to your exact location with house number and colony details.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Exact Delivery Fields */}
                    {useExactDelivery && (
                      <div className="space-y-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          📍 Exact Delivery Details (Required)
                        </p>
                        <input
                          type="text"
                          placeholder="House Number / Flat Number *"
                          value={address.houseNo}
                          onChange={(e) =>
                            setAddress({ ...address, houseNo: e.target.value })
                          }
                          className="input-field"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Colony / Society / Area Name *"
                          value={address.colony}
                          onChange={(e) =>
                            setAddress({ ...address, colony: e.target.value })
                          }
                          className="input-field"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Items Total:</span>
                    <span>₹{itemsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon ({appliedCoupon?.code}):</span>
                      <span>-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-1 flex justify-between font-semibold">
                    <span>Order Total:</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">Payment: Cash on Delivery</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddressModal(false)}
                  disabled={placingOrder}
                  className="flex-1 btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="flex-1 btn-primary"
                >
                  {placingOrder ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thank You Modal */}
      <AnimatePresence mode="wait">
        {showThankYouModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4"
            style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <motion.div
              initial={{ scale: 0.3, y: 100, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -50, opacity: 0 }}
              transition={{ 
                type: 'spring', 
                damping: 20, 
                stiffness: 200,
                duration: 0.5 
              }}
              className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full text-center relative overflow-hidden"
            >
              {/* Confetti animation background */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 50%, rgba(255,255,255,0) 100%)'
                }}
              />

              {/* Success checkmark with bounce */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.1, 
                  type: 'spring', 
                  stiffness: 150,
                  damping: 12
                }}
                className="w-28 h-28 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10"
              >
                <motion.svg
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: "easeInOut" }}
                  className="w-16 h-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
                
                {/* Animated ring */}
                <motion.div
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 border-4 border-green-400 rounded-full"
                />
              </motion.div>

              <motion.h2
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-4xl font-bold text-gray-900 mb-4 relative z-10"
              >
                🎉 Thank You! 🎉
              </motion.h2>
              
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-2xl font-semibold text-green-600 mb-3 relative z-10"
              >
                Order Placed Successfully!
              </motion.p>
              
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-gray-600 mb-6 text-lg relative z-10"
              >
                Your order has been confirmed. You will receive your items soon via Cash on Delivery.
              </motion.p>

              {/* Auto-redirect message with animated dots */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="text-sm text-gray-500 flex items-center justify-center gap-2 relative z-10"
              >
                <span>Redirecting to shop</span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ...
                </motion.span>
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;
