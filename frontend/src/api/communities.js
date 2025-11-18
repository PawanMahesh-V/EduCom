import ApiClient from './client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const communityApi = {
  getAll: async () => {
    return await ApiClient.get(`${API_BASE_URL}/communities`);
  },

  getById: async (id) => {
    return await ApiClient.get(`${API_BASE_URL}/communities/${id}`);
  },

  create: async (communityData) => {
    return await ApiClient.post(`${API_BASE_URL}/communities`, communityData);
  },

  update: async (id, communityData) => {
    return await ApiClient.put(`${API_BASE_URL}/communities/${id}`, communityData);
  },

  delete: async (id) => {
    return await ApiClient.delete(`${API_BASE_URL}/communities/${id}`);
  },

  getMembers: async (id) => {
    return await ApiClient.get(`${API_BASE_URL}/communities/${id}/members`);
  },
};

export default communityApi;
