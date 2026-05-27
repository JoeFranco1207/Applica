import React, { useRef, useEffect, useState } from 'react';
import './VideoGrid.css';

const VideoGrid = ({ 
  participants = [], 
  currentUserVideo, 
  screenShareStream,
  isScreenSharing 
}) => {
  const screenShareRef = useRef(null);

  useEffect(() => {
    if (screenShareStream && screenShareRef.current) {
      screenShareRef.current.srcObject = screenShareStream;
    }
  }, [screenShareStream]);

  // Determine layout based on number of participants
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
    currentUserVideo ? { id: 'current-user', ...currentUserVideo } : null,
    ...participants
  ].filter(Boolean);

  return (
    <div className="video-grid-container">
      {isScreenSharing && (
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
          <div key={participant.id} className="video-participant">
            <video
              ref={participant.videoRef}
              autoPlay
              playsInline
              muted={participant.id === 'current-user'}
              className="participant-video"
            />
            
            {/* Fallback avatar when video is off */}
            {!participant.videoEnabled && (
              <div className="participant-avatar">
                <img 
                  src={participant.profilePhoto || '/default-avatar.png'} 
                  alt={participant.name}
                />
              </div>
            )}

            {/* Participant info */}
            <div className="participant-info">
              <div className="participant-name">{participant.name}</div>
              
              {/* Status indicators */}
              <div className="participant-status">
                {!participant.audioEnabled && (
                  <span className="status-badge audio-off" title="Audio off">
                    🔇
                  </span>
                )}
                {!participant.videoEnabled && (
                  <span className="status-badge video-off" title="Video off">
                    📹
                  </span>
                )}
                {participant.isScreenSharing && (
                  <span className="status-badge screen-sharing" title="Sharing screen">
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

            {/* Border highlight for speaking */}
            {participant.isSpeaking && (
              <div className="speaking-indicator" />
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
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
