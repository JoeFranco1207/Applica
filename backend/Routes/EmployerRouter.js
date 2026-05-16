import express from "express";
import { protection, restrictTo } from "../Controller/ProtectionController.js";
import { employerProfileController } from "../Controller/EmployerProfileController.js";
import { createJobController } from "../Controller/CreateJobController.js";
import { getEmployerJobsController } from "../Controller/JobsController.js";
const router = express.Router();

router.put('/profile', protection, employerProfileController);
router.post('/create-job', protection, restrictTo('employer'), createJobController);
router.get('/my-jobs', protection, restrictTo('employer'), getEmployerJobsController);

export default router;