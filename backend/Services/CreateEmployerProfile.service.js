import AppError from "../Middleware/AppError.js";
import User from "../Model/UserSchema.js";

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

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== "employer") {
    throw new AppError("User is not an employer", 403);
  }

  // build update object only with allowed fields
  const updateData = {};
  if (companyName !== undefined) updateData.companyName = companyName;
  if (companyDescription !== undefined) updateData.companyDescription = companyDescription;
  if (companySize !== undefined) updateData.companySize = companySize;
  if (industry !== undefined) updateData.industry = industry;
  if (website !== undefined) updateData.website = website;
  if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
  if (companyLogo !== undefined) updateData.companyLogo = companyLogo;
  if (dateEstablished !== undefined) updateData.dateEstablished = dateEstablished;

  if (companyLocation !== undefined) {
    if (typeof companyLocation === "string") {
      try {
        updateData.companyLocation = JSON.parse(companyLocation);
      } catch (err) {
        updateData.companyLocation = user.companyLocation || {};
      }
    } else {
      updateData.companyLocation = companyLocation;
    }
  }

  // apply updates directly to the user document so discriminators (if not created) are handled
  for (const key of Object.keys(updateData)) {
    user[key] = updateData[key];
  }

  await user.save();

  return user;
};


