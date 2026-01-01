import { io } from 'socket.io-client';
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
      console.log('[SocketService] Already connected, socket id:', this.socket.id);
      return this.socket;
    }
    
    // If socket exists but not connected, don't create new one - just return existing
    if (this.socket) {
      console.log('[SocketService] Socket exists, waiting for connection...');
      return this.socket;
    }
    
    console.log('[SocketService] Creating new socket connection to:', SOCKET_URL);
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('[SocketService] Connected! Socket id:', this.socket.id);
      
      // Register user
      if (this.userId) {
        console.log('[SocketService] Registering user:', this.userId);
        this.socket.emit('register', this.userId);
      }
    });
    this.socket.on('disconnect', () => {
      console.log('[SocketService] Disconnected');
      this.isConnected = false;
    });
    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error);
    });
    
    // Debug: log all incoming events
    this.socket.onAny((event, ...args) => {
      console.log('[SocketService] Received event:', event, args);
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
    
    // If socket doesn't exist, try to connect first
    if (!this.socket && this.userId) {
      console.log('[SocketService] Socket not found, attempting to connect...');
      this.connect(this.userId);
    }
    
    if (this.socket) {
      if (this.socket.connected) {
        console.log('[SocketService] Emitting send-direct-message event');
        this.socket.emit('send-direct-message', data);
      } else {
        console.log('[SocketService] Socket exists but not connected, waiting...');
        // Wait for connection and then send
        this.socket.once('connect', () => {
          console.log('[SocketService] Now connected, emitting send-direct-message event');
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
}
// Create singleton instance
const socketService = new SocketService();
export default socketService;
