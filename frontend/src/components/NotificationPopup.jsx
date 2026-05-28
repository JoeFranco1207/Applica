import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';
import './NotificationPopup.css';

// Icon Components
const HeartIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const EyeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ShareIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const RepostIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="17 2 21 6 17 10" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <polyline points="7 22 3 18 7 14" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </svg>
);

const BriefcaseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

const BellIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const InterviewIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 4h8v4H8z" />
  </svg>
);

const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ArrowRightIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

const NotificationPopup = () => {
  const { notifications, removeNotification } = useNotification();
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
      case 'react':
        return <HeartIcon size={18} />;
      case 'comment':
        return <CommentIcon size={18} />;
      case 'view':
        return <EyeIcon size={18} />;
      case 'share':
        return <ShareIcon size={18} />;
      case 'repost':
        return <RepostIcon size={18} />;
      case 'apply':
      case 'status':
      case 'interview:invited':
        return <BriefcaseIcon size={18} />;
      default:
        return <BellIcon size={18} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like':
      case 'react':
        return '#e74c3c';
      case 'comment':
        return '#1892aa';
      case 'view':
        return '#9b59b6';
      case 'share':
        return '#1abc9c';
      case 'repost':
        return '#f39c12';
      case 'apply':
      case 'status':
      case 'interview:invited':
        return '#0284c7';
      default:
        return '#616a85';
    }
  };

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="notification-item"
          style={{ borderLeftColor: getNotificationColor(notification.type), cursor: 'pointer' }}
          onClick={async () => {
            const token = localStorage.getItem('token');
            // Try to mark notification as read on server if we have an id
            try {
              if (notification.id && token) {
                await axios.post(`http://localhost:8000/api/notifications/${notification.id}/read`, {}, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              }
            } catch (err) {
              // ignore read errors
            }

            // Navigate to post if available (include commentId if present)
            if (notification.postId) {
              // normalize post id which can be populated object or string
              const pid = typeof notification.postId === 'string'
                ? notification.postId
                : (notification.postId && (notification.postId._id || notification.postId.id || notification.postId.toString())) || null;
              if (pid) {
                removeNotification(notification.id);
                const commentQuery = notification.commentId ? `?commentId=${notification.commentId}` : '';
                window.location.href = `/post/${pid}${commentQuery}`;
              }
            }
          }}
        >
          <div className="notification-icon" style={{ color: getNotificationColor(notification.type) }}>
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
          <div className="notification-actions">
            {notification.type === 'interview:invited' && notification.interview?.roomId && (
              <button
                className="notification-join"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                  navigate(`/interview/${notification.interview.roomId}`);
                }}
              >
                <ArrowRightIcon size={16} />
                Join
              </button>
            )}
            <button
              className="notification-close"
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationPopup;

