import AppSuccessful from "../Middleware/AppSuccessful.js";
import {
  getAllJobs,
  addJobView,
  toggleJobLike,
  applyToJob,
  getEmployerJobs,
  getJobById,
  notifyApplicantResumeViewed,
  updateApplicantStatus,
  removeApplicant,
  deleteEmployerJob,
} from "../Services/JobInteraction.service.js";

export const getJobsController = async (req, res, next) => {
  try {
    const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10) || 1) : null;
    const limit = req.query.limit
      ? Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10))
      : null;
    const skip = page ? (page - 1) * limit : undefined;
    const includeTotal = page === 1;

    if (page) {
      const data = await getAllJobs({ limit, skip, includeTotal });
      const hasMore = data.jobs.length === limit;
      const totalPages = includeTotal && data.total > 0 ? Math.ceil(data.total / limit) : 0;

      return res.success(
        new AppSuccessful("Jobs retrieved successfully", 200, {
          jobs: data.jobs,
          total: includeTotal ? data.total : undefined,
          page,
          limit,
          totalPages: includeTotal ? totalPages : undefined,
          hasMore,
        })
      );
    }

    const data = await getAllJobs();
    return res.success(new AppSuccessful("Jobs retrieved successfully", 200, data.jobs));
  } catch (err) {
    next(err);
  }
};

export const getJobByIdController = async (req, res, next) => {
  try {
    const job = await getJobById(req.params.jobId);
    return res.success(new AppSuccessful("Job retrieved successfully", 200, job));
  } catch (err) {
    next(err);
  }
};

export const addJobViewController = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;
    const updatedJob = await addJobView(jobId, req.user.id);
    return res.success(new AppSuccessful("Job view recorded", 200, updatedJob));
  } catch (err) {
    next(err);
  }
};

export const toggleJobLikeController = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;
    const updatedJob = await toggleJobLike(jobId, req.user.id);
    // The toggleJobLike function already populates createdBy, but ensure it's returned
    return res.success(new AppSuccessful("Job like updated", 200, updatedJob));
  } catch (err) {
    next(err);
  }
};

export const applyToJobController = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;
    const coverLetter = typeof req.body.coverLetter === 'string' ? req.body.coverLetter.trim() : '';
    const updatedJob = await applyToJob(jobId, req.user.id, coverLetter);
    return res.success(new AppSuccessful("Application recorded", 200, updatedJob));
  } catch (err) {
    next(err);
  }
};

export const updateApplicantStatusController = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;
    const applicantId = req.params.applicantId;
    const { status } = req.body;
    const updatedJob = await updateApplicantStatus(jobId, req.user.id, applicantId, status);
    return res.success(new AppSuccessful("Applicant status updated", 200, updatedJob));
  } catch (err) {
    next(err);
  }
};

export const removeApplicantController = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;
    const applicantId = req.params.applicantId;
    const updatedJob = await removeApplicant(jobId, req.user.id, applicantId);
    return res.success(new AppSuccessful("Applicant removed", 200, updatedJob));
  } catch (err) {
    next(err);
  }
};

export const notifyApplicantResumeViewedController = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;
    const applicantId = req.params.applicantId;
    const result = await notifyApplicantResumeViewed(jobId, req.user.id, applicantId);
    return res.success(new AppSuccessful("Employer viewed applicant resume", 200, result));
  } catch (err) {
    next(err);
  }
};

export const getEmployerJobsController = async (req, res, next) => {
  try {
    const employerId = req.user.id;
    const jobs = await getEmployerJobs(employerId);
    return res.success(new AppSuccessful("Employer jobs retrieved", 200, jobs));
  } catch (err) {
    next(err);
  }
};

export const deleteEmployerJobController = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;
    const deletedJob = await deleteEmployerJob(jobId, req.user.id);
    return res.success(new AppSuccessful("Job deleted successfully", 200, deletedJob));
  } catch (err) {
    next(err);
  }
};
