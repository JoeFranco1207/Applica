import AppError from '../Middleware/AppError.js';
import Notification from '../Model/NotificationSchema.js';
import User from '../Model/UserSchema.js';
import Job from '../Model/JobSchema.js';
import Post from '../Model/PostSchema.js';
import { sendNotificationToUser } from '../server.js';

export const createNotificationService = async (notificationData) => {
  const { type, recipient, actor, message, postId, jobId, commentId, replyId } = notificationData;

  if (!recipient || !actor) {
    throw new AppError('Recipient and actor are required', 400);
  }

  // Don't notify user about their own actions
  if (recipient.toString() === actor.toString()) {
    return null;
  }

  const actorUser = await User.findById(actor);
  if (!actorUser) {
    throw new AppError('Actor user not found', 404);
  }

  const notification = await Notification.create({
    type,
    recipient,
    actor,
    actorName: `${actorUser.firstName || ''} ${actorUser.lastName || ''}`.trim() || actorUser.email,
    actorAvatar: actorUser.role === 'employer' ? actorUser.companyLogo : actorUser.profilePicture,
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
      actor,
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

export const getNotificationsService = async (userId, options = {}) => {
  const { limit = 50, skip = 0, unreadOnly = false } = options;

  const filter = { recipient: userId };
  if (unreadOnly) filter.read = false;

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

export const getUnreadCountService = async (userId) => {
  const count = await Notification.countDocuments({
    recipient: userId,
    read: false,
  });

  return count;
};
