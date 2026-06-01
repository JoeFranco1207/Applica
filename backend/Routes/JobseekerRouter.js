import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { jobseekerProfile, updateJobseekerProfile, createResumeController, uploadResumeController } from "../Controller/JobSeekerProfileController.js";
import { getJobseekerApplicationsController } from "../Controller/JobsController.js";
import { protection, restrictTo } from "../Controller/ProtectionController.js";

const router = express.Router();
// configure multer storage for resume uploads
const resumeUploadDir = path.join(process.cwd(), 'uploads', 'resumes');
fs.mkdirSync(resumeUploadDir, { recursive: true });
const storage = multer.diskStorage({
	destination: resumeUploadDir,
	filename: (req, file, cb) => {
		const timestamp = Date.now();
		const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
		cb(null, `${timestamp}_${safeName}`);
	}
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/applications', protection, restrictTo('jobseeker'), getJobseekerApplicationsController);
router.put('/profile', protection, jobseekerProfile);
router.patch('/update-profile', protection, updateJobseekerProfile);
// Endpoint used by frontend to create a resume from a selected design
router.post('/resume', protection, createResumeController);
router.post('/create-resume/:fileName', protection, createResumeController);

// Upload a user-provided resume (PDF/DOC).
router.post('/upload-resume', protection, upload.single('resume'), uploadResumeController);
export default router;