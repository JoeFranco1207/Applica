import express from "express";
import { jobseekerProfile, updateJobseekerProfile, createResumeController  } from "../Controller/JobSeekerProfileController.js";
import { protection } from "../Controller/ProtectionController.js";

const router = express.Router();
router.put('/profile', protection, jobseekerProfile);
router.patch('/update-profile', protection, updateJobseekerProfile);
router.post('/create-resume/:fileName', protection, createResumeController);
export default router;