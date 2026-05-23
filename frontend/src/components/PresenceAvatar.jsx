import React, { useEffect, useState } from 'react';
import './PresenceAvatar.css';

const normalizeId = (id) => {
  if (id === null || id === undefined) return null;
  if (typeof id === 'object') return normalizeId(id._id || id.id || id.userId || id.userID || id.uid);
  return id?.toString?.() || null;
};

const getPayloadUserId = (payload) => {
  if (!payload) return null;
  const candidate = payload.userId || payload.userID || payload.user || payload.id || payload.uid || payload.actorId || payload.senderId;
  return normalizeId(candidate);
};

const getStoredCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
const isRecentlyActive = (timestamp) => {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= ONLINE_THRESHOLD_MS;
};

export default function PresenceAvatar({ src, alt, size = 48, userId, initialIsOnline = false, initialLastActive = null, lastActive = null, showLastActive = true, initialPresenceMode = 'offline', presenceMode: propPresenceMode, onClick, className = '', style = {} }) {
  const getInitialMode = () => {
    const fallback = initialIsOnline ? 'online' : 'offline';
    const storedUser = getStoredCurrentUser();
    const storedUserId = normalizeId(storedUser?._id || storedUser?.id);
    const currentUserMatches = storedUserId && normalizeId(userId) === storedUserId;
    const storedPresence = currentUserMatches ? (storedUser?.presenceMode || (storedUser?.isOnline ? 'online' : undefined)) : undefined;
    return propPresenceMode ?? initialPresenceMode ?? storedPresence ?? fallback;
  };

  const [presenceMode, setPresenceMode] = useState(getInitialMode());
  const [lastActiveState, setLastActiveState] = useState(lastActive ?? initialLastActive);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  useEffect(() => {
    setPresenceMode(getInitialMode());
  }, [propPresenceMode, initialPresenceMode, initialIsOnline]);

  useEffect(() => {
    setLastActiveState(lastActive ?? initialLastActive);
  }, [lastActive, initialLastActive]);

  useEffect(() => {
    const normalizedUserId = normalizeId(userId);
    const handler = (e) => {
      const payload = e?.detail;
      if (!payload) return;
      const uid = getPayloadUserId(payload);
      if (!uid || !normalizedUserId) return;
      if (uid === normalizedUserId) {
        const mode = payload.presenceMode ?? (payload.isOnline ? 'online' : 'offline');
        setPresenceMode(mode);
        setLastActiveState(payload.lastActive || null);
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

  const displayPresenceMode = (() => {
    if (presenceMode === 'dnd' || presenceMode === 'away' || presenceMode === 'busy') return presenceMode;
    if (presenceMode === 'online') return 'online';
    if (isRecentlyActive(lastActiveState)) return 'online';
    return presenceMode ?? 'offline';
  })();

  const sizeStyle = { width: size, height: size, fontSize: Math.max(12, Math.floor(size / 3)) };

  return (
    <div className={`presence-avatar ${className}`} style={{ ...sizeStyle, ...style }} onClick={onClick}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || 'User'}
          className="presence-avatar-img"
          style={{ ...sizeStyle }}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="presence-avatar-placeholder" style={{ ...sizeStyle }}>{initials}</div>
      )}

      {displayPresenceMode ? (
        <span className={`presence-dot presence-${displayPresenceMode}`} title={displayPresenceMode} />
      ) : null}

      {displayPresenceMode !== 'online' && showLastActive && lastActiveState ? (
        <div className="presence-last-active">{lastActiveText(lastActiveState)}</div>
      ) : null}
    </div>
  );
}

