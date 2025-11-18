import ApiClient from './client';
import { API_ENDPOINTS } from '../config/api';
const notificationApi = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_ENDPOINTS.NOTIFICATIONS.BASE}${queryString ? `?${queryString}` : ''}`;
    return await ApiClient.get(url);
  },

  markAsRead: async (id) => {
    return await ApiClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  markAllAsRead: async () => {
    return await ApiClient.put(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
  },

  delete: async (id) => {
    return await ApiClient.delete(API_ENDPOINTS.NOTIFICATIONS.BY_ID(id));
  },

  create: async (notificationData) => {
    return await ApiClient.post(API_ENDPOINTS.NOTIFICATIONS.BASE, notificationData);
  },

  broadcast: async (notificationData) => {
    return await ApiClient.post(API_ENDPOINTS.NOTIFICATIONS.BROADCAST, notificationData);
  },
};

export default notificationApi;
