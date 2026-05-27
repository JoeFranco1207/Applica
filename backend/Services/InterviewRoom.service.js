import InterviewRoom from '../Model/InterviewRoomSchema.js';
import Interview from '../Model/InterviewSchema.js';

class InterviewRoomService {
  constructor() {
    this.rooms = new Map(); // In-memory room tracking for faster access
    this.userSockets = new Map(); // Map userId -> socketId
  }

  // Create or get a room
  async initializeRoom(roomId, interviewId, employerId) {
    let room = await InterviewRoom.findOne({ roomId });
    
    if (!room) {
      room = await InterviewRoom.create({
        roomId,
        interview: interviewId,
        employer: employerId,
        status: 'waiting'
      });
    }
    
    this.rooms.set(roomId, {
      roomId,
      participants: new Map(),
      screenShareStream: null,
      recordingSession: null
    });
    
    return room;
  }

  // Add participant to room
  async addParticipant(roomId, userId, socketId, role = 'applicant') {
    const room = await InterviewRoom.findOne({ roomId });
    if (!room) return null;

    // Check if participant already exists
    const existingIndex = room.participants.findIndex(p => p.user.toString() === userId.toString());
    
    if (existingIndex >= 0) {
      // Update existing participant
      room.participants[existingIndex].socketId = socketId;
      room.participants[existingIndex].status = 'in-room';
      room.participants[existingIndex].joinedAt = new Date();
    } else {
      // Add new participant
      room.participants.push({
        user: userId,
        socketId,
        role,
        status: 'in-room',
        joinedAt: new Date()
      });
    }

    // Update status to active if not already
    if (room.status === 'waiting' && room.participants.some(p => p.role === 'employer')) {
      room.status = 'active';
      room.startedAt = new Date();
    }

    await room.save();
    this.userSockets.set(userId, socketId);
    
    return room;
  }

  // Remove participant from room
  async removeParticipant(roomId, userId) {
    const room = await InterviewRoom.findOne({ roomId });
    if (!room) return null;

    const participantIndex = room.participants.findIndex(p => p.user.toString() === userId.toString());
    
    if (participantIndex >= 0) {
      room.participants[participantIndex].status = 'left';
      room.participants[participantIndex].leftAt = new Date();
    }

    // Check if room should be ended
    const activeParticipants = room.participants.filter(p => p.status === 'in-room');
    if (activeParticipants.length === 0) {
      room.status = 'ended';
      room.endedAt = new Date();
    }

    await room.save();
    this.userSockets.delete(userId);
    
    return room;
  }

  // Admit participant from waiting room
  async admitParticipant(roomId, userId) {
    const room = await InterviewRoom.findOne({ roomId });
    if (!room) return null;

    const participant = room.participants.find(p => p.user.toString() === userId.toString());
    if (participant) {
      participant.status = 'in-room';
    }

    await room.save();
    return room;
  }

  // Deny participant (reject from waiting room)
  async denyParticipant(roomId, userId) {
    const room = await InterviewRoom.findOne({ roomId });
    if (!room) return null;

    room.participants = room.participants.filter(p => p.user.toString() !== userId.toString());
    await room.save();
    
    return room;
  }

  // Get room details
  async getRoom(roomId) {
    return await InterviewRoom.findOne({ roomId })
      .populate('interview')
      .populate('employer', 'firstName lastName profilePhoto')
      .populate('participants.user', 'firstName lastName profilePhoto email');
  }

  // Get room by interview ID
  async getRoomByInterview(interviewId) {
    return await InterviewRoom.findOne({ interview: interviewId })
      .populate('interview')
      .populate('employer', 'firstName lastName profilePhoto')
      .populate('participants.user', 'firstName lastName profilePhoto email');
  }

  // Toggle screen share
  async toggleScreenShare(roomId, userId, isSharing) {
    const room = await InterviewRoom.findOne({ roomId });
    if (!room) return null;

    const participant = room.participants.find(p => p.user.toString() === userId.toString());
    if (participant) {
      participant.isScreenSharing = isSharing;
    }

    await room.save();
    return room;
  }

  // Toggle audio/video
  async toggleMedia(roomId, userId, mediaType, enabled) {
    const room = await InterviewRoom.findOne({ roomId });
    if (!room) return null;

    const participant = room.participants.find(p => p.user.toString() === userId.toString());
    if (participant) {
      if (mediaType === 'audio') participant.audioEnabled = enabled;
      if (mediaType === 'video') participant.videoEnabled = enabled;
    }

    await room.save();
    return room;
  }

  // Get participants in room
  getParticipantsInRoom(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.participants.values()) : [];
  }

  // Get waiting room participants
  async getWaitingParticipants(roomId) {
    const room = await InterviewRoom.findOne({ roomId });
    if (!room) return [];
    
    return room.participants
      .filter(p => p.status === 'waiting')
      .map(p => ({
        userId: p.user,
        socketId: p.socketId,
        role: p.role
      }));
  }

  // End room session
  async endRoom(roomId) {
    const room = await InterviewRoom.findOne({ roomId });
    if (!room) return null;

    room.status = 'ended';
    room.endedAt = new Date();
    room.participants.forEach(p => {
      if (p.status === 'in-room') {
        p.status = 'left';
        p.leftAt = new Date();
      }
    });

    await room.save();
    this.rooms.delete(roomId);
    
    return room;
  }

  // Cleanup old rooms (older than 24 hours and ended)
  async cleanupOldRooms() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await InterviewRoom.deleteMany({
      status: 'ended',
      endedAt: { $lt: twentyFourHoursAgo }
    });
  }
}

export default new InterviewRoomService();
