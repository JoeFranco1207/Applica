import Job from "../Model/JobSchema.js";
import AppError from "../Middleware/AppError.js";
import User from "../Model/UserSchema.js";
import Jobseeker from "../Model/JobseekerSchema.js";
import { createNotificationService } from "./Notification.service.js";
import { sendApplicantStatusEmail } from "./NodeMailer.js";

export const getAllJobs = async ({ limit, skip, includeTotal = false } = {}) => {
  const query = Job.find()
    .sort({ createdAt: -1 })
    .populate({
      path: "createdBy",
      select: "firstName lastName email companyName role profilePicture companyLogo",
    });

  if (typeof skip === 'number') query.skip(skip);
  if (typeof limit === 'number') query.limit(limit);

  const jobs = await query;
  if (includeTotal) {
    const total = await Job.countDocuments();
    return { jobs, total };
  }

  return { jobs };
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

  // Populate createdBy to return full employer info
  await job.populate({
    path: "createdBy",
    select: "firstName lastName email companyName role profilePicture companyLogo",
  });

  return job;
};

export const toggleJobLike = async (jobId, userId) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  const likeIndex = job.likes.findIndex((id) => id.toString() === userId.toString());
  const isLiking = likeIndex === -1;
  if (isLiking) {
    job.likes.push(userId);
  } else {
    job.likes.splice(likeIndex, 1);
  }

  await job.save();

  // Send notification to job creator when someone likes their job post
  const creatorId = job.createdBy?._id?.toString?.() || job.createdBy?.toString?.();
  if (isLiking && creatorId && creatorId !== userId.toString()) {
    try {
      await createNotificationService({
        type: 'like',
        recipient: creatorId,
        actor: userId,
        message: `liked your ${job.title || 'job posting'}`,
        jobId: job._id,
      });
    } catch (notificationError) {
      console.error('Failed to create job like notification:', notificationError);
    }
  }

  // Populate createdBy to return full employer info including email and profile picture
  await job.populate({
    path: "createdBy",
    select: "firstName lastName email companyName role profilePicture companyLogo",
  });

  return job;
};

export const applyToJob = async (jobId, userId, coverLetter = '') => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  const existingApplication = job.applicants.find((application) => {
    if (application.user) {
      return application.user.toString() === userId.toString();
    }
    if (application._id) {
      return application._id.toString() === userId.toString();
    }
    return application.toString() === userId.toString();
  });

  let applicantUser = await Jobseeker.findById(userId).select('resume');
  if (!applicantUser) {
    applicantUser = await User.findById(userId).select('resume');
  }

  if (!applicantUser || !applicantUser.resume || !applicantUser.resume.toString().trim()) {
    throw new AppError("Please create and save your resume before applying", 400);
  }

  if (existingApplication) {
    if (existingApplication.status === 'rejected') {
      const rejectedAt = existingApplication.rejectedAt || existingApplication.updatedAt || existingApplication.appliedAt;
      const reapplyDelayMs = 20 * 24 * 60 * 60 * 1000;
      const canReapplyAt = new Date(new Date(rejectedAt).getTime() + reapplyDelayMs);

      if (new Date() < canReapplyAt) {
        throw new AppError(
          "You can reapply to this job only after 20 days from rejection.",
          400
        );
      }

      existingApplication.status = 'pending';
      existingApplication.resume = applicantUser.resume;
      existingApplication.coverLetter = coverLetter || existingApplication.coverLetter || '';
      existingApplication.appliedAt = new Date();
      existingApplication.updatedAt = new Date();
      existingApplication.rejectedAt = undefined;
    } else {
      throw new AppError("You have already applied for this job", 400);
    }
  } else {
    job.applicants.push({
      user: userId,
      resume: applicantUser.resume,
      coverLetter: coverLetter || '',
      status: "pending",
      appliedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await job.save();

  const creatorId = job.createdBy?._id?.toString?.() || job.createdBy?.toString?.();
  if (creatorId && creatorId !== userId.toString()) {
    try {
      await createNotificationService({
        type: 'apply',
        recipient: creatorId,
        actor: userId,
        message: existingApplication
          ? `re-applied for ${job.title || 'your job'}`
          : `applied for ${job.title || 'your job'}`,
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

export const notifyApplicantResumeViewed = async (jobId, employerId, applicantId) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.createdBy.toString() !== employerId.toString()) {
    throw new AppError("Not authorized to view this applicant", 403);
  }

  const applicant = job.applicants.find((entry) => {
    if (entry.user) {
      return entry.user.toString() === applicantId.toString();
    }
    if (entry._id) {
      return entry._id.toString() === applicantId.toString();
    }
    return entry.toString() === applicantId.toString();
  });

  if (!applicant) {
    throw new AppError("Applicant not found", 404);
  }

  const applicantUserId = applicant.user ? applicant.user : applicant;

  await createNotificationService({
    type: 'view',
    recipient: applicantUserId,
    actor: employerId,
    message: `viewed your resume for ${job.title || 'your application'}`,
    jobId: job._id,
  });

  return applicant;
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
    resume: entry.resume,
    appliedAt: entry.appliedAt || new Date(),
    updatedAt: new Date(),
    rejectedAt: status === 'rejected' ? new Date() : undefined,
  };

  await job.save();
  await job.populate({
    path: "applicants.user",
    select: "_id firstName lastName email phoneNumber bio citizenShip experience education resume location profilePicture",
  });

  const applicantUser = await User.findById(applicantUserId).select('email firstName lastName');
  if (applicantUser && applicantUser.email) {
    const applicantName = `${applicantUser.firstName || ''} ${applicantUser.lastName || ''}`.trim();
    const employerUser = await User.findById(employerId).select('companyName firstName lastName');
    const employerName = employerUser?.companyName || `${employerUser?.firstName || ''} ${employerUser?.lastName || ''}`.trim() || 'Applica Employer';
    let message;

    if (status === 'rejected') {
      message = `Your application for ${job.title} has been rejected. You can reapply after 20 days.`;
    } else if (status === 'reviewing') {
      message = `Your application for ${job.title} is under review.`;
    } else if (status === 'accepted') {
      message = `Your application for ${job.title} has been accepted.`;
    } else {
      message = `Your application for ${job.title} is now ${status}.`;
    }

    try {
      await createNotificationService({
        type: 'status',
        recipient: applicantUser._id,
        actor: employerId,
        message,
        jobId: job._id,
      });
    } catch (notificationError) {
      console.error('Failed to create application status notification:', notificationError);
    }

    if (status === 'accepted' || status === 'rejected') {
      try {
        await sendApplicantStatusEmail(applicantUser.email, status, job.title || 'your job', employerName);
      } catch (emailError) {
        console.error('Failed to send applicant status email:', emailError);
      }
    }
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
