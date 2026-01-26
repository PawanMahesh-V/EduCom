const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    ME: `${API_BASE_URL}/auth/me`,
    VERIFY_LOGIN: `${API_BASE_URL}/auth/verify-login`,
    CHECK_EMAIL: `${API_BASE_URL}/auth/check-email`,
    SEND_REGISTRATION_CODE: `${API_BASE_URL}/auth/send-registration-code`,
    VERIFY_REGISTRATION_CODE: `${API_BASE_URL}/auth/verify-registration-code`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    VERIFY_RESET_CODE: `${API_BASE_URL}/auth/verify-reset-code`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
    REGISTRATION_REQUESTS: `${API_BASE_URL}/auth/registration-requests`,
    REGISTRATION_APPROVE: (id) => `${API_BASE_URL}/auth/registration-requests/${id}/approve`,
    REGISTRATION_REJECT: (id) => `${API_BASE_URL}/auth/registration-requests/${id}/reject`,
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
    MEMBERS: (id) => `${API_BASE_URL}/communities/${id}/members`,
    MESSAGES: (id, userId) => `${API_BASE_URL}/communities/${id}/messages${userId ? `?userId=${userId}` : ''}`,
    DELETE_MESSAGE: (communityId, messageId) => `${API_BASE_URL}/communities/${communityId}/messages/${messageId}`,
    DELETE_MULTIPLE_MESSAGES: (communityId) => `${API_BASE_URL}/communities/${communityId}/messages/delete-multiple`,
    STUDENT: (studentId) => `${API_BASE_URL}/communities/student/${studentId}`,
    TEACHER: (teacherId) => `${API_BASE_URL}/communities/teacher/${teacherId}`,
    HOD: (hodId) => `${API_BASE_URL}/communities/hod/${hodId}`,
    JOIN: `${API_BASE_URL}/communities/join`,
    LEAVE: (id) => `${API_BASE_URL}/communities/${id}/leave`,
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
  DIRECT_MESSAGES: {
    CONVERSATIONS: (userId) => `${API_BASE_URL}/direct-messages/conversations/${userId}`,
    MESSAGES: (userId, otherUserId) => `${API_BASE_URL}/direct-messages/messages/${userId}/${otherUserId}`,
    USERS: (excludeUserId) => `${API_BASE_URL}/direct-messages/users${excludeUserId ? `?exclude=${excludeUserId}` : ''}`,
    SEARCH: (userId, otherUserId, query) => `${API_BASE_URL}/direct-messages/messages/${userId}/${otherUserId}/search?q=${encodeURIComponent(query)}`,
    DELETE: (messageId) => `${API_BASE_URL}/direct-messages/message/${messageId}`,
    DELETE_MULTIPLE: `${API_BASE_URL}/direct-messages/message/delete-multiple`,
  }
};

export default API_BASE_URL;
