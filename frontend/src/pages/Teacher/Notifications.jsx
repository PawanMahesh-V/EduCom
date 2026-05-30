import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '../../context/NotificationContext';

const Notifications = () => {
  const { notifications, loading, markAsRead } = useNotifications();

  return (
    <div className="nt-viewport">
      <div className="nt-header">
        <h1 className="nt-title">Notification Feed</h1>
        <p className="nt-subtitle">Stay synchronized with your latest course activities and system updates</p>
      </div>
      
      {loading ? (
        <div className="nt-state-message">
          <div className="nt-spinner"></div>
          <span>Syncing notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="nt-state-message">
          <FontAwesomeIcon icon={faBell} className="nt-empty-icon" />
          <p>No new notifications available.</p>
        </div>
      ) : (
        <div className="nt-list-stack">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`nt-item ${notification.is_read ? 'nt-item--read' : 'nt-item--unread'}`}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <div className="nt-icon-wrapper">
                <FontAwesomeIcon icon={faBell} />
              </div>
              <div className="nt-body">
                <h4 className="nt-item-title">{notification.title}</h4>
                <p className="nt-item-message">{notification.message}</p>
                <span className="nt-item-time">
                  {new Date(notification.created_at).toLocaleString('en-PK', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
              {!notification.is_read && (
                <div className="nt-unread-badge">New</div>
              )}
              {notification.is_read && (
                <div className="nt-read-tick"><FontAwesomeIcon icon={faCheckCircle} /></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;