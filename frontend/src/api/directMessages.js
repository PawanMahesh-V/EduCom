import ApiClient from './client';
import { API_ENDPOINTS } from '../config/api';

const directMessageApi = {
  getConversations: async (userId) => {
    return await ApiClient.get(API_ENDPOINTS.DIRECT_MESSAGES.CONVERSATIONS(userId));
  },

  getMessages: async (userId, otherUserId) => {
    return await ApiClient.get(API_ENDPOINTS.DIRECT_MESSAGES.MESSAGES(userId, otherUserId));
  },

  getUsers: async (excludeUserId) => {
    return await ApiClient.get(API_ENDPOINTS.DIRECT_MESSAGES.USERS(excludeUserId));
  },

  searchMessages: async (userId, otherUserId, query) => {
    return await ApiClient.get(API_ENDPOINTS.DIRECT_MESSAGES.SEARCH(userId, otherUserId, query));
  },

  deleteMessage: async (messageId) => {
    console.log('[directMessageApi] deleteMessage called with:', messageId);
    console.log('[directMessageApi] URL:', API_ENDPOINTS.DIRECT_MESSAGES.DELETE(messageId));
    const result = await ApiClient.delete(API_ENDPOINTS.DIRECT_MESSAGES.DELETE(messageId));
    console.log('[directMessageApi] deleteMessage result:', result);
    return result;
  },

  deleteMultipleMessages: async (messageIds) => {
    console.log('[directMessageApi] deleteMultipleMessages called with:', messageIds);
    console.log('[directMessageApi] URL:', API_ENDPOINTS.DIRECT_MESSAGES.DELETE_MULTIPLE);
    const result = await ApiClient.post(API_ENDPOINTS.DIRECT_MESSAGES.DELETE_MULTIPLE, { messageIds });
    console.log('[directMessageApi] deleteMultipleMessages result:', result);
    return result;
  },
};

export default directMessageApi;
