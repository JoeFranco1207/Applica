import express from 'express';
import {Register , Login, sendVerificationCode, verifyCode , chooseRole } from '../Controller/UserController.js'
import { jobseekerProfile } from '../Controller/JobSeekerProfileController.js';
import { protection } from '../Controller/ProtectionController.js';
const router = express.Router();

router.post("/register", Register);
router.post("/login", Login);
router.post("/sendVerificationCode", sendVerificationCode);
router.put("/verifyCode", verifyCode);
router.put('/select-role', protection, chooseRole);
export default router;

// {
//   "citizenShip": "Filipino",
//   "location": {
//     "region": "NCR",
//     "city": "Quezon City",
//     "barangay": "Cubao",
//     "otherDetails": "Near MRT"
//   },
//   "experience": "2 years internship",
//   "education": "BS Computer Science",
//   "resume": "https://example.com/resume.pdf",
//   "profilePicture": "https://example.com/profile.jpg",
//   "bio": "Motivated developer"
// }