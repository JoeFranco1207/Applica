import Job from "../Model/JobSchema.js";
import User from "../Model/UserSchema.js";
import Notification from "../Model/NotificationSchema.js";
import AppError from "../Middleware/AppError.js";
import { createNotificationService } from "./Notification.service.js";

export const getAllJobs = async () => {
  return Job.find()
    .sort({ createdAt: -1 })
    .populate({
      path: "createdBy",
      select: "firstName lastName email companyName role profilePicture companyLogo",
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
  
  // Create real-time notification for employer when someone applies to their job
  if (job.createdBy.toString() !== userId.toString()) {
    await createNotificationService({
      type: 'apply',
      recipient: job.createdBy,
      actor: userId,
      message: `applied for ${job.title || 'your job'}`,
      jobId: job._id,
    });
  }
  
  return job;
};

export const getJobById = async (jobId) => {
  const job = await Job.findById(jobId).populate({
    path: "createdBy",
    select: "firstName lastName email companyName role profilePicture companyLogo",
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
      select: "firstName lastName email companyName role profilePicture companyLogo",
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
