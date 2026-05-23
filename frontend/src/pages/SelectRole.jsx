import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function SelectRole() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const chooseRole = async (role) => {
    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await axios.put(
        'http://localhost:8000/api/auth/select-role',
        { role },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // update local user role
      const updatedUser = { ...(user || {}), role: res.data.data.role };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // navigate to the appropriate profile creation
      if (res.data.data.role === 'employer') {
        navigate('/create/employer');
      } else if (res.data.data.role === 'jobseeker') {
        navigate('/create/jobseeker');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Error selecting role', err.response || err.message);
      setError(err.response?.data?.message || 'Failed to select role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: 28, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', width: 520, maxWidth: '92%' }}>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Select your role</h2>
        <p style={{ marginTop: 0, marginBottom: 18 }}>Choose whether you'd like to use Applica as a Jobseeker or an Employer.</p>

        {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => chooseRole('jobseeker')}
            disabled={loading}
            style={{ flex: 1, padding: '14px 18px', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'white', fontWeight: 700 }}
          >
            I'm a Jobseeker
          </button>

          <button
            onClick={() => chooseRole('employer')}
            disabled={loading}
            style={{ flex: 1, padding: '14px 18px', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'white', fontWeight: 700 }}
          >
            I'm an Employer
          </button>
        </div>

        <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>
          You can only choose your role once. If you need to change it later, contact support.
        </p>
      </div>
    </div>
  );
}

