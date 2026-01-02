import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { notificationApi } from '../../api';
import { useNotifications } from '../../hooks/useSocket';
import { showAlert } from '../../utils/alert';

const Notifications = () => {
  const raw = sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const userId = user?.id || user?.userId;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time notifications
  useNotifications((notification) => {
    showAlert(notification.title, notification.message, notification.type || 'info');
    setNotifications(prev => [notification, ...prev]);
  });

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getAll({ userId });
      setNotifications(response.notifications || []);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      showAlert('Error', 'Failed to mark notification as read', 'error');
    }
  };

  return (
    <div className="container">
      <div className="notifications-header">
        <h1 className="mb-1">Notifications</h1>
        <p className="text-secondary m-0">Stay updated with your course activities</p>
      </div>
      
      {loading ? (
        <div className="text-center p-4 text-secondary">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state text-center p-4 text-secondary">
          <FontAwesomeIcon icon={faBell} className="icon-xl mb-3 opacity-30" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
              onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
            >
              <div className="notification-icon">
                <FontAwesomeIcon icon={faBell} />
              </div>
              <div className="notification-content">
                <h4 className="notification-title">{notification.title}</h4>
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">
                  {new Date(notification.created_at).toLocaleString('en-PK', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Karachi'
                  })}
                </span>
              </div>
              {!notification.is_read && (
                <div className="notification-badge">New</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
