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

export const rejectEmployer = async (employerId) => {
    const employer = await Employer.findById(employerId);
    if (!employer) {
      throw new AppError("Employer not found", 404);
    }
    if (employer.AccountStatus === "Rejected") {
      throw new AppError("Employer is already rejected", 400);
    }
    employer.AccountStatus = "Rejected";
    await employer.save();
    return employer;
}

export const getPendingEmployers = async () => {
    const pendingEmployers = await Employer.find({ AccountStatus: "Pending" });
    return pendingEmployers;
}
export const getAllEmployers = async () => {
    const employers = await Employer.find();
    return employers;
}

export const getEmployerById = async (employerId) => {
    const employer = await Employer.findById(employerId);
    if (!employer) {
      throw new AppError("Employer not found", 404);
    }
    return employer;
}

export const deleteEmployer = async (employerId) => {
    const employer = await Employer.findById(employerId);
    if (!employer) {
      throw new AppError("Employer not found", 404);
    }
    await Employer.findByIdAndDelete(employerId);
    return { message: "Employer deleted successfully" };
}





