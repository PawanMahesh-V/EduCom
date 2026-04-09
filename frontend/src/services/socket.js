import { io } from 'socket.io-client';//
// Socket.IO connects to the root server URL, not the /api path
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
  }
  connect(userId) {
    // Store userId for re-registration
    if (userId) {
      this.userId = userId;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    // If socket exists but not connected, don't create new one - just return existing
    if (this.socket) {
      return this.socket;
    }

    const token = localStorage.getItem('userToken');
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    this.socket.on('connect', () => {
      this.isConnected = true;

      // Register user
      if (this.userId) {
        this.socket.emit('register', this.userId);
      }
    });
    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });
    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error);
    });

    return this.socket;
  }
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
  // Community/Chat methods
  joinCommunity(communityId, userId, userName) {
    if (this.socket) {
      this.socket.emit('join-community', { communityId, userId, userName });
    }
  }
  leaveCommunity(communityId) {
    if (this.socket) {
      this.socket.emit('leave-community', communityId);
    }
  }
  sendMessage(data) {
    if (this.socket) {
      this.socket.emit('send-message', data);
    } else {
    }
  }
  deleteMessage(messageId, communityId) {
    if (this.socket) {
      this.socket.emit('delete-message', { messageId, communityId });
    }
  }
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }
  onMessageDeleted(callback) {
    if (this.socket) {
      this.socket.on('message-deleted', callback);
    }
  }
  offNewMessage() {
    if (this.socket) {
      this.socket.off('new-message');
    }
  }
  offMessageDeleted() {
    if (this.socket) {
      this.socket.off('message-deleted');
    }
  }
  // Typing indicator
  sendTyping(communityId, userName, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { communityId, userName, isTyping });
    }
  }
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }
  offUserTyping() {
    if (this.socket) {
      this.socket.off('user-typing');
    }
  }
  // Notification methods
  sendNotification(data) {
    if (this.socket) {
      this.socket.emit('send-notification', data);
    }
  }
  broadcastNotification(data) {
    if (this.socket) {
      this.socket.emit('broadcast-notification', data);
    }
  }
  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on('new-notification', callback);
    }
  }
  offNewNotification() {
    if (this.socket) {
      this.socket.off('new-notification');
    }
  }
  // User status
  onUserStatus(callback) {
    if (this.socket) {
      this.socket.on('user-status', callback);
    }
  }
  offUserStatus() {
    if (this.socket) {
      this.socket.off('user-status');
    }
  }
  // Enrollment events
  onUserEnrolled(callback) {
    if (this.socket) {
      this.socket.on('user-enrolled', callback);
    }
  }
  offUserEnrolled() {
    if (this.socket) {
      this.socket.off('user-enrolled');
    }
  }
  // Direct Message methods
  sendDirectMessage(data) {
    // If socket doesn't exist, try to connect first
    if (!this.socket && this.userId) {
      this.connect(this.userId);
    }

    if (this.socket) {
      if (this.socket.connected) {
        this.socket.emit('send-direct-message', data);
      } else {
        // Wait for connection and then send
        this.socket.once('connect', () => {
          this.socket.emit('send-direct-message', data);
        });
      }
    } else {
      console.error('[SocketService] Socket not available and no userId to connect');
    }
  }
  onNewDirectMessage(callback) {
    if (this.socket) {
      this.socket.on('new-direct-message', callback);
    }
  }
  onDirectMessageSent(callback) {
    if (this.socket) {
      this.socket.on('direct-message-sent', callback);
    }
  }
  offNewDirectMessage() {
    if (this.socket) {
      this.socket.off('new-direct-message');
    }
  }
  offDirectMessageSent() {
    if (this.socket) {
      this.socket.off('direct-message-sent');
    }
  }
  sendDMTyping(receiverId, senderName, isTyping) {
    if (this.socket) {
      this.socket.emit('dm-typing', { receiverId, senderName, isTyping });
    }
  }
  onDMUserTyping(callback) {
    if (this.socket) {
      this.socket.on('dm-user-typing', callback);
    }
  }
  offDMUserTyping() {
    if (this.socket) {
      this.socket.off('dm-user-typing');
    }
  }

  // Message delivery and read receipts
  markMessageDelivered(messageId) {
    if (this.socket) {
      this.socket.emit('mark-message-delivered', { messageId });
    }
  }

  markMessageRead(messageId, userId) {
    if (this.socket) {
      this.socket.emit('mark-message-read', { messageId, userId });
    }
  }

  markMessagesRead(messageIds, userId) {
    if (this.socket && messageIds && messageIds.length > 0) {
      this.socket.emit('mark-messages-read', { messageIds, userId });
    }
  }

  onMessageDelivered(callback) {
    if (this.socket) {
      this.socket.on('message-delivered', callback);
    }
  }

  onMessageRead(callback) {
    if (this.socket) {
      this.socket.on('message-read', callback);
    }
  }

  offMessageDelivered() {
    if (this.socket) {
      this.socket.off('message-delivered');
    }
  }

  offMessageRead() {
    if (this.socket) {
      this.socket.off('message-read');
    }
  }
}
// Create singleton instance
const socketService = new SocketService();
export default socketService;
