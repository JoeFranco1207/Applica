import AppConfig from '../Model/AppConfigSchema.js';
import Admin from '../Model/AdminSchema.js';
import User from '../Model/UserSchema.js';
import Employer from '../Model/EmployerSchema.js';
import Post from '../Model/PostSchema.js';
import Message from '../Model/MessageSchema.js';
import Report from '../Model/ReportSchema.js';
import AppError from '../Middleware/AppError.js';
import { createSystemNotificationService } from './Notification.service.js';
import { getBlocklistWords } from './Blocklist.service.js';
import { getPremiumStats } from './Payment.service.js';

export const listAdmins = async () => {
  return Admin.find().select('-password -adminCode').lean();
};

export const updateAdminPermissions = async (adminId, permissions) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }
  if (!Array.isArray(permissions)) {
    throw new AppError('Permissions must be an array', 400);
  }
  admin.permissions = permissions.map((perm) => String(perm).trim()).filter(Boolean);
  await admin.save();
  const adminSafe = admin.toObject();
  delete adminSafe.password;
  delete adminSafe.adminCode;
  return adminSafe;
};

export const getVerifiedEmployers = async () => {
  return Employer.find({ approvalStatus: 'Accepted' }).lean();
};

export const getAllEmployersExtended = async () => {
  return Employer.find().lean();
};

export const getReports = async () => {
  return Report.find().sort({ createdAt: -1 }).populate('reporter', 'firstName lastName email role').lean();
};

export const resolveReport = async (reportId, status, actionTaken) => {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new AppError('Report not found', 404);
  }
  if (!['open', 'reviewed', 'dismissed', 'actioned'].includes(status)) {
    throw new AppError('Invalid report status', 400);
  }
  report.status = status;
  if (actionTaken) {
    report.actionTaken = actionTaken;
  }
  await report.save();
  return report;
};

export const takeReportAction = async (reportId, action, note) => {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new AppError('Report not found', 404);
  }
  if (!action) {
    throw new AppError('Action is required', 400);
  }

  const updateReport = async (status, actionTaken) => {
    report.status = status;
    report.actionTaken = actionTaken;
    await report.save();
    return report;
  };

  if (action === 'dismiss') {
    return updateReport('dismissed', note || 'Dismissed by admin');
  }

  if (action === 'mark-reviewed') {
    return updateReport('reviewed', note || 'Marked as reviewed');
  }

  if (action === 'delete-target' || action === 'ban-user') {
    const targetId = report.targetId;
    const targetType = report.targetType;

    if (targetType === 'post') {
      await Post.findByIdAndDelete(targetId);
    }

    if (targetType === 'message') {
      await Message.findByIdAndDelete(targetId);
    }

    if (targetType === 'user' || targetType === 'employer') {
      await User.findByIdAndUpdate(targetId, {
        isSuspended: true,
        suspensionReason: note || 'Account suspended by admin after report review',
      });
    }

    return updateReport('actioned', `${action} executed${note ? `: ${note}` : ''}`);
  }

  throw new AppError('Unsupported report action', 400);
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getFraudAlerts = async () => {
  const blocklist = await getBlocklistWords();
  const suspiciousUsers = await Post.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: '$author',
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gte: 3 },
      },
    },
    {
      $sort: { count: -1 },
    },
    { $limit: 20 },
  ]);

  const postMatch = {};
  if (blocklist.length > 0) {
    const regex = new RegExp(blocklist.map((item) => escapeRegex(item.word)).join('|'), 'i');
    postMatch.content = regex;
  }

  const suspiciousPosts = blocklist.length > 0 ? await Post.find(postMatch).sort({ createdAt: -1 }).limit(50).lean() : [];

  return {
    suspiciousUsers,
    suspiciousPosts,
  };
};

export const suspendUser = async (userId, reason, expires) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  user.isSuspended = true;
  user.suspensionReason = String(reason || 'Suspended by admin');
  if (expires) {
    user.suspensionExpires = new Date(expires);
  }
  await user.save();
  return user;
};

