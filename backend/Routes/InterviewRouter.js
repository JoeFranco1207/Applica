import express from 'express';
import {
  createInterview,
  getInterviewsForUser,
  getInterviewRoom,
  getInterviewRoomByInterview,
  endInterviewRoom,
  getWaitingParticipants,
  getInterviewWithRoomStatus,
  deleteInterview
} from '../Controller/InterviewController.js';
import { protection } from '../Controller/ProtectionController.js';

const router = express.Router();

// Interview management
router.post('/', protection, createInterview);
router.get('/user/:userId', getInterviewsForUser);
router.delete('/:interviewId', protection, deleteInterview);

// Interview room endpoints
router.get('/room/:roomId', getInterviewRoom);
router.get('/room-by-interview/:interviewId', getInterviewRoomByInterview);
router.post('/room/:roomId/end', endInterviewRoom);
router.get('/room/:roomId/waiting-participants', getWaitingParticipants);
router.get('/room/:roomId/details', getInterviewWithRoomStatus);

export default router;
