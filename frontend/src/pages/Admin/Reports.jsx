import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || admin?.role !== 'admin') {
      navigate('/auth');
    }
  }, [token, admin, navigate]);

  useEffect(() => {
    if (!token || admin?.role !== 'admin') return;
    setLoading(true);
    fetchReports().finally(() => setLoading(false));
  }, [token, admin?.role]);

  const fetchReports = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data.data || []);
    } catch (err) {
      console.error(err);
      setReports([]);
    }
  };

  const takeAction = async (reportId, action) => {
    try {
      await axios.post(
        `http://localhost:8000/api/admin/reports/${reportId}/action`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReports();
    } catch (err) {
      console.error(err);
      alert('Failed to take action on report.');
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Reports & Review</h1>
          <p style={subtitleStyle}>Track open reports, resolve them and take moderation action from the admin console.</p>
        </div>
        <button style={refreshButtonStyle} onClick={() => { setLoading(true); fetchReports().finally(() => setLoading(false)); }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={emptyStateStyle}>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div style={emptyStateStyle}>No active reports to review.</div>
      ) : (
        <div style={gridStyle}>
          {reports.map((report) => (
            <div key={report._id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <div style={reportTitleStyle}>Report #{report._id.slice(-6)}</div>
                  <div style={reportMetaStyle}>Type: {report.targetType}</div>
                </div>
                <span style={statusStyle(report.status)}>{report.status}</span>
              </div>
              <div style={reportSectionStyle}>
                <strong>Reporter</strong>
                <div>{report.reporter?.firstName ? `${report.reporter.firstName} ${report.reporter.lastName}` : report.reporter?.email || 'Unknown'}</div>
              </div>
              <div style={reportSectionStyle}>
                <strong>Reason</strong>
                <div>{report.reason}</div>
              </div>
              <div style={reportSectionStyle}>
                <strong>Details</strong>
                <div>{report.details || 'No extra details were provided.'}</div>
              </div>
              <div style={actionRowStyle}>
                <button style={primaryButtonStyle} onClick={() => takeAction(report._id, 'mark-reviewed')}>Mark reviewed</button>
                <button style={secondaryButtonStyle} onClick={() => takeAction(report._id, 'dismiss')}>Dismiss</button>
                <button style={dangerButtonStyle} onClick={() => takeAction(report._id, 'delete-target')}>Delete target</button>
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

const reportTitleStyle = {
  fontSize: 18,
  fontWeight: 700,
  color: '#0f172a',
};

const reportMetaStyle = {
  color: '#64748b',
  fontSize: 13,
};

const statusStyle = (status) => ({
  padding: '8px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  color: status === 'open' ? '#1d4ed8' : status === 'dismissed' ? '#b91c1c' : '#047857',
  background: status === 'open' ? 'rgba(59, 130, 246, 0.12)' : status === 'dismissed' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
});

const reportSectionStyle = {
  marginBottom: 14,
  color: '#334155',
  lineHeight: 1.6,
};

const actionRowStyle = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const primaryButtonStyle = {
  background: '#10b981',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 700,
};

const secondaryButtonStyle = {
  background: '#64748b',
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
