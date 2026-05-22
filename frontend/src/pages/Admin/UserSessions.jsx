import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function UserSessions() {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/auth'); return; }
      try {
        const res = await axios.get(`http://localhost:8000/api/admin/users/${userId}/sessions`, { headers: { Authorization: `Bearer ${token}` } });
        const data = res.data?.data || {};
        setUser(data.user || null);
        setSessions(data.sessions || []);
      } catch (err) {
        console.error('Failed to fetch sessions', err);
        alert('Failed to fetch sessions');
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchSessions();
  }, [userId, navigate]);

  const revoke = async (sessionId) => {
    if (!window.confirm('Revoke this session?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:8000/api/admin/users/${userId}/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } });
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      alert('Session revoked');
    } catch (err) {
      console.error('Failed to revoke session', err);
      alert('Failed to revoke session');
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>User Sessions</h2>
      {user && (
        <div style={{ marginBottom: 12 }}>
          <strong>{user.firstName} {user.lastName}</strong> — {user.email}
        </div>
      )}

      {sessions.length === 0 ? (
        <div>No active sessions</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Device</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Created</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Expires</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s._id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{s.device || 'Unknown'}</td>
                <td style={{ padding: 8 }}>{s.createdAt ? new Date(s.createdAt).toLocaleString() : '-'}</td>
                <td style={{ padding: 8 }}>{s.expires ? new Date(s.expires).toLocaleString() : 'No expiry'}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => revoke(s._id)}>Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
