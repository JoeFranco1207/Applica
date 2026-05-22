import AppSuccessful from '../Middleware/AppSuccessful.js';
import AppError from '../Middleware/AppError.js';
import Notification from '../Model/NotificationSchema.js';
import User from '../Model/UserSchema.js';
import {
  getNotificationsService,
  markNotificationAsReadService,
  deleteNotificationService,
  getUnreadCountService,
  createNotificationService,
  createSystemNotificationService,
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

export const createConnectController = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    const { recipient } = req.body;
    if (!recipient) {
      return res.status(400).json({ message: 'Recipient is required' });
    }
    if (recipient === actorId) {
      return res.status(400).json({ message: 'You cannot connect with yourself' });
    }

    const [actorUser, recipientUser] = await Promise.all([
      User.findById(actorId).select('connections'),
      User.findById(recipient).select('connections'),
    ]);

    if (!recipientUser) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    if (!actorUser) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    const alreadyConnected = actorUser.connections?.some((c) => c.toString() === recipient) ||
      recipientUser.connections?.some((c) => c.toString() === actorId);
    if (alreadyConnected) {
      return res.status(400).json({ message: 'You are already connected with this user' });
    }

    const existingRequest = await Notification.findOne({
      type: 'connection',
      actor: actorId,
      recipient,
      read: false,
    });
    if (existingRequest) {
      return res.status(409).json({ message: 'Connection request already sent' });
    }

    const notification = await createNotificationService({
      type: 'connection',
      recipient,
      actor: actorId,
      message: 'sent you a connection request',
    });

    return res.status(201).json(new AppSuccessful('Connection request sent', 201, notification));
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const acceptConnectionController = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    if (!notificationId) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.type !== 'connection') {
      return res.status(400).json({ message: 'This notification is not a connection request' });
    }
    if (notification.recipient.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You cannot accept this connection request' });
    }

    // Mark original notification as read
    notification.read = true;
    await notification.save();

    const actorUser = await User.findById(notification.actor);
    const recipientUser = await User.findById(req.user.id);

    if (!actorUser || !recipientUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyConnected = recipientUser.connections?.some((c) => c.toString() === actorUser._id.toString()) ||
      actorUser.connections?.some((c) => c.toString() === recipientUser._id.toString());
    if (alreadyConnected) {
      return res.status(400).json({ message: 'You are already connected with this user' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { connections: actorUser._id },
    });
    await User.findByIdAndUpdate(actorUser._id, {
      $addToSet: { connections: recipientUser._id },
    });

    await createSystemNotificationService(
      notification.actor,
      `${recipientUser.firstName || recipientUser.email} accepted your connection request`,
      'status'
    );

    return res.status(200).json(new AppSuccessful('Connection accepted', 200, notification));
  } catch (err) {
    console.error(err);
    next(err);
  }
};
