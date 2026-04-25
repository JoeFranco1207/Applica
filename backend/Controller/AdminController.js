import { createAdmin } from "../Services/ManageEmployer.service.js";
import AppSuccessful from "../Middleware/AppSuccessful.js";

export const registerAdmin = async (req, res, next) => {
  try {
    const adminData = req.body;
    const newAdmin = await createAdmin(adminData);

    return res.json(
      new AppSuccessful("Admin registered successfully", 201, newAdmin)
    );
  } catch (error) {
    next(error);
  } 
};