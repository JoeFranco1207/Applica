import InterviewRoomService from './InterviewRoom.service.js';
import Interview from '../Model/InterviewSchema.js';
import { getSocketIdByUser } from './SocketIO.service.js';

export const initializeInterviewRoomSocket = (io, socket) => {
  // Join interview waiting room
  socket.on('interview-room:join', async (data) => {
    try {
      const { roomId, userId, role = 'applicant' } = data;
      if (!roomId || !userId) return;

      socket.userId = userId;
      socket.join(roomId);

      // Initialize room if needed
      const room = await InterviewRoomService.getRoom(roomId);
      if (!room) {
        const interview = await Interview.findOne({ roomId });
        if (interview) {
          await InterviewRoomService.initializeRoom(roomId, interview._id, interview.employer);
        }
      }

      // Add participant to room
      await InterviewRoomService.addParticipant(roomId, userId, socket.id, role);

      // Get current room state
      const updatedRoom = await InterviewRoomService.getRoom(roomId);

      // Emit to room about new participant
      io.to(roomId).emit('interview-room:participant-joined', {
        participant: {
          user: userId,
          role,
          socketId: socket.id
        },
        roomState: {
          roomId,
          participants: updatedRoom.participants,
          status: updatedRoom.status
        }
      });

      // Send current room state to the joining participant
      socket.emit('interview-room:state', {
        roomId,
        participants: updatedRoom.participants,
        status: updatedRoom.status,
        employer: updatedRoom.employer
      });

      console.log(`User ${userId} joined interview room ${roomId}`);
    } catch (err) {
      console.error('Error joining interview room:', err?.message);
      socket.emit('interview-room:error', { message: 'Failed to join interview room' });
    }
  });

  // Admit participant from waiting room (employer action)
  socket.on('interview-room:admit', async (data) => {
    try {
      const { roomId, userId } = data;
      if (!roomId || !userId) return;

      // Verify the socket owner is the employer
      const room = await InterviewRoomService.getRoom(roomId);
      if (room.employer._id.toString() !== socket.userId) {
        socket.emit('interview-room:error', { message: 'Unauthorized' });
        return;
      }

      await InterviewRoomService.admitParticipant(roomId, userId);

      // Notify the admitted participant
      const targetSocketId = getSocketIdByUser(userId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('interview-room:admitted', {
          roomId,
          message: 'You have been admitted to the interview'
        });
      }

      // Notify all in room
      const updatedRoom = await InterviewRoomService.getRoom(roomId);
      io.to(roomId).emit('interview-room:participant-admitted', {
        userId,
        participants: updatedRoom.participants
      });

      console.log(`User ${userId} admitted to interview room ${roomId}`);
    } catch (err) {
      console.error('Error admitting participant:', err?.message);
      socket.emit('interview-room:error', { message: 'Failed to admit participant' });
    }
  });

  // Reject/deny participant from waiting room
  socket.on('interview-room:deny', async (data) => {
    try {
      const { roomId, userId } = data;
      if (!roomId || !userId) return;

      const room = await InterviewRoomService.getRoom(roomId);
      if (room.employer._id.toString() !== socket.userId) {
        socket.emit('interview-room:error', { message: 'Unauthorized' });
        return;
      }

      await InterviewRoomService.denyParticipant(roomId, userId);

      // Notify the denied participant
      const targetSocketId = getSocketIdByUser(userId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('interview-room:denied', {
          roomId,
          message: 'Your request to join has been denied'
        });
      }

      console.log(`User ${userId} denied entry to interview room ${roomId}`);
    } catch (err) {
      console.error('Error denying participant:', err?.message);
      socket.emit('interview-room:error', { message: 'Failed to deny participant' });
    }
  });

  // WebRTC Signaling - Offer
  socket.on('interview-room:webrtc-offer', async (data) => {
    try {
      const { roomId, targetUserId, offer } = data;
      if (!roomId || !targetUserId || !offer) return;

      const targetSocketId = getSocketIdByUser(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('interview-room:webrtc-offer', {
          from: socket.userId,
          offer,
          roomId
        });
      }
    } catch (err) {
      console.error('Error sending WebRTC offer:', err?.message);
    }
  });

  // WebRTC Signaling - Answer
  socket.on('interview-room:webrtc-answer', async (data) => {
    try {
      const { roomId, targetUserId, answer } = data;
      if (!roomId || !targetUserId || !answer) return;

      const targetSocketId = getSocketIdByUser(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('interview-room:webrtc-answer', {
          from: socket.userId,
          answer,
          roomId
        });
      }
    } catch (err) {
      console.error('Error sending WebRTC answer:', err?.message);
    }
  });

  // WebRTC ICE Candidate
  socket.on('interview-room:ice-candidate', async (data) => {
    try {
      const { roomId, targetUserId, candidate } = data;
      if (!roomId || !targetUserId || !candidate) return;

      const targetSocketId = getSocketIdByUser(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('interview-room:ice-candidate', {
          from: socket.userId,
          candidate,
          roomId
        });
      }
    } catch (err) {
      console.error('Error sending ICE candidate:', err?.message);
    }
  });

  // Toggle screen share
  socket.on('interview-room:toggle-screenshare', async (data) => {
    try {
      const { roomId, isSharing } = data;
      if (!roomId) return;

      await InterviewRoomService.toggleScreenShare(roomId, socket.userId, isSharing);

      // Notify all participants in room
      io.to(roomId).emit('interview-room:screenshare-toggle', {
        userId: socket.userId,
        isSharing
      });
    } catch (err) {
      console.error('Error toggling screen share:', err?.message);
    }
  });

  // Toggle audio
  socket.on('interview-room:toggle-audio', async (data) => {
    try {
      const { roomId, enabled } = data;
      if (!roomId) return;

      await InterviewRoomService.toggleMedia(roomId, socket.userId, 'audio', enabled);

      // Notify all participants in room
      io.to(roomId).emit('interview-room:audio-toggle', {
        userId: socket.userId,
        enabled
      });
    } catch (err) {
      console.error('Error toggling audio:', err?.message);
    }
  });

  // Toggle video
  socket.on('interview-room:toggle-video', async (data) => {
    try {
      const { roomId, enabled } = data;
      if (!roomId) return;

      await InterviewRoomService.toggleMedia(roomId, socket.userId, 'video', enabled);

      // Notify all participants in room
      io.to(roomId).emit('interview-room:video-toggle', {
        userId: socket.userId,
        enabled
      });
    } catch (err) {
      console.error('Error toggling video:', err?.message);
    }
  });

  // Leave room
  socket.on('interview-room:leave', async (data) => {
    try {
      const { roomId } = data;
      if (!roomId) return;

      socket.leave(roomId);
      await InterviewRoomService.removeParticipant(roomId, socket.userId);

      // Notify all remaining participants
      const updatedRoom = await InterviewRoomService.getRoom(roomId);
      io.to(roomId).emit('interview-room:participant-left', {
        userId: socket.userId,
        roomState: updatedRoom
      });

      console.log(`User ${socket.userId} left interview room ${roomId}`);
    } catch (err) {
      console.error('Error leaving interview room:', err?.message);
    }
  });

  // End interview (employer action)
  socket.on('interview-room:end', async (data) => {
    try {
      const { roomId } = data;
      if (!roomId) return;

      const room = await InterviewRoomService.getRoom(roomId);
      if (room.employer._id.toString() !== socket.userId) {
        socket.emit('interview-room:error', { message: 'Unauthorized' });
        return;
      }

      await InterviewRoomService.endRoom(roomId);

      // Notify all participants
      io.to(roomId).emit('interview-room:ended', {
        message: 'The interview has ended',
        roomId
      });

      console.log(`Interview room ${roomId} ended by employer ${socket.userId}`);
    } catch (err) {
      console.error('Error ending interview room:', err?.message);
      socket.emit('interview-room:error', { message: 'Failed to end interview' });
    }
  });

  // Send chat message in interview
  socket.on('interview-room:chat-message', async (data) => {
    try {
      const { roomId, message } = data;
      if (!roomId || !message) return;

      io.to(roomId).emit('interview-room:chat-message', {
        userId: socket.userId,
        message,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error sending chat message:', err?.message);
    }
  });

  // Get room details
  socket.on('interview-room:get-details', async (data) => {
    try {
      const { roomId } = data;
      if (!roomId) return;

      const room = await InterviewRoomService.getRoom(roomId);
      if (!room) {
        socket.emit('interview-room:error', { message: 'Room not found' });
        return;
      }

      socket.emit('interview-room:details', room);
    } catch (err) {
      console.error('Error getting room details:', err?.message);
    }
  });
};
