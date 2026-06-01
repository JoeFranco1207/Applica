import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Subscriptions() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || admin?.role !== 'admin') {
      navigate('/auth');
    }
  }, [token, admin, navigate]);

  useEffect(() => {
    if (!token || admin?.role !== 'admin') return;
    setLoading(true);
    fetchSubscribers().finally(() => setLoading(false));
  }, [token, admin?.role]);

  const fetchSubscribers = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscribers(res.data.data || []);
    } catch (err) {
      console.error(err);
      setSubscribers([]);
    }
  };

  const revoke = async (id) => {
    try {
      await axios.post(`http://localhost:8000/api/admin/subscriptions/${id}/revoke`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      alert('Failed to revoke premium access.');
    }
  };

  const refund = async (id) => {
    const reason = window.prompt('Refund reason');
    if (reason === null) return;
    try {
      await axios.post(`http://localhost:8000/api/admin/subscriptions/${id}/refund`, { reason }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      alert('Failed to refund subscription.');
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Premium Subscriber Management</h1>
          <p style={subtitleStyle}>Review active AI premium subscriptions and issue revokes or refunds as needed.</p>
        </div>
        <button style={refreshButtonStyle} onClick={() => { setLoading(true); fetchSubscribers().finally(() => setLoading(false)); }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={emptyStateStyle}>Loading subscriber data...</div>
      ) : subscribers.length === 0 ? (
        <div style={emptyStateStyle}>No premium subscribers found.</div>
      ) : (
        <div style={gridStyle}>
          {subscribers.map((subscriber) => (
            <div key={subscriber._id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <div style={subscriberNameStyle}>{subscriber.firstName} {subscriber.lastName}</div>
                  <div style={subscriberMetaStyle}>{subscriber.email}</div>
                </div>
                <span style={badgeStyle}>{subscriber.role}</span>
              </div>
              <div style={detailRowStyle}>Premium plan: <strong>{subscriber.premiumPlan || 'unknown'}</strong></div>
              <div style={detailRowStyle}>Member since: <strong>{new Date(subscriber.createdAt).toLocaleDateString()}</strong></div>
              <div style={actionRowStyle}>
                <button style={secondaryButtonStyle} onClick={() => revoke(subscriber._id)}>Revoke access</button>
                <button style={dangerButtonStyle} onClick={() => refund(subscriber._id)}>Refund</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
};

const titleStyle = {
  margin: 0,
  fontSize: 30,
  color: '#111827',
};

const subtitleStyle = {
  margin: 0,
  color: '#475569',
  maxWidth: 660,
};

const refreshButtonStyle = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '12px 20px',
  borderRadius: 14,
  cursor: 'pointer',
  fontWeight: 700,
};

const gridStyle = {
  display: 'grid',
  gap: 18,
};

const cardStyle = {
  background: '#fff',
  padding: 20,
  borderRadius: 24,
  border: '1px solid #e5e7eb',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
};

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
  gap: 16,
};

const subscriberNameStyle = {
  fontWeight: 700,
  color: '#0f172a',
  fontSize: 18,
};

const subscriberMetaStyle = {
  color: '#64748b',
  fontSize: 14,
};

const badgeStyle = {
  background: '#e2e8f0',
  color: '#0f172a',
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

const detailRowStyle = {
  margin: '8px 0',
  color: '#334155',
};

const actionRowStyle = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 16,
};

const secondaryButtonStyle = {
  background: '#f59e0b',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 700,
};

const dangerButtonStyle = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 700,
};

const emptyStateStyle = {
  padding: 40,
  textAlign: 'center',
  color: '#64748b',
  background: '#f8fafc',
  borderRadius: 20,
};
