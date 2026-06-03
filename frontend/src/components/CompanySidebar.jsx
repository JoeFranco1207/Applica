import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CompanySidebar({ max = 6 }) {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const token = localStorage.getItem('token');

    const fetchData = async () => {
      setLoading(true);
      try {
        // Get recommended company names and profile metadata
        const recRes = await axios.get(`${API_BASE}/api/auth/recommendations`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        const recData = recRes.data?.data || {};
        const companiesData = (recData.recommendedCompaniesWithProfile || recData.recommendedCompanies || [])
          .slice(0, max)
          .map((company) => (typeof company === 'string' ? { name: company } : company));

        // Fetch jobs once to compute open positions per company
        const jobsRes = await axios.get(`${API_BASE}/api/jobs`);
        const jobs = jobsRes.data?.data || jobsRes.data || [];
        const counts = {};
        (jobs || []).forEach((j) => {
          const n = (j.companyName || '').toString().trim();
          if (!n) return;
          const key = n.toLowerCase();
          counts[key] = (counts[key] || 0) + 1;
        });

        const results = await Promise.all(
          companiesData.map(async (company) => {
            const name = (company.name || '').trim();
            const openPositions = counts[name.toLowerCase()] || 0;
            if (company.logo || company.companyId) {
              return {
                name,
                logo: company.logo || '',
                companyId: company.companyId || null,
                openPositions,
              };
            }

            try {
              const search = await axios.get(`${API_BASE}/api/auth/users/search`, {
                headers: { Authorization: token ? `Bearer ${token}` : '' },
                params: { query: name },
              });
              const users = search.data?.data || [];
              const match = (users || []).find((u) => (u.companyName || '').toLowerCase().includes(name.toLowerCase())) || users[0];
              const logo = match?.profilePicture || match?.companyLogo || '';
              return {
                name,
                logo,
                companyId: match?._id || null,
                openPositions,
              };
            } catch (e) {
              return { name, logo: '', companyId: null, openPositions };
            }
          })
        );

        // Fallback sample companies if none returned
        const final = results.length ? results : [
          { name: 'Jollibee Foods Corporation', logo: '', openPositions: 120 },
          { name: 'SM Retail Inc.', logo: '', openPositions: 98 },
        ].slice(0, max);

        setCompanies(final);
      } catch (err) {
        console.error('Failed to load companies', err);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [max]);

  return (
    <div style={{ padding: 12 }}>
      {/* Top companies hiring card (moved to top) */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 6px 18px rgba(20,26,56,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Top companies hiring</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Check out top companies hiring now</div>
          </div>
          <button onClick={() => navigate('/companies')} style={{ background: 'transparent', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: 13 }}>View all</button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading companies...</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {companies.map((c) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {c.logo ? <img src={c.logo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{(c.name || '').slice(0,1)}</div>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.openPositions}+ open positions</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button title="Save company" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, lineHeight: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                  <button onClick={() => navigate(`/search?query=${encodeURIComponent(c.name)}`)} style={{ border: 'none', background: 'linear-gradient(90deg,#eef2ff,#f0fdf4)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', color: 'var(--brand)' }} aria-label={`View ${c.name}`}>
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

