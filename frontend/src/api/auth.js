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
      // Login step only sends verification email; token should be set after verify step

      return data;
    } catch (error) {
      throw new Error(error || 'Failed to login');
    }
  },

  logout: async () => {
    try {
      await ApiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('user');
      // Backward-compat cleanup
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
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

  verifyLogin: async (email, code) => {
    try {
      const data = await ApiClient.post(API_ENDPOINTS.AUTH.VERIFY_LOGIN, { email, code });
      return data;
    } catch (error) {
      throw new Error(error || 'Failed to verify code');
    }
  },

  checkEmail: async (email) => {
    try {
      const data = await ApiClient.post(API_ENDPOINTS.AUTH.CHECK_EMAIL, { email });
      return data;
    } catch (error) {
      throw new Error(error || 'Failed to check email');
    }
  },

  sendRegistrationCode: async (email) => {
    try {
      const data = await ApiClient.post(API_ENDPOINTS.AUTH.SEND_REGISTRATION_CODE, { email });
      return data;
    } catch (error) {
      throw new Error(error || 'Failed to send verification code');
    }
  },

  verifyRegistrationCode: async (email, code) => {
    try {
      const data = await ApiClient.post(API_ENDPOINTS.AUTH.VERIFY_REGISTRATION_CODE, { email, code });
      return data;
    } catch (error) {
      throw new Error(error || 'Failed to verify code');
    }
  },

  register: async (payload) => {
    try {
      const data = await ApiClient.post(API_ENDPOINTS.AUTH.REGISTER, payload);
      return data;
    } catch (error) {
      throw new Error(error || 'Failed to register');
    }
  },

  forgotPassword: async (email) => {
    try {
      const data = await ApiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      return data;
    } catch (error) {
      throw new Error(error || 'Failed to request password reset');
    }
  },

  verifyResetCode: async (email, code) => {
    try {
      const data = await ApiClient.post(API_ENDPOINTS.AUTH.VERIFY_RESET_CODE, { email, code });
      return data;
    } catch (error) {
      throw new Error(error || 'Failed to verify reset code');
    }
  },

  resetPassword: async (resetToken, newPassword) => {
    try {
      const data = await ApiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { resetToken, newPassword });
      return data;
    } catch (error) {
      throw new Error(error || 'Failed to reset password');
    }
  },

  getRegistrationRequests: async () => {
    try {
      const data = await ApiClient.get(API_ENDPOINTS.AUTH.REGISTRATION_REQUESTS);
      return data;
    } catch (error) {
      throw new Error(error || 'Failed to fetch registration requests');
    }
  },

  approveRegistration: async (requestId) => {
    try {
      const data = await ApiClient.post(API_ENDPOINTS.AUTH.REGISTRATION_APPROVE(requestId));
      return data;
    } catch (error) {
      throw new Error(error || 'Failed to approve registration');
    }
  },

  rejectRegistration: async (requestId) => {
    try {
      const data = await ApiClient.post(API_ENDPOINTS.AUTH.REGISTRATION_REJECT(requestId));
      return data;
    } catch (error) {
      throw new Error(error || 'Failed to reject registration');
    }
  },
};

export default authApi;
