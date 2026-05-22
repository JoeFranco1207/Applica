import AppError from '../Middleware/AppError.js';
import Notification from '../Model/NotificationSchema.js';
import User from '../Model/UserSchema.js';
import Job from '../Model/JobSchema.js';
import Post from '../Model/PostSchema.js';
import { sendNotificationToUser } from './SocketIO.service.js';

export const createNotificationService = async (notificationData) => {
  const { type, recipient, actor, message, postId, jobId, commentId, replyId } = notificationData;

  if (!recipient) {
    throw new AppError('Recipient is required', 400);
  }

  let actorName = 'Applica';
  let actorAvatar = '';
  let actorId = actor || null;

  if (actor) {
    if (recipient.toString() === actor.toString()) {
      return null;
    }

    const actorUser = await User.findById(actor);
    if (!actorUser) {
      throw new AppError('Actor user not found', 404);
    }

    actorName = actorUser.role === 'employer'
      ? actorUser.companyName || `${actorUser.firstName || ''} ${actorUser.lastName || ''}`.trim() || actorUser.email
      : `${actorUser.firstName || ''} ${actorUser.lastName || ''}`.trim() || actorUser.email;
    actorAvatar = actorUser.role === 'employer' ? actorUser.companyLogo : actorUser.profilePicture;
  }

  const notification = await Notification.create({
    type,
    recipient,
    actor: actorId,
    actorName,
    actorAvatar,
    message,
    postId,
    commentId,
    replyId,
    jobId,
    read: false,
  });

  // Emit real-time notification via Socket.IO
  try {
    sendNotificationToUser(recipient, {
      _id: notification._id,
      type,
      actor: actorId,
      actorName: notification.actorName,
      actorAvatar: notification.actorAvatar,
      message,
      postId,
      commentId,
      replyId,
      jobId,
      createdAt: notification.createdAt,
    });
  } catch (err) {
    console.error('Error sending real-time notification:', err);
  }

  return notification;
};

export const createSystemNotificationService = async (recipient, message, type = 'status') => {
  if (!recipient) {
    throw new AppError('Recipient is required', 400);
  }

  const notification = await Notification.create({
    type,
    recipient,
    actor: null,
    actorName: 'Applica',
    actorAvatar: '',
    message,
    read: false,
  });

  try {
    sendNotificationToUser(recipient, {
      _id: notification._id,
      type,
      actor: null,
      actorName: notification.actorName,
      actorAvatar: notification.actorAvatar,
      message,
      createdAt: notification.createdAt,
    });
  } catch (err) {
    console.error('Error sending real-time notification:', err);
  }

  return notification;
};

export const getNotificationsService = async (userId, options = {}) => {
  const { limit = 50, skip = 0, unreadOnly = false, types } = options;

  const filter = { recipient: userId };
  if (unreadOnly) filter.read = false;
  if (types && types.length > 0) {
    filter.type = { $in: types };
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('actor', 'firstName lastName email')
    .populate('postId', 'content')
    .populate('jobId', 'title');

  const total = await Notification.countDocuments(filter);

  return { notifications, total };
};

export const markNotificationAsReadService = async (notificationId) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return notification;
};

export const deleteNotificationService = async (notificationId) => {
  const result = await Notification.findByIdAndDelete(notificationId);

  if (!result) {
    throw new AppError('Notification not found', 404);
  }

  return result;
};

export const getUnreadCountService = async (userId, options = {}) => {
  const { types } = options;
  const filter = {
    recipient: userId,
    read: false,
  };

  if (types && types.length > 0) {
    filter.type = { $in: types };
  }

  const count = await Notification.countDocuments(filter);
  return count;
};
