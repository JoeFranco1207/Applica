
import jwt from 'jsonwebtoken';
import User from '../Model/UserSchema.js';
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
    try {
      decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError("Session expired. Please log in again.", 401));
      }
      return next(new AppError("Unauthorized: invalid token", 401));
    }

    // include activeSessionToken (select:false) and sessions, and explicitly include role/email/isVerified
    const user = await User.findById(decoded.id).select('+activeSessionToken sessions role email isVerified');

    if (!user) {
      return next(new AppError("Unauthorized: user not found", 401));
    }

    const storedToken = user.activeSessionToken?.trim();
    // If activeSessionToken exists and differs, reject
    if (storedToken && storedToken !== token) {
      return next(new AppError("Unauthorized: session no longer active. Please log in again.", 401));
    }

    // Otherwise, check sessions array for a matching non-expired token
    if (user.sessions && user.sessions.length > 0) {
      const match = user.sessions.find((s) => s.token === token && (!s.expires || s.expires.getTime() > Date.now()));
      if (!match && !storedToken) {
        return next(new AppError("Unauthorized: session no longer active. Please log in again.", 401));
      }
    }

    // Debug: log the decoded id and stored role to help diagnose forbidden responses
    console.log('Protection: decoded user id=', decoded.id, 'stored role=', user.role);

    const normalizedRole = (user.role || "").toString().trim().toLowerCase();

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: normalizedRole,
      isVerified: user.isVerified,
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