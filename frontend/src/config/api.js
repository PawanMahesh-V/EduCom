const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://172.16.165.165:5000/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    ME: `${API_BASE_URL}/auth/me`,
  },

  USERS: {
    BASE: `${API_BASE_URL}/users`,
    TEACHERS: `${API_BASE_URL}/users/teachers`,
    BY_ID: (id) => `${API_BASE_URL}/users/${id}`,
  },

  COURSES: {
    BASE: `${API_BASE_URL}/courses`,
    BY_ID: (id) => `${API_BASE_URL}/courses/${id}`,
    ENROLLED: (id) => `${API_BASE_URL}/courses/${id}/enrolled`,
  },

  COMMUNITIES: {
    BASE: `${API_BASE_URL}/communities`,
    BY_ID: (id) => `${API_BASE_URL}/communities/${id}`,
  },
  NOTIFICATIONS: {
    BASE: `${API_BASE_URL}/notifications`,
    READ_ALL: `${API_BASE_URL}/notifications/read-all`,
    BROADCAST: `${API_BASE_URL}/notifications/broadcast`,
    BY_ID: (id) => `${API_BASE_URL}/notifications/${id}`,
    MARK_READ: (id) => `${API_BASE_URL}/notifications/${id}/read`,
  },
  DASHBOARD: {
    STATS: `${API_BASE_URL}/dashboard/admin/stats`,
    RECENT_USERS: `${API_BASE_URL}/dashboard/admin/recent-users`,
    RECENT_COURSES: `${API_BASE_URL}/dashboard/admin/recent-courses`,
    ACTIVITY: `${API_BASE_URL}/dashboard/admin/activity`,
  },
};

export default API_BASE_URL;
