import User from '../Model/UserSchema.js';
import AppError from '../Middleware/AppError.js';
import AppSuccessful from '../Middleware/AppSuccessful.js'
import { doHash, doHashValidation  } from '../validator/Hashing.js';
import jwt from 'jsonwebtoken';
import { signupValidation } from '../validator/Validator.js';
import {sendVerificationEmail, sendForgotPasswordEmail} from '../Services/NodeMailer.js';


//Register
export const Register = async(req,res,next)=>{
 const {firstName, lastName, email, password} = req.body;
  try{
    const emailExists = await User.findOne({email});

     if(emailExists){
    // return res.status(400).json({success:false, message:"Email Exists"})
    return  next(new AppError("email already exists", 400));
     }    
      
     const {error} = signupValidation.validate({email, password});

     if(error){
        return next(new AppError("Invalid input data", 400)), console.log(error.details[0].message);
     }
     const HashedPassword = await doHash(password, 10)
       const newUser = new User({
        firstName,
        lastName,
        middleName: "",
        email,
        password:HashedPassword        
       });
       await newUser.save();
       return next(new AppSuccessful("Account Created Successfully. ", 201));
       
           
   }catch(err){
    return next(new AppError("Server Error: ", 500)), console.log(err);
   }

};

export const Login = async(req,res,next)=>{
    const {email, password} = req.body;
    try{
        const user = await User.findOne({email});
        if(!user){
            return next(new AppError("Invalid Email or Password", 400));
        }
        const isPasswordValid = await doHashValidation(password, user.password);

        if(!isPasswordValid){
            return next(new AppError("Invalid Email or Password", 400));
        }
        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'});
        return next(new AppSuccessful("Login Successful", 200, {token}));
    }catch(err){
        return next(new AppError("Server Error: ", 500)), console.log(err)
    }};


    export const sendVerificationCode = async(req, res, next) =>{
        const {email} = req.body;
        try{
            const user = await User.findOne({email});
            if(!user){
                return next(new AppError("Email not found", 404));
            }
            const code = Math.floor(100000 + Math.random() * 900000);
           
            await User.updateOne(
                {email},
                {
                    verificationCode: code,
                    codeExpiration: Date.now() + 10 * 60 * 1000
                }
            )
            await sendVerificationEmail(email, code);
         
            return next(new AppSuccessful("Verification code sent successfully", 200));
        }catch(err){
            return next(new AppError("Server Error: ", 500)), console.log(err + "wow")
        }
    };

    export const verifyCode = async(req, res, next) =>{
        const {email, code} = req.body;
        try{
            const user = await User.findOne({email}).select('+verificationCode +codeExpiration');
            if(!user){
                return next(new AppError("Email not found", 404));
            }   
          
            if(user.codeExpiration < Date.now()){
                return next(new AppError("Verification code expired", 400));
            }   
            if(user.verificationCode !== code){
                return next(new AppError("Invalid verification code", 400));
            }
           
            await User.updateOne(
              { email},
              {
                isVerified: true,
                verificationCode: null,
                codeExpiration:null
              }
            )
            return next(new AppSuccessful("Email verified successfully", 200));
        }catch(err){
            return next(new AppError("Server Error: ", 500)), console.log(err)
        }};

    
//  export const SetUpProfile = async(req, res, next) =>{
//     const  {}
//  }   
    