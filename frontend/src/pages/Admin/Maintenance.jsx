import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Maintenance() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const [enabled, setEnabled] = useState(false);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || admin?.role !== 'admin') {
      navigate('/auth');
    }
  }, [token, admin, navigate]);

  useEffect(() => {
    if (!token || admin?.role !== 'admin') return;
    fetchMode();
  }, [token, admin?.role]);

  const fetchMode = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/maintenance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnabled(res.data.data.enabled);
      setReason(res.data.data.reason || '');
    } catch (err) {
      console.error(err);
      setStatus('Unable to load maintenance mode');
    } finally {
      setLoading(false);
    }
  };

  const saveMode = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:8000/api/admin/maintenance',
        { enabled, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEnabled(res.data.data.enabled);
      setReason(res.data.data.reason || '');
      setStatus('Maintenance mode updated successfully.');
    } catch (err) {
      console.error(err);
      setStatus(err.response?.data?.message || 'Failed to update maintenance mode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Maintenance Mode</h1>
          <p style={subtitleStyle}>Enable or disable maintenance mode and publish a message to users while the site is paused.</p>
        </div>
      </div>

      <section style={panelStyle}>
        {loading ? (
          <div style={emptyStateStyle}>Loading maintenance state...</div>
        ) : (
          <>
            <div style={toggleRowStyle}>
              <label style={switchLabelStyle}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  style={switchInputStyle}
                />
                <span style={switchTextStyle}>{enabled ? 'Maintenance enabled' : 'Live mode'}</span>
              </label>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Public maintenance reason</label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={textareaStyle}
                placeholder="Explain why the site is under maintenance..."
              />
            </div>

            {status && <div style={statusStyle}>{status}</div>}

            <button style={buttonStyle} onClick={saveMode} disabled={loading}>
              {loading ? 'Saving...' : 'Save maintenance settings'}
            </button>
          </>
        )}
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
  gap: 18,
  maxWidth: 760,
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const toggleRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const switchLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  cursor: 'pointer',
};

const switchTextStyle = {
  fontWeight: 700,
  color: '#111827',
};

const switchInputStyle = {
  width: 18,
  height: 18,
};

const labelStyle = {
  fontWeight: 700,
  color: '#0f172a',
};

const textareaStyle = {
  width: '100%',
  minHeight: 120,
  borderRadius: 18,
  border: '1px solid #d1d5db',
  padding: 14,
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
