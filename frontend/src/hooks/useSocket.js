import { useEffect } from 'react';
import socketService from '../services/socket';
export const useSocket = () => {
  return socketService;
};
export const useCommunityMessages = (communityId, onNewMessage, onMessageDeleted) => {
  useEffect(() => {
    if (!communityId) {
      return;
    }
    // Only join/leave community room - listeners are managed globally in dashboards
    socketService.joinCommunity(communityId);
    // Setup message listener for this specific chat
    const messageHandler = onNewMessage;
    const deleteHandler = onMessageDeleted;
    if (messageHandler) {
      socketService.socket?.on('new-message', messageHandler);
    }
    if (deleteHandler) {
      socketService.socket?.on('message-deleted', deleteHandler);
    }
    // Cleanup
    return () => {
      socketService.leaveCommunity(communityId);
      if (messageHandler) {
        socketService.socket?.off('new-message', messageHandler);
      }
      if (deleteHandler) {
        socketService.socket?.off('message-deleted', deleteHandler);
      }
    };
  }, [communityId, onNewMessage, onMessageDeleted]);
  return {
    sendMessage: (message, senderId, senderName) => {
      socketService.sendMessage({
        communityId,
        message,
        senderId,
        senderName
      });
    },
    deleteMessage: (messageId) => {
      socketService.deleteMessage(messageId, communityId);
    }
  };
};
export const useTypingIndicator = (communityId, userName) => {
  useEffect(() => {
    if (!communityId) return;
    let typingTimeout;
    const handleTyping = (isTyping) => {
      socketService.sendTyping(communityId, userName, isTyping);
      
      if (isTyping) {
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          socketService.sendTyping(communityId, userName, false);
        }, 2000);
      }
    };
    return () => {
      clearTimeout(typingTimeout);
      socketService.offUserTyping();
    };
  }, [communityId, userName]);
  return {
    onTyping: (callback) => socketService.onUserTyping(callback),
    startTyping: () => socketService.sendTyping(communityId, userName, true),
    stopTyping: () => socketService.sendTyping(communityId, userName, false)
  };
};
export const useNotifications = (onNewNotification) => {
  useEffect(() => {
    if (onNewNotification) {
      socketService.onNewNotification(onNewNotification);
    }
    return () => {
      socketService.offNewNotification();
    };
  }, [onNewNotification]);
  return {
    sendNotification: (userId, title, message, type, senderId) => {
      socketService.sendNotification({
        userId,
        title,
        message,
        type,
        senderId
      });
    },
    broadcastNotification: (role, title, message, type, senderId) => {
      socketService.broadcastNotification({
        role,
        title,
        message,
        type,
        senderId
      });
    }
  };
};
export const useUserStatus = (onUserStatus) => {
  useEffect(() => {
    if (onUserStatus) {
      socketService.onUserStatus(onUserStatus);
    }
    return () => {
      socketService.offUserStatus();
    };
  }, [onUserStatus]);
};
export const useDirectMessages = (userId, onNewMessage) => {
  useEffect(() => {
    if (!userId) return;
    const handleNewMessage = (message) => {
      if (onNewMessage) {
        onNewMessage(message);
      }
    };
    const handleMessageSent = (message) => {
      if (onNewMessage) {
        onNewMessage(message);
      }
    };
    socketService.onNewDirectMessage(handleNewMessage);
    socketService.onDirectMessageSent(handleMessageSent);
    return () => {
      socketService.offNewDirectMessage();
      socketService.offDirectMessageSent();
    };
  }, [userId, onNewMessage]);
  return {
    sendDirectMessage: (receiverId, message, senderName) => {
      socketService.sendDirectMessage({
        senderId: userId,
        receiverId,
        message,
        senderName
      });
    }
  };
};
export const useDMTypingIndicator = (receiverId, senderName) => {
  useEffect(() => {
    if (!receiverId) return;
    let typingTimeout;
    return () => {
      clearTimeout(typingTimeout);
      socketService.offDMUserTyping();
    };
  }, [receiverId, senderName]);
  return {
    onTyping: (callback) => socketService.onDMUserTyping(callback),
    startTyping: () => socketService.sendDMTyping(receiverId, senderName, true),
    stopTyping: () => socketService.sendDMTyping(receiverId, senderName, false)
  };
};
