import express from "express";
import { jobseekerProfile, updateJobseekerProfile  } from "../Controller/JobSeekerProfileController.js";
import { protection } from "../Controller/ProtectionController.js";
const router = express.Router();
router.put('/profile', protection, jobseekerProfile);
router.patch('/update-profile', protection, updateJobseekerProfile);

export default router;