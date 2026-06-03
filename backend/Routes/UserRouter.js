import express from 'express';
import { Register, Login, Logout, sendVerificationCode, verifyCode, chooseRole, getProfile, getUserById, searchUsers, searchAll, deleteUser, updateProfile, changePassword, deactivateUser, createSupportTicket, getSupportTickets, updateConnectedAccounts, updateBillingPlan, getRecommendations, getPersonalizedJobsController, getPersonalizedPostsController, getPersonalizedFeedController } from '../Controller/UserController.js';
import { jobseekerProfile } from '../Controller/JobSeekerProfileController.js';
import { protection } from '../Controller/ProtectionController.js';
const router = express.Router();


router.post('/register', Register);
router.post('/login', Login);
// Allow logout without protection so we can clear server-side session even if token mismatches
router.post('/logout', Logout);
router.post('/sendVerificationCode', sendVerificationCode);
router.put('/verifyCode', verifyCode);
router.put('/select-role', protection, chooseRole);
router.get('/profile', protection, getProfile);
router.put('/profile', protection, updateProfile);
router.put('/profile/:id', protection, updateProfile);
router.put('/change-password/:id', protection, changePassword);
router.put('/deactivate/:id', protection, deactivateUser);
router.post('/support/tickets', protection, createSupportTicket);
router.get('/support/tickets', protection, getSupportTickets);
router.put('/connected-accounts', protection, updateConnectedAccounts);
router.put('/billing', protection, updateBillingPlan);
router.delete('/profile', protection, deleteUser);
router.get('/search', protection, searchAll);
router.get('/users/search', protection, searchUsers);
router.get('/users/:id', protection, getUserById);
router.get('/recommendations', protection, getRecommendations);
router.get('/feed/personalized-jobs', protection, getPersonalizedJobsController);
router.get('/feed/personalized-posts', protection, getPersonalizedPostsController);
router.get('/feed/personalized', protection, getPersonalizedFeedController);

export default router;