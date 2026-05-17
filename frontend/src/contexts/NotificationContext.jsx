import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (token && userId) {
      const newSocket = io('http://localhost:8000', {
        auth: {
          token,
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to notifications server');
        // Register user with socket server
        newSocket.emit('register', userId);
      });

      newSocket.on('notification', (notification) => {
        console.log('Received notification:', notification);
        
        // Add notification to state
        const newNotif = {
          id: Date.now(),
          ...notification,
          read: false,
          createdAt: new Date(),
        };
        
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Optional: Auto-dismiss after 5 seconds
        setTimeout(() => {
          removeNotification(newNotif.id);
        }, 5000);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from notifications server');
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.disconnect();
      };
    }
  }, []);

  const removeNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
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
    clearNotifications,
    markAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
