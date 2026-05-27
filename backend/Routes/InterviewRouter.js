import express from 'express';
import {
  createInterview,
  getInterviewsForUser,
  getInterviewRoom,
  getInterviewRoomByInterview,
  endInterviewRoom,
  getWaitingParticipants,
  getInterviewWithRoomStatus
} from '../Controller/InterviewController.js';

const router = express.Router();

// Interview management
router.post('/', createInterview);
router.get('/user/:userId', getInterviewsForUser);

// Interview room endpoints
router.get('/room/:roomId', getInterviewRoom);
router.get('/room-by-interview/:interviewId', getInterviewRoomByInterview);
router.post('/room/:roomId/end', endInterviewRoom);
router.get('/room/:roomId/waiting-participants', getWaitingParticipants);
router.get('/room/:roomId/details', getInterviewWithRoomStatus);

export default router;
