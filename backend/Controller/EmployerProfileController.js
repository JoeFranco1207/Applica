import AppSuccessful from "../Middleware/AppSuccessful.js";
import { employerProfileService } from "../Services/CreateEmployerProfile.service.js";
import Employer from '../Model/EmployerSchema.js'

export const employerProfileController = async (req, res, next) => {
  try {
    const userId = req.Employer.companyName;
    const profile = await employerProfileService(userId, req.body);

    return res.json(
      new AppSuccessful("Employer profile created successfully", 201, profile)
    );
  } catch (err) {
    console.log(err)
    next(err);
  }
};

