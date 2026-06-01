
import jwt from 'jsonwebtoken';
import User from '../Model/UserSchema.js';
import Admin from '../Model/AdminSchema.js';
import AppError from '../Middleware/AppError.js';

export const protection = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  try {
    if (!authHeader || typeof authHeader !== 'string') {
      return next(new AppError("Unauthorized: missing authorization header", 401));
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    if (!token) {
      return next(new AppError("Unauthorized: missing token", 401));
    }

    let decoded;
    const secrets = [process.env.TOKEN_SECRET];
    if (process.env.ADMIN_TOKEN_SECRET && process.env.ADMIN_TOKEN_SECRET !== process.env.TOKEN_SECRET) {
      secrets.push(process.env.ADMIN_TOKEN_SECRET);
    }

    let verifyError;
    for (const secret of secrets) {
      try {
        decoded = jwt.verify(token, secret);
        verifyError = null;
        break;
      } catch (err) {
        verifyError = err;
        if (err.name === 'TokenExpiredError') {
          return next(new AppError("Session expired. Please log in again.", 401));
        }
      }
    }

    if (!decoded) {
      return next(new AppError("Unauthorized: invalid token", 401));
    }

    let decodedUser;
    let decodedRole = (decoded.role || "user").toString().trim().toLowerCase();
    let subject;

    if (decodedRole === 'admin') {
      const admin = await Admin.findById(decoded.id).select('+email role');
      if (!admin) {
        return next(new AppError("Unauthorized: admin not found", 401));
      }
      decodedUser = admin;
      subject = 'admin';
    } else {
      const user = await User.findById(decoded.id).select('+activeSessionToken sessions role email isVerified');
      if (!user) {
        return next(new AppError("Unauthorized: user not found", 401));
      }

      const storedToken = user.activeSessionToken?.trim();
      if (storedToken && storedToken !== token) {
        return next(new AppError("Unauthorized: session no longer active. Please log in again.", 401));
      }

      if (user.sessions && user.sessions.length > 0) {
        const match = user.sessions.find((s) => s.token === token && (!s.expires || s.expires.getTime() > Date.now()));
        if (!match && !storedToken) {
          return next(new AppError("Unauthorized: session no longer active. Please log in again.", 401));
        }
      }

      decodedUser = user;
      subject = 'user';
    }

    // Debug: log the decoded id and stored role to help diagnose forbidden responses
    console.log('Protection: decoded id=', decoded.id, 'token role=', decodedRole, 'resolved subject=', subject);

    const normalizedRole = decodedRole === 'admin'
      ? 'admin'
      : (decodedUser.role || 'user').toString().trim().toLowerCase();

    req.user = {
      id: decodedUser._id.toString(),
      email: decodedUser.email,
      role: normalizedRole,
      isVerified: normalizedRole === 'admin' ? true : decodedUser.isVerified,
    };

    next();
  } catch (err) {
    console.log('Protection middleware error:', err);
    next(new AppError("Unauthorized", 401));
  }
};


// export const jobseekerOnly = (req, res, next) => {
//   try {
//     if (req.user.role !== "jobseeker") {
//       return next(
//         new AppError("Access denied. Jobseekers only.", 403)
//       );
//     }

//     next();
//   } catch (err) {
//     next(err);
//   }
// };

export const restrictTo = (...roles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const normalizedUserRole = (req.user.role || "").toString().trim().toLowerCase();
    const normalizedRoles = roles.map((role) => role.toString().trim().toLowerCase());

    // Debug: log restrictTo comparison details
    console.log('restrictTo: allowed=', normalizedRoles, 'userRole=', normalizedUserRole);

    if (!normalizedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({ message: `Forbidden: Not allowed (${normalizedUserRole})` });
    }

    next();
  };
};


export const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return next(new AppError("Please verify your account first", 403));
  }
  next();
};