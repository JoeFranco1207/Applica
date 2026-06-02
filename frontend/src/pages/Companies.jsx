import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/api/auth/recommendations`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        const data = res.data?.data || {};
        setCompanies((data.recommendedCompanies || []).slice(0, 10));
      } catch (err) {
        console.error('Failed to load recommendations', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const list = (!loading && companies && companies.length) ? companies : ['Tech Innovations Inc.', 'Creative Labs', 'Analytics Pro', 'Web Solutions Ltd'];

  return (
    <div style={{ padding: 28, maxWidth: 980, margin: '0 auto' }}>
      <h1>Companies</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Explore companies and view related profiles/posts.</p>
      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {list.map((c) => (
          <button
            key={typeof c === 'string' ? c : c}
            onClick={() => navigate(`/search?query=${encodeURIComponent(typeof c === 'string' ? c : c)}`)}
            style={{ textAlign: 'left', padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}
          >
            <div style={{ fontWeight: 700 }}>{typeof c === 'string' ? c : c}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>See profiles and posts related to this company</div>
          </button>
        ))}
      </div>
    </div>
  );
}
