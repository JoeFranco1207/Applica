import React, { useState } from 'react';
import './InterviewControls.css';

const InterviewControls = ({
  isAudioEnabled = true,
  isVideoEnabled = true,
  isScreenSharing = false,
  isRecording = false,
  isEmployer = false,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onEndCall,
  participantCount = 0,
  timeElapsed = '00:00'
}) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="interview-controls">
      {/* Call info */}
      <div className="call-info">
        <div className="info-item">
          <span className="info-label">👥 Participants:</span>
          <span className="info-value">{participantCount}</span>
        </div>
        <div className="info-item">
          <span className="info-label">⏱️ Duration:</span>
          <span className="info-value">{timeElapsed}</span>
        </div>
        {isRecording && (
          <div className="info-item recording-active">
            <span className="recording-dot">●</span>
            <span className="info-label">Recording</span>
          </div>
        )}
      </div>

      {/* Main controls */}
      <div className="controls-main">
        {/* Audio toggle */}
        <button
          className={`control-button ${isAudioEnabled ? 'active' : 'inactive'}`}
          onClick={onToggleAudio}
          title={isAudioEnabled ? 'Mute (M)' : 'Unmute (M)'}
          aria-label={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          <span className="control-icon">{isAudioEnabled ? '🎤' : '🔇'}</span>
          <span className="control-label">
            {isAudioEnabled ? 'Mute' : 'Unmuted'}
          </span>
        </button>

        {/* Video toggle */}
        <button
          className={`control-button ${isVideoEnabled ? 'active' : 'inactive'}`}
          onClick={onToggleVideo}
          title={isVideoEnabled ? 'Stop video (V)' : 'Start video (V)'}
          aria-label={isVideoEnabled ? 'Stop video' : 'Start video'}
        >
          <span className="control-icon">{isVideoEnabled ? '📹' : '📹'}</span>
          <span className="control-label">
            {isVideoEnabled ? 'Stop' : 'Start'}
          </span>
        </button>

        {/* Screen share button */}
        <button
          className={`control-button ${isScreenSharing ? 'active' : ''}`}
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop sharing (S)' : 'Share screen (S)'}
          aria-label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <span className="control-icon">{isScreenSharing ? '🖥️' : '🖥️'}</span>
          <span className="control-label">
            {isScreenSharing ? 'Sharing' : 'Share'}
          </span>
        </button>

        {/* Recording button (employer only) */}
        {isEmployer && (
          <button
            className={`control-button ${isRecording ? 'recording' : ''}`}
            onClick={onToggleRecording}
            title={isRecording ? 'Stop recording' : 'Start recording'}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <span className="control-icon">{isRecording ? '⏹️' : '⏹️'}</span>
            <span className="control-label">
              {isRecording ? 'Recording' : 'Record'}
            </span>
          </button>
        )}

        {/* More options */}
        <button
          className="control-button more-button"
          onClick={() => setShowMore(!showMore)}
          title="More options"
          aria-label="More options"
        >
          <span className="control-icon">⋯</span>
        </button>

        {/* End call button */}
        <button
          className="control-button end-call-button"
          onClick={onEndCall}
          title="End call (Esc)"
          aria-label="End call"
        >
          <span className="control-icon">📞</span>
          <span className="control-label">End</span>
        </button>
      </div>

      {/* More options menu */}
      {showMore && (
        <div className="controls-more">
          <button className="more-option">
            <span>💬</span>
            <span>Chat</span>
          </button>
          <button className="more-option">
            <span>🎚️</span>
            <span>Adjust audio</span>
          </button>
          <button className="more-option">
            <span>⚙️</span>
            <span>Settings</span>
          </button>
          <button className="more-option">
            <span>❓</span>
            <span>Help</span>
          </button>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="controls-shortcuts">
        <span className="shortcut"><kbd>M</kbd> Mute</span>
        <span className="shortcut"><kbd>V</kbd> Video</span>
        <span className="shortcut"><kbd>S</kbd> Share</span>
        <span className="shortcut"><kbd>Esc</kbd> End</span>
      </div>
    </div>
  );
};

export default InterviewControls;
