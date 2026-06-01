import { createAdmin, LoginAdmin, acceptEmployer, deleteEmployer, rejectEmployer, getAllEmployers, getPendingEmployers, getEmployerById } from "../Services/ManageEmployer.service.js";
import Admin from '../Model/AdminSchema.js';
import User from '../Model/UserSchema.js';
import AppError from '../Middleware/AppError.js';
import AppSuccessful from "../Middleware/AppSuccessful.js";
import { doHash, doHashValidation } from '../validator/Hashing.js';
import jwt from 'jsonwebtoken';
import { getPremiumStats } from '../Services/Payment.service.js';
import * as AdminService from '../Services/Admin.service.js';




export const registerAdmin = async (req, res, next) => {
  try {
    const adminData = req.body;
    const newAdmin = await createAdmin(adminData);

    return res.json(
      new AppSuccessful("Admin registered successfully", 201, newAdmin)
    );
  } catch (error) {
    next(error);
  } 
};

export const getUserSessionsController = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('sessions firstName lastName email');
    if (!user) return next(new AppError('User not found', 404));
    return res.json(new AppSuccessful('User sessions fetched', 200, { user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email }, sessions: user.sessions || [] }));
  } catch (err) {
    next(err);
  }
};

export const revokeUserSessionController = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const sessionId = req.params.sessionId;
    if (!userId || !sessionId) return next(new AppError('Missing parameters', 400));

    const user = await User.findById(userId).select('sessions');
    if (!user) return next(new AppError('User not found', 404));

    const session = user.sessions.id(sessionId);
    if (!session) return next(new AppError('Session not found', 404));

    // remove the session
    session.remove();
    // if activeSessionToken matches removed token, clear activeSessionToken
    if (user.activeSessionToken === session.token) {
      user.activeSessionToken = null;
      user.activeSessionDevice = "";
      user.activeSessionExpires = null;
    }

    await user.save();

    return res.json(new AppSuccessful('Session revoked', 200, null));
  } catch (err) {
    next(err);
  }
};

export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { admin, token } = await LoginAdmin(email, password);
    return res.json(new AppSuccessful("Admin logged in successfully", 200, { admin, token }));
  } catch (error) {
    next(error);
  }
};

export const logoutAdmin = async (req, res, next) => {
  try {
    const {email, password} = req.body;
        res.clearCookie('Authorization', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    }).json(new AppSuccessful("Admin logged out successfully", 200));

    if(!res.clearCookie){
        throw new AppError("Failed to clear cookie",400);
    }
  } catch (error) {
    next(error);
  }
}

export const adminAccessLoginController = async (req, res, next) => {
  try {
    const { adminCode, password } = req.body;
    const expectedAdminCode = process.env.ADMIN_ACCESS_CODE || '071205020307';
    const expectedPassword = process.env.ADMIN_ACCESS_PASSWORD || '071205020307-070302051207';

    if (adminCode !== expectedAdminCode || password !== expectedPassword) {
      throw new AppError('Invalid admin code or password', 401);
    }

    const email = process.env.ADMIN_ACCESS_EMAIL || 'admin@applica.local';
    let admin = await Admin.findOne({ email });
    if (!admin) {
      const hashedPassword = await doHash(password, 10);
      admin = await Admin.create({
        email,
        password: hashedPassword,
        adminCode: expectedAdminCode,
      });
    }

    const { admin: adminData, token } = await LoginAdmin(email, password);
    return res.json(new AppSuccessful('Admin logged in successfully', 200, { admin: adminData, token }));
  } catch (error) {
    next(error);
  }
};

export const acceptEmployerController = async (req, res, next) => {
    try {
        const employerId = req.params.id;
        const employer = await acceptEmployer(employerId);
        return res.json(new AppSuccessful("Employer accepted successfully", 200, employer));
    } catch (error) {
        next(error);
      }
}

export const rejectEmployerController = async (req, res, next) => {
    try {
        const employerId = req.params.id;
        const employer = await rejectEmployer(employerId);
        return res.json(new AppSuccessful("Employer rejected successfully", 200, employer));
    }
    catch (error) {
        next(error);
    }
};

export const getPendingEmployersController = async (req, res, next) => {
    try {
        const pendingEmployers = await getPendingEmployers();
        return res.json(new AppSuccessful("Pending employers retrieved successfully", 200, pendingEmployers));
    }
    catch (error) {      
        next(error);
    }
  };

export const getAllEmployersController = async (req, res, next) => {
    try {
        const employers = await getAllEmployers();
        return res.json(new AppSuccessful("Employers retrieved successfully", 200, employers));
    }
    catch (error) {      
        next(error);
    }
  };
    
export const getEmployerByIdController = async (req, res, next) => {
    try {
        const employerId = req.params.id;
        const employer = await getEmployerById(employerId);
        return res.json(new AppSuccessful("Employer retrieved successfully", 200, employer));
    }
    catch (error) {
        next(error);
    }
  }
  
  export const deleteEmployerController = async (req, res, next) => {
    try {
       const employerId = req.params.id;
        const result = await deleteEmployer(employerId);
        return res.json(new AppSuccessful("Employer deleted successfully", 200, result));
    } catch (error) {
        next(error);
    }
  };
  
  export const getPremiumStatsController = async (req, res, next) => {
    try {
      const stats = await getPremiumStats();
      return res.json(new AppSuccessful('Premium stats retrieved', 200, stats));
    } catch (err) {
      next(err);
    }
  };

  export const getAdminOverviewController = async (req, res, next) => {
    try {
      const overview = await AdminService.getAdminOverview();
      return res.json(new AppSuccessful('Admin overview retrieved', 200, overview));
    } catch (err) {
      next(err);
    }
  };

  export const getAdminsController = async (req, res, next) => {
    try {
      const admins = await AdminService.listAdmins();
      return res.json(new AppSuccessful('Admins retrieved successfully', 200, admins));
    } catch (err) {
      next(err);
    }
  };

  export const updateAdminPermissionsController = async (req, res, next) => {
    try {
      const adminId = req.params.id;
      const permissions = req.body.permissions;
      const updatedAdmin = await AdminService.updateAdminPermissions(adminId, permissions);
      return res.json(new AppSuccessful('Admin permissions updated', 200, updatedAdmin));
    } catch (err) {
      next(err);
    }
  };

  export const getVerifiedEmployersController = async (req, res, next) => {
    try {
      const employers = await AdminService.getVerifiedEmployers();
      return res.json(new AppSuccessful('Verified employers retrieved', 200, employers));
    } catch (err) {
      next(err);
    }
  };

  export const getReportsController = async (req, res, next) => {
    try {
      const reports = await AdminService.getReports();
      return res.json(new AppSuccessful('Reports fetched', 200, reports));
    } catch (err) {
      next(err);
    }
  };

  export const resolveReportController = async (req, res, next) => {
    try {
      const reportId = req.params.id;
      const { status, actionTaken } = req.body;
      const report = await AdminService.resolveReport(reportId, status, actionTaken);
      return res.json(new AppSuccessful('Report updated', 200, report));
    } catch (err) {
      next(err);
    }
  };

  export const takeReportActionController = async (req, res, next) => {
    try {
      const reportId = req.params.id;
      const { action, note } = req.body;
      const report = await AdminService.takeReportAction(reportId, action, note);
      return res.json(new AppSuccessful('Report action completed', 200, report));
    } catch (err) {
      next(err);
    }
  };

  export const getFraudAlertsController = async (req, res, next) => {
    try {
      const alerts = await AdminService.getFraudAlerts();
      return res.json(new AppSuccessful('Fraud alerts retrieved', 200, alerts));
    } catch (err) {
      next(err);
    }
  };

  export const suspendUserController = async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { reason, expires } = req.body;
      const result = await AdminService.suspendUser(userId, reason, expires);
      return res.json(new AppSuccessful('User suspended successfully', 200, result));
    } catch (err) {
      next(err);
    }
  };

  export const unsuspendUserController = async (req, res, next) => {
    try {
      const userId = req.params.id;
      const result = await AdminService.unsuspendUser(userId);
      return res.json(new AppSuccessful('User unsuspended successfully', 200, result));
    } catch (err) {
      next(err);
    }
  };

  export const getPremiumSubscribersController = async (req, res, next) => {
    try {
      const subscribers = await AdminService.listPremiumSubscribers();
      return res.json(new AppSuccessful('Premium subscribers fetched', 200, subscribers));
    } catch (err) {
      next(err);
    }
  };

  export const revokePremiumAccessController = async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { reason } = req.body;
      const result = await AdminService.revokePremiumAccess(userId, reason);
      return res.json(new AppSuccessful('Premium access revoked', 200, result));
    } catch (err) {
      next(err);
    }
  };

  export const refundSubscriptionController = async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { reason, amountCents } = req.body;
      const result = await AdminService.refundSubscription(userId, amountCents, reason);
      return res.json(new AppSuccessful('Subscription refunded', 200, result));
    } catch (err) {
      next(err);
    }
  };

  export const broadcastNotificationController = async (req, res, next) => {
    try {
      const { message, target, title } = req.body;
      const result = await AdminService.broadcastNotification(message, target, title);
      return res.json(new AppSuccessful('Broadcast sent', 200, result));
    } catch (err) {
      next(err);
    }
  };

  export const getFlaggedMessagesController = async (req, res, next) => {
    try {
      const messages = await AdminService.getFlaggedMessages();
      return res.json(new AppSuccessful('Flagged messages fetched', 200, messages));
    } catch (err) {
      next(err);
    }
  };

  export const deleteMessageController = async (req, res, next) => {
    try {
      const messageId = req.params.id;
      const result = await AdminService.deleteMessage(messageId);
      return res.json(new AppSuccessful('Message deleted', 200, result));
    } catch (err) {
      next(err);
    }
  };

  export const getMaintenanceModeController = async (req, res, next) => {
    try {
      const mode = await AdminService.getMaintenanceMode();
      return res.json(new AppSuccessful('Maintenance mode fetched', 200, mode));
    } catch (err) {
      next(err);
    }
  };

  export const setMaintenanceModeController = async (req, res, next) => {
    try {
      const { enabled, reason } = req.body;
      const result = await AdminService.setMaintenanceMode(Boolean(enabled), reason);
      return res.json(new AppSuccessful('Maintenance mode updated', 200, result));
    } catch (err) {
      next(err);
    }
  };
