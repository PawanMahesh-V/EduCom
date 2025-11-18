import ApiClient from './client';
import { API_ENDPOINTS } from '../config/api';
const courseApi = {
  getAll: async () => {
    return await ApiClient.get(API_ENDPOINTS.COURSES.BASE);
  },

  getById: async (id) => {
    return await ApiClient.get(API_ENDPOINTS.COURSES.BY_ID(id));
  },

  create: async (courseData) => {
    return await ApiClient.post(API_ENDPOINTS.COURSES.BASE, courseData);
  },

  update: async (id, courseData) => {
    return await ApiClient.put(API_ENDPOINTS.COURSES.BY_ID(id), courseData);
  },

  delete: async (id) => {
    return await ApiClient.delete(API_ENDPOINTS.COURSES.BY_ID(id));
  },

  getEnrolledStudents: async (id) => {
    return await ApiClient.get(API_ENDPOINTS.COURSES.ENROLLED(id));
  },

  getStudentCourses: async (studentId) => {
    return await ApiClient.get(`${API_ENDPOINTS.COURSES.BASE}/student/${studentId}`);
  },

  getTeacherCourses: async (teacherId) => {
    return await ApiClient.get(`${API_ENDPOINTS.COURSES.BASE}/teacher/${teacherId}`);
  },

  getTeacherStats: async (teacherId) => {
    return await ApiClient.get(`${API_ENDPOINTS.COURSES.BASE}/teacher/${teacherId}/stats`);
  },

  assignToStudents: async (courseId, studentIds) => {
    return await ApiClient.post(`${API_ENDPOINTS.COURSES.BY_ID(courseId)}/assign`, {
      student_ids: studentIds
    });
  },

  removeStudents: async (courseId, studentIds) => {
    return await ApiClient.post(`${API_ENDPOINTS.COURSES.BY_ID(courseId)}/remove`, {
      student_ids: studentIds
    });
  },
};

export default courseApi;
