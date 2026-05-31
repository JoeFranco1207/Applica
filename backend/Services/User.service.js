import User from '../Model/UserSchema.js';
import Employer from '../Model/EmployerSchema.js';
import Jobseeker from '../Model/JobseekerSchema.js';
import Post from '../Model/PostSchema.js';
import Resume from '../Model/ResumeSchema.js';
import Job from '../Model/JobSchema.js';
import AppError from '../Middleware/AppError.js';
import AppSuccessful from '../Middleware/AppSuccessful.js'
import { doHash, doHashValidation  } from '../validator/Hashing.js';
import jwt from 'jsonwebtoken';
import { signupValidation, phoneNumberValidation } from '../validator/Validator.js';
import {sendVerificationEmail, sendForgotPasswordEmail, sendLoginNotificationEmail} from '../Services/NodeMailer.js';
import { createSystemNotificationService } from './Notification.service.js';

// Helper to normalize legacy employer_ prefixed plan values
const normalizePlanFields = (user) => {
  if (user.premiumPlan && typeof user.premiumPlan === 'string' && user.premiumPlan.startsWith('employer_')) {
    user.premiumPlan = user.premiumPlan.replace(/^employer_/, '');
  }
  if (user.lastAIPaymentPlan && typeof user.lastAIPaymentPlan === 'string' && user.lastAIPaymentPlan.startsWith('employer_')) {
    user.lastAIPaymentPlan = user.lastAIPaymentPlan.replace(/^employer_/, '');
  }
};

const getAcceptedJobDataForJobseeker = async (userId) => {
  if (!userId) return null;

  const acceptedJobs = await Job.find({
    'applicants.user': userId,
    'applicants.status': 'accepted',
  })
    .populate({ path: 'createdBy', select: 'companyName' })
    .lean();

  if (!acceptedJobs?.length) return null;

  let bestMatch = null;

  for (const job of acceptedJobs) {
    const application = Array.isArray(job.applicants)
      ? job.applicants.find((entry) => entry?.user?.toString() === userId.toString())
      : null;

    if (!application) continue;

    const updatedAt = application.updatedAt ? new Date(application.updatedAt).getTime() : 0;

    if (!bestMatch || updatedAt > bestMatch.updatedAt) {
      bestMatch = {
        employeeOf: job.createdBy?.companyName || job.companyName || '',
        employeeJobTitle: job.title || '',
        updatedAt,
      };
    }
  }

  return bestMatch;
};

const attachEmployeeTagToUser = async (user) => {
  if (!user || user.role !== 'jobseeker') return user;
  const userObj = user.toObject ? user.toObject() : { ...user };
  const acceptedJob = await getAcceptedJobDataForJobseeker(userObj._id || userObj.id || user);
  if (acceptedJob?.employeeOf) {
    userObj.employeeOf = acceptedJob.employeeOf;
    if (acceptedJob.employeeJobTitle) {
      userObj.employeeJobTitle = acceptedJob.employeeJobTitle;
    }
  }
  return userObj;
};

export const registerService = async (data) => { 
   const {firstName, lastName, email, password, phoneNumber} = data;
    email.toLowerCase();
    const emailExists = await User.findOne({email});
    const phoneNumberExists = await User.findOne({phoneNumber});
     const {error: phoneError} = phoneNumberValidation.validate({phoneNumber});

        if(phoneError){
            throw new AppError("Invalid phone number format. Please use 09XXXXXXXXX or +639XXXXXXXXX.", 400)
        }
        
        if(phoneNumberExists){
            throw new AppError("Phone number already exists", 400)
        }
    
         if(emailExists){
        throw new AppError("email already exists", 400);
         }    
          
         const {error} = signupValidation.validate({email, password});
    
         if(error){
            throw new AppError("Invalid input data", 400)
         }
        
         const hashedPassword = await doHash(password, 10);
          
         const newUser = await User.create({
              firstName,
             lastName,
             middleName: "",
             email,
            password: hashedPassword,
             phoneNumber,
         })

            return newUser;
     
};

export const sendVerificationCodeService = async(email) =>{
            const code = Math.floor(100000 + Math.random() * 900000);
           
           const user = await User.findOneAndUpdate(
                {email},
                {
                    verificationCode: code,
                    codeExpiration: Date.now() + 10 * 60 * 1000
                }, 
                {returnDocument: 'after'}
            )

             if(!user){
                throw new AppError("Email not found", 404);
            }
            await sendVerificationEmail(email, code);
         
           return true;
        };

// export const verifyCodeService = async(email, code) =>{

//      const user = await User.findOne({email}).select('+verificationCode +codeExpiration');

//              if(!user){
//                  throw new AppError("Email not found", 404);
//              }          
//              if(user.codeExpiration < Date.now()){
//                  throw new AppError("Verification code expired", 400);
//              }   
//              if(user.verificationCode !== Number(code)){
//                 throw new AppError("Invalid verification code", 400);
//              }
            
