import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { notificationApi } from '../api';
import { showAlert } from '../utils/alert';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

import { useAuth } from './AuthContext';

// ...

export const NotificationProvider = ({ children }) => {
  const { socketService, isConnected } = useSocket();
  const { user } = useAuth(); // Use centralized auth state
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derive unread count dynamically
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fetch initial notifications on mount
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
            
            // Ensure data is an array
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

  // Listen for real-time notifications
  useEffect(() => {
      if (!isConnected) return;

      const handleNewNotification = (notification) => {
          console.log('[NotificationProvider] New notification received:', notification);
          setNotifications(prev => [notification, ...prev]);
      };
      socketService.onNewNotification(handleNewNotification);
      return () => {
          socketService.offNewNotification();
      }
  }, [isConnected, socketService]);

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

  return (
      <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearContextNotifications, loading }}>
          {children}
      </NotificationContext.Provider>
  );
};
