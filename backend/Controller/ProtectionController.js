
import jwt from 'jsonwebtoken';
import AppError from '../Middleware/AppError.js';
import AppSuccessful from '../Middleware/AppSuccessful.js';

export const protection = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  try{
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401));
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

  req.user = {
    id: decoded.id,
    email: decoded.email
  };

  next();
}catch(err){
  next(err);
 console.log(err)
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

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Not allowed" });
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