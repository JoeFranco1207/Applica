import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import './NotificationPopup.css';

const NotificationPopup = () => {
  const { notifications, removeNotification } = useNotification();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
      case 'react':
        return '❤️';
      case 'comment':
        return '💬';
      case 'view':
        return '👁️';
      case 'share':
        return '🔗';
      case 'repost':
        return '🔄';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like':
      case 'react':
        return '#e74c3c';
      case 'comment':
        return '#3498db';
      case 'view':
        return '#9b59b6';
      case 'share':
        return '#1abc9c';
      case 'repost':
        return '#f39c12';
      default:
        return '#34495e';
    }
  };

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="notification-item"
          style={{ borderLeftColor: getNotificationColor(notification.type) }}
        >
          <div className="notification-icon">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="notification-content">
            <p className="notification-message">
              {notification.message || `New ${notification.type} notification`}
            </p>
            <span className="notification-time">
              {new Date(notification.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationPopup;
