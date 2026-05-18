import Job from "../Model/JobSchema.js";
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

  if (
    job.applicants.some(
      (application) =>
        application.user?.toString() === userId.toString() ||
        application.toString() === userId.toString()
    )
  ) {
    return job;
  }

  job.applicants.push({
    user: userId,
    status: "pending",
    appliedAt: new Date(),
    updatedAt: new Date(),
  });

  await job.save();

  const creatorId = job.createdBy?._id?.toString?.() || job.createdBy?.toString?.();
  if (creatorId && creatorId !== userId.toString()) {
    try {
      await createNotificationService({
        type: 'apply',
        recipient: creatorId,
        actor: userId,
        message: `applied for ${job.title || 'your job'}`,
        jobId: job._id,
      });
    } catch (notificationError) {
      console.error('Failed to create job apply notification:', notificationError);
    }
  }

  await job.populate({
    path: "createdBy",
    select: "firstName lastName email companyName role profilePicture companyLogo",
  });

  return job;
};

export const updateApplicantStatus = async (jobId, employerId, applicantId, status) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.createdBy.toString() !== employerId.toString()) {
    throw new AppError("Not authorized to update this job application", 403);
  }

  const applicationIndex = job.applicants.findIndex((entry) => {
    if (entry.user) {
      return entry.user.toString() === applicantId.toString();
    }
    if (entry._id) {
      return entry._id.toString() === applicantId.toString();
    }
    return entry.toString() === applicantId.toString();
  });

  if (applicationIndex === -1) {
    throw new AppError("Applicant not found", 404);
  }

  const validStatuses = ["pending", "reviewing", "accepted", "rejected"];
  if (!validStatuses.includes(status)) {
    throw new AppError("Invalid status update", 400);
  }

  const entry = job.applicants[applicationIndex];
  const applicantUserId = entry.user ? entry.user : entry;
  job.applicants[applicationIndex] = {
    user: applicantUserId,
    status,
    appliedAt: entry.appliedAt || new Date(),
    updatedAt: new Date(),
  };

  await job.save();
  await job.populate({
    path: "applicants.user",
    select: "_id firstName lastName email phoneNumber bio citizenShip experience education resume location profilePicture",
  });

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
      path: "applicants.user",
      select: "_id firstName lastName email phoneNumber bio citizenShip experience education resume location profilePicture",
    });
};

export const deleteEmployerJob = async (jobId, employerId) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.createdBy.toString() !== employerId.toString()) {
    throw new AppError("Not authorized to delete this job", 403);
  }

  await job.deleteOne();
  return job;
};

export const removeApplicant = async (jobId, employerId, applicantId) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.createdBy.toString() !== employerId.toString()) {
    throw new AppError("Not authorized to remove this application", 403);
  }

  const applicationIndex = job.applicants.findIndex((entry) => {
    if (entry.user) {
      return entry.user.toString() === applicantId.toString();
    }
    if (entry._id) {
      return entry._id.toString() === applicantId.toString();
    }
    return entry.toString() === applicantId.toString();
  });

  if (applicationIndex === -1) {
    throw new AppError("Applicant not found", 404);
  }

  job.applicants.splice(applicationIndex, 1);
  await job.save();

  await job.populate({
    path: "createdBy",
    select: "firstName lastName email companyName role profilePicture companyLogo",
  });
  await job.populate({
    path: "views",
    match: { role: "jobseeker" },
    select: "_id firstName lastName email",
  });
  await job.populate({
    path: "likes",
    match: { role: "jobseeker" },
    select: "_id firstName lastName email",
  });
  await job.populate({
    path: "applicants.user",
    select: "_id firstName lastName email phoneNumber bio citizenShip experience education resume location profilePicture",
  });

  return job;
};
