import express from "express";
import { protection, restrictTo } from "../Controller/ProtectionController.js";
import { employerProfileController } from "../Controller/EmployerProfileController.js";
import { createJobController } from "../Controller/CreateJobController.js";
import {
  getEmployerJobsController,
  notifyApplicantResumeViewedController,
  updateApplicantStatusController,
  removeApplicantController,
  deleteEmployerJobController,
  filterApplicantsWithAIController,
} from "../Controller/JobsController.js";
const router = express.Router();

router.put('/profile', protection, employerProfileController);
router.post('/create-job', protection, restrictTo('employer'), createJobController);
router.get('/my-jobs', protection, restrictTo('employer'), getEmployerJobsController);
router.patch('/my-jobs/:jobId/applicants/:applicantId/status', protection, restrictTo('employer'), updateApplicantStatusController);
router.post('/my-jobs/:jobId/applicants/:applicantId/view-resume', protection, restrictTo('employer'), notifyApplicantResumeViewedController);
router.delete('/my-jobs/:jobId/applicants/:applicantId', protection, restrictTo('employer'), removeApplicantController);
router.delete('/my-jobs/:jobId', protection, restrictTo('employer'), deleteEmployerJobController);
router.post('/my-jobs/:jobId/applicants/filter-ai', protection, restrictTo('employer'), filterApplicantsWithAIController);

export default router;