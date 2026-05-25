import Job from "../Model/JobSchema.js";
import Employer from "../Model/EmployerSchema.js";
import AppError from "../Middleware/AppError.js";
export const createJob = async (jobData, employerId) => {
  const {
    title,
    description,
    requirements,
    location,
    salary,
    salaryMin,
    salaryMax,
    salaryFrequency,
    externalLink,
    media,
  } = jobData;

  const employer = await Employer.findById(employerId);

  if (!employer) {
    throw new AppError("Employer not found", 404);
  }

 
  const jobPayload = {
    title,
    description,
    requirements,
    companyName: employer.companyName,
    location,
    salary: salaryMin ? Number(salaryMin) : salary ? Number(salary) : 0,
    salaryMin: salaryMin ? Number(salaryMin) : undefined,
    salaryMax: salaryMax ? Number(salaryMax) : undefined,
    salaryFrequency: salaryFrequency || "monthly",
    createdBy: employerId,
  };

  if (externalLink) {
    jobPayload.externalLink = externalLink;
  }

  if (media && media.data) {
    jobPayload.media = media;
  }

  const newJob = await Job.create(jobPayload);

  return newJob;
};