import { registerService, sendVerificationCodeService, verifyCodeService, loginService, chooseRoleService, getProfileService, getUserByIdService, deleteUserService } from '../Services/User.service.js';
import { doHash, doHashValidation } from '../validator/Hashing.js';
import AppSuccessful from '../Middleware/AppSuccessful.js'
import AppError from '../Middleware/AppError.js';
import User from '../Model/UserSchema.js';
import jwt from 'jsonwebtoken';
//USER CONTROLLER

//Register
export const Register = async(req,res,next)=>{
  try{
    const newUser = await registerService(req.body);
    return res.success(new AppSuccessful("User registered successfully", 201));
   }catch(err){
    console.log(err);
     next(err);
   }
};



//Verifications
    export const sendVerificationCode = async(req, res, next) =>{
        const {email} = req.body;
        try{
            const response = await sendVerificationCodeService(email);
            return res.success(new AppSuccessful("Verification code sent successfully", 200, response));
        }catch(err){
            return next(err);
        }
    };


  export const verifyCode = async (req, res, next) => {

  const { email, code } = req.body;

  try {

    const response = await verifyCodeService(email, code);

    const { token, user } = response;

    res.cookie(
      'Authorization',
      'Bearer ' + token,
      {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
      }
    ).json({
      success: true,
      message: "Email verified successfully",
      data: {
        user,
        token
      }
    });

  } catch (err) {
    return next(err);
  }
};

    export const Login = async(req,res,next)=>{
   const {email, password, deviceInfo} = req.body;
     try{
        const response = await loginService(email, password, deviceInfo);
        const {token, user, alreadyLoggedIn} = response;

        if (token) {
         return res.cookie(
      'Authorization',
      'Bearer ' + token,
      {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
      }
    ).json({
      success: true,
      message: response.message,
       data: {user, token}});
        }

        if (alreadyLoggedIn) {
          return res.status(409).json({
            success: false,
            message: 'This account is already logged in on another device.',
            data: { user }
          });
        }

        return res.success(new AppSuccessful("Email not verified", 200, { user }));
     
        }catch(err){
          console.log(err);
            return next(err);
        }};

    //Logging Out
 export const Logout = async(req, res, next)=>{
  try {
    let userId = req.user?.id;

    if (!userId) {
      // Try to extract token from Authorization header or cookie
      const authHeader = req.headers.authorization || req.headers.Authorization || (req.cookies && req.cookies.Authorization);
      let token = null;
      if (authHeader) {
        token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
      }

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
          userId = decoded?.id || decoded?._id || null;
        } catch (e) {
          // invalid token — still attempt to find user by matching activeSessionToken to raw token
          const userByToken = await User.findOne({ activeSessionToken: token });
          userId = userByToken?._id || null;
        }
      }
    }

    const authHeader = req.headers.authorization || req.headers.Authorization || (req.cookies && req.cookies.Authorization);
    let token = null;
    if (authHeader) {
      token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    }

    if (userId) {
      if (token) {
        // remove the session entry matching the token
        await User.findByIdAndUpdate(userId, {
          $pull: { sessions: { token } },
          $set: { activeSessionToken: null, activeSessionDevice: "", activeSessionExpires: null }
        });
      } else {
        // no token; clear active session fields
        await User.findByIdAndUpdate(userId, {
          activeSessionToken: null,
          activeSessionDevice: "",
          activeSessionExpires: null,
        });
      }
    }

    return res.clearCookie('Authorization', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict'
    }).json({success:true, message: "User logged out successfully"});
  } catch (err) {
    return next(err);
  }
 }



//SELECTION


