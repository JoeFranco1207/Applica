import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (err) {
      return {};
    }
  })();

  const [queue, setQueue] = useState([]);
  const [pendingEmployers, setPendingEmployers] = useState([]);
  const [premiumStats, setPremiumStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/auth');
    }
  }, [token, user, navigate]);

  const fetchModeration = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/moderation/queue', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQueue(res.data.data?.posts || []);
    } catch (err) {
      console.error('AdminDashboard: failed to load moderation queue', err);
      setQueue([]);
    }
  };

  const fetchPendingEmployers = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/employers/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingEmployers(res.data.data || []);
    } catch (err) {
      console.error('AdminDashboard: failed to load pending employers', err);
      setPendingEmployers([]);
    }
  };

  const fetchPremiumStats = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/stats/premium', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPremiumStats(res.data.data || null);
    } catch (err) {
      console.error('AdminDashboard: failed to load premium stats', err);
      setPremiumStats(null);
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/stats/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOverview(res.data.data || null);
    } catch (err) {
      console.error('AdminDashboard: failed to load overview', err);
      setOverview(null);
    }
  };

  useEffect(() => {
    if (!token || user?.role !== 'admin') return;
    setLoading(true);
    Promise.all([fetchModeration(), fetchPendingEmployers(), fetchPremiumStats(), fetchOverview()]).finally(() => setLoading(false));
  }, [token, user?.role]);

  const clearRestriction = async (postId) => {
    try {
      await axios.post(
        `http://localhost:8000/api/admin/moderation/posts/${postId}/clear`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchModeration();
    } catch (err) {
      console.error('AdminDashboard: failed to clear restriction', err);
    }
  };

  const acceptEmployer = async (employerId) => {
    try {
      await axios.post(`http://localhost:8000/api/admin/employers/${employerId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPendingEmployers();
    } catch (err) {
      console.error('AdminDashboard: failed to accept employer', err);
    }
  };

  return (
    <div style={dashboardWallStyle}>
      <div style={topCardsStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Restricted Posts</div>
          <div style={statValueStyle}>{queue.length}</div>
          <div style={statSubTextStyle}>Posts currently flagged for review</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Pending Employers</div>
          <div style={statValueStyle}>{pendingEmployers.length}</div>
          <div style={statSubTextStyle}>Employer accounts waiting for approval</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Total Premium Revenue</div>
          <div style={statValueStyle}>{(overview?.premiumStats || premiumStats) ? `₱${((overview?.premiumStats || premiumStats).totalRevenueCents/100).toLocaleString()}` : '—'}</div>
          <div style={statSubTextStyle}>All-time revenue from AI premium purchases</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Premium Subscribers</div>
          <div style={statValueStyle}>{(overview?.premiumStats || premiumStats) ? (overview?.premiumStats || premiumStats).totalSubscribers : '—'}</div>
          <div style={statSubTextStyle}>Users with active AI premium access</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Open Reports</div>
          <div style={statValueStyle}>{overview?.openReports ?? '—'}</div>
          <div style={statSubTextStyle}>Reports awaiting admin review</div>
        </div>
      </div>

      {loading ? (
        <div style={loadingStyle}>Loading dashboard...</div>
      ) : (
        <div style={gridStyle}>
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={sectionTitleStyle}>Moderation Queue</div>
                <div style={sectionSubtitleStyle}>Clear restricted posts or keep them flagged for review.</div>
              </div>
              <button onClick={fetchModeration} style={refreshButtonStyle}>Refresh</button>
            </div>

            {queue.length === 0 ? (
              <div style={emptyStateStyle}>No restricted posts pending review.</div>
            ) : (
              queue.map((post) => (
                <div key={post._id} style={itemStyle}>
                  <div style={itemHeaderStyle}>
                    <span>{post.authorName || post.authorEmail || 'Unknown author'}</span>
                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={itemTextStyle}>{post.content}</div>
                  <div style={tagStyle}>Reason: {post.restrictionReason || 'No reason provided'}</div>
                  <button onClick={() => clearRestriction(post._id)} style={actionButtonStyle}>Clear restriction</button>
                </div>
              ))
            )}
          </section>

          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={sectionTitleStyle}>Pending Employers</div>
                <div style={sectionSubtitleStyle}>Approve trusted employers to start posting.</div>
              </div>
              <button onClick={fetchPendingEmployers} style={refreshButtonStyle}>Refresh</button>
            </div>

            {pendingEmployers.length === 0 ? (
              <div style={emptyStateStyle}>No pending employer approvals.</div>
            ) : (
              pendingEmployers.map((employer) => (
                <div key={employer._id} style={itemStyle}>
                  <div style={itemHeaderStyle}>
                    <span>{employer.companyName || employer.email || 'Employer account'}</span>
                    <span>{employer.email}</span>
                  </div>
                  <div style={itemTextStyle}>Status: {employer.approvalStatus || 'Pending'}</div>
                  <button onClick={() => acceptEmployer(employer._id)} style={actionButtonStyle}>Accept employer</button>
                </div>
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
}

const dashboardWallStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
  width: '100%',
};

const topCardsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))',
  gap: 20,
};

const statCardStyle = {
  background: '#ffffff',
  padding: 26,
  borderRadius: 28,
  border: '1px solid #e5e7eb',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
  minHeight: 160,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const statLabelStyle = {
  textTransform: 'uppercase',
  color: '#64748b',
  fontSize: 11,
  letterSpacing: '0.18em',
  marginBottom: 18,
};

const statValueStyle = {
  fontSize: 34,
  fontWeight: 800,
  color: '#0f172a',
};

const statSubTextStyle = {
  marginTop: 12,
  color: '#64748b',
  fontSize: 13,
  lineHeight: 1.5,
};

const quickActionStyle = {
  marginTop: 14,
  display: 'inline-block',
  padding: '8px 12px',
  borderRadius: 14,
  background: '#eef2ff',
  color: '#4338ca',
  fontSize: 12,
  fontWeight: 600,
};

const loadingStyle = {
  padding: 32,
  background: '#fff',
  borderRadius: 24,
  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.06)',
  textAlign: 'center',
  color: '#64748b',
};

const gridStyle = {
  display: 'grid',
  gap: 24,
  gridTemplateColumns: '1.7fr 1.3fr',
};

const sectionStyle = {
  background: '#ffffff',
  padding: 28,
  borderRadius: 28,
  border: '1px solid #e5e7eb',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
};

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 20,
};

const sectionTitleStyle = {
  fontSize: 18,
  fontWeight: 700,
  color: '#0f172a',
};

const sectionSubtitleStyle = {
  marginTop: 6,
  color: '#64748b',
  fontSize: 13,
};

const refreshButtonStyle = {
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#0f172a',
  borderRadius: 16,
  padding: '10px 16px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
};

const itemStyle = {
  marginTop: 16,
  padding: 20,
  borderRadius: 22,
  background: '#f8fafc',
  border: '1px solid #e5e7eb',
};

const itemHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  fontWeight: 700,
  color: '#111827',
};

const itemTextStyle = {
  marginTop: 10,
  color: '#475569',
  lineHeight: 1.6,
};

const tagStyle = {
  marginTop: 12,
  display: 'inline-block',
  padding: '8px 12px',
  borderRadius: 999,
  background: '#fee2e2',
  color: '#b91c1c',
  fontWeight: 700,
  fontSize: 12,
};

const actionButtonStyle = {
  marginTop: 14,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  padding: '12px 18px',
  borderRadius: 16,
  cursor: 'pointer',
  fontWeight: 700,
  boxShadow: '0 12px 28px rgba(37, 99, 235, 0.18)',
};

const emptyStateStyle = {
  marginTop: 12,
  padding: 24,
  borderRadius: 20,
  background: '#f8fafc',
  color: '#64748b',
  border: '1px solid #e5e7eb',
};
