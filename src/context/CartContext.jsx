import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { cartAPI } from '../api/api';

const CartContext = createContext();

// Debounce delay for backend sync (5 seconds)
const SYNC_DELAY = 30000;

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);
  
  // Refs to track debounce timer and pending cart data
  const syncTimeoutRef = useRef(null);
  const pendingCartRef = useRef(null);

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

  // Save cart to backend (actual API call)
  const saveCartToBackend = async (items) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setIsSyncing(true);
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
      setPendingSync(false);
      pendingCartRef.current = null;
    } catch (error) {
      console.error('Failed to save cart to backend:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Debounced sync function - waits before syncing to backend
  const debouncedSyncToBackend = useCallback((items) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Store pending cart data
    pendingCartRef.current = items;
    setPendingSync(true);

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    console.log(`[Cart] Changes detected, will sync to database in ${SYNC_DELAY / 1000} seconds...`);

    // Set new timeout
    syncTimeoutRef.current = setTimeout(() => {
      console.log('[Cart] Syncing to database now...');
      if (pendingCartRef.current) {
        saveCartToBackend(pendingCartRef.current);
      }
    }, SYNC_DELAY);
  }, []);

  // Force immediate sync (useful before page unload or logout)
  const forceSync = useCallback(async () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    
    if (pendingCartRef.current) {
      await saveCartToBackend(pendingCartRef.current);
    }
  }, []);

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

  // Save cart to localStorage immediately, debounce backend sync
  useEffect(() => {
    // Always save to localStorage immediately for instant persistence
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    const token = localStorage.getItem('token');
    if (token && cartItems.length >= 0) {
      // Use debounced sync for backend (5 second delay)
      debouncedSyncToBackend(cartItems);
    }
  }, [cartItems, debouncedSyncToBackend]);

  // Sync to backend before page unload to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingCartRef.current) {
        // Use sendBeacon for reliable sync on page close
        const token = localStorage.getItem('token');
        if (token && pendingCartRef.current) {
          const cartForBackend = pendingCartRef.current.map(item => ({
            productId: item._id,
            name: item.name,
            image: item.image,
            price: item.price,
            originalPrice: item.originalPrice,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            category: item.category,
          }));
          
          // Use sendBeacon for reliable delivery during page unload
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          navigator.sendBeacon(
            `${apiUrl}/cart/sync`,
            new Blob([JSON.stringify({ items: cartForBackend, token })], { type: 'application/json' })
          );
        }
      }
    };

    const handleVisibilityChange = () => {
      // NOTE: Disabled auto-sync on tab switch to preserve debounce behavior
      // Uncomment below if you want immediate sync when user leaves tab
      // if (document.visibilityState === 'hidden' && pendingCartRef.current) {
      //   forceSync();
      // }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Cleanup timeout on unmount
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [forceSync]);

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
    isSyncing,      // true when actively syncing to backend
    pendingSync,    // true when there are unsaved changes waiting
    forceSync,      // function to force immediate sync
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
