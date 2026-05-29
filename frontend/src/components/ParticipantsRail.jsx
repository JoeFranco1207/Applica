import React from 'react';
import PresenceAvatar from './PresenceAvatar';
import './ParticipantsRail.css';

const PeopleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M7 21v-2a4 4 0 0 1 3-3.87" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ChevronIcon = ({ direction = 'left', size = 18 }) => {
  const points = direction === 'left' ? '14 6 6 12 14 18' : '10 6 18 12 10 18';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={points} />
    </svg>
  );
};

export default function ParticipantsRail({ participants = [], currentUser = null, waitingParticipants = [], collapsed = false, onToggleCollapse = () => {} }) {
  const combined = [...participants];
  // show waiting participants at bottom of rail

  return (
    <aside className={`participants-rail${collapsed ? ' collapsed' : ''}`}>
      <div className="rail-header">
        <div className="rail-title">
          <PeopleIcon />
          {!collapsed && <span>Participants</span>}
        </div>

        <div className="rail-header-actions">
          {!collapsed && <div className="rail-count">{participants.length + 1}</div>}
          <button
            type="button"
            className="rail-toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Open participants panel' : 'Collapse participants panel'}
          >
            <ChevronIcon direction={collapsed ? 'right' : 'left'} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="rail-list">
            {/* current user first */}
            {currentUser && (
              <div className="rail-item self">
                <PresenceAvatar src={currentUser.profilePhoto} alt={currentUser.name || 'You'} size={44} />
                <div className="rail-item-info">
                  <div className="rail-item-name">{currentUser.firstName || currentUser.name || 'You'}</div>
                  <div className="rail-item-role">You</div>
                </div>
              </div>
            )}

            {combined.map((p) => (
              <div key={p.id} className="rail-item">
                <PresenceAvatar src={p.profilePhoto} alt={p.name} size={44} />
                <div className="rail-item-info">
                  <div className="rail-item-name">{p.name}</div>
                  <div className="rail-item-role">{p.role || (p.status === 'waiting' ? 'Waiting' : '')}</div>
                </div>
              </div>
            ))}
          </div>

          {waitingParticipants.length > 0 && (
            <div className="rail-waiting">
              <div className="rail-waiting-title">Waiting</div>
              {waitingParticipants.map((w) => (
                <div className="rail-waiting-item" key={w.id || w.userId}>
                  <PresenceAvatar src={w.profilePhoto} alt={w.name} size={36} />
                  <div className="rail-waiting-name">{w.name}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
