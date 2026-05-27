import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import VideoGrid from './VideoGrid';
import WaitingRoom from './WaitingRoom';
import InterviewControls from './InterviewControls';
import './InterviewRoom.css';

const InterviewRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);

  // State
  const [currentUser, setCurrentUser] = useState(null);
  const [isEmployer, setIsEmployer] = useState(false);
  const [roomState, setRoomState] = useState('loading'); // loading, waiting, active, ended
  const [participants, setParticipants] = useState([]);
  const [waitingParticipants, setWaitingParticipants] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState('00:00');
  const [error, setError] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Get current user from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(userData);

    // Register user with socket
    socket.emit('register', userData._id);

    // Join interview room
    socket.emit('interview-room:join', {
      roomId,
      userId: userData._id,
      role: userData.role === 'employer' ? 'employer' : 'applicant'
    });

    // Socket event listeners
    socket.on('interview-room:state', (data) => {
      setRoomDetails(data);
      const userRole = userData.role === 'employer' ? 'employer' : 'applicant';
      setIsEmployer(userRole === 'employer');
      setRoomState(data.status === 'waiting' ? 'waiting' : 'active');
    });

    socket.on('interview-room:admitted', () => {
      setRoomState('active');
    });

    socket.on('interview-room:denied', () => {
      setError('Your request to join has been denied');
      setTimeout(() => navigate('/interviews'), 3000);
    });

    socket.on('interview-room:participant-joined', (data) => {
      setWaitingParticipants(prev => [...prev, data.participant]);
    });

    socket.on('interview-room:participant-admitted', (data) => {
      const admitted = data.participants.find(p => p.status === 'in-room');
      if (admitted) {
        setParticipants(prev => [...prev, admitted]);
        setWaitingParticipants(prev => prev.filter(p => p.user !== admitted.user));
      }
    });

    socket.on('interview-room:participant-left', (data) => {
      setParticipants(prev => prev.filter(p => p.user._id !== data.userId));
    });

    socket.on('interview-room:ended', () => {
      setRoomState('ended');
      setError('The interview has ended');
      setTimeout(() => navigate('/interviews'), 3000);
    });

    socket.on('interview-room:error', (data) => {
      setError(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, navigate]);

  // Initialize media devices
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
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Set initial media tracks
        stream.getAudioTracks().forEach(track => track.enabled = isAudioEnabled);
        stream.getVideoTracks().forEach(track => track.enabled = isVideoEnabled);
      } catch (err) {
        setError('Unable to access camera or microphone. Please check your permissions.');
        console.error('Media access error:', err);
      }
    };

    initializeMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Timer for call duration
  useEffect(() => {
    if (roomState !== 'active') return;

    const interval = setInterval(() => {
      setTimeElapsed(prev => {
        const [minutes, seconds] = prev.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds + 1;
        const newMinutes = Math.floor(totalSeconds / 60);
        const newSeconds = totalSeconds % 60;
        return `${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [roomState]);

  // Handle audio toggle
  const handleToggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const enabled = !isAudioEnabled;
      localStreamRef.current.getAudioTracks().forEach(track => track.enabled = enabled);
      setIsAudioEnabled(enabled);

      socketRef.current?.emit('interview-room:toggle-audio', {
        roomId,
        enabled
      });
    }
  }, [isAudioEnabled, roomId]);

  // Handle video toggle
  const handleToggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const enabled = !isVideoEnabled;
      localStreamRef.current.getVideoTracks().forEach(track => track.enabled = enabled);
      setIsVideoEnabled(enabled);

      socketRef.current?.emit('interview-room:toggle-video', {
        roomId,
        enabled
      });
    }
  }, [isVideoEnabled, roomId]);

  // Handle screen share
  const handleToggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share
      localStreamRef.current?.getTracks().forEach(track => {
        if (track.kind === 'video' && track.getSettings().displaySurface) {
          track.stop();
        }
      });
      setIsScreenSharing(false);

      socketRef.current?.emit('interview-room:toggle-screenshare', {
        roomId,
        isSharing: false
      });
    } else {
      // Start screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          },
          audio: false
        });

        setIsScreenSharing(true);
        socketRef.current?.emit('interview-room:toggle-screenshare', {
          roomId,
          isSharing: true
        });
      } catch (err) {
        console.error('Screen share error:', err);
      }
    }
  }, [isScreenSharing, roomId]);

  // Handle recording
  const handleToggleRecording = useCallback(() => {
    setIsRecording(!isRecording);
    // Implement actual recording logic here
  }, [isRecording]);

  // Handle end call
  const handleEndCall = useCallback(() => {
    if (isEmployer) {
      socketRef.current?.emit('interview-room:end', { roomId });
    } else {
      socketRef.current?.emit('interview-room:leave', { roomId });
      navigate('/interviews');
    }
  }, [isEmployer, roomId, navigate]);

  // Handle admit participant
  const handleAdmitParticipant = (participantId) => {
    socketRef.current?.emit('interview-room:admit', {
      roomId,
      userId: participantId
    });
  };

  // Handle deny participant
  const handleDenyParticipant = (participantId) => {
    socketRef.current?.emit('interview-room:deny', {
      roomId,
      userId: participantId
    });
  };

  // Loading state
  if (roomState === 'loading') {
    return (
      <div className="interview-room loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Connecting to interview room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-room">
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="interview-room-layout">
        {/* Waiting room (if not admitted) */}
        {roomState === 'waiting' && !isEmployer ? (
          <div className="waiting-section">
            <WaitingRoom
              waitingParticipants={waitingParticipants}
              isEmployer={false}
              interviewTitle={roomDetails?.interview?.title}
            />
          </div>
        ) : (
          <>
            {/* Main video area */}
            <div className="video-section">
              <VideoGrid
                participants={participants}
                currentUserVideo={{
                  id: 'current-user',
                  videoRef: localVideoRef,
                  name: currentUser?.firstName,
                  profilePhoto: currentUser?.profilePhoto,
                  audioEnabled: isAudioEnabled,
                  videoEnabled: isVideoEnabled,
                  isScreenSharing
                }}
                screenShareStream={isScreenSharing}
                isScreenSharing={isScreenSharing}
              />
            </div>

            {/* Waiting room sidebar (employer only) */}
            {isEmployer && (
              <div className="waiting-room-sidebar">
                <WaitingRoom
                  waitingParticipants={waitingParticipants}
                  isEmployer={true}
                  onAdmit={handleAdmitParticipant}
                  onDeny={handleDenyParticipant}
                  interviewTitle={roomDetails?.interview?.title}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <InterviewControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        isEmployer={isEmployer}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleRecording={handleToggleRecording}
        onEndCall={handleEndCall}
        participantCount={participants.length + 1}
        timeElapsed={timeElapsed}
      />
    </div>
  );
};

export default InterviewRoom;
