import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminAccess() {
  const navigate = useNavigate();
  const [adminCode, setAdminCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/admin/direct-login', {
        adminCode,
        password,
      });
      const data = res.data.data;
      if (data?.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.admin));
        showMessage('Admin login successful', 'success');
        setTimeout(() => navigate('/admin/dashboard'), 800);
      } else {
        showMessage('Login failed', 'error');
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Invalid admin credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: 24, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 450, padding: 32, border: '1px solid #e5e7eb', borderRadius: 18, background: '#ffffff', boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)' }}>
        <h2 style={{ marginBottom: 16, color: '#111827' }}>Admin Login</h2>
        <p style={{ marginBottom: 24, color: '#4b5563' }}>Enter the admin code and password to access the admin dashboard.</p>
      {message && (
        <div style={{ marginBottom: 16, color: messageType === 'success' ? '#047857' : '#b91c1c' }}>{message}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Admin Code</label>
          <input
            type="text"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 12, background: '#111827', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}
        >
          {loading ? 'Signing in...' : 'Sign in as Admin'}
        </button>
      </form>
      </div>
    </div>
  );
}
