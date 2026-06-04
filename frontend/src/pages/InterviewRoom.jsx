import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import VideoGrid from '../components/VideoGrid';
import WaitingRoom from '../components/WaitingRoom';
import InterviewControls from '../components/InterviewControls';
import ParticipantsRail from '../components/ParticipantsRail';
import './InterviewRoom.css';

const normalizeParticipant = (participant) => {
  const user = typeof participant.user === 'object' ? participant.user : { _id: participant.user };

  return {
    id: user._id,
    userId: user._id,
    name: `${user.firstName || user.name || 'Guest'}${user.lastName ? ` ${user.lastName}` : ''}`,
    profilePhoto: user.profilePhoto || '',
    socketId: participant.socketId,
    role: participant.role,
    status: participant.status,
    audioEnabled: participant.audioEnabled !== false,
    videoEnabled: participant.videoEnabled !== false,
    isScreenSharing: participant.isScreenSharing || false,
    isSpeaking: participant.isSpeaking || false,
    isRecording: participant.isRecording || false,
    stream: null
  };
};

export default function InterviewRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const reconnectAttemptRef = useRef(0);

  const [currentUser, setCurrentUser] = useState(null);
  const [isEmployer, setIsEmployer] = useState(false);
  const [roomState, setRoomState] = useState('loading');
  const [participants, setParticipants] = useState([]);
  const [waitingParticipants, setWaitingParticipants] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState('00:00');
  const [error, setError] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const joinLink = typeof window !== 'undefined'
    ? `${window.location.origin}/interview/${roomId}`
    : `/interview/${roomId}`;

  const buildParticipantList = useCallback((rawParticipants, selfId) => {
    const normalized = rawParticipants.map((item) => normalizeParticipant(item));
    const waiting = normalized.filter((item) => item.status === 'waiting');
    const inRoom = normalized.filter((item) => item.status === 'in-room' && item.id !== selfId);

    setWaitingParticipants(waiting);
    setParticipants(inRoom);
  }, []);

  const videoSectionRef = useRef(null);

  const handleToggleVideoFullscreen = useCallback(async () => {
    try {
      // Request fullscreen on the root document element so the entire app goes fullscreen
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    } catch (err) {
      console.warn('Video fullscreen toggle failed', err);
    }
  }, []);

  const fullscreenTimerRef = useRef(null);
  const mouseHandlerRef = useRef(null);

  const enableFullscreenControls = useCallback(() => {
    document.documentElement.classList.add('video-fullscreen');
    document.documentElement.classList.add('show-controls');

    const onMove = () => {
      document.documentElement.classList.add('show-controls');
      clearTimeout(fullscreenTimerRef.current);
      fullscreenTimerRef.current = setTimeout(() => {
        document.documentElement.classList.remove('show-controls');
      }, 3000);
    };

    mouseHandlerRef.current = onMove;
    document.addEventListener('mousemove', onMove);
  }, []);

  const disableFullscreenControls = useCallback(() => {
    document.documentElement.classList.remove('video-fullscreen');
    document.documentElement.classList.remove('show-controls');
    clearTimeout(fullscreenTimerRef.current);
    if (mouseHandlerRef.current) {
      document.removeEventListener('mousemove', mouseHandlerRef.current);
      mouseHandlerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      if (document.fullscreenElement) {
        enableFullscreenControls();
      } else {
        disableFullscreenControls();
      }
    };

    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      disableFullscreenControls();
    };
  }, [enableFullscreenControls, disableFullscreenControls]);

  const addRemoteStream = useCallback((userId, stream) => {
    setParticipants((prev) => prev.map((p) => p.id === userId ? { ...p, stream } : p));
  }, []);

  const createPeerConnection = useCallback((remoteUserId, remoteSocketId) => {
    if (!localStreamRef.current) return null;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('interview-room:ice-candidate', {
          roomId,
          targetUserId: remoteUserId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        addRemoteStream(remoteUserId, event.streams[0]);
      }
    };

    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    if (screenShareStream && screenShareStream.getVideoTracks().length > 0) {
      pc.addTrack(screenShareStream.getVideoTracks()[0], screenShareStream);
    }

    peerConnectionsRef.current[remoteUserId] = pc;
    return pc;
  }, [addRemoteStream, roomId, screenShareStream]);

  const sendOffer = useCallback(async (remoteUserId, remoteSocketId) => {
    if (!socketRef.current) return;
    const pc = peerConnectionsRef.current[remoteUserId] || createPeerConnection(remoteUserId, remoteSocketId);
    if (!pc) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit('interview-room:webrtc-offer', {
      roomId,
      targetUserId: remoteUserId,
      offer
    });
  }, [createPeerConnection, roomId]);

  const handleIncomingOffer = useCallback(async (data) => {
    const { from, offer } = data;
    if (!from || !offer) return;
    const remoteUserId = from;

    const pc = peerConnectionsRef.current[remoteUserId] || createPeerConnection(remoteUserId, null);
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketRef.current?.emit('interview-room:webrtc-answer', {
      roomId,
      targetUserId: remoteUserId,
      answer
    });
  }, [createPeerConnection, roomId]);

  const handleIncomingAnswer = useCallback(async (data) => {
    const { from, answer } = data;
    if (!from || !answer) return;
    const pc = peerConnectionsRef.current[from];
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  const handleIncomingCandidate = useCallback(async (data) => {
    const { from, candidate } = data;
    if (!from || !candidate) return;
    const pc = peerConnectionsRef.current[from];
    if (!pc) return;
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (sender && cameraTrack) {
        sender.replaceTrack(cameraTrack);
      }
    });

    setScreenShareStream(null);
    setIsScreenSharing(false);
    socketRef.current?.emit('interview-room:toggle-screenshare', {
      roomId,
      isSharing: false
    });
  }, [roomId]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || '/', {
      path: '/socket.io',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    let userData = {};
    try {
      userData = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (parseError) {
      console.warn('[Interview] Failed to parse stored user data:', parseError);
      userData = {};
    }

    const userId = userData._id || userData.id;
    if (!userId) {
      setError('Unable to identify current user. Please sign in again.');
      setRoomState('error');
      return;
    }

    setCurrentUser(userData);
    setIsEmployer(userData.role === 'employer');

    // Timeout for connection - show error if no response after 10 seconds
    const connectionTimeout = setTimeout(() => {
      if (roomState === 'loading' || isConnecting) {
        setError('Connection timeout. Please check your internet and try again.');
        setIsConnecting(false);
      }
    }, 10000);

    // Initial room join
    const joinRoom = () => {
      console.log('[Interview] Joining room:', roomId, 'as', userId);
      setIsConnecting(true);
      socket.emit('interview-room:join', {
        roomId,
        userId,
        role: userData.role === 'employer' ? 'employer' : 'applicant'
      });
    };

    // Emit register
    socket.emit('register', userId);

    // Handle connection and reconnection
    socket.on('connect', () => {
      console.log('[Interview] Socket connected:', socket.id);
      clearTimeout(connectionTimeout);
      if (reconnectAttemptRef.current > 0) {
        // User is reconnecting after disconnect
        console.log('[Interview] Reconnecting to room');
        socket.emit('interview-room:reconnect', {
          roomId,
          userId
        });
      } else {
        // Initial connection
        joinRoom();
      }
      reconnectAttemptRef.current += 1;
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('[Interview] Connection error:', error);
      clearTimeout(connectionTimeout);
      setError(`Connection error: ${error.message}`);
      setRoomState('error');
      setIsConnecting(false);
    });

    socket.on('error', (error) => {
      console.error('[Interview] Socket error:', error);
      setError(`Socket error: ${error}`);
      setRoomState('error');
      setIsConnecting(false);
    });

    socket.on('interview-room:state', (data) => {
      console.log('[Interview] Received room state:', data);
      setRoomDetails((prev) => ({ ...prev, ...data }));
      setRoomState(data.status === 'waiting' ? 'waiting' : data.status === 'paused' ? 'paused' : 'active');
      buildParticipantList(data.participants || [], userId);
      setIsConnecting(false);

      // Fetch elapsed time from server
      socket.emit('interview-room:get-elapsed-time', { roomId });
    });

    socket.on('interview-room:elapsed-time', (data) => {
      if (data.elapsedMs !== undefined) {
        const minutes = Math.floor(data.elapsedMs / 60000);
        const seconds = Math.floor((data.elapsedMs % 60000) / 1000);
        setTimeElapsed(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    });

    socket.on('interview-room:participant-joined', (data) => {
      const participant = normalizeParticipant(data.participant);
      if (participant.status === 'waiting') {
        setWaitingParticipants((prev) => [...prev.filter((p) => p.id !== participant.id), participant]);
      } else {
        setParticipants((prev) => [...prev.filter((p) => p.id !== participant.id), participant]);
      }
    });

    socket.on('interview-room:participant-admitted', (data) => {
      buildParticipantList(data.participants || [], userId);
    });

    socket.on('interview-room:participant-left', (data) => {
      const leavingId = data.userId;
      setParticipants((prev) => prev.filter((p) => p.id !== leavingId));
      if (peerConnectionsRef.current[leavingId]) {
        peerConnectionsRef.current[leavingId].close();
        delete peerConnectionsRef.current[leavingId];
      }
    });

    socket.on('interview-room:participant-disconnected', (data) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === data.userId ? { ...p, status: 'disconnected' } : p
        )
      );
    });

    socket.on('interview-room:participant-reconnected', (data) => {
      const reconnected = normalizeParticipant(data.participant);
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === data.userId ? { ...p, status: reconnected.status } : p
        )
      );
    });

    socket.on('interview-room:audio-toggle', (data) => {
      setParticipants((prev) => prev.map((p) => p.id === data.userId ? { ...p, audioEnabled: data.enabled } : p));
    });

    socket.on('interview-room:video-toggle', (data) => {
      setParticipants((prev) => prev.map((p) => p.id === data.userId ? { ...p, videoEnabled: data.enabled } : p));
    });

    socket.on('interview-room:screenshare-toggle', (data) => {
      setParticipants((prev) => prev.map((p) => p.id === data.userId ? { ...p, isScreenSharing: data.isSharing } : p));
    });

    socket.on('interview-room:paused', () => {
      setIsPaused(true);
      setRoomState('paused');
    });

    socket.on('interview-room:resumed', () => {
      setIsPaused(false);
      setRoomState('active');
      socket.emit('interview-room:get-elapsed-time', { roomId });
    });

    socket.on('interview-room:webrtc-offer', handleIncomingOffer);
    socket.on('interview-room:webrtc-answer', handleIncomingAnswer);
    socket.on('interview-room:ice-candidate', handleIncomingCandidate);

    socket.on('interview-room:admitted', () => setRoomState('active'));
    socket.on('interview-room:denied', () => {
      setError('Your request to join has been denied');
      setTimeout(() => navigate(isEmployer ? '/employer/interviews' : '/jobseeker/interviews'), 3000);
    });

    socket.on('interview-room:ended', () => {
      setRoomState('ended');
      setError('The interview has ended');
      setTimeout(() => navigate(isEmployer ? '/employer/interviews' : '/jobseeker/interviews'), 3000);
    });

    socket.on('interview-room:error', (data) => {
      console.error('[Interview] Room error:', data.message);
      setError(data.message);
      setRoomState('error');
      setIsConnecting(false);
    });

    return () => {
      clearTimeout(connectionTimeout);
      socket.disconnect();
    };
  }, [buildParticipantList, handleIncomingAnswer, handleIncomingCandidate, handleIncomingOffer, navigate, roomId, isEmployer]);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/interviews/room/${roomId}/details`);
        const details = res.data?.data;
        if (details) {
          setRoomDetails((prev) => ({ ...prev, ...details }));
        }
      } catch (err) {
        console.warn('[Interview] Failed to load interview details:', err?.response?.data || err.message || err);
      }
    };

    fetchRoomDetails();
  }, [roomId]);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        localStreamRef.current = stream;
        stream.getAudioTracks().forEach((track) => { track.enabled = isAudioEnabled; });
        stream.getVideoTracks().forEach((track) => { track.enabled = isVideoEnabled; });
      } catch (err) {
        setError('Unable to access camera or microphone. Please check your permissions.');
        console.error('Media access error:', err);
      }
    };

    initializeMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (roomState !== 'active' || !localStreamRef.current) return;

    participants.forEach((participant) => {
      if (!peerConnectionsRef.current[participant.id] && participant.socketId) {
        sendOffer(participant.id, participant.socketId).catch(console.error);
      }
    });
  }, [participants, roomState, sendOffer]);

  useEffect(() => {
    if (screenShareStream) {
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        const screenTrack = screenShareStream.getVideoTracks()[0];
        if (sender && screenTrack) {
          sender.replaceTrack(screenTrack);
        }
      });
    }
  }, [screenShareStream]);

  useEffect(() => {
    if (roomState !== 'active' || isPaused) return;

    const interval = setInterval(() => {
      setTimeElapsed((prev) => {
        const [minutes, seconds] = prev.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds + 1;
        const newMinutes = Math.floor(totalSeconds / 60);
        const newSeconds = totalSeconds % 60;
        return `${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`;
      });

      // Sync with server every 10 seconds
      if (Math.floor((new Date().getSeconds() * 1000 + new Date().getMilliseconds()) / 10000) % 1 === 0) {
        socketRef.current?.emit('interview-room:get-elapsed-time', { roomId });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [roomState, isPaused, roomId]);

  const handleToggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const enabled = !isAudioEnabled;
      localStreamRef.current.getAudioTracks().forEach((track) => { track.enabled = enabled; });
      setIsAudioEnabled(enabled);
      socketRef.current?.emit('interview-room:toggle-audio', { roomId, enabled });
    }
  }, [isAudioEnabled, roomId]);

  const handleToggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const enabled = !isVideoEnabled;
      localStreamRef.current.getVideoTracks().forEach((track) => { track.enabled = enabled; });
      setIsVideoEnabled(enabled);
      socketRef.current?.emit('interview-room:toggle-video', { roomId, enabled });
    }
  }, [isVideoEnabled, roomId]);

  const handleToggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
      screenStreamRef.current = stream;
      setScreenShareStream(stream);
      setIsScreenSharing(true);

      stream.getVideoTracks()[0].onended = () => stopScreenShare();
      socketRef.current?.emit('interview-room:toggle-screenshare', { roomId, isSharing: true });
    } catch (err) {
      console.error('Screen share error:', err);
    }
  }, [isScreenSharing, roomId, stopScreenShare]);

  const handleToggleRecording = useCallback(() => {
    setIsRecording((prev) => !prev);
  }, []);

  const handlePauseInterview = useCallback(() => {
    if (!isEmployer) return;
    socketRef.current?.emit('interview-room:pause', { roomId });
  }, [isEmployer, roomId]);

  const handleResumeInterview = useCallback(() => {
    if (!isEmployer) return;
    socketRef.current?.emit('interview-room:resume', { roomId });
  }, [isEmployer, roomId]);


  const handleEndCall = useCallback(() => {
    if (isEmployer) {
      socketRef.current?.emit('interview-room:end', { roomId });
    } else {
      socketRef.current?.emit('interview-room:leave', { roomId });
      navigate('/jobseeker/interviews');
    }
  }, [isEmployer, navigate, roomId]);

  const handleCopyJoinLink = useCallback(async () => {
    if (!navigator.clipboard) {
      setCopyStatus('Clipboard API unavailable');
      return;
    }

    try {
      await navigator.clipboard.writeText(joinLink);
      setCopyStatus('Link copied!');
      setTimeout(() => setCopyStatus(''), 2300);
    } catch (err) {
      console.error('Copy failed', err);
      setCopyStatus('Unable to copy. Please copy manually.');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  }, [joinLink]);

  const handleAdmitParticipant = useCallback((participantId) => {
    socketRef.current?.emit('interview-room:admit', { roomId, userId: participantId });
  }, [roomId]);

  const handleDenyParticipant = useCallback((participantId) => {
    socketRef.current?.emit('interview-room:deny', { roomId, userId: participantId });
  }, [roomId]);

  if (roomState === 'loading' || isConnecting) {
    return (
      <div className="interview-room loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Connecting to interview room...</p>
          {error && <p style={{ color: '#ef4444', marginTop: '12px' }}>Error: {error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="interview-room">
      {error && (
        <div className="error-banner">
          <span className="error-icon">!</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>X</button>
        </div>
      )}

      <div className="interview-room-header">
        <div className="room-title-block">
          <span className="room-badge">
            {roomState === 'waiting' ? 'Waiting Room' : roomState === 'paused' ? 'Paused' : roomState === 'active' ? 'Live Interview' : 'Interview Room'}
          </span>
          <h1 className="room-title">{roomDetails?.interview?.title || 'Interview Room'}</h1>
          <p className="room-subtitle">
            {roomDetails?.interview?.description || 'Welcome to your interview room. Manage the session, share your screen, and stay connected.'}
          </p>
          {roomDetails?.interview?.scheduledAt && (
            <p className="room-subtext">
              Scheduled {new Date(roomDetails.interview.scheduledAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="room-meta-panel">
          <span className="room-meta-pill">Room ID: {roomId}</span>
          <span className="room-meta-pill">Location: {roomDetails?.interview?.location || 'Online'}</span>
          <span className="room-meta-pill">Employer: {roomDetails?.interview?.employer?.firstName ? `${roomDetails.interview.employer.firstName} ${roomDetails.interview.employer.lastName || ''}`.trim() : 'Recruiter'}</span>
        </div>
      </div>

      <div className={`interview-room-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {roomState === 'waiting' && !isEmployer ? (
          <div className="waiting-section">
            {roomDetails?.interview && (
              <div className="interview-request-panel">
                <h2>{roomDetails.interview.title || 'Interview request'}</h2>
                <p className="request-meta">
                  Scheduled {new Date(roomDetails.interview.scheduledAt).toLocaleString()} • {roomDetails.interview.location || 'Online'}
                </p>
                <p>{roomDetails.interview.description || 'You have been invited to this interview by the employer.'}</p>
                <p className="request-employer">
                  From {roomDetails.interview.employer?.firstName ? `${roomDetails.interview.employer.firstName} ${roomDetails.interview.employer.lastName || ''}`.trim() : 'an employer'}
                </p>
              </div>
            )}
            <WaitingRoom
              waitingParticipants={waitingParticipants}
              isEmployer={false}
              interviewTitle={roomDetails?.interview?.title}
            />
          </div>
        ) : (
          <>
            <div className="video-section" ref={videoSectionRef}>
              <VideoGrid
                participants={participants}
                currentUserVideo={{
                  id: currentUser?._id || currentUser?.id || 'current-user',
                  name: currentUser?.firstName || currentUser?.name || 'You',
                  profilePhoto: currentUser?.profilePhoto,
                  stream: localStreamRef.current,
                  audioEnabled: isAudioEnabled,
                  videoEnabled: isVideoEnabled,
                  isScreenSharing
                }}
                screenShareStream={screenShareStream}
                isScreenSharing={isScreenSharing}
              />
            </div>

            <ParticipantsRail
              participants={participants}
              currentUser={currentUser}
              waitingParticipants={waitingParticipants}
              collapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            />
          </>
        )}
      </div>

      <div className="controls-overlay">
        <InterviewControls
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          isRecording={isRecording}
          isPaused={isPaused}
          isEmployer={isEmployer}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleVideoFullscreen={handleToggleVideoFullscreen}
          onToggleRecording={handleToggleRecording}
          onPause={handlePauseInterview}
          onResume={handleResumeInterview}
          onEndCall={handleEndCall}
          participantCount={participants.length + 1}
          timeElapsed={timeElapsed}
        />
      </div>
    </div>
  );
}
