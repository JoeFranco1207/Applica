import { registerService, sendVerificationCodeService, verifyCodeService, loginService, chooseRoleService, getProfileService, getUserByIdService, deleteUserService } from '../Services/User.service.js';
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
    const user = await getUserByIdService(req.params.id);
    return res.success(new AppSuccessful('User profile fetched', 200, user));
  } catch (err) {
    console.log(err);
    return next(err);
  }
};