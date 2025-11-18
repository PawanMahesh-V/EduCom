import ApiClient from './client';
import { API_ENDPOINTS } from '../config/api';
const dashboardApi = {
  getStats: async () => {
    return await ApiClient.get(API_ENDPOINTS.DASHBOARD.STATS);
  },

  getRecentUsers: async () => {
    const stats = await ApiClient.get(API_ENDPOINTS.DASHBOARD.STATS);
    return stats.recentUsers || [];
  },

  getRecentCourses: async () => {
    const stats = await ApiClient.get(API_ENDPOINTS.DASHBOARD.STATS);
    return stats.recentCourses || [];
  },
  
  getActivity: async (days = 7) => {
    const url = `${API_ENDPOINTS.DASHBOARD.ACTIVITY}?days=${encodeURIComponent(days)}`;
    return await ApiClient.get(url);
  },
};

export default dashboardApi;
