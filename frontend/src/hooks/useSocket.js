import { useEffect, useRef, useCallback } from 'react';
import socketService from '../services/socket';
export const useSocket = () => {
  return socketService;
};
export const useCommunityMessages = (communityId, onNewMessage, onMessageDeleted) => {
  // Use refs to avoid stale closures - callbacks always use latest version
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  
  // Update refs when callbacks change
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);
  
  useEffect(() => {
    onMessageDeletedRef.current = onMessageDeleted;
  }, [onMessageDeleted]);
  
  useEffect(() => {
    if (!communityId) {
      return;
    }
    // Only join/leave community room - listeners are managed globally in dashboards
    socketService.joinCommunity(communityId);
    // Setup message listener using refs to avoid stale closures
    const messageHandler = (data) => {
      if (onNewMessageRef.current) {
        onNewMessageRef.current(data);
      }
    };
    const deleteHandler = (data) => {
      if (onMessageDeletedRef.current) {
        onMessageDeletedRef.current(data);
      }
    };
    
    socketService.socket?.on('new-message', messageHandler);
    socketService.socket?.on('message-deleted', deleteHandler);
    
    // Cleanup
    return () => {
      socketService.leaveCommunity(communityId);
      socketService.socket?.off('new-message', messageHandler);
      socketService.socket?.off('message-deleted', deleteHandler);
    };
  }, [communityId]); // Only depend on communityId, not callbacks
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
  // Use ref to avoid stale closures
  const onNewMessageRef = useRef(onNewMessage);
  
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);
  
  useEffect(() => {
    if (!userId) return;
    
    const handleNewMessage = (message) => {
      if (onNewMessageRef.current) {
        onNewMessageRef.current(message);
      }
    };
    
    // Only listen for incoming messages, not sent ones (to avoid duplicates)
    socketService.onNewDirectMessage(handleNewMessage);
    
    return () => {
      socketService.offNewDirectMessage();
    };
  }, [userId]); // Only depend on userId
  
  return {
    sendDirectMessage: (receiverId, message, senderName, isAnonymous = false) => {
      console.log('[useSocket] sendDirectMessage called with isAnonymous:', isAnonymous);
      const data = {
        senderId: userId,
        receiverId,
        message,
        senderName,
        isAnonymous
      };
      console.log('[useSocket] Sending data to socket:', data);
      socketService.sendDirectMessage(data);
    }
  };
};
export const useDMTypingIndicator = (receiverId, senderName) => {
  // Use refs to avoid stale closures
  const receiverIdRef = useRef(receiverId);
  const senderNameRef = useRef(senderName);
  const typingCallbackRef = useRef(null);
  
  useEffect(() => {
    receiverIdRef.current = receiverId;
    senderNameRef.current = senderName;
  }, [receiverId, senderName]);
  
  useEffect(() => {
    if (!receiverId) return;
    
    return () => {
      socketService.offDMUserTyping();
    };
  }, [receiverId]);
  
  return {
    onTyping: (callback) => {
      // Store callback and register listener
      if (typingCallbackRef.current !== callback) {
        socketService.offDMUserTyping();
        typingCallbackRef.current = callback;
        socketService.onDMUserTyping(callback);
      }
    },
    startTyping: () => socketService.sendDMTyping(receiverIdRef.current, senderNameRef.current, true),
    stopTyping: () => socketService.sendDMTyping(receiverIdRef.current, senderNameRef.current, false)
  };
};