export const unsuspendUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  user.isSuspended = false;
  user.suspensionReason = '';
  user.suspensionExpires = null;
  await user.save();
  return user;
};

export const listPremiumSubscribers = async () => {
  return User.find({ premiumAIAccess: true }).select('firstName lastName email role premiumPlan createdAt').lean();
};

export const revokePremiumAccess = async (userId, reason) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  user.premiumAIAccess = false;
  user.premiumPlan = '';
  if (reason) {
    user.refundHistory = user.refundHistory || [];
    user.refundHistory.push({ amountCents: 0, reason: String(reason || 'Premium access revoked'), admin: null, createdAt: new Date() });
  }
  await user.save();
  return user;
};

export const refundSubscription = async (userId, amountCents = 0, reason = '') => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  user.premiumAIAccess = false;
  user.premiumPlan = '';
  user.refundHistory = user.refundHistory || [];
  user.refundHistory.push({ amountCents: Number(amountCents) || 0, reason: String(reason || 'Refund issued by admin'), admin: null, createdAt: new Date() });
  await user.save();
  return user;
};

export const broadcastNotification = async (message, target = 'all', title) => {
  if (!message || typeof message !== 'string') {
    throw new AppError('Message is required', 400);
  }
  const filter = {};
  if (target === 'employer') {
    filter.role = 'employer';
  } else if (target === 'jobseeker') {
    filter.role = 'jobseeker';
  } else if (target === 'admin') {
    filter.role = 'admin';
  }
  const recipients = await User.find(filter).select('_id').lean();
  const notifications = [];
  for (const recipient of recipients) {
    try {
      const notification = await createSystemNotificationService(recipient._id, `${title ? `${title}: ` : ''}${message}`, 'status');
      notifications.push(notification);
    } catch (err) {
      console.error('Failed to send broadcast notification to', recipient._id, err.message || err);
    }
  }
  return { delivered: notifications.length, requested: recipients.length };
};

export const getFlaggedMessages = async () => {
  const blocklist = await getBlocklistWords();
  if (!blocklist.length) {
    return [];
  }
  const regex = new RegExp(blocklist.map((item) => escapeRegex(item.word)).join('|'), 'i');
  return Message.find({ text: regex }).sort({ createdAt: -1 }).limit(100).lean();
};

export const deleteMessage = async (messageId) => {
  const message = await Message.findByIdAndDelete(messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }
  return message;
};

export const getMaintenanceMode = async () => {
  const entry = await AppConfig.findOne({ key: 'maintenanceMode' }).lean();
  return {
    enabled: Boolean(entry?.value),
    reason: entry?.metadata?.reason || '',
    updatedAt: entry?.updatedAt || null,
  };
};

export const setMaintenanceMode = async (enabled, reason) => {
  const entry = await AppConfig.findOneAndUpdate(
    { key: 'maintenanceMode' },
    {
      value: Boolean(enabled),
      metadata: { reason: String(reason || '') },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return {
    enabled: Boolean(entry.value),
    reason: entry.metadata?.reason || '',
    updatedAt: entry.updatedAt,
  };
};

export const getAdminOverview = async () => {
  const [pendingEmployers, restrictedPosts, openReports, suspendedAccounts, premiumStats, totalUsers] = await Promise.all([
    Employer.countDocuments({ approvalStatus: 'Pending' }),
    Post.countDocuments({ restricted: true }),
    Report.countDocuments({ status: 'open' }),
    User.countDocuments({ isSuspended: true }),
    getPremiumStats(),
    User.countDocuments(),
  ]);
  const fraudAlerts = await getFraudAlerts();
  return {
    pendingEmployers,
    restrictedPosts,
    openReports,
    suspendedAccounts,
    totalUsers,
    suspiciousUsers: fraudAlerts.suspiciousUsers,
    suspiciousPosts: fraudAlerts.suspiciousPosts,
    fraudAlertCount: fraudAlerts.suspiciousUsers.length + fraudAlerts.suspiciousPosts.length,
    premiumStats,
  };
};
