import ApiClient from './client';
import { API_ENDPOINTS } from '../config/api';

class ModerationApi {
  async getReportedMessages() {
    return ApiClient.get(API_ENDPOINTS.MODERATION.REPORTED_MESSAGES);
  }

  async approveMessage(id) {
    return ApiClient.put(API_ENDPOINTS.MODERATION.APPROVE(id));
  }

  async rejectMessage(id) {
    return ApiClient.put(API_ENDPOINTS.MODERATION.REJECT(id));
  }

  async banUser(userId, messageId) {
    return ApiClient.post(API_ENDPOINTS.MODERATION.BAN_USER(userId, messageId));
  }

  async getBannedUsers() {
    return ApiClient.get(API_ENDPOINTS.MODERATION.BANNED_USERS);
  }

  async unbanUser(userId) {
    return ApiClient.put(API_ENDPOINTS.MODERATION.UNBAN_USER(userId));
  }
}

export default new ModerationApi();
