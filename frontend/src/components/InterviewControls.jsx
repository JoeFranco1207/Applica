import React, { useState } from 'react';
import './InterviewControls.css';

const ParticipantsIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 7a4 4 0 1 1 8 0" />
    <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
  </svg>
);

const ClockIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const MicIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <path d="M12 19v4" />
    <path d="M8 23h8" />
  </svg>
);

const MicOffIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 1l22 22" />
    <path d="M9 5a3 3 0 0 1 6 0v5" />
    <path d="M19 10v2a7 7 0 0 1-6 6.92" />
    <path d="M12 19v4" />
    <path d="M8 23h8" />
  </svg>
);

const VideoIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="6" width="12" height="12" rx="2" />
    <path d="M15 9l6-3v12l-6-3" />
  </svg>
);

const ScreenIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
  </svg>
);

const RecordIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="6" />
  </svg>
);

const PauseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const PlayIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const MoreIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const ChatIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SettingsIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 8.6 15a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 8.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 9a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 15z" />
  </svg>
);

const HelpIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 17h.01" />
    <path d="M12 7a3 3 0 0 1 2.83 2.83" />
    <path d="M12 12h.01" />
  </svg>
);

const EndCallIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15c1.5 3 4.5 5 8 5s6.5-2 8-5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const InterviewControls = ({
  isAudioEnabled = true,
  isVideoEnabled = true,
  isScreenSharing = false,
  isRecording = false,
  isPaused = false,
  isEmployer = false,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onPause,
  onResume,
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
          <ParticipantsIcon size={18} />
          <span className="info-label">Participants:</span>
          <span className="info-value">{participantCount}</span>
        </div>
        <div className="info-item">
          <ClockIcon size={18} />
          <span className="info-label">Duration:</span>
          <span className="info-value">{timeElapsed}</span>
        </div>
        {isRecording && (
          <div className="info-item recording-active">
            <span className="recording-dot"></span>
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
          <span className="control-icon">
            {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
          </span>
          <span className="control-label">
            {isAudioEnabled ? 'Mute' : 'Unmute'}
          </span>
        </button>

        {/* Video toggle */}
        <button
          className={`control-button ${isVideoEnabled ? 'active' : 'inactive'}`}
          onClick={onToggleVideo}
          title={isVideoEnabled ? 'Stop video (V)' : 'Start video (V)'}
          aria-label={isVideoEnabled ? 'Stop video' : 'Start video'}
        >
          <span className="control-icon"><VideoIcon /></span>
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
          <span className="control-icon"><ScreenIcon /></span>
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
            <span className="control-icon"><RecordIcon /></span>
            <span className="control-label">
              {isRecording ? 'Recording' : 'Record'}
            </span>
          </button>
        )}

        {/* Pause/Resume button (employer only) */}
        {isEmployer && (
          <button
            className={`control-button ${isPaused ? 'paused' : ''}`}
            onClick={isPaused ? onResume : onPause}
            title={isPaused ? 'Resume interview' : 'Pause interview'}
            aria-label={isPaused ? 'Resume' : 'Pause'}
          >
            <span className="control-icon">{isPaused ? <PlayIcon /> : <PauseIcon />}</span>
            <span className="control-label">
              {isPaused ? 'Resume' : 'Pause'}
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
          <span className="control-icon"><MoreIcon /></span>
        </button>

        {/* End call button */}
        <button
          className="control-button end-call-button"
          onClick={onEndCall}
          title="End call (Esc)"
          aria-label="End call"
        >
          <span className="control-icon"><EndCallIcon /></span>
          <span className="control-label">End</span>
        </button>
      </div>

      {/* More options menu */}
      {showMore && (
        <div className="controls-more">
          <button className="more-option">
            <span><ChatIcon /></span>
            <span>Chat</span>
          </button>
          <button className="more-option">
            <span><SettingsIcon /></span>
            <span>Adjust audio</span>
          </button>
          <button className="more-option">
            <span><SettingsIcon /></span>
            <span>Settings</span>
          </button>
          <button className="more-option">
            <span><HelpIcon /></span>
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