export const chooseRole = async (req, res, next) => {
  try {
    const data = await chooseRoleService(req.user.id, req.body.role);

    return res.success(new AppSuccessful("Role selected successfully", 200, data));
  } catch (err) {
    console.log(err)
    return next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await getProfileService(req.user.id);
    return res.success(new AppSuccessful("Profile retrieved successfully", 200, user));
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const result = await deleteUserService(req.user.id);
    res.clearCookie('Authorization', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });
    return res.success(new AppSuccessful('User account deleted successfully', 200, result));
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id; // Get the ID of the user making the request
    
    const targetUser = await User.findById(id).lean();
    
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // If target is an employer, always allow viewing their profile for jobseekers
    if (targetUser.role === 'employer') {
      return res.success(new AppSuccessful('Employer profile fetched', 200, targetUser));
    }

    // Check if viewing own profile
    if (requesterId === id) {
      return res.success(new AppSuccessful('User profile fetched', 200, targetUser));
    }

    // Check profile visibility for non-employer users
    if (targetUser.profileVisibility === 'public') {
      return res.success(new AppSuccessful('User profile fetched', 200, targetUser));
    }

    if (targetUser.profileVisibility === 'private') {
      return res.status(403).json({ 
        success: false, 
        message: 'This profile is private and cannot be viewed' 
      });
    }

    if (targetUser.profileVisibility === 'connections') {
      // Check if requester is in target user's connections
      const isConnected = targetUser.connections?.includes(requesterId);
      if (!isConnected) {
        return res.status(403).json({ 
          success: false, 
          message: 'You must be connected to view this profile' 
        });
      }
      return res.success(new AppSuccessful('User profile fetched', 200, targetUser));
    }

    // Default to allowing view for backward compatibility
    return res.success(new AppSuccessful('User profile fetched', 200, targetUser));
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

const parseFullName = (fullName = "") => {
  const name = String(fullName || "").trim();
  if (!name) return { firstName: "", lastName: "" };
  const parts = name.split(/\s+/);
  return {
    firstName: parts.shift() || "",
    lastName: parts.join(" ") || "",
  };
};

export const updateProfile = async (req, res, next) => {
  try {
    // allow updating by param id or update the authenticated user when no id provided
    const { id: paramId } = req.params;
    const id = paramId || req.user?.id;
    const updateData = { ...req.body };

    if (typeof updateData.fullName === "string") {
      const { firstName, lastName } = parseFullName(updateData.fullName);
      delete updateData.fullName;
      updateData.firstName = firstName;
      updateData.lastName = lastName;
    }
    
    // Find and update user
    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update localStorage on frontend by returning updated user
    return res.success(new AppSuccessful('Profile updated successfully', 200, user));
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { id: paramId } = req.params;
    const userId = paramId || req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const validPassword = await doHashValidation(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
    }

    user.password = await doHash(newPassword, 10);
    await user.save();

    return res.success(new AppSuccessful('Password changed successfully', 200, null));
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const { id: paramId } = req.params;
    const userId = paramId || req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isSuspended = true;
    user.suspensionReason = 'User requested temporary deactivation from account settings';
    user.suspensionExpires = null;
    await user.save();

    return res.success(new AppSuccessful('User account deactivated successfully', 200, null));
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

export const createSupportTicket = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subject, message } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Ticket subject is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const ticketId = `SUP-${Date.now()}`;
    const newTicket = {
      ticketId,
      subject: subject.trim(),
      message: message?.trim() || '',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    user.supportTickets = user.supportTickets || [];
    user.supportTickets.push(newTicket);
    await user.save();

    return res.success(new AppSuccessful('Support ticket created successfully', 201, newTicket));
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

export const getSupportTickets = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('supportTickets');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.success(new AppSuccessful('Support tickets fetched successfully', 200, user.supportTickets || []));
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

export const updateConnectedAccounts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.connectedAccounts = {
      ...user.connectedAccounts,
      ...req.body,
    };
    await user.save();

    return res.success(new AppSuccessful('Connected accounts updated successfully', 200, user.connectedAccounts));
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

export const updateBillingPlan = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { premiumPlan, amountCents = 0, currency = 'USD' } = req.body;
    if (!premiumPlan || !['monthly', 'halfYearly', 'annual', ''].includes(premiumPlan)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan' });
    }

    user.premiumPlan = premiumPlan;
    user.billingHistory = user.billingHistory || [];
    if (premiumPlan) {
      user.billingHistory.push({
        plan: premiumPlan,
        amountCents,
        currency,
        status: 'completed',
        createdAt: new Date(),
      });
    }
    await user.save();

    return res.success(new AppSuccessful('Billing information updated successfully', 200, {
      premiumPlan: user.premiumPlan,
      billingHistory: user.billingHistory,
    }));
  } catch (err) {
    console.log(err);
    return next(err);
  }
};
