import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../api/api';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from backend when user is logged in
  const loadCartFromBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCartItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await cartAPI.get();
      if (response.data.success) {
        const backendCart = response.data.data || [];
        
        // Map backend cart format to frontend format
        const cartForFrontend = backendCart.map(item => ({
          _id: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          originalPrice: item.originalPrice,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          category: item.category,
        }));
        
        setCartItems(cartForFrontend);
        // Update localStorage to match backend
        localStorage.setItem('cart', JSON.stringify(cartForFrontend));
      }
    } catch (error) {
      console.error('Failed to load cart from backend:', error);
      // If backend fails, start with empty cart when logged in
      setCartItems([]);
      localStorage.removeItem('cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Save cart to backend
  const saveCartToBackend = async (items) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Map cart items to match backend schema
      const cartForBackend = items.map(item => ({
        productId: item._id,
        name: item.name,
        image: item.image,
        price: item.price,
        originalPrice: item.originalPrice,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        category: item.category,
      }));
      
      await cartAPI.update(cartForBackend);
    } catch (error) {
      console.error('Failed to save cart to backend:', error);
    }
  };

  // Load cart on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // User is logged in, load from backend
      loadCartFromBackend();
    } else {
      // User is not logged in, load from localStorage
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    }
  }, []);

  // Save cart to localStorage and backend whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    const token = localStorage.getItem('token');
    if (token && cartItems.length >= 0) {
      // Debounce the backend save
      const timeoutId = setTimeout(() => {
        saveCartToBackend(cartItems);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1, selectedSize = null) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item._id === product._id &&
          item.selectedSize?.label === selectedSize?.label
      );

      if (existingItemIndex > -1) {
        // Item exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // New item
        const price = selectedSize ? selectedSize.price : product.price;
        const discountedPrice = price - (price * product.discountPercent) / 100;

        const newItem = {
          _id: product._id,
          name: product.name,
          image: product.images[0],
          price: discountedPrice,
          originalPrice: price,
          quantity,
          selectedSize,
          category: product.category,
        };
        
        return [...prevItems, newItem];
      }
    });
  };

  const removeFromCart = (productId, sizeLabel = null) => {
    setCartItems((prevItems) => {
      return prevItems.filter((item) => {
        // If both have no size, compare only IDs
        if (!item.selectedSize && !sizeLabel) {
          return item._id !== productId;
        }
        // If both have sizes, compare both ID and size
        return !(item._id === productId && item.selectedSize?.label === sizeLabel);
      });
    });
  };

  const updateQuantity = (productId, quantity, sizeLabel = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, sizeLabel);
      return;
    }

    setCartItems((prevItems) => {
      return prevItems.map((item) => {
        // If both have no size, compare only IDs
        if (!item.selectedSize && !sizeLabel && item._id === productId) {
          return { ...item, quantity };
        }
        // If both have sizes, compare both ID and size
        if (item._id === productId && item.selectedSize?.label === sizeLabel) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem('cart');
    
    // Clear from backend if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await cartAPI.clear();
      } catch (error) {
        console.error('Failed to clear cart from backend:', error);
      }
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    loadCartFromBackend,
    isLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
