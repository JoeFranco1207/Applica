import AppSuccessful from '../Middleware/AppSuccessful.js';
import {
  getNotificationsService,
  markNotificationAsReadService,
  deleteNotificationService,
  getUnreadCountService,
} from '../Services/Notification.service.js';

export const getNotificationsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50, skip = 0, unreadOnly = false, types } = req.query;
    const parsedTypes = types
      ? Array.isArray(types)
        ? types
        : types.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    const data = await getNotificationsService(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      unreadOnly: unreadOnly === 'true',
      types: parsedTypes,
    });

    return res.status(200).json(
      new AppSuccessful('Notifications fetched successfully', 200, data)
    );
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const getUnreadCountController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { types } = req.query;
    const parsedTypes = types
      ? Array.isArray(types)
        ? types
        : types.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    const count = await getUnreadCountService(userId, {
      types: parsedTypes,
    });

    return res.status(200).json(
      new AppSuccessful('Unread count fetched', 200, { count })
    );
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const markAsReadController = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await markNotificationAsReadService(notificationId);
    
    return res.status(200).json(
      new AppSuccessful('Notification marked as read', 200, notification)
    );
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const deleteNotificationController = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    await deleteNotificationService(notificationId);
    
    return res.status(200).json(
      new AppSuccessful('Notification deleted', 200, null)
    );
  } catch (err) {
    console.log(err);
    next(err);
  }
};
