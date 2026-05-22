import mongoose from 'mongoose';
import AppSuccessful from '../Middleware/AppSuccessful.js';
import AppError from '../Middleware/AppError.js';
import User from '../Model/UserSchema.js';
import Message from '../Model/MessageSchema.js';
import { sendChatMessageToUser, sendChatMessageDeletedToUser } from '../Services/SocketIO.service.js';

const buildConversationId = (id1, id2) => {
  return [id1.toString(), id2.toString()].sort().join('_');
};

export const getConnectionsController = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('connections', 'firstName lastName email role profilePicture companyLogo');
    if (!user) return next(new AppError('User not found', 404));

    const userConnections = Array.isArray(user.connections) ? user.connections : [];
    const connections = userConnections.map((connection) => ({
      _id: connection._id,
      firstName: connection.firstName,
      lastName: connection.lastName,
      email: connection.email,
      role: connection.role,
      profilePicture: connection.profilePicture,
      companyLogo: connection.companyLogo,
    }));

    return res.status(200).json(new AppSuccessful('Connections fetched successfully', 200, { connections }));
  } catch (err) {
    next(err);
  }
};

export const getMessagesController = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const recipientId = req.params.otherId;

    if (!recipientId) {
      return next(new AppError('Recipient ID is required', 400));
    }
    if (recipientId === senderId) {
      return next(new AppError('Cannot fetch messages with yourself', 400));
    }

    const user = await User.findById(senderId).select('connections');
    if (!user) return next(new AppError('User not found', 404));

    const userConnections = Array.isArray(user.connections) ? user.connections : [];
    const isConnected = userConnections.some((c) => c.toString() === recipientId);
    if (!isConnected) {
      return next(new AppError('You are not connected with this user', 403));
    }

    const conversationId = buildConversationId(senderId, recipientId);
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'firstName lastName role profilePicture companyLogo')
      .populate('recipient', 'firstName lastName role profilePicture companyLogo');

    return res.status(200).json(new AppSuccessful('Messages retrieved successfully', 200, { messages }));
  } catch (err) {
    next(err);
  }
};

export const createMessageController = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const recipientId = req.params.otherId;
    const { text = '', linkUrl = '', system = false, callInfo } = req.body;
    const attachmentFile = req.file;

    let parsedCallInfo;
    if (callInfo) {
      parsedCallInfo = typeof callInfo === 'string' ? JSON.parse(callInfo) : callInfo;
    }

    if (!recipientId) {
      return next(new AppError('Recipient ID is required', 400));
    }

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return next(new AppError('Recipient ID is invalid', 400));
    }

    if (!text.trim() && !linkUrl.trim() && !attachmentFile && !system) {
      return next(new AppError('Please provide a message, a link, or an attachment', 400));
    }

    if (recipientId === senderId) {
      return next(new AppError('Cannot send a message to yourself', 400));
    }

    const user = await User.findById(senderId).select('connections');
    if (!user) return next(new AppError('User not found', 404));

    const userConnections = Array.isArray(user.connections) ? user.connections : [];
    const isConnected = userConnections.some((c) => c.toString() === recipientId);
    if (!isConnected) {
      return next(new AppError('You are not connected with this user', 403));
    }

    const conversationId = buildConversationId(senderId, recipientId);
    const attachment = attachmentFile
      ? {
          fileName: attachmentFile.originalname,
          fileUrl: `/uploads/chat/${attachmentFile.filename}`,
          mimeType: attachmentFile.mimetype,
        }
      : undefined;

    const message = await Message.create({
      conversationId,
      sender: senderId,
      recipient: recipientId,
      text: text.trim(),
      linkUrl: linkUrl.trim() || undefined,
      attachment,
      system: String(system) === 'true' || system === true,
      callInfo: parsedCallInfo,
    });

    await message.populate('sender', 'firstName lastName role profilePicture companyLogo');
    await message.populate('recipient', 'firstName lastName role profilePicture companyLogo');
    const populatedMessage = message;

    try {
      sendChatMessageToUser(recipientId, {
        _id: populatedMessage._id,
        conversationId: populatedMessage.conversationId,
        sender: {
          _id: populatedMessage.sender._id,
          firstName: populatedMessage.sender.firstName,
          lastName: populatedMessage.sender.lastName,
          role: populatedMessage.sender.role,
          profilePicture: populatedMessage.sender.profilePicture,
          companyLogo: populatedMessage.sender.companyLogo,
        },
        recipient: {
          _id: populatedMessage.recipient._id,
          firstName: populatedMessage.recipient.firstName,
          lastName: populatedMessage.recipient.lastName,
          role: populatedMessage.recipient.role,
          profilePicture: populatedMessage.recipient.profilePicture,
          companyLogo: populatedMessage.recipient.companyLogo,
        },
        text: populatedMessage.text,
        linkUrl: populatedMessage.linkUrl,
        attachment: populatedMessage.attachment,
        system: populatedMessage.system,
        callInfo: populatedMessage.callInfo,
        createdAt: populatedMessage.createdAt,
      });
    } catch (socketErr) {
      console.error('Failed to send chat socket event:', socketErr);
    }

    return res.status(201).json(new AppSuccessful('Message sent successfully', 201, { message: populatedMessage }));
  } catch (err) {
    console.error('ChatController.createMessageController error:', err);
    next(err);
  }
};

export const removeConnectionController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const otherId = req.params.otherId;

    if (!otherId) {
      return next(new AppError('Recipient ID is required', 400));
    }
    if (otherId === userId) {
      return next(new AppError('Cannot remove connection to yourself', 400));
    }

    const user = await User.findById(userId).select('connections');
    if (!user) return next(new AppError('User not found', 404));

    const userConnections = Array.isArray(user.connections) ? user.connections : [];
    const isConnected = userConnections.some((c) => c.toString() === otherId);
    if (!isConnected) {
      return next(new AppError('Connection not found', 404));
    }

    await User.findByIdAndUpdate(userId, { $pull: { connections: otherId } });
    await User.findByIdAndUpdate(otherId, { $pull: { connections: userId } });

    return res.status(200).json(new AppSuccessful('Connection removed', 200, null));
  } catch (err) {
    next(err);
  }
};

export const removeMessageController = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const recipientId = req.params.otherId;
    const messageId = req.params.messageId;

    if (!recipientId) {
      return next(new AppError('Recipient ID is required', 400));
    }
    if (!messageId) {
      return next(new AppError('Message ID is required', 400));
    }
    if (recipientId === senderId) {
      return next(new AppError('Cannot remove a message to yourself', 400));
    }
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return next(new AppError('Message ID is invalid', 400));
    }

    const conversationId = buildConversationId(senderId, recipientId);
    const message = await Message.findOneAndDelete({
      _id: messageId,
      sender: senderId,
      conversationId,
    });

    if (!message) {
      return next(new AppError('Message not found or not authorized', 404));
    }

    try {
      sendChatMessageDeletedToUser(recipientId, {
        messageId,
        conversationId,
      });
    } catch (socketErr) {
      console.error('Failed to send chat delete socket event:', socketErr);
    }

    return res.status(200).json(new AppSuccessful('Message unsent successfully', 200, null));
  } catch (err) {
    next(err);
  }
};
