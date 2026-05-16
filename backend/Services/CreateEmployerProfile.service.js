import AppError from "../Middleware/AppError.js";
import User from "../Model/UserSchema.js";
import Employer from "../Model/EmployerSchema.js";

export const employerProfileService = async (userId, profileData) => {
  const {
    companyName,
    companyDescription,
    companyLocation,
    companySize,
    industry,
    website,
    contactNumber,
    companyLogo,
    dateEstablished,
  } = profileData;

  const employer = await Employer.findById(userId);

  if (!employer) {
    throw new AppError("Employer not found", 404);
  }

  // Only update fields that are provided in the request
  if (companyName !== undefined) employer.companyName = companyName;
  if (companyDescription !== undefined) employer.companyDescription = companyDescription;
  if (companySize !== undefined) employer.companySize = companySize;
  if (industry !== undefined) employer.industry = industry;
  if (website !== undefined) employer.website = website;
  if (contactNumber !== undefined) employer.contactNumber = contactNumber;
  if (companyLogo !== undefined) employer.companyLogo = companyLogo;
  if (dateEstablished !== undefined) employer.dateEstablished = dateEstablished;

  // Handle companyLocation specially
  if (companyLocation !== undefined) {
    if (typeof companyLocation === "string") {
      try {
        employer.companyLocation = JSON.parse(companyLocation);
      } catch (err) {
        employer.companyLocation = employer.companyLocation || {};
      }
    } else {
      employer.companyLocation = companyLocation;
    }
  }

  await employer.save();

  return employer;
};


