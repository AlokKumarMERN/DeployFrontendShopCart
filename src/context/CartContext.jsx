import { createContext, useContext, useState, useEffect } from 'react';

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

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
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

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
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
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
