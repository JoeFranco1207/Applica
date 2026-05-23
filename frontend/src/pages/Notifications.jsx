import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

// Icon Components
const HeartIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const EyeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ShareIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const RepostIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="17 2 21 6 17 10" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <polyline points="7 22 3 18 7 14" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </svg>
);

const BriefcaseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

const BellIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const relevantNotificationTypes = ['like', 'share', 'repost', 'comment', 'reply', 'apply', 'status'];

  const isRelevantNotification = (notification) => {
    if (!notification || !notification.type) return false;
    if (!relevantNotificationTypes.includes(notification.type)) return false;
    if (notification.type === 'status') {
      const message = String(notification.message || '').toLowerCase();
      return /accept|accepted|reject|rejected|rejection/.test(message);
    }
    return true;
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:8000/api/notifications?limit=1000',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // show all notifications (no client-side type filtering)
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

  // Update notifications when presence updates arrive
  useEffect(() => {
    const handler = (e) => {
      const payload = e?.detail;
      if (!payload) return;
      const mode = payload.presenceMode || (payload.isOnline ? 'online' : 'offline');
      setNotifications((prev) => prev.map((n) => {
        const actorId = n.actor?._id || n.actorId || n.actor?.id || n.actor;
        if (!actorId) return n;
        if (actorId.toString() === (payload.userId || payload.user || '').toString()) {
          return { ...n, actorIsOnline: mode === 'online', actorLastActive: payload.lastActive || null, actorPresenceMode: mode };
        }
        return n;
      }));
    };
    window.addEventListener('app:userPresenceUpdated', handler);
    return () => window.removeEventListener('app:userPresenceUpdated', handler);
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
          (notif._id === notificationId || notif.id === notificationId) ? { ...notif, read: true } : notif
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
        prev.filter((notif) => (notif._id || notif.id) !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const navigate = useNavigate();

  const resolveId = (maybeObj) => {
    if (!maybeObj) return null;
    return typeof maybeObj === 'string' ? maybeObj : (maybeObj._id || maybeObj.id || null);
  };

  const openNotification = async (notification) => {
    if (!notification) return;
    const nid = notification._id || notification.id || (notification._id && notification._id.toString());
    try {
      // mark read on server
      if (nid) {
        await axios.patch(
          `http://localhost:8000/api/notifications/${nid}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotifications((prev) => prev.map((n) => ((n._id === nid || n.id === nid) ? { ...n, read: true } : n)));
      }
    } catch (err) {
      // ignore
    }

    // route to post if present
    const postId = resolveId(notification.postId) || notification.postId;
    if (postId) {
      navigate(`/post/${postId}${notification.commentId ? `?commentId=${notification.commentId}` : ''}`);
      return;
    }

    // route to job if present
    const jobId = resolveId(notification.jobId) || notification.jobId;
    if (jobId) {
      navigate(`/explore?jobId=${encodeURIComponent(jobId)}`, { state: { openJobId: jobId } });
      return;
    }

    // route to actor profile when available
    const actorId = notification.actor?._id || notification.actorId || notification.actor?.id || notification.actor || null;
    if (actorId) {
      navigate(`/profile/${actorId}`);
      return;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
      case 'react':
        return <HeartIcon size={20} />;
      case 'comment':
        return <CommentIcon size={20} />;
      case 'view':
        return <EyeIcon size={20} />;
      case 'share':
        return <ShareIcon size={20} />;
      case 'repost':
        return <RepostIcon size={20} />;
      case 'apply':
        return <BriefcaseIcon size={20} />;
      default:
        return <BellIcon size={20} />;
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
      case 'apply':
        return `${actorName} applied to your job`;
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
              key={notification._id || notification.id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => openNotification(notification)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-body">
                <div className="notification-author">
                  {(notification.actorAvatar || notification.actor?.profilePicture) && (
                    <div className="avatar-wrapper" style={{ position: 'relative' }}>
                      <img
                        src={notification.actorAvatar || notification.actor?.profilePicture}
                        alt={notification.actorName || (notification.actor && (notification.actor.firstName || notification.actor.name)) || 'User'}
                        className="notification-avatar"
                        onClick={(e) => { e.stopPropagation(); const aid = notification.actor?._id || notification.actorId || notification.actor?.id || notification.actor; if (aid) navigate(`/profile/${aid}`); }}
                      />
                      {notification.actorPresenceMode ? (
                        <span className={`presence-dot presence-${notification.actorPresenceMode}`} title={notification.actorPresenceMode}></span>
                      ) : null}
                    </div>
                  )}
                  <div className="notification-info">
                    <h3 className="notification-title">
                      <span onClick={(e) => { e.stopPropagation(); const aid = notification.actor?._id || notification.actorId || notification.actor?.id || notification.actor; if (aid) navigate(`/profile/${aid}`); }}>{getNotificationTitle(notification.type, notification.actorName || (notification.actor && `${notification.actor.firstName || ''} ${notification.actor.lastName || ''}`.trim()))}</span>
                    </h3>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    {notification.actorPresenceMode !== 'online' && notification.actorLastActive && (
                      <span className="last-active">{new Date(notification.actorLastActive).toLocaleString()}</span>
                    )}
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
                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification._id || notification.id); }}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => { e.stopPropagation(); handleDelete(notification._id || notification.id); }}
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

