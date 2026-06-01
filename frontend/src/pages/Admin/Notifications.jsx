import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || admin?.role !== 'admin') {
      navigate('/auth');
    }
  }, [token, admin, navigate]);

  const sendBroadcast = async () => {
    if (!message.trim()) {
      setStatus('Message is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:8000/api/admin/notifications/broadcast',
        { message, target },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus(`Sent to ${res.data.data.delivered}/${res.data.data.requested} recipients.`);
      setMessage('');
    } catch (err) {
      console.error(err);
      setStatus(err.response?.data?.message || 'Broadcast failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Broadcast Notifications</h1>
          <p style={subtitleStyle}>Send system notifications to all users or target specific roles.</p>
        </div>
      </div>

      <section style={panelStyle}>
        <label style={labelStyle}>Message</label>
        <textarea
          style={textareaStyle}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter notification text..."
        />

        <div style={fieldRowStyle}>
          <label style={labelStyle}>Recipient group</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)} style={selectStyle}>
            <option value="all">All users</option>
            <option value="jobseeker">Jobseekers</option>
            <option value="employer">Employers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {status && <div style={statusStyle}>{status}</div>}

        <button style={buttonStyle} onClick={sendBroadcast} disabled={loading}>
          {loading ? 'Sending...' : 'Send notification'}
        </button>
      </section>
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
  alignItems: 'flex-start',
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

const panelStyle = {
  background: '#fff',
  borderRadius: 24,
  border: '1px solid #e5e7eb',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  maxWidth: 760,
};

const labelStyle = {
  fontWeight: 700,
  color: '#0f172a',
};

const textareaStyle = {
  width: '100%',
  borderRadius: 18,
  border: '1px solid #d1d5db',
  padding: 14,
  resize: 'vertical',
  fontSize: 15,
};

const fieldRowStyle = {
  display: 'grid',
  gap: 10,
};

const selectStyle = {
  width: '100%',
  padding: 12,
  borderRadius: 16,
  border: '1px solid #d1d5db',
  background: '#fff',
  fontSize: 15,
};

const buttonStyle = {
  width: 'fit-content',
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 16,
  padding: '12px 22px',
  cursor: 'pointer',
  fontWeight: 700,
};

const statusStyle = {
  color: '#475569',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: '12px 16px',
};

const emptyStateStyle = {
  padding: 40,
  textAlign: 'center',
  color: '#64748b',
  background: '#f8fafc',
  borderRadius: 20,
};
