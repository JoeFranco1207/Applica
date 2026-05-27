import express from 'express';
import { createInterview, getInterviewsForUser } from '../Controller/InterviewController.js';

const router = express.Router();

router.post('/', createInterview);
router.get('/user/:userId', getInterviewsForUser);

export default router;
