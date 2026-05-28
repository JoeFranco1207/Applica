import React, { useEffect, useRef } from 'react';
import './VideoGrid.css';

const ParticipantTile = ({ participant, isLocal }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <div className="video-participant">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="participant-video"
      />

      {!participant.videoEnabled && (
        <div className="participant-avatar">
          <img
            src={participant.profilePhoto || '/default-avatar.png'}
            alt={participant.name}
          />
        </div>
      )}

      <div className="participant-info">
        <div className="participant-name">{participant.name}</div>
        <div className="participant-status">
          {!participant.audioEnabled && (
            <span className="status-badge audio-off" title="Audio muted">
              🔇
            </span>
          )}
          {!participant.videoEnabled && (
            <span className="status-badge video-off" title="Video off">
              📹
            </span>
          )}
          {participant.isScreenSharing && (
            <span className="status-badge screen-sharing" title="Screen sharing">
              🖥️
            </span>
          )}
          {participant.isRecording && (
            <span className="status-badge recording" title="Recording">
              🔴
            </span>
          )}
        </div>
      </div>
      {participant.isSpeaking && <div className="speaking-indicator" />}
    </div>
  );
};

const VideoGrid = ({ participants = [], currentUserVideo, screenShareStream, isScreenSharing }) => {
  const screenShareRef = useRef(null);

  useEffect(() => {
    if (screenShareRef.current) {
      screenShareRef.current.srcObject = screenShareStream || null;
    }
  }, [screenShareStream]);

  const getGridClass = () => {
    const count = participants.length + (currentUserVideo ? 1 : 0);
    if (count === 1) return 'video-grid-single';
    if (count === 2) return 'video-grid-two';
    if (count <= 4) return 'video-grid-four';
    if (count <= 6) return 'video-grid-six';
    if (count <= 9) return 'video-grid-nine';
    return 'video-grid-many';
  };

  const allParticipants = [
    currentUserVideo ? { ...currentUserVideo, id: currentUserVideo.id || 'current-user' } : null,
    ...participants
  ].filter(Boolean);

  return (
    <div className="video-grid-container">
      {isScreenSharing && screenShareStream && (
        <div className="screen-share-section">
          <video
            ref={screenShareRef}
            autoPlay
            playsInline
            muted={false}
            className="screen-share-video"
          />
          <div className="screen-share-label">Screen Share</div>
        </div>
      )}

      <div className={`video-grid ${getGridClass()}`}>
        {allParticipants.map((participant) => (
          <ParticipantTile
            key={participant.id}
            participant={participant}
            isLocal={participant.id === 'current-user'}
          />
        ))}
      </div>

      {allParticipants.length === 0 && (
        <div className="video-grid-empty">
          <div className="empty-state">
            <div className="empty-icon">📹</div>
            <p>Waiting for participants...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
