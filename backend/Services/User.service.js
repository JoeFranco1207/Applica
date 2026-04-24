import User from '../Model/UserSchema.js';
import AppError from '../Middleware/AppError.js';
import AppSuccessful from '../Middleware/AppSuccessful.js'
import { doHash, doHashValidation  } from '../validator/Hashing.js';
import jwt from 'jsonwebtoken';
import { signupValidation, phoneNumberValidation } from '../validator/Validator.js';
import {sendVerificationEmail, sendForgotPasswordEmail} from '../Services/NodeMailer.js';
import Jobseeker from '../Model/JobseekerSchema.js';


export const registerService = async (data) => { 
   const {firstName, lastName, email, password, phoneNumber} = data;
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
                {new: true}
            )

             if(!user){
                throw new AppError("Email not found", 404);
            }
            await sendVerificationEmail(email, code);
         
           return true;
        };

export const verifyCodeService = async(email, code) =>{

     const user = await User.findOne({email}).select('+verificationCode +codeExpiration');

             if(!user){
                 throw new AppError("Email not found", 404);
             }          
             if(user.codeExpiration < Date.now()){
                 throw new AppError("Verification code expired", 400);
             }   
             if(user.verificationCode !== Number(code)){
                throw new AppError("Invalid verification code", 400);
             }
            
             await User.updateOne(
               { email},
               {
                 isVerified: true,
                 verificationCode: null,
                 codeExpiration:null
               }
             )
             return true;
            
            };
 

export const loginService = async(email, password) => {
      const existingUser = await User.findOne({email}).select('+password');
        if(!existingUser){
            throw new AppError("Invalid Email or Password", 400)
        }
        const isPasswordValid = await doHashValidation(password, existingUser.password);

        if(!isPasswordValid){
            throw new AppError("Invalid Email or Password", 400)
        }
        const token = jwt.sign({
            email: existingUser.email,
            id: existingUser._id, 
            verified: existingUser.verified
            
        },process.env.TOKEN_SECRET, {
            expiresIn: "8h"
        });
        const user = existingUser.toObject();
        delete user.password;
        return {token, user};
    
}


export const chooseRoleService = async(userId, role) =>{

  console.log("Incoming role:", role);

    if (!['jobseeker', 'employer'].includes(role)) {
      throw new AppError("Invalid role selection", 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.role !== "user") {
      throw new AppError("Role already selected", 400);
    }

    user.role = role;
    await user.save();
  return {role: user.role};


}