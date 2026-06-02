import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RecommendedJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/api/auth/recommendations`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        const data = res.data?.data || {};
        setJobs((data.recommendedJobs || []).slice(0, 8));
      } catch (err) {
        console.error('Failed to load recommended jobs', err);
      }
    };
    fetch();
  }, []);

  const list = jobs.length ? jobs : ['Frontend Engineer', 'Backend Engineer', 'Product Designer'];

  return (
    <div style={{ padding: 28, maxWidth: 980, margin: '0 auto' }}>
      <h1>Recommended Jobs</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Jobs tailored for you — click any to search for similar posts.</p>
      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {list.map((j, idx) => (
          <button
            key={typeof j === 'string' ? `${j}-${idx}` : j.title || idx}
            onClick={() => navigate(`/search?query=${encodeURIComponent(typeof j === 'string' ? j : j.title || j)}`)}
            style={{ textAlign: 'left', padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}
          >
            <div style={{ fontWeight: 700 }}>{typeof j === 'string' ? j : (j.title || j)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>Find posts and profiles related to this role</div>
          </button>
        ))}
      </div>
    </div>
  );
}
