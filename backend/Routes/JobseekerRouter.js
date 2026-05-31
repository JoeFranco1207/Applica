import express from "express";
import { jobseekerProfile, updateJobseekerProfile, createResumeController  } from "../Controller/JobSeekerProfileController.js";
import { getJobseekerApplicationsController } from "../Controller/JobsController.js";
import { protection, restrictTo } from "../Controller/ProtectionController.js";

const router = express.Router();
router.get('/applications', protection, restrictTo('jobseeker'), getJobseekerApplicationsController);
router.put('/profile', protection, jobseekerProfile);
router.patch('/update-profile', protection, updateJobseekerProfile);
// Endpoint used by frontend to create a resume from a selected design
router.post('/resume', protection, createResumeController);
router.post('/create-resume/:fileName', protection, createResumeController);
export default router;