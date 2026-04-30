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
    companyLogo
  } = profileData;

  const employer = await Employer.findById(userId);

  if (!employer) {
    throw new AppError("Employer not found", 404);
  }

  employer.companyName = companyName;
  employer.companyDescription = companyDescription;
  employer.companyLocation = companyLocation;
  employer.companySize = companySize;
  employer.industry = industry;
  employer.website = website;
  employer.contactNumber = contactNumber;
  employer.companyLogo = companyLogo;

  await employer.save();

  return employer;
};