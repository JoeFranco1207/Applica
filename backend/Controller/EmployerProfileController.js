import AppSuccessful from "../Middleware/AppSuccessful.js";
import { employerProfileService } from "../Services/CreateEmployerProfile.service.js";

export const employerProfile = async (req, res, next) => {
  try {
    const userId = req.User.id;
    const profile = await employerProfileService(userId, req.body);

    return res.json(
      new AppSuccessful("Employer profile created successfully", 201, profile)
    );
  } catch (error) {
    next(error);
  }
};