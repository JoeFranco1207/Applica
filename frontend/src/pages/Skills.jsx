import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Skills() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/api/auth/recommendations`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        const data = res.data?.data || {};
        setSkills((data.recommendedSkills || []).slice(0, 8));
      } catch (err) {
        console.error('Failed to load skills', err);
      }
    };
    fetch();
  }, []);

  const list = skills.length ? skills : ['React', 'Node.js', 'Product Design', 'Data Analysis'];

  return (
    <div style={{ padding: 28, maxWidth: 980, margin: '0 auto' }}>
      <h1>Skills in Demand</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Explore talent and posts by skill.</p>
      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {list.map((s, idx) => (
          <button
            key={`${s}-${idx}`}
            onClick={() => navigate(`/search?query=${encodeURIComponent(s)}`)}
            style={{ textAlign: 'left', padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}
          >
            <div style={{ fontWeight: 700 }}>{s}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>See profiles and posts mentioning this skill</div>
          </button>
        ))}
      </div>
    </div>
  );
}
