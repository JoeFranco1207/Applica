import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PresenceAvatar from './PresenceAvatar';
import './LikesList.css';

export default function LikesList({ likerIds = [], postId, onClose }) {
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchLikers() {
      setLoading(true);
      try {
        if (postId) {
          const res = await axios.get(`/api/posts/${postId}/likers`);
          if (!cancelled) setLikers(res.data || []);
        } else if (likerIds?.length) {
          const res = await axios.post('/api/users/batch', { ids: likerIds });
          if (!cancelled) setLikers(res.data || []);
        } else {
          setLikers([]);
        }
      } catch (err) {
        console.error('Failed to load likers', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLikers();
    return () => { cancelled = true; };
  }, [likerIds, postId]);

  return (
    <div className="likes-modal-backdrop" onClick={onClose}>
      <div className="likes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="likes-modal-header">
          <h3>Likes</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="likes-list">
          {loading && <div className="likes-loading">Loading...</div>}
          {!loading && likers.length === 0 && <div className="likes-empty">No likes yet.</div>}
          {!loading && likers.map((u) => (
            <div key={u._id} className="likes-row">
              <PresenceAvatar userId={u._id} src={u.profilePicture} size={40} presenceMode={u.presenceMode || (u.isOnline ? 'online' : 'offline')} lastActive={u.lastActive} showPresence={u.showActivityStatus !== false} />
              <div className="likes-row-info">
                <div className="likes-row-name">{u.firstName} {u.lastName}</div>
                <div className="likes-row-email">{u.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

