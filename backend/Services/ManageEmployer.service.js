import Admin from "../Model/AdminSchema.js";
import Employer from "../Model/EmployerSchema.js";
import AppError from "../Middleware/AppError.js";
import { doHash, doHashValidation } from "../validator/Hashing.js";
import jwt from 'jsonwebtoken';

export const createAdmin = async (adminData) => {
  const { email, password, adminCode, permissions } = adminData;

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new AppError("Admin with this email already exists", 400);
  }

  if (!password) {
    throw new AppError("Password is required", 400);
  }

  if (adminCode !== process.env.ADMIN_SECRET) {
    throw new AppError("Invalid admin code", 403);
  }

  const hashedPassword = await doHash(password, 10);

  const admin = await Admin.create({
    email,
    password: hashedPassword,
    adminCode,
    permissions
  });

  return admin;
};



export const LoginAdmin = async (email, password) => {
  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new AppError("Admin not found", 404);
  }


  const isMatch = await doHashValidation(password, admin.password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }


  const token = jwt.sign(
    { id: admin._id, role: "admin" },
    process.env.TOKEN_SECRET,
    { expiresIn: "1d" }
  );
  const {...adminSafe } = admin.toObject();

  return {
    admin : adminSafe,
    token
  };
};



export const acceptEmployer = async (employerId) => { 
   
    const employer = await Employer.findById(employerId);
    
    if (!employer) {
      throw new AppError("Employer not found", 404);
    }
    if (employer.approvalStatus === "Accepted") {
      throw new AppError("Employer is already verified", 400);
    }
    employer.approvalStatus = "Accepted";
    await employer.save();
    return employer;
}


export const rejectEmployer = async (employerId) => {
    const employer = await Employer.findById(employerId);
    if (!employer) {
      throw new AppError("Employer not found", 404);
    }

    if(employer.approvalStatus === "Accepted"){
      throw new AppError("Employer is already accepted", 403);
    }
    if (employer.approvalStatus === "Rejected") {
      throw new AppError("Employer is already rejected", 400);
    }
    employer.approvalStatus = "Rejected";
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





