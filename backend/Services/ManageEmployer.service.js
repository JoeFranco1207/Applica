import Admin from "../Model/AdminSchema.js";
import Employer from "../Model/EmployerSchema.js";
import AppError from "../Middleware/AppError.js";
import { doHash } from "../validator/Hashing.js";

export const createAdmin = async (adminData) => {
  const { email, password, adminCode, permissions } = adminData;


  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new AppError("Admin with this email already exists", 400);
  }

  if (adminCode !== process.env.ADMIN_SECRET) {
    throw new AppError("Invalid admin code", 403);
  }


  const hashedPassword = await doHash(password);

  const newAdmin = await Admin.create({
    email,
    password: hashedPassword,
    adminCode,
    permissions
  });

  return newAdmin;
};

export const acceptEmployer = async (employerId) => {
    
    const employer = await Employer.findById(employerId);
    if (!employer) {
      throw new AppError("Employer not found", 404);
    }
    if (employer.AccountStatus === "Verified") {
      throw new AppError("Employer is already verified", 400);
    }
    employer.AccountStatus = "Verified";
    await employer.save();
    return employer;
}
