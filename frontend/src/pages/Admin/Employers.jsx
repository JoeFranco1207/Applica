import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Employers() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const [pending, setPending] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || admin?.role !== 'admin') {
      navigate('/auth');
    }
  }, [token, admin, navigate]);

  useEffect(() => {
    if (!token || admin?.role !== 'admin') return;
    setLoading(true);
    Promise.all([fetchPending(), fetchAll()]).finally(() => setLoading(false));
  }, [token, admin?.role]);

  const fetchPending = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/employers/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPending(res.data.data || []);
    } catch (err) {
      console.error(err);
      setPending([]);
    }
  };

  const fetchAll = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/employers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployers(res.data.data || []);
    } catch (err) {
      console.error(err);
      setEmployers([]);
    }
  };

  const acceptEmployer = async (employerId) => {
    try {
      await axios.post(`http://localhost:8000/api/admin/employers/${employerId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPending();
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to accept employer.');
    }
  };

  const rejectEmployer = async (employerId) => {
    try {
      await axios.post(`http://localhost:8000/api/admin/employers/${employerId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPending();
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to reject employer.');
    }
  };

  const suspendEmployer = async (employerId) => {
    try {
      await axios.post(`http://localhost:8000/api/admin/users/${employerId}/suspend`, { reason: 'Employer suspended by admin' }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to suspend employer.');
    }
  };

  const unsuspendEmployer = async (employerId) => {
    try {
      await axios.post(`http://localhost:8000/api/admin/users/${employerId}/unsuspend`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to unsuspend employer.');
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Employer Verification</h1>
          <p style={subtitleStyle}>Approve, reject, verify, and suspend employer accounts from a single admin workflow.</p>
        </div>
        <button style={refreshButtonStyle} onClick={() => { setLoading(true); Promise.all([fetchPending(), fetchAll()]).finally(() => setLoading(false)); }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={emptyStateStyle}>Loading employer data...</div>
      ) : (
        <div style={gridStyle}>
          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>Pending Employers</h2>
            {pending.length === 0 ? (
              <div style={emptyStateStyle}>No pending employer approvals.</div>
            ) : (
              pending.map((employer) => (
                <div key={employer._id} style={itemCardStyle}>
                  <div style={itemHeaderStyle}>
                    <div>{employer.companyName || employer.email}</div>
                    <span style={badgeStyle}>{employer.approvalStatus || 'Pending'}</span>
                  </div>
                  <div style={itemTextStyle}>{employer.companyDescription || 'No company description available.'}</div>
                  <div style={actionRowStyle}>
                    <button style={primaryButtonStyle} onClick={() => acceptEmployer(employer._id)}>Accept</button>
                    <button style={secondaryButtonStyle} onClick={() => rejectEmployer(employer._id)}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>All Employers</h2>
            {employers.length === 0 ? (
              <div style={emptyStateStyle}>No employer accounts found.</div>
            ) : (
              employers.map((employer) => (
                <div key={employer._id} style={itemCardStyle}>
                  <div style={itemHeaderStyle}>
                    <div>{employer.companyName || employer.email}</div>
                    <span style={badgeStyle}>{employer.approvalStatus || 'Unknown'}</span>
                  </div>
                  <div style={itemTextStyle}>Created: {new Date(employer.createdAt).toLocaleDateString()}</div>
                  <div style={itemTextStyle}>Verified: {employer.approvalStatus === 'Accepted' ? 'Yes' : 'No'}</div>
                  <div style={actionRowStyle}>
                    {employer.isSuspended ? (
                      <button style={primaryButtonStyle} onClick={() => unsuspendEmployer(employer._id)}>Unsuspend</button>
                    ) : (
                      <button style={secondaryButtonStyle} onClick={() => suspendEmployer(employer._id)}>Suspend</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
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
  gap: 20,
  gridTemplateColumns: '1.2fr 1fr',
};

const panelStyle = {
  background: '#fff',
  borderRadius: 24,
  border: '1px solid #e5e7eb',
  padding: 24,
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
};

const sectionTitleStyle = {
  margin: '0 0 20px',
  fontSize: 20,
  color: '#111827',
};

const itemCardStyle = {
  borderRadius: 20,
  border: '1px solid #f1f5f9',
  padding: 20,
  marginBottom: 16,
  background: '#f9fafb',
};

const itemHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
  gap: 10,
};

const badgeStyle = {
  background: '#e2e8f0',
  color: '#0f172a',
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

const itemTextStyle = {
  color: '#44566c',
  marginBottom: 16,
  lineHeight: 1.6,
};

const actionRowStyle = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
};

const primaryButtonStyle = {
  border: 'none',
  background: '#10b981',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: 12,
  cursor: 'pointer',
  fontWeight: 700,
};

const secondaryButtonStyle = {
  border: 'none',
  background: '#f97316',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: 12,
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
