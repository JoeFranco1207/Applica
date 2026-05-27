import Interview from '../Model/InterviewSchema.js';
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
