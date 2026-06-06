import { useState, useEffect } from 'react';
import api from '../api/client';
import API_BASE_URL from '../config/api';
import { showSuccess, showError } from '../utils/alert';

export const useCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);

  const fetchCart = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/marketplace/cart`);
      setCartItems(response || []);
      setHasLoadedCart(true);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCartItems([]);
    }
  };

  const handleAddToCart = async (e, item) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`${API_BASE_URL}/marketplace/cart`, { item_id: item.id, quantity: 1 });
      await fetchCart(); 
      showSuccess(`${item.title} added to cart!`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showError('Failed to add to cart');
    }
  };

  const handleUpdateCartQuantity = async (e, item, delta) => {
    if (e) e.stopPropagation();
    try {
      const cartItem = cartItems.find(c => c.id === item.id);
      const newQuantity = (cartItem ? cartItem.qty : 0) + delta;
      
      if (newQuantity <= 0) {
        await api.delete(`${API_BASE_URL}/marketplace/cart/${item.id}`);
      } else {
        await api.put(`${API_BASE_URL}/marketplace/cart/${item.id}`, { quantity: newQuantity });
      }
      await fetchCart();
    } catch (error) {
      console.error('Failed to update cart quantity:', error);
      showError('Failed to update quantity');
    }
  };

  const handleRemoveFromCart = async (id) => {
    try {
      await api.delete(`${API_BASE_URL}/marketplace/cart/${id}`);
      await fetchCart(); 
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      showError('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try { 
        await api.delete(`${API_BASE_URL}/marketplace/cart`); 
        setCartItems([]);
    } catch (e) { 
        console.error(e); 
    }
  };

  const cartTotal = cartItems.reduce((sum, c) => sum + parseFloat(c.price || 0) * (c.qty || 1), 0);

  return {
    cartItems,
    hasLoadedCart,
    fetchCart,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleRemoveFromCart,
    clearCart,
    cartTotal,
    setCartItems,
    setHasLoadedCart
  };
};
