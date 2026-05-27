import Interview from '../Model/InterviewSchema.js';
import InterviewRoom from '../Model/InterviewRoomSchema.js';
import InterviewRoomService from '../Services/InterviewRoom.service.js';
import { sendNotificationToUser, sendInterviewInvite } from '../Services/SocketIO.service.js';

export const createInterview = async (req, res, next) => {
  try {
    const { employer, title, description, participants = [], scheduledAt, location } = req.body;
    if (!employer || !scheduledAt || !participants.length) {
      return res.status(400).json({ status: 'error', message: 'employer, scheduledAt and participants are required' });
    }

    const roomId = `interview_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const interview = await Interview.create({
      employer,
      title,
      description,
      participants,
      scheduledAt: new Date(scheduledAt),
      location,
      roomId,
      status: 'scheduled'
    });

    // notify participants via socket notifications if possible
    (participants || []).forEach((p) => {
      try {
        const userId = p.user || p;
        // send a dedicated interview invite socket event
        sendInterviewInvite(userId, {
          _id: interview._id,
          title: interview.title,
          scheduledAt: interview.scheduledAt,
          roomId: interview.roomId,
          employer: interview.employer
        });
        // also persist a generic notification fallback
        sendNotificationToUser(userId, {
          type: 'interview:invited',
          interview: {
            _id: interview._id,
            title: interview.title,
            scheduledAt: interview.scheduledAt,
            roomId: interview.roomId,
            employer: interview.employer
          }
        });
      } catch (err) {
        // continue
      }
    });

    return res.status(201).json({ status: 'success', message: 'Interview scheduled', data: interview });
  } catch (err) {
    next(err);
  }
};

export const getInterviewsForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ status: 'error', message: 'userId required' });
    const interviews = await Interview.find({ 'participants.user': userId }).sort({ scheduledAt: -1 }).lean();
    return res.status(200).json({ status: 'success', data: interviews });
  } catch (err) {
    next(err);
  }
};

// Get interview room details
export const getInterviewRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (!roomId) return res.status(400).json({ status: 'error', message: 'roomId required' });

    const room = await InterviewRoomService.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ status: 'error', message: 'Room not found' });
    }

    return res.status(200).json({ status: 'success', data: room });
  } catch (err) {
    next(err);
  }
};

// Get interview room by interview ID
export const getInterviewRoomByInterview = async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    if (!interviewId) return res.status(400).json({ status: 'error', message: 'interviewId required' });

    const room = await InterviewRoomService.getRoomByInterview(interviewId);
    if (!room) {
      return res.status(404).json({ status: 'error', message: 'Room not found' });
    }

    return res.status(200).json({ status: 'success', data: room });
  } catch (err) {
    next(err);
  }
};

// End interview room
export const endInterviewRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!roomId || !userId) {
      return res.status(400).json({ status: 'error', message: 'roomId and userId required' });
    }

    const room = await InterviewRoomService.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ status: 'error', message: 'Room not found' });
    }

    // Verify user is employer
    if (room.employer._id.toString() !== userId) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    await InterviewRoomService.endRoom(roomId);
    
    return res.status(200).json({ status: 'success', message: 'Interview room ended', data: room });
  } catch (err) {
    next(err);
  }
};

// Get waiting room participants
export const getWaitingParticipants = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (!roomId) return res.status(400).json({ status: 'error', message: 'roomId required' });

    const waitingParticipants = await InterviewRoomService.getWaitingParticipants(roomId);
    
    return res.status(200).json({ status: 'success', data: waitingParticipants });
  } catch (err) {
    next(err);
  }
};

// Get interview details with room status
export const getInterviewWithRoomStatus = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (!roomId) return res.status(400).json({ status: 'error', message: 'roomId required' });

    const interview = await Interview.findOne({ roomId })
      .populate('employer', 'firstName lastName profilePhoto email')
      .populate('participants.user', 'firstName lastName profilePhoto email');

    if (!interview) {
      return res.status(404).json({ status: 'error', message: 'Interview not found' });
    }

    const room = await InterviewRoomService.getRoom(roomId);

    return res.status(200).json({
      status: 'success',
      data: {
        interview,
        room: room ? {
          status: room.status,
          participants: room.participants,
          startedAt: room.startedAt,
          endedAt: room.endedAt
        } : null
      }
    });
  } catch (err) {
    next(err);
  }
};
