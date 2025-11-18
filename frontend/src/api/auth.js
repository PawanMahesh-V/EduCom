import ApiClient from './client';
import { API_ENDPOINTS } from '../config/api';
const authApi = {
  login: async (identifier, password) => {
    try {
      const payload = {
        identifier: identifier ? identifier.trim() : identifier,
        password,
      };

      const data = await ApiClient.post(API_ENDPOINTS.AUTH.LOGIN, payload);
      if (data.token) {
        localStorage.setItem('userToken', data.token);
      }

      return data;
    } catch (error) {
      throw new Error(error || 'Failed to login');
    }
  },

  logout: async () => {
    try {
      await ApiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      localStorage.removeItem('userToken');
      sessionStorage.removeItem('userToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    } catch (error) {
      localStorage.removeItem('userToken');
      sessionStorage.removeItem('userToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      throw new Error(error || 'Failed to logout');
    }
  },

  getCurrentUser: async () => {
    try {
      const data = await ApiClient.get(API_ENDPOINTS.AUTH.ME);
      return data;
    } catch (error) {
      throw new Error(error || 'Failed to get current user');
    }
  },
};

export default authApi;
