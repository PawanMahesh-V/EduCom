import ApiClient from './client';
import { API_ENDPOINTS } from '../config/api';

const communityApi = {
  getAll: async () => {
    return await ApiClient.get(API_ENDPOINTS.COMMUNITIES.BASE);
  },

  getById: async (id) => {
    return await ApiClient.get(API_ENDPOINTS.COMMUNITIES.BY_ID(id));
  },

  create: async (communityData) => {
    return await ApiClient.post(API_ENDPOINTS.COMMUNITIES.BASE, communityData);
  },

  update: async (id, communityData) => {
    return await ApiClient.put(API_ENDPOINTS.COMMUNITIES.BY_ID(id), communityData);
  },

  updateStatus: async (id, status) => {
    // Re-using the generic update endpoint
    return await ApiClient.put(API_ENDPOINTS.COMMUNITIES.BY_ID(id), { name: null, status });
  },
  setStatus: async (id, status, currentName) => {
    return await ApiClient.put(API_ENDPOINTS.COMMUNITIES.BY_ID(id), { name: currentName, status });
  },

  delete: async (id) => {
    return await ApiClient.delete(API_ENDPOINTS.COMMUNITIES.BY_ID(id));
  },

  getMembers: async (id) => {
    return await ApiClient.get(API_ENDPOINTS.COMMUNITIES.MEMBERS(id));
  },

  getMessages: async (id, userId) => {
    return await ApiClient.get(API_ENDPOINTS.COMMUNITIES.MESSAGES(id, userId));
  },

  deleteMessage: async (communityId, messageId) => {
    return await ApiClient.delete(API_ENDPOINTS.COMMUNITIES.DELETE_MESSAGE(communityId, messageId));
  },

  deleteMultipleMessages: async (communityId, messageIds) => {
    return await ApiClient.post(API_ENDPOINTS.COMMUNITIES.DELETE_MULTIPLE_MESSAGES(communityId), { messageIds });
  },

  getStudentCommunities: async (studentId) => {
    return await ApiClient.get(API_ENDPOINTS.COMMUNITIES.STUDENT(studentId));
  },

  getTeacherCommunities: async (teacherId) => {
    return await ApiClient.get(API_ENDPOINTS.COMMUNITIES.TEACHER(teacherId));
  },

  getHodCommunities: async (hodId) => {
    return await ApiClient.get(API_ENDPOINTS.COMMUNITIES.HOD(hodId));
  },

  joinCommunity: async (joinCode, studentId) => {
    return await ApiClient.post(API_ENDPOINTS.COMMUNITIES.JOIN, { joinCode, studentId });
  },

  leaveCommunity: async (id) => {
    return await ApiClient.post(API_ENDPOINTS.COMMUNITIES.LEAVE(id));
  },
};

export default communityApi;
