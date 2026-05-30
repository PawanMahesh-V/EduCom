import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { notificationApi } from '../api';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { socketService, isConnected } = useSocket();
  const { user } = useAuth(); // Safely accessing personalized global state
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derive unread counts dynamically
  const unreadCount = notifications.filter(n => !n.is_read).length;

  /* ==========================================================================
     1. BASE ARCHITECTURE DATA-FETCHING EFFECTS
     ========================================================================== */
  useEffect(() => {
    const fetchNotifications = async () => {
        try {
            if (!user || (!user.id && !user.userId)) {
              setLoading(false);
              return;
            }
            
            setLoading(true);
            const userId = user.id || user.userId;
            const data = await notificationApi.getAll(userId);
            
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        } catch (err) {
            console.error("[NotificationProvider] Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };
    
    fetchNotifications();
  }, [user]);

  /* ==========================================================================
     2. REAL-TIME EVENT STREAM SUBSCRIPTIONS
     ========================================================================== */
  useEffect(() => {
      if (!isConnected || !socketService) return;

      const handleNewNotification = (notification) => {
          console.log('[NotificationProvider] New notification received:', notification);
          setNotifications(prev => [notification, ...prev]);
      };

      socketService.onNewNotification(handleNewNotification);
      
      return () => {
          socketService.offNewNotification();
      };
  }, [isConnected, socketService]);

  /* ==========================================================================
     3. CONTEXT PROVIDER OPERATION INTERACTION HANDLERS
     ========================================================================== */
  const markAsRead = async (id) => {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      
      try {
          await notificationApi.markAsRead(id);
      } catch (err) {
          console.error("[NotificationProvider] Failed to mark read", err);
       }
  };

  const markAllAsRead = async () => {
      const userId = user?.id || user?.userId;
      if (!userId) return;

      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      try {
          await notificationApi.markAllAsRead();
      } catch (err) {
          console.error("[NotificationProvider] Failed to mark all as read", err);
      }
  };

  const clearContextNotifications = async (courseId, senderId) => {
      // Optimistic update
      setNotifications(prev => prev.map(n => {
          if (courseId && n.course_id === courseId) return { ...n, is_read: true };
          if (senderId && n.sender_id === senderId) return { ...n, is_read: true };
          return n;
      }));

      try {
          if (courseId) {
              await notificationApi.markAsReadByContext(courseId);
          } else if (senderId) {
              await notificationApi.markAsReadBySender(senderId);
          }
      } catch (err) {
          console.error("[NotificationProvider] Failed to clear context notifications", err);
      }
  };

  // Memoizing operations prevents unneeded downstream tree component mutations
  const contextValue = useMemo(() => ({
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearContextNotifications, 
    loading
  }), [notifications, unreadCount, loading, user]);

  return (
      <NotificationContext.Provider value={contextValue}>
          {children}
      </NotificationContext.Provider>
  );
};

export default NotificationContext;