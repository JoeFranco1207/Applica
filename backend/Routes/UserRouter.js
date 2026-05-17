import express from 'express';
import { Register, Login, sendVerificationCode, verifyCode, chooseRole, getProfile, getUserById, deleteUser } from '../Controller/UserController.js';
import { jobseekerProfile } from '../Controller/JobSeekerProfileController.js';
import { protection } from '../Controller/ProtectionController.js';
const router = express.Router();

router.post('/register', Register);
router.post('/login', Login);
router.post('/sendVerificationCode', sendVerificationCode);
router.put('/verifyCode', verifyCode);
router.put('/select-role', protection, chooseRole);
router.get('/profile', protection, getProfile);
router.delete('/profile', protection, deleteUser);
router.get('/users/:id', protection, getUserById);

export default router;