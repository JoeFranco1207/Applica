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
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

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
      });

      newSocket.on('notification', (notification) => {
        console.log('Received notification:', notification);
        
        // Add notification to state
        const newNotif = {
            id: notification._id || notification.id || Date.now(),
            ...notification,
            read: false,
            createdAt: notification.createdAt || new Date(),
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
    isConnected,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

