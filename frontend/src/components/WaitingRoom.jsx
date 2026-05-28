import React, { useState, useEffect } from 'react';
import './WaitingRoom.css';

const WaitingRoom = ({ 
  waitingParticipants = [], 
  isEmployer = false, 
  onAdmit, 
  onDeny,
  interviewTitle = 'Interview Room'
}) => {
  const [filter, setFilter] = useState('all');

  const filteredParticipants = waitingParticipants.filter(p => {
    if (filter === 'waiting') return p.status === 'waiting';
    if (filter === 'admitted') return p.status === 'admitted';
    return true;
  });

  const handleAdmit = (participantId) => {
    onAdmit?.(participantId);
  };

  const handleDeny = (participantId) => {
    onDeny?.(participantId);
  };

  return (
    <div className="waiting-room">
      <div className="waiting-room-header">
        <div className="header-content">
          <h2 className="waiting-room-title">Waiting Room</h2>
          <p className="waiting-room-subtitle">{interviewTitle}</p>
        </div>
        <div className="participant-count">
          {filteredParticipants.length}
        </div>
      </div>

      {isEmployer && filteredParticipants.length > 0 && (
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({waitingParticipants.length})
          </button>
          <button
            className={`filter-tab ${filter === 'waiting' ? 'active' : ''}`}
            onClick={() => setFilter('waiting')}
          >
            Waiting ({waitingParticipants.filter(p => p.status === 'waiting').length})
          </button>
          <button
            className={`filter-tab ${filter === 'admitted' ? 'active' : ''}`}
            onClick={() => setFilter('admitted')}
          >
            Admitted ({waitingParticipants.filter(p => p.status === 'admitted').length})
          </button>
        </div>
      )}

      <div className="waiting-room-list">
        {filteredParticipants.length === 0 ? (
          <div className="empty-waiting-room">
            <div className="empty-icon"></div>
            <p>No participants in waiting room</p>
            <span className="empty-hint">Participants will appear here when they join</span>
          </div>
        ) : (
          filteredParticipants.map((participant) => (
            <div
              key={participant.userId || participant.id}
              className={`waiting-participant ${participant.status}`}
            >
              {/* Avatar */}
              <div className="participant-avatar">
                <img
                  src={participant.profilePhoto || '/default-avatar.png'}
                  alt={participant.name}
                />
              </div>

              {/* Participant info */}
              <div className="participant-details">
                <h3 className="participant-name">{participant.name}</h3>
                <p className="participant-email">{participant.email}</p>
                <span className={`participant-status-badge ${participant.status}`}>
                  {participant.status === 'waiting' ? 'Waiting' : 'Admitted'}
                </span>
              </div>

              {/* Actions (only for employer and waiting participants) */}
              {isEmployer && participant.status === 'waiting' && (
                <div className="participant-actions">
                  <button
                    className="btn-admit"
                    onClick={() => handleAdmit(participant.userId || participant.id)}
                    title="Admit to interview"
                  >
                    <span className="button-icon">✓</span> Admit
                  </button>
                  <button
                    className="btn-deny"
                    onClick={() => handleDeny(participant.userId || participant.id)}
                    title="Deny entry"
                  >
                    <span className="button-icon">×</span> Deny
                  </button>
                </div>
              )}

              {/* Status indicator for admitted */}
              {participant.status === 'admitted' && (
                <div className="admitted-indicator">
                  <span>✓ In Interview</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Instructions for applicant */}
      {!isEmployer && waitingParticipants.some(p => p.userId === 'currentUser') && (
        <div className="waiting-instructions">
          <div className="instruction-icon">i</div>
          <p>
            You're in the waiting room. The employer will admit you soon.
            Please check your audio and video settings while waiting.
          </p>
        </div>
      )}
    </div>
  );
};

export default WaitingRoom;
