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
      let room = await InterviewRoomService.getRoom(roomId);
      if (!room) {
        const interview = await Interview.findOne({ roomId });
        if (interview) {
          await InterviewRoomService.initializeRoom(roomId, interview._id, interview.employer);
          room = await InterviewRoomService.getRoom(roomId);
        }
      }

      if (!room) {
        socket.emit('interview-room:error', { message: 'Interview room not found.' });
        return;
      }

      // Add participant to room
      const addedRoom = await InterviewRoomService.addParticipant(roomId, userId, socket.id, role);
      if (!addedRoom) {
        socket.emit('interview-room:error', { message: 'Unable to join the interview room.' });
        return;
      }

      // Get current room state
      const updatedRoom = await InterviewRoomService.getRoom(roomId);
      if (!updatedRoom) {
        socket.emit('interview-room:error', { message: 'Failed to load interview room state.' });
        return;
      }

      // Emit to room about new participant
      const joinedParticipant = updatedRoom.participants.find((p) => p.user.toString() === userId.toString());
      io.to(roomId).emit('interview-room:participant-joined', {
        participant: {
          user: userId,
          role,
          socketId: socket.id,
          status: joinedParticipant?.status || 'waiting'
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

  // Pause interview room (employer action)
  socket.on('interview-room:pause', async (data) => {
    try {
      const { roomId } = data;
      if (!roomId) return;

      const room = await InterviewRoomService.getRoom(roomId);
      if (room.employer._id.toString() !== socket.userId) {
        socket.emit('interview-room:error', { message: 'Unauthorized' });
        return;
      }

      await InterviewRoomService.pauseRoom(roomId);
      io.to(roomId).emit('interview-room:paused', {
        roomId,
        pausedAt: new Date().toISOString()
      });

      console.log(`Interview room ${roomId} paused by employer ${socket.userId}`);
    } catch (err) {
      console.error('Error pausing interview room:', err?.message);
      socket.emit('interview-room:error', { message: 'Failed to pause interview' });
    }
  });

  // Resume interview room (employer action)
  socket.on('interview-room:resume', async (data) => {
    try {
      const { roomId } = data;
      if (!roomId) return;

      const room = await InterviewRoomService.getRoom(roomId);
      if (room.employer._id.toString() !== socket.userId) {
        socket.emit('interview-room:error', { message: 'Unauthorized' });
        return;
      }

      await InterviewRoomService.resumeRoom(roomId);
      io.to(roomId).emit('interview-room:resumed', {
        roomId,
        resumedAt: new Date().toISOString()
      });

      console.log(`Interview room ${roomId} resumed by employer ${socket.userId}`);
    } catch (err) {
      console.error('Error resuming interview room:', err?.message);
      socket.emit('interview-room:error', { message: 'Failed to resume interview' });
    }
  });

  // Get current elapsed time for the interview
  socket.on('interview-room:get-elapsed-time', async (data) => {
    try {
      const { roomId } = data;
      if (!roomId) return;

      const elapsedMs = await InterviewRoomService.getElapsedTime(roomId);
      socket.emit('interview-room:elapsed-time', {
        roomId,
        elapsedMs
      });
    } catch (err) {
      console.error('Error getting elapsed time:', err?.message);
    }
  });

  // Handle participant disconnect (grace period for reconnection)
  const disconnectGraceMap = new Map(); // roomId -> { userId -> timeoutId }

  socket.on('disconnect', async () => {
    if (!socket.userId) return;

    try {
      // Find rooms the user is in
      const rooms = socket.rooms;
      for (const roomId of rooms) {
        if (roomId === socket.id) continue; // Skip the socket's own room

        const room = await InterviewRoomService.getRoom(roomId);
        if (!room) continue;

        // Mark participant as disconnected
        await InterviewRoomService.markParticipantDisconnected(roomId, socket.userId);

        // Notify other participants about disconnect
        io.to(roomId).emit('interview-room:participant-disconnected', {
          userId: socket.userId,
          disconnectedAt: new Date().toISOString(),
          message: 'Participant temporarily disconnected. Waiting for reconnection...'
        });

        // Set grace period (30 seconds) for reconnection before removing completely
        if (!disconnectGraceMap.has(roomId)) {
          disconnectGraceMap.set(roomId, new Map());
        }

        const gracePeriodTimeout = setTimeout(async () => {
          const updatedRoom = await InterviewRoomService.getRoom(roomId);
          const participant = updatedRoom?.participants.find(
            p => p.user.toString() === socket.userId.toString() && p.status === 'disconnected'
          );

          if (participant) {
            await InterviewRoomService.removeParticipant(roomId, socket.userId);
            io.to(roomId).emit('interview-room:participant-left', {
              userId: socket.userId,
              reason: 'Did not reconnect within grace period'
            });
          }

          disconnectGraceMap.get(roomId)?.delete(socket.userId);
        }, 30000);

        disconnectGraceMap.get(roomId)?.set(socket.userId, gracePeriodTimeout);

        console.log(`User ${socket.userId} disconnected from room ${roomId}. Grace period started.`);
      }
    } catch (err) {
      console.error('Error handling disconnect:', err?.message);
    }
  });

  // Reconnect participant to room after unexpected disconnect
  socket.on('interview-room:reconnect', async (data) => {
    try {
      const { roomId, userId } = data;
      if (!roomId || !userId) return;

      socket.userId = userId;
      socket.join(roomId);

      // Clear grace period timeout if it exists
      if (disconnectGraceMap.has(roomId)) {
        const timeout = disconnectGraceMap.get(roomId).get(userId);
        if (timeout) {
          clearTimeout(timeout);
          disconnectGraceMap.get(roomId).delete(userId);
        }
      }

      // Reconnect participant
      const room = await InterviewRoomService.reconnectParticipant(roomId, userId, socket.id);

      // Notify all participants about reconnection
      const reconnectedParticipant = room.participants.find(p => p.user.toString() === userId.toString());
      io.to(roomId).emit('interview-room:participant-reconnected', {
        userId,
        participant: {
          user: userId,
          role: reconnectedParticipant.role,
          status: reconnectedParticipant.status,
          socketId: socket.id,
          reconnectCount: reconnectedParticipant.reconnectCount
        }
      });

      // Send updated room state to the reconnected participant
      socket.emit('interview-room:state', {
        roomId,
        participants: room.participants,
        status: room.status,
        employer: room.employer,
        startedAt: room.startedAt
      });

      console.log(`User ${userId} reconnected to interview room ${roomId}`);
    } catch (err) {
      console.error('Error reconnecting to interview room:', err?.message);
      socket.emit('interview-room:error', { message: 'Failed to reconnect to interview room' });
    }
  });
};
