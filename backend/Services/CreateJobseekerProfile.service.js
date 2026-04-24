import User from '../Model/UserSchema.js';
import AppError from '../Middleware/AppError.js';
import AppSuccessful from '../Middleware/AppSuccessful.js'
import { doHash, doHashValidation  } from '../validator/Hashing.js';
import jwt from 'jsonwebtoken';
import { signupValidation, phoneNumberValidation } from '../validator/Validator.js';
import {sendVerificationEmail, sendForgotPasswordEmail} from '../Services/NodeMailer.js';
import Jobseeker from '../Model/JobseekerSchema.js';


export const jobseekerProfileService = async (userId, profileData) => {
    const {
      citizenShip,
        location,
        experience,
        education,
        resume,
        profilePicture,
        bio
    } = profileData;

 const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.role !== "jobseeker") {
      throw new AppError("You must be a jobseeker", 403);
    }
    if(!location || !location.region || !location.city || !location.barangay){
        throw new AppError("Incomplete location data", 400);
    };

    if(user.jobseekerProfile){
        throw new AppError("Jobseeker profile already exists", 400);
    }
   

    user.citizenShip = citizenShip;
    user.location = location;
    user.experience = experience;
    user.education = education;
    user.resume = resume;
    user.profilePicture = profilePicture;
    user.bio = bio;

    await user.save();
    return user;

}


export const updateJobseekerProfileService = async (userId, profileData) => {

     const user = await User.findById(userId);
  
    
     if(!user){throw new AppError("User doesn't Exists", 400);}
     if (user.role !== "jobseeker"){throw new AppError("Not authorized", 403);}
  
     const allowedFields = [
        "citizenShip",
        "location",
        "experience",
        "education",
        "resume",
        "profilePicture",
        "bio"
      ];
  
      
    for (const field of Object.keys(profileData)) {
    if (allowedFields.includes(field)) {
    user[field] = profileData[field];
      }
    }
     await user.save();
     return user;
  }


   
