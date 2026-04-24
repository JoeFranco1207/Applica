import  {registerService, sendVerificationCodeService, verifyCodeService, loginService, chooseRoleService} from "../Services/User.service.js";
import AppSuccessful from '../Middleware/AppSuccessful.js'
import AppError from '../Middleware/AppError.js';
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


    export const verifyCode = async(req, res, next) =>{
      const {email, code} = req.body;
        try{
           await verifyCodeService(email, code);
            return res.success(new AppSuccessful("Email verified successfully", 200));
        }catch(err){
            return next(err);
        }};
    


    export const Login = async(req,res,next)=>{
   const {email, password} = req.body;
     try{
        const response = await loginService(email, password);
        const {token, user} = response;
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
      message: response.message, 
       data: {user, token}});
     
        }catch(err){
          console.log(err);
            return next(err);
        }};

    //Logging Out
 export const Logout = async(req, res)=>{
  const result = await LogOutService();
            try{
             res.clearCookie('Authorization', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict'
            }).json({success:true, message: "User logged out successfully"});
            
            if(!res.clearCookie){
                return next(new AppError("Logout failed", 400));
            }
        }catch(err){
            return next(err);
           }
        }



//SELECTION


export const chooseRole = async (req, res, next) => {
  try {
    const data = await chooseRoleService(req.User.id, req.body.role);

    return res.success(new AppSuccessful("Role selected successfully", 200, data));
  } catch (err) {
    return next(err);
  }
};
 //JOBSEEKER CONTROLLER

