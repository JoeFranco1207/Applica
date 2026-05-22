import { createAdmin, LoginAdmin, acceptEmployer, deleteEmployer, rejectEmployer, getAllEmployers, getPendingEmployers } from "../Services/ManageEmployer.service.js";
import User from '../Model/UserSchema.js';
import AppError from '../Middleware/AppError.js';
import AppSuccessful from "../Middleware/AppSuccessful.js";




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
    }
    catch (error) {
        next(error);
    }
  }