//              await User.updateOne(
//                { email},
//                {
//                  isVerified: true,
//                  verificationCode: null,
//                  codeExpiration:null
//                }
//              )
//              return true;
            
//             };
 export const verifyCodeService = async (email, code) => {

  const user = await User.findOne({ email })
    .select('+verificationCode +codeExpiration +password');

  if (!user) {
    throw new AppError("Email not found", 404);
  }

  if (user.codeExpiration < Date.now()) {
    throw new AppError("Verification code expired", 400);
  }

  if (user.verificationCode !== Number(code)) {
    throw new AppError("Invalid verification code", 400);
  }

  // mark user as verified
  user.isVerified = true;
  user.verificationCode = null;
  user.codeExpiration = null;

  // Normalize legacy employer_ prefixed plan values before save
  normalizePlanFields(user);

  await user.save();

  // generate token
  const token = jwt.sign(
    {
      email: user.email,
      id: user._id,
      verified: user.isVerified
    },
    process.env.TOKEN_SECRET,
    {
      expiresIn: "8h"
    }
  );

  // remove password before returning
  const safeUser = user.toObject();
  delete safeUser.password;

  return {
    token,
    user: safeUser
  };
};

export const loginService = async(email, password, deviceInfo) => {
      const existingUser = await User.findOne({email}).select('+password +activeSessionToken');
        if(!existingUser){
            throw new AppError("Invalid Email or Password", 400)
        }
        const isPasswordValid = await doHashValidation(password, existingUser.password);

        if(!isPasswordValid){
            throw new AppError("Invalid Email or Password", 400)
        }

        const safeUser = existingUser.toObject();
        delete safeUser.password;

        if (!existingUser.isVerified) {
            return { user: safeUser };
        }

        const now = Date.now();
        const activeToken = existingUser.activeSessionToken;
        const activeExpires = existingUser.activeSessionExpires?.getTime?.() ?? existingUser.activeSessionExpires;
        const hasActiveSession = activeToken && (!activeExpires || activeExpires > now);

        if (hasActiveSession) {
            await sendLoginNotificationEmail(
              existingUser.email,
              deviceInfo,
              existingUser.activeSessionDevice
            );

            await createSystemNotificationService(
              existingUser._id,
              `A login attempt was made while your Applica account was already active on another session. If this wasn't you, please secure your account immediately.`,
              'status'
            );

            return {
              user: safeUser,
              alreadyLoggedIn: true,
              currentDevice: existingUser.activeSessionDevice || 'Unknown device',
            };
        }

        if (activeToken && activeExpires && activeExpires <= now) {
            existingUser.activeSessionToken = null;
            existingUser.activeSessionDevice = "";
            existingUser.activeSessionExpires = null;
        }

        const token = jwt.sign({
            email: existingUser.email,
            id: existingUser._id,
            verified: existingUser.isVerified
        }, process.env.TOKEN_SECRET, {
            expiresIn: "8h"
        });

        const expiresAt = new Date(now + 8 * 60 * 60 * 1000);

        existingUser.activeSessionToken = token;
        existingUser.activeSessionDevice = deviceInfo || "Unknown device";
        existingUser.activeSessionExpires = expiresAt;

        // Push to sessions array for multi-session support
        existingUser.sessions = existingUser.sessions || [];
        existingUser.sessions.push({
          token,
          device: deviceInfo || 'Unknown device',
          createdAt: new Date(now),
          expires: expiresAt,
        });

        // Normalize legacy employer_ prefixed plan values before save
        normalizePlanFields(existingUser);

        await existingUser.save();

        return { token, user: safeUser };
    
}

export const chooseRoleService = async(userId, role) => {
  const normalizedRole = (role || "").toString().trim().toLowerCase();

  if (!['jobseeker', 'employer'].includes(normalizedRole)) {
    throw new AppError("Invalid role selection", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }


  if (user.role !== "user" && user.__t) {
    throw new AppError("Role already selected", 400);
  }

  user.role = normalizedRole;
  user.__t = normalizedRole;

  await user.save();

  return { role: user.role };
}

export const getProfileService = async (userId) => {
  const user = await User.findById(userId).select('-password -verificationCode -verificationCodeValidation -codeExpiration -forgotPasswordCode');

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return await attachEmployeeTagToUser(user);
};

export const getUserByIdService = async (userId) => {
  const user = await User.findById(userId).select('-password -verificationCode -verificationCodeValidation -codeExpiration -forgotPasswordCode');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return await attachEmployeeTagToUser(user);
};

export const deleteUserService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await Promise.all([
    Post.deleteMany({ author: userId }),
    Resume.deleteMany({ jobseeker: userId }),
    Job.deleteMany({ createdBy: userId }),
    Post.updateMany({ likes: userId }, { $pull: { likes: userId } }),
    Job.updateMany(
      { $or: [{ views: userId }, { likes: userId }, { applicants: userId }] },
      { $pull: { views: userId, likes: userId, applicants: userId } }
    ),
  ]);

  await User.deleteOne({ _id: userId });
  return { message: 'User deleted successfully' };
};
