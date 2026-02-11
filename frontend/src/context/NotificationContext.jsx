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
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
                setUnreadCount(data.filter(n => !n.is_read).length);
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
          setUnreadCount(prev => prev + 1);
          
          // Trigger global alert
          showAlert(notification.title || 'New Notification', 'info');
      };
      socketService.onNewNotification(handleNewNotification);
      return () => {
          socketService.offNewNotification();
      }
  }, [isConnected, socketService]);

  const markAsRead = async (id) => {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
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
      setUnreadCount(0);
  };

  return (
      <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, loading }}>
          {children}
      </NotificationContext.Provider>
  );
};
