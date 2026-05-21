import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import './NotificationPanel.css';

const timeAgo = (date) => {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const Avatar = ({ src, alt, size = 40, onClick }) => (
  <div className="np-avatar" style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
    {src ? <img src={src} alt={alt || 'avatar'} /> : <div className="np-initials">{(alt || 'U').slice(0,2)}</div>}
  </div>
);

export default function NotificationPanel({ onClose }) {
  const { notifications, markNotificationAsRead, removeNotification } = useNotification();
  const [tab, setTab] = useState('all');
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const items = (notifications || [])
      .filter((n) => (tab === 'unread' ? !n.read : true));
    return items;
  }, [notifications, tab]);

  const today = [];
  const earlier = [];
  const todayDate = new Date().toDateString();
  (filtered || []).forEach((n) => {
    const d = new Date(n.createdAt || Date.now()).toDateString();
    if (d === todayDate) today.push(n); else earlier.push(n);
  });

  const getActorId = (n) => {
    return n?.actorId || n?.actor?._id || n?.actor?.id || n?.from?._id || n?.from?.id || null;
  };

  const getActorPicture = (n) => {
    return n?.actorAvatar || n?.actorPicture || n?.actor?.profilePicture || n?.actor?.avatar || n?.from?.profilePicture || n?.from?.avatar || null;
  };

  const getActorName = (n) => {
    if (n?.actorName) return n.actorName;
    if (n?.actor) {
      const fn = n.actor.firstName || n.actor.fn || '';
      const ln = n.actor.lastName || n.actor.ln || '';
      const full = `${fn} ${ln}`.trim();
      if (full) return full;
      if (n.actor.name) return n.actor.name;
      if (n.actor.email) return n.actor.email.split('@')[0];
    }
    if (n?.from) return n.from.name || n.from.fullName || 'User';
    return 'User';
  };

  const handleClick = async (n) => {
    if (!n) return;
    if (!n.read) {
      await markNotificationAsRead(n.id);
    }
    // If notification points to a post
    if (n.postId) {
      const pid = typeof n.postId === 'string' ? n.postId : n.postId?._id || n.postId?.id || null;
      if (pid) {
        onClose?.();
        navigate(`/post/${pid}${n.commentId ? `?commentId=${n.commentId}` : ''}`);
        return;
      }
    }
    // If notification points to a job
    if (n.jobId) {
      const jid = typeof n.jobId === 'string' ? n.jobId : n.jobId?._id || n.jobId?.id || null;
      if (jid) {
        onClose?.();
        // navigate to /explore and instruct page to open the job modal
        // include jobId in both state and query string for robustness
        navigate(`/explore?jobId=${encodeURIComponent(jid)}`, { state: { openJobId: jid } });
        return;
      }
    }
    // If it points to a user profile
    if (n.actorId) {
      onClose?.();
      navigate(`/profile/${n.actorId}`);
      return;
    }
  };

  return (
    <div className="notification-panel">
      <div className="np-header">
        <div className="np-title">Notifications</div>
        <div className="np-tabs">
          <button className={`np-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All</button>
          <button className={`np-tab ${tab === 'unread' ? 'active' : ''}`} onClick={() => setTab('unread')}>Unread</button>
        </div>
      </div>

      <div className="np-list">
        {today.length > 0 && (
          <div className="np-section">
            <div className="np-section-title">Today</div>
            {today.map((n) => (
              <div key={n.id} className={`np-item ${n.read ? 'read' : 'unread'}`} onClick={() => handleClick(n)}>
                <Avatar
                  src={getActorPicture(n)}
                  alt={getActorName(n)}
                  onClick={(e) => { e.stopPropagation(); const aid = getActorId(n); if (aid) { markNotificationAsRead(n.id); onClose?.(); navigate(`/profile/${aid}`); } }}
                />
                <div className="np-body">
                  <div className="np-message"><strong onClick={(e) => { e.stopPropagation(); const aid = getActorId(n); if (aid) { markNotificationAsRead(n.id); onClose?.(); navigate(`/profile/${aid}`); } }}>{getActorName(n)}</strong> — {n.message}</div>
                  <div className="np-meta">
                    <span className="np-time">{timeAgo(n.createdAt)}</span>
                    {!n.read && <span className="np-dot" aria-hidden />}
                  </div>
                </div>
                <button className="np-close" onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}>&times;</button>
              </div>
            ))}
          </div>
        )}

        {earlier.length > 0 && (
          <div className="np-section">
            <div className="np-section-title">Earlier</div>
            {earlier.map((n) => (
              <div key={n.id} className={`np-item ${n.read ? 'read' : 'unread'}`} onClick={() => handleClick(n)}>
                <Avatar
                  src={getActorPicture(n)}
                  alt={getActorName(n)}
                  onClick={(e) => { e.stopPropagation(); const aid = getActorId(n); if (aid) { markNotificationAsRead(n.id); onClose?.(); navigate(`/profile/${aid}`); } }}
                />
                <div className="np-body">
                  <div className="np-message"><strong onClick={(e) => { e.stopPropagation(); const aid = getActorId(n); if (aid) { markNotificationAsRead(n.id); onClose?.(); navigate(`/profile/${aid}`); } }}>{getActorName(n)}</strong> — {n.message}</div>
                  <div className="np-meta">
                    <span className="np-time">{timeAgo(n.createdAt)}</span>
                    {!n.read && <span className="np-dot" aria-hidden />}
                  </div>
                </div>
                <button className="np-close" onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}>&times;</button>
              </div>
            ))}
          </div>
        )}

        {today.length === 0 && earlier.length === 0 && (
          <div className="np-empty">You're all caught up</div>
        )}
      </div>

      <div className="np-footer">
        <button className="np-seeall" onClick={() => { onClose?.(); navigate('/notifications'); }}>See all</button>
      </div>
    </div>
  );
}
