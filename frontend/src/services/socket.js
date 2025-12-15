import { io } from 'socket.io-client';
// Socket.IO connects to the root server URL, not the /api path
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }
  connect(userId) {
    if (this.socket?.connected) {
      return this.socket;
    }
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    this.socket.on('connect', () => {
      this.isConnected = true;
      
      // Register user
      if (userId) {
        this.socket.emit('register', userId);
      }
    });
    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });
    this.socket.on('connect_error', (error) => {
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
  joinCommunity(communityId) {
    if (this.socket) {
      this.socket.emit('join-community', communityId);
    } else {
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
  // Direct Message methods
  sendDirectMessage(data) {
    console.log('[SocketService] sendDirectMessage called with data:', data);
    if (this.socket) {
      console.log('[SocketService] Emitting send-direct-message event');
      this.socket.emit('send-direct-message', data);
    } else {
      console.error('[SocketService] Socket not connected');
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
}
// Create singleton instance
const socketService = new SocketService();
export default socketService;
