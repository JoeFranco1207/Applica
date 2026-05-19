import User from '../Model/UserSchema.js';
import AppError from '../Middleware/AppError.js';
import AppSuccessful from '../Middleware/AppSuccessful.js'
import { doHash, doHashValidation  } from '../validator/Hashing.js';
import jwt from 'jsonwebtoken';
import { signupValidation, phoneNumberValidation } from '../validator/Validator.js';
import {sendVerificationEmail, sendForgotPasswordEmail} from '../Services/NodeMailer.js';
import Jobseeker from '../Model/JobseekerSchema.js';

const hasLocationData = (location) => {
  if (!location) return false;
  const hasCoords = location.coords?.lat != null && location.coords?.lng != null;
  const hasManualFields = location.region && location.city && location.barangay;
  return hasCoords || hasManualFields;
};

export const jobseekerProfileService = async (userId, profileData = {}) => {
    const {
      citizenShip,
      location,
      experience,
      education,
      resume,
      profilePicture,
      bio,
    } = profileData;

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.role !== "jobseeker") {
      throw new AppError("You must be a jobseeker", 403);
    }

    if (!citizenShip) {
      throw new AppError("citizenShip is required", 400);
    }

    if (!hasLocationData(location)) {
      throw new AppError("Incomplete location data. Provide either current location coordinates or region/city/barangay.", 400);
    }

    if (!experience) {
      throw new AppError("Experience is required", 400);
    }

    if (!education) {
      throw new AppError("Education is required", 400);
    }

    if (!resume) {
      throw new AppError("Resume is required", 400);
    }

    if (user.jobseekerProfile) {
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


export const updateJobseekerProfileService = async (userId, profileData = {}) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User doesn't exists", 400);
  }
  if (user.role !== "jobseeker") {
    throw new AppError("Not authorized", 403);
  }

  const allowedFields = [
    "citizenShip",
    "location",
    "experience",
    "education",
    "resume",
    "profilePicture",
    "bio",
  ];

  const updateData = {};
  for (const field of Object.keys(profileData)) {
    if (allowedFields.includes(field)) {
      updateData[field] = profileData[field];
    }
  }

  if (profileData.location) {
    const location = profileData.location;
    if (!hasLocationData(location)) {
      throw new AppError("Incomplete location data. Provide either current location coordinates or region/city/barangay.", 400);
    }
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
    context: "query",
  });

  if (!updatedUser) {
    throw new AppError("User doesn't exists", 400);
  }

  return updatedUser;
}


   
