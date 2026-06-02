import Job from "../Model/JobSchema.js";
import Employer from "../Model/EmployerSchema.js";
import AppError from "../Middleware/AppError.js";

// Premium limits configuration
const PREMIUM_LIMITS = {
  free: {
    maxActiveJobs: 1,
    descriptionMaxWords: 100,
    requirementsMaxWords: 60,
    descriptionMaxChars: 500,
    requirementsMaxChars: 300,
    postDurationDays: 14,
  },
  premium: {
    maxActiveJobs: null, // unlimited
    descriptionMaxWords: 300,
    requirementsMaxWords: 150,
    descriptionMaxChars: 2000,
    requirementsMaxChars: 1000,
    postDurationDays: 60,
  },
};

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
    employmentType,
    remoteType,
    externalLink,
    media,
  } = jobData;

  const employer = await Employer.findById(employerId);

  if (!employer) {
    throw new AppError("Employer not found", 404);
  }

  const isPremium = !!employer.premiumAIAccess;
  const limits = isPremium ? PREMIUM_LIMITS.premium : PREMIUM_LIMITS.free;

  const getWordCount = (text = "") => {
    return typeof text !== 'string'
      ? 0
      : text
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;
  };

  const descriptionWordCount = getWordCount(description);
  const requirementsWordCount = getWordCount(requirements);

  // Check active job limit
  if (limits.maxActiveJobs) {
    const activeJobCount = await Job.countDocuments({
      createdBy: employerId,
      deletedAt: { $exists: false },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    if (activeJobCount >= limits.maxActiveJobs) {
      throw new AppError(
        `You can only have ${limits.maxActiveJobs} active job posts on the free plan. Upgrade to premium for unlimited posting!`,
        403,
        { errorCode: 'JOB_LIMIT_EXCEEDED', limit: limits.maxActiveJobs }
      );
    }
  }

  // Check description word limit
  if (descriptionWordCount > limits.descriptionMaxWords) {
    throw new AppError(
      `Job description exceeds ${limits.descriptionMaxWords} words. ${!isPremium ? 'Upgrade to premium for longer posting descriptions!' : ''}`,
      400,
      {
        errorCode: 'DESCRIPTION_TOO_LONG',
        limit: limits.descriptionMaxWords,
        current: descriptionWordCount,
      }
    );
  }

  // Check requirements word limit
  if (requirementsWordCount > limits.requirementsMaxWords) {
    throw new AppError(
      `Requirements exceed ${limits.requirementsMaxWords} words. ${!isPremium ? 'Upgrade to premium for more detailed requirements!' : ''}`,
      400,
      {
        errorCode: 'REQUIREMENTS_TOO_LONG',
        limit: limits.requirementsMaxWords,
        current: requirementsWordCount,
      }
    );
  }

  // Optional safety guard for overly long text
  if (description && description.length > limits.descriptionMaxChars) {
    throw new AppError(
      `Job description exceeds ${limits.descriptionMaxChars} characters and is too long to save.`,
      400,
      { errorCode: 'DESCRIPTION_TOO_LONG_CHAR', limit: limits.descriptionMaxChars, current: description.length }
    );
  }

  if (requirements && requirements.length > limits.requirementsMaxChars) {
    throw new AppError(
      `Requirements exceed ${limits.requirementsMaxChars} characters and are too long to save.`,
      400,
      { errorCode: 'REQUIREMENTS_TOO_LONG_CHAR', limit: limits.requirementsMaxChars, current: requirements.length }
    );
  }

  const jobPayload = {
    title,
    description,
    requirements,
    companyName: employer.companyName,
    location,
    employmentType: employmentType || "Full-time",
    remoteType: remoteType || "Remote",
    salary: salaryMin ? Number(salaryMin) : salary ? Number(salary) : 0,
    salaryMin: salaryMin ? Number(salaryMin) : undefined,
    salaryMax: salaryMax ? Number(salaryMax) : undefined,
    salaryFrequency: salaryFrequency || "monthly",
    createdBy: employerId,
    expiresAt: new Date(Date.now() + limits.postDurationDays * 24 * 60 * 60 * 1000),
    postPlan: isPremium ? "premium" : "free",
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
