import ApiClient from './client';
import { API_ENDPOINTS } from '../config/api';
const userApi = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_ENDPOINTS.USERS.BASE}${queryString ? `?${queryString}` : ''}`;
    return await ApiClient.get(url);
  },

  getTeachers: async () => {
    return await ApiClient.get(API_ENDPOINTS.USERS.TEACHERS);
  },

  getById: async (id) => {
    return await ApiClient.get(API_ENDPOINTS.USERS.BY_ID(id));
  },

  create: async (userData) => {
    return await ApiClient.post(API_ENDPOINTS.USERS.BASE, userData);
  },

  update: async (id, userData) => {
    return await ApiClient.put(API_ENDPOINTS.USERS.BY_ID(id), userData);
  },

  delete: async (id) => {
    return await ApiClient.delete(API_ENDPOINTS.USERS.BY_ID(id));
  }
};

export default userApi;
