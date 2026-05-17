import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:8000/api/notifications?limit=100',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications(response.data.data.notifications || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `http://localhost:8000/api/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await axios.delete(
        `http://localhost:8000/api/notifications/${notificationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

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

  const getNotificationTitle = (type, actorName) => {
    switch (type) {
      case 'like':
      case 'react':
        return `${actorName} reacted to your post`;
      case 'comment':
        return `${actorName} commented on your post`;
      case 'view':
        return `${actorName} viewed your post`;
      case 'share':
        return `${actorName} shared your post`;
      case 'repost':
        return `${actorName} reposted your post`;
      default:
        return `${actorName} interacted with you`;
    }
  };

  if (loading) {
    return <div className="notifications-container loading">Loading notifications...</div>;
  }

  if (error) {
    return <div className="notifications-container error">{error}</div>;
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <p>Stay updated with your interactions</p>
      </div>

      {notifications.length === 0 ? (
        <div className="no-notifications">
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-body">
                <div className="notification-author">
                  {notification.actorAvatar && (
                    <img
                      src={notification.actorAvatar}
                      alt={notification.actorName}
                      className="notification-avatar"
                    />
                  )}
                  <div className="notification-info">
                    <h3 className="notification-title">
                      {getNotificationTitle(notification.type, notification.actorName)}
                    </h3>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                {notification.message && (
                  <p className="notification-message">{notification.message}</p>
                )}
              </div>
              <div className="notification-actions">
                {!notification.read && (
                  <button
                    className="action-btn read-btn"
                    onClick={() => handleMarkAsRead(notification._id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(notification._id)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
