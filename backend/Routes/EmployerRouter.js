import express from "express";
import { protection } from "../Controller/ProtectionController.js";
import { employerProfileController } from "../Controller/EmployerProfileController.js";
import { createJobController } from "../Controller/CreateJobController.js"
const router = express.Router();

router.put('/profile', protection, employerProfileController);
router.post('/create-job', protection, createJobController);

export default router;