import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const relevantNotificationTypes = ['like', 'share', 'repost', 'comment', 'reply', 'apply', 'status', 'connection'];

  const isRelevantNotification = (notification) => {
    if (!notification || !notification.type) return false;
    if (!relevantNotificationTypes.includes(notification.type)) return false;
    if (notification.type === 'status') {
      const message = String(notification.message || '').toLowerCase();
      return /accept|accepted|reject|rejected|rejection/.test(message);
    }
    return true;
  };

  const fetchUnreadCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(
        'http://localhost:8000/api/notifications/unread/count?types=like,share,repost,comment,reply,apply,status,connection',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data?.data?.count != null) {
        setUnreadCount(data.data.count);
      }
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err);
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(
        'http://localhost:8000/api/notifications?types=like,share,repost,comment,reply,apply,status,connection',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      const items = (data?.data?.notifications || [])
        .filter(isRelevantNotification)
        .map((notification) => ({
          id: notification._id || notification.id,
          ...notification,
          createdAt: notification.createdAt || new Date(),
        }));
      setNotifications(items);
      setUnreadCount(items.filter((notification) => !notification.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Initialize socket connection and unread badge count
  useEffect(() => {
    const token = localStorage.getItem('token');
    let userId = null;
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      userId = storedUser?._id || storedUser?.id || null;
    } catch (err) {
      userId = null;
    }

    fetchUnreadCount();
    fetchNotifications();

    if (token && userId) {
      console.log('Initializing Socket.IO connection for user:', userId);
      
      const newSocket = io('http://localhost:8000', {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      newSocket.on('connect', () => {
        console.log('Connected to notifications server with socket ID:', newSocket.id);
        setIsConnected(true);
        // Register user with socket server
        newSocket.emit('register', userId);
        console.log('Registered user:', userId);

        // Optimistically mark the current user online unless they are in DND.
        const initialPresenceMode = storedUser?.presenceMode === 'dnd' ? 'dnd' : 'online';
        const selfPresenceEvent = new CustomEvent('app:userPresenceUpdated', {
          detail: {
            userId,
            isOnline: initialPresenceMode === 'online',
            lastActive: null,
            presenceMode: initialPresenceMode,
          },
        });
        window.dispatchEvent(selfPresenceEvent);
      });

      newSocket.on('notification', (notification) => {
        console.log('Received notification:', notification);

        if (!isRelevantNotification(notification)) {
          return;
        }

        // Keep unread badge updated in real time
        setUnreadCount((prev) => prev + 1);

        setNotifications((prev) => [
          {
            id: notification._id || notification.id || Date.now(),
            ...notification,
            read: false,
            createdAt: notification.createdAt || new Date(),
          },
          ...prev,
        ]);
      });

      // Listen for user presence updates and broadcast as a DOM event
      newSocket.on('user:presence', (payload) => {
        try {
          console.log('Received user presence update:', payload);
          const ev = new CustomEvent('app:userPresenceUpdated', { detail: payload });
          window.dispatchEvent(ev);
        } catch (err) {
          console.error('Error handling user presence update:', err);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from notifications server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });

      newSocket.on('error', (error) => {
        console.error('Socket.IO error:', error);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.disconnect();
      };
    }
  }, []);

  const setPresence = (mode) => {
    if (!socket) return;
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = storedUser?._id || storedUser?.id || null;
      socket.emit('presence:set', { userId, mode });
      // optimistic update: broadcast locally so UI updates immediately
      const evt = new CustomEvent('app:userPresenceUpdated', { detail: { userId, isOnline: mode === 'online', lastActive: mode === 'offline' ? new Date() : null, presenceMode: mode } });
      window.dispatchEvent(evt);
    } catch (err) {
      console.error('Failed to set presence:', err);
    }
  };

  const removeNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const deleteNotification = async (notificationId) => {
    const token = localStorage.getItem('token');
    if (!token || !notificationId) return;
    try {
      await axios.delete(
        `http://localhost:8000/api/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // remove locally and adjust unread count
      setNotifications((prev) => {
        const wasUnread = prev.find((n) => n.id === notificationId && !n.read);
        if (wasUnread) {
          setUnreadCount((u) => Math.max(u - 1, 0));
        }
        return prev.filter((n) => n.id !== notificationId);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    const token = localStorage.getItem('token');
    if (!token || !notificationId) return;

    try {
      await axios.patch(
        `http://localhost:8000/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNotifications((prev) => prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      ));
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const value = {
    notifications,
    socket,
    unreadCount,
    removeNotification,
    markNotificationAsRead,
    fetchNotifications,
    clearNotifications,
    markAsRead,
    deleteNotification,
    isConnected,
    setPresence,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};


