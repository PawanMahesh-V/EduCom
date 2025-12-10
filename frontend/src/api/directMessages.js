import ApiClient from './client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const directMessageApi = {
  getConversations: async (userId) => {
    return await ApiClient.get(`${API_BASE_URL}/direct-messages/conversations/${userId}`);
  },

  getMessages: async (userId, otherUserId) => {
    return await ApiClient.get(`${API_BASE_URL}/direct-messages/messages/${userId}/${otherUserId}`);
  },

  getUsers: async (excludeUserId) => {
    return await ApiClient.get(`${API_BASE_URL}/direct-messages/users?exclude=${excludeUserId}`);
  },
};

export default directMessageApi;
