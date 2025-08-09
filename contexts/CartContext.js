import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCartFromStorage();
  }, []);

  const loadCartFromStorage = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cartItems');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCartToStorage = async (items) => {
    try {
      await AsyncStorage.setItem('cartItems', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    const existingItemIndex = cartItems.findIndex(
      item => item.id === product.id && 
      JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant)
    );

    let updatedCart;
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      updatedCart = cartItems.map((item, index) => 
        index === existingItemIndex 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      // Add new item to cart
      const cartItem = {
        ...product,
        quantity,
        selectedVariant,
        cartId: `${product.id}_${Date.now()}` // Unique cart item ID
      };
      updatedCart = [...cartItems, cartItem];
    }

    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
  };

  const removeFromCart = (cartId) => {
    const updatedCart = cartItems.filter(item => item.cartId !== cartId);
    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
  };

  const updateQuantity = (cartId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartId);
      return;
    }

    const updatedCart = cartItems.map(item =>
      item.cartId === cartId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartToStorage([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.selectedVariant ? item.selectedVariant.price : item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const isInCart = (productId, variant = null) => {
    return cartItems.some(
      item => item.id === productId && 
      JSON.stringify(item.selectedVariant) === JSON.stringify(variant)
    );
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    isInCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};