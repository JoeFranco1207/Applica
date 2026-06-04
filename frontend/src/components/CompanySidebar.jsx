import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CompanySidebar({ max = 6, currentRole }) {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [bestProfile, setBestProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUser = useMemo(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (err) {
      return null;
    }
  }, []);

  const isEmployer = currentRole === 'employer' || currentUser?.role === 'employer';

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const token = localStorage.getItem('token');

    const fetchData = async () => {
      setLoading(true);
      try {
        if (isEmployer) {
          const recRes = await axios.get(`${API_BASE}/api/auth/recommendations`, {
            headers: { Authorization: token ? `Bearer ${token}` : '' },
          });
          const recData = recRes.data?.data || {};
          let profiles = Array.isArray(recData.recommendedProfiles) ? recData.recommendedProfiles : [];
          profiles = (profiles || []).filter(Boolean);

          // If the backend returned recommendations but they aren't jobseeker profiles,
          // try to prefer entries that look like jobseekers (have an id or explicit role).
          if (profiles.length) {
            const jobseekerCandidates = profiles.filter((p) => p && (p.role === 'jobseeker' || p._id || p.id));
            if (jobseekerCandidates.length) profiles = jobseekerCandidates;
          }

          if (!profiles.length) {
            const query = (
              currentUser?.location?.city ||
              currentUser?.location?.region ||
              currentUser?.companyName ||
              'jobseeker'
            ).toString().trim() || 'jobseeker';

            const profileRes = await axios.get(`${API_BASE}/api/auth/users/search`, {
              headers: { Authorization: token ? `Bearer ${token}` : '' },
              params: { query },
            });

            profiles = Array.isArray(profileRes.data?.data) ? profileRes.data.data : [];
            profiles = profiles.filter((profile) => profile.role === 'jobseeker');
          }

          const maxTopProfiles = Math.min(max, 4);

          // Choose a best profile that is an actual existing jobseeker (prefer _id or id and explicit role).
          let best = null;
          if (Array.isArray(profiles) && profiles.length) {
            best = profiles.find((p) => (p && (p.role === 'jobseeker') && (p._id || p.id))) ||
                   profiles.find((p) => (p && (p._id || p.id))) ||
                   profiles[0];
          }

          const topProfiles = (Array.isArray(profiles) ? profiles.filter((p) => p !== best) : []).slice(0, maxTopProfiles);

          const mapProfile = (profile) => ({
            name: [profile.firstName || '', profile.lastName || '']
              .filter(Boolean)
              .join(' ') || profile.email || 'Candidate',
            logo: profile.profilePicture || profile.companyLogo || '',
            profileId: profile._id || profile.id || null,
            subtitle: profile.companyName || 'Jobseeker',
            details: profile.role === 'jobseeker' ? 'Recommended for hiring' : profile.role || 'Candidate',
          });

          let mappedBest = best ? mapProfile(best) : null;
          let mappedTop = topProfiles.map(mapProfile);

          // If recommendations are short (e.g. only one best profile), try to
          // include other available recommended profiles as the top list.
          if ((!mappedTop || mappedTop.length === 0) && Array.isArray(profiles) && profiles.length > 0) {
            const candidates = profiles
              .slice(0, maxTopProfiles + 1)
              .filter((p) => p !== best)
              .slice(0, maxTopProfiles);
            mappedTop = candidates.map(mapProfile);
          }

          // If still empty, try a final search to fetch real jobseeker profiles
          if (!mappedTop || mappedTop.length === 0) {
            try {
              const searchRes = await axios.get(`${API_BASE}/api/auth/users/search`, {
                headers: { Authorization: token ? `Bearer ${token}` : '' },
                params: { query: 'jobseeker', limit: maxTopProfiles + 2 },
              });
              const users = Array.isArray(searchRes.data?.data) ? searchRes.data.data : [];
              const jobseekers = users.filter((u) => u && (u.role === 'jobseeker' || u._id || u.id));
              const uniq = [];
              const uniqueJobseekers = jobseekers.filter((u) => {
                const id = u._id || u.id || u.email || u.emailAddress;
                if (!id) return false;
                if (uniq.includes(id)) return false;
                uniq.push(id);
                return true;
              }).slice(0, maxTopProfiles);

              if (uniqueJobseekers.length) {
                mappedTop = uniqueJobseekers.map(mapProfile);
                if (!mappedBest) {
                  const firstReal = uniqueJobseekers.find((u) => u._id || u.id) || uniqueJobseekers[0];
                  if (firstReal) mappedBest = mapProfile(firstReal);
                }
              }
            } catch (e) {
              // ignore search error and fall back to placeholders below
            }
          }

          // If still empty after real search, provide sample placeholders so the UI isn't blank.
          if (!mappedTop || mappedTop.length === 0) {
            mappedTop = [
              { name: 'Jane Doe', logo: '', profileId: null, subtitle: 'Software Engineer', details: 'Best candidate' },
              { name: 'Juan Dela Cruz', logo: '', profileId: null, subtitle: 'Customer Success', details: 'Top candidate' },
              { name: 'Alex Santos', logo: '', profileId: null, subtitle: 'UI/UX Designer', details: 'Top candidate' },
              { name: 'Maya Lee', logo: '', profileId: null, subtitle: 'Operations Lead', details: 'Top candidate' },
            ].slice(0, maxTopProfiles);
          }

          setBestProfile(mappedBest || {
            name: 'Jane Doe',
            logo: '',
            profileId: null,
            subtitle: 'Top-fit candidate',
            details: 'Best match for your hiring needs',
          });
          setCompanies(mappedTop);
          return;
        }

        // Get recommended company names and profile metadata for jobseekers
        const recRes = await axios.get(`${API_BASE}/api/auth/recommendations`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        const recData = recRes.data?.data || {};
        let companiesData = (recData.recommendedCompaniesWithProfile || recData.recommendedCompanies || [])
          .slice(0, max)
          .map((company) => (typeof company === 'string' ? { name: company } : company));

        const jobsRes = await axios.get(`${API_BASE}/api/jobs`);
        const jobs = jobsRes.data?.data || jobsRes.data || [];
        const counts = {};
        (jobs || []).forEach((j) => {
          const n = (j.companyName || '').toString().trim();
          if (!n) return;
          const key = n.toLowerCase();
          counts[key] = (counts[key] || 0) + 1;
        });

        if (!companiesData.length) {
          companiesData = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, max)
            .map(([name]) => ({ name }));
        }

        const results = await Promise.all(
          companiesData.map(async (company) => {
            const name = (company.name || '').trim();
            if (!name) {
              return null;
            }
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

        const final = results.filter(Boolean);
        setCompanies(final.length ? final : Object.entries(counts).slice(0, max).map(([name, count]) => ({
          name,
          logo: '',
          companyId: null,
          openPositions: count,
        })));
      } catch (err) {
        console.error('Failed to load companies', err);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [max, isEmployer, currentUser]);

  return (
    <div style={{ padding: 12 }}>
      {isEmployer ? (
        <>
          <div style={{ background: 'var(--surface-strong)', borderRadius: 12, padding: 14, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)', border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-h)' }}>Best profile to recruit</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  The top candidate with the strongest match for your hiring needs.
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ color: 'var(--text-secondary)' }}>Loading best profile...</div>
            ) : bestProfile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 14px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {bestProfile.logo ? <img src={bestProfile.logo} alt={bestProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 18, color: 'var(--text-secondary)' }}>{(bestProfile.name || '').slice(0, 1)}</div>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{bestProfile.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{bestProfile.subtitle}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{bestProfile.details}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (bestProfile.profileId) {
                      navigate(`/profile/${bestProfile.profileId}`);
                    } else {
                      navigate(`/search?query=${encodeURIComponent(bestProfile.name)}`);
                    }
                  }}
                  style={{ border: 'none', background: 'transparent', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', color: 'var(--brand)', fontWeight: 700 }}
                >
                  View profile
                </button>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>No candidate found yet.</div>
            )}
          </div>

          <div style={{ background: 'var(--surface-strong)', borderRadius: 12, padding: 14, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-h)' }}>Top profiles to recruit</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Browse the next best candidates recommended for your hiring.
                </div>
              </div>
              <button
                onClick={() => navigate('/search?query=jobseeker')}
                style={{ background: 'transparent', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: 13 }}
              >
                View all
              </button>
            </div>

            {loading ? (
              <div style={{ color: 'var(--text-secondary)' }}>Loading top profiles...</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {companies.map((c) => (
                  <div key={c.profileId || c.companyId || c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {c.logo ? <img src={c.logo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{(c.name || '').slice(0,1)}</div>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{c.subtitle || c.details || ''}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (c.profileId) {
                          navigate(`/profile/${c.profileId}`);
                        } else {
                          navigate(`/search?query=${encodeURIComponent(c.name)}`);
                        }
                      }}
                      style={{ border: 'none', background: 'transparent', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', color: 'var(--brand)' }}
                      aria-label={`View ${c.name}`}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ background: 'var(--surface-strong)', borderRadius: 12, padding: 14, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)', border: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-h)' }}>Top companies hiring</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Check out top companies hiring now
              </div>
            </div>
            <button
              onClick={() => navigate('/companies')}
              style={{ background: 'transparent', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: 13 }}
            >
              View all
            </button>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading companies...</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {companies.map((c) => (
                <div key={c.profileId || c.companyId || c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {c.logo ? <img src={c.logo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{(c.name || '').slice(0,1)}</div>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {c.openPositions != null ? `${c.openPositions}+ open positions` : c.subtitle || c.details || ''}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (c.companyId) {
                        navigate(`/company/${c.companyId}`);
                      } else {
                        navigate(`/search?query=${encodeURIComponent(c.name)}`);
                      }
                    }}
                    style={{ border: 'none', background: 'transparent', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', color: 'var(--brand)' }}
                    aria-label={`View ${c.name}`}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

