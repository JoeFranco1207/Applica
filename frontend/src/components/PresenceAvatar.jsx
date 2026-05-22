import React, { useEffect, useState } from 'react';
import './PresenceAvatar.css';

export default function PresenceAvatar({ src, alt, size = 48, userId, initialIsOnline = false, initialLastActive = null, showLastActive = true, initialPresenceMode = 'offline' }) {
  const [presenceMode, setPresenceMode] = useState(initialPresenceMode || (initialIsOnline ? 'online' : 'offline'));
  const [lastActive, setLastActive] = useState(initialLastActive);

  useEffect(() => {
    const handler = (e) => {
      const payload = e?.detail;
      if (!payload) return;
      const uid = (payload.userId || payload.user || payload.userID || '').toString();
      if (!uid || !userId) return;
      if (uid === userId.toString()) {
        const mode = payload.presenceMode || (payload.isOnline ? 'online' : 'offline');
        setPresenceMode(mode);
        setLastActive(payload.lastActive || null);
      }
    };

    window.addEventListener('app:userPresenceUpdated', handler);
    return () => window.removeEventListener('app:userPresenceUpdated', handler);
  }, [userId]);

  const initials = (alt || 'U').split(' ').map(s => s.charAt(0)).join('').slice(0,2).toUpperCase();

  const lastActiveText = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hr${hr>1?'s':''} ago`;
    const day = Math.floor(hr / 24);
    return `${day} day${day>1?'s':''} ago`;
  };

  const sizeStyle = { width: size, height: size, fontSize: Math.max(12, Math.floor(size / 3)) };

  return (
    <div className="presence-avatar" style={{ ...sizeStyle }}>
      {src ? (
        <img src={src} alt={alt || 'User'} className="presence-avatar-img" style={{ ...sizeStyle }} />
      ) : (
        <div className="presence-avatar-placeholder" style={{ ...sizeStyle }}>{initials}</div>
      )}

      {presenceMode ? (
        <span className={`presence-dot presence-${presenceMode}`} title={presenceMode} />
      ) : null}

      {presenceMode !== 'online' && showLastActive && lastActive ? (
        <div className="presence-last-active">{lastActiveText(lastActive)}</div>
      ) : null}
    </div>
  );
}
