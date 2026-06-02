import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SavedSearches() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/api/auth/recommendations`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        const data = res.data?.data || {};
        setSaved((data.savedSearches || []).slice(0, 8));
      } catch (err) {
        console.error('Failed to load saved searches', err);
      }
    };
    fetch();
  }, []);

  const list = saved.length ? saved : ['React developer', 'Remote product designer', 'Data analyst'];

  return (
    <div style={{ padding: 28, maxWidth: 980, margin: '0 auto' }}>
      <h1>Saved searches</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Quick access to searches you saved.</p>
      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {list.map((s, idx) => (
          <button
            key={`${s}-${idx}`}
            onClick={() => navigate(`/search?query=${encodeURIComponent(s)}`)}
            style={{ textAlign: 'left', padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}
          >
            <div style={{ fontWeight: 700 }}>{s}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
