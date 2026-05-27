import User from '../Model/UserSchema.js';

let ioRef = null;
const userSockets = new Map();

export const setIo = (io) => {
  ioRef = io;
};

export const registerSocketUser = async (userId, socketId) => {
  if (!userId) return;
  userSockets.set(userId.toString(), socketId);
  try {
    // respect existing presenceMode (e.g., dnd) when setting online
    const user = await User.findById(userId).select('presenceMode');
    const presenceMode = (user && user.presenceMode === 'dnd') ? 'dnd' : 'online';
    await User.findByIdAndUpdate(userId, { isOnline: true, presenceMode }, { new: true });
    if (ioRef) {
      ioRef.emit('user:presence', { userId, isOnline: true, lastActive: null, presenceMode });
    }
  } catch (err) {
    console.error('Error setting user online:', err.message || err);
  }
};

export const unregisterSocketById = async (socketId) => {
  for (const [userId, storedSocketId] of userSockets.entries()) {
    if (storedSocketId === socketId) {
      userSockets.delete(userId);
      try {
        const lastActive = new Date();
        // on disconnect set to offline
        await User.findByIdAndUpdate(userId, { isOnline: false, lastActive, presenceMode: 'offline' }, { new: true });
        if (ioRef) {
          ioRef.emit('user:presence', { userId, isOnline: false, lastActive, presenceMode: 'offline' });
        }
      } catch (err) {
        console.error('Error setting user offline:', err.message || err);
      }
      break;
    }
  }
};

export const setUserPresence = async (userId, mode) => {
  if (!userId || !mode) return;
  if (!['online', 'offline', 'dnd'].includes(mode)) return;
  try {
    const update = { presenceMode: mode, isOnline: mode === 'online' };
    if (mode === 'offline') update.lastActive = new Date();
    await User.findByIdAndUpdate(userId, update, { new: true });
    if (ioRef) {
      ioRef.emit('user:presence', { userId, isOnline: update.isOnline, lastActive: update.lastActive || null, presenceMode: mode });
    }
  } catch (err) {
    console.error('Error updating user presence mode:', err.message || err);
  }
};

export const sendNotificationToUser = (userId, notification) => {
  if (!ioRef) return;
  const socketId = userSockets.get(userId.toString());
  if (socketId) {
    ioRef.to(socketId).emit('notification', notification);
    console.log(`Notification sent to user ${userId}`);
  }
};

export const sendChatMessageToUser = (userId, message) => {
  if (!ioRef) return;
  const socketId = userSockets.get(userId.toString());
  if (socketId) {
    ioRef.to(socketId).emit('chat:message', message);
    console.log(`Chat message sent to user ${userId}`);
  }
};

export const sendInterviewInvite = (userId, interview) => {
  if (!ioRef) return;
  const socketId = userSockets.get(userId.toString());
  if (socketId) {
    ioRef.to(socketId).emit('interview:invited', interview);
    console.log(`Interview invite sent to user ${userId}`);
  }
};

export const sendChatMessageDeletedToUser = (userId, payload) => {
  if (!ioRef) return;
  const socketId = userSockets.get(userId.toString());
  if (socketId) {
    ioRef.to(socketId).emit('chat:message-deleted', payload);
    console.log(`Chat delete event sent to user ${userId}`);
  }
};

export const getSocketIdByUser = (userId) => {
  if (!userId) return null;
  return userSockets.get(userId.toString()) || null;
};

export const broadcastPostUpdate = (postData) => {
  if (!ioRef || !postData) return;
  ioRef.emit('post:updated', postData);
  console.log(`Broadcasted post update for post ${postData._id || postData.id}`);
};
