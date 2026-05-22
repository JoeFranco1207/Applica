let ioRef = null;
const userSockets = new Map();

export const setIo = (io) => {
  ioRef = io;
};

export const registerSocketUser = (userId, socketId) => {
  if (!userId) return;
  userSockets.set(userId.toString(), socketId);
};

export const unregisterSocketById = (socketId) => {
  for (const [userId, storedSocketId] of userSockets.entries()) {
    if (storedSocketId === socketId) {
      userSockets.delete(userId);
      break;
    }
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

export const sendChatMessageDeletedToUser = (userId, payload) => {
  if (!ioRef) return;
  const socketId = userSockets.get(userId.toString());
  if (socketId) {
    ioRef.to(socketId).emit('chat:message-deleted', payload);
    console.log(`Chat delete event sent to user ${userId}`);
  }
};

export const broadcastPostUpdate = (postData) => {
  if (!ioRef || !postData) return;
  ioRef.emit('post:updated', postData);
  console.log(`Broadcasted post update for post ${postData._id || postData.id}`);
};
