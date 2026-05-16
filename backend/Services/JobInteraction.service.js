import Job from "../Model/JobSchema.js";
import AppError from "../Middleware/AppError.js";

export const getAllJobs = async () => {
  return Job.find()
    .sort({ createdAt: -1 })
    .populate({
      path: "createdBy",
      select: "firstName lastName email companyName role",
    });
};

export const addJobView = async (jobId, userId) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (!job.views.includes(userId)) {
    job.views.push(userId);
    await job.save();
  }

  return job;
};

export const toggleJobLike = async (jobId, userId) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  const likeIndex = job.likes.findIndex((id) => id.toString() === userId.toString());
  if (likeIndex === -1) {
    job.likes.push(userId);
  } else {
    job.likes.splice(likeIndex, 1);
  }

  await job.save();
  return job;
};

export const applyToJob = async (jobId, userId) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.applicants.some((id) => id.toString() === userId.toString())) {
    return job;
  }

  job.applicants.push(userId);
  await job.save();
  return job;
};

export const getJobById = async (jobId) => {
  const job = await Job.findById(jobId).populate({
    path: "createdBy",
    select: "firstName lastName email companyName role",
  });

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  return job;
};

export const getEmployerJobs = async (employerId) => {
  return Job.find({ createdBy: employerId })
    .sort({ createdAt: -1 })
    .populate({
      path: "createdBy",
      select: "firstName lastName email companyName role",
    })
    .populate({
      path: "views",
      match: { role: "jobseeker" },
      select: "_id firstName lastName email",
    })
    .populate({
      path: "likes",
      match: { role: "jobseeker" },
      select: "_id firstName lastName email",
    })
    .populate({
      path: "applicants",
      match: { role: "jobseeker" },
      select: "_id firstName lastName email phoneNumber bio citizenShip experience education resume location profilePicture",
    });
};
