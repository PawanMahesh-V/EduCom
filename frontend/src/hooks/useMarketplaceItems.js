import { useState, useEffect } from 'react';
import api from '../api/client';
import API_BASE_URL from '../config/api';
import { showError } from '../utils/alert';

export const useMarketplaceItems = (socket, activeTab, searchQuery, roleFilter) => {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState({ items: false, orders: false, sales: false });

  const fetchSales = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/marketplace/orders/received`);
      setReceivedOrders(response || []);
      setHasLoaded(prev => ({ ...prev, sales: true }));
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      setReceivedOrders([]);
    }
  };

  const fetchItems = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      if (activeTab === 'orders') {
        const response = await api.get(`${API_BASE_URL}/marketplace/orders/me`);
        setOrders(response || []);
        setHasLoaded(prev => ({ ...prev, orders: true }));
      } else if (activeTab === 'sales') {
        const response = await api.get(`${API_BASE_URL}/marketplace/orders/received`);
        setReceivedOrders(response || []);
        setHasLoaded(prev => ({ ...prev, sales: true }));
      } else if (activeTab === 'items') {
        const endpoint = '/marketplace';
        const params = new URLSearchParams();

        if (searchQuery) params.append('search', searchQuery);
        if (roleFilter !== 'All Roles') params.append('role', roleFilter);
        params.append('page', 1);
        params.append('limit', 1000); // Fetch all items for client-side pagination

        const response = await api.get(`${API_BASE_URL}${endpoint}${params.toString() ? '?' + params.toString() : ''}`);
        
        setItems(response?.items || []);
        setHasLoaded(prev => ({ ...prev, items: true }));
      }
    } catch (error) {
      console.error('Failed to fetch marketplace data:', error);
      if (activeTab === 'orders') setOrders([]);
      else if (activeTab === 'sales') setReceivedOrders([]);
      else setItems([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handleInventoryUpdate = () => {
        fetchItems(true);
    };
    socket.on('inventory_updated', handleInventoryUpdate);
    return () => {
        socket.off('inventory_updated', handleInventoryUpdate);
    };
  }, [socket, activeTab, searchQuery, roleFilter]);

  useEffect(() => {
    if (!hasLoaded.sales) fetchSales();
  }, []);

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`${API_BASE_URL}/marketplace/${id}`);
      fetchItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      showError('Failed to delete item');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus, otp = null) => {
    try {
      await api.put(`${API_BASE_URL}/marketplace/orders/${orderId}/status`, { status: newStatus, otp });
      setHasLoaded(prev => ({ ...prev, orders: false, sales: false })); 
      fetchItems();
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await api.put(`${API_BASE_URL}/marketplace/orders/${orderId}/cancel`);
      setHasLoaded(prev => ({ ...prev, items: false, orders: false, sales: false })); 
      fetchItems();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      showError(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const totalEarnings = receivedOrders.reduce((total, order) => {
    if (order.status !== 'cancelled' && order.status !== 'cancelled_by_buyer' && order.status !== 'refunded') {
      const orderEarned = order.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      return total + orderEarned;
    }
    return total;
  }, 0);

  return {
    items,
    orders,
    receivedOrders,
    loading,
    hasLoaded,
    fetchItems,
    handleDeleteItem,
    handleUpdateStatus,
    handleCancelOrder,
    totalEarnings,
    setHasLoaded
  };
};
