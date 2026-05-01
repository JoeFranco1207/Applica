import Job from "../Model/JobSchema.js";
import Employer from "../Model/EmployerSchema.js";
import AppError from "../Middleware/AppError.js";
export const createJob = async (jobData, employerId) => {
  const { title, description, requirements, location, salary } = jobData;

  const employer = await Employer.findById(employerId);

  if (!employer) {
    throw new AppError("Employer not found", 404);
  }

 
  const newJob = await Job.create({
    title,
    description,
    requirements,
    companyName: employer.companyName, 
    location,
    salary,
    createdBy: employerId
  });

  return newJob;
};