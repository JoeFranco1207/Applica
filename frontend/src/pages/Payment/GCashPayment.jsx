import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GCashPayment.css';

export default function GCashPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const sourceUrl = params.get('sourceUrl') || location.state?.sourceUrl || '';
  const sourceId = params.get('sourceId') || location.state?.sourceId || '';

  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gcashPhone');
    if (saved) setPhone(saved);
  }, []);

  const validatePhone = (p) => {
    const trimmed = p.trim();
    // Accept formats: +63XXXXXXXXXX or 09XXXXXXXXX or 9XXXXXXXXX
    const plus63 = /^\+63\d{10}$/;
    const zero9 = /^09\d{9}$/;
    const nine = /^9\d{9}$/;
    return plus63.test(trimmed) || zero9.test(trimmed) || nine.test(trimmed);
  };

  const normalizePhone = (p) => {
    let s = p.trim();
    if (s.startsWith('0')) s = '+63' + s.slice(1);
    if (s.startsWith('9')) s = '+63' + s;
    return s;
  };

  const handleSave = async () => {
    setError('');
    if (!validatePhone(phone)) {
      setError('Please enter a valid Philippine mobile number (09xxxxxxxxx or +63xxxxxxxxxx).');
      return;
    }

    const normalized = normalizePhone(phone);
    setSaving(true);

    try {
      // Save locally for convenience
      localStorage.setItem('gcashPhone', normalized);

      // Attempt to persist to backend if sourceId exists
      if (sourceId) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const res = await axios.post(
          `${backendUrl}/api/payments/gcash/attach-phone`,
          { sourceId, phone: normalized },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }
        );
        if (res?.data?.status !== 'success') {
          throw new Error(res?.data?.message || 'attach failed');
        }
      }

      setSaving(false);
      alert('Phone number saved. You can now continue to the PayMongo payment link below.');
    } catch (err) {
      console.error('Failed to save phone to backend', err);
      setSaving(false);
      const serverMessage = err?.response?.data?.message || err?.message || 'Failed to save phone number. Try again.';
      setError(serverMessage);
    }
  };

  return (
    <div className="gcash-page">
      <div className="gcash-card">
        <h2>GCash Payment</h2>
        <p className="muted">Enter your GCash mobile number so we can attach it to the payment source.</p>

        <label className="label">Mobile number</label>
        <input
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="09xxxxxxxxx or +63xxxxxxxxxx"
          inputMode="tel"
        />
        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button className="btn primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save number'}
          </button>
          <button className="btn" onClick={() => navigate(-1)}>Back</button>
        </div>

        <hr style={{ margin: '20px 0' }} />

        <h3>Pay with GCash</h3>
        <p className="muted">Open the PayMongo authentication link below to complete the payment.</p>

        {sourceUrl ? (
          <>
            <a className="btn full" href={sourceUrl} target="_blank" rel="noreferrer">Continue to payment</a>
            <div className="source-url">If the button doesn't work, copy this link:</div>
            <textarea className="source-text" readOnly value={sourceUrl} />
          </>
        ) : (
          <div className="muted">No payment link available. Make sure the backend created a PayMongo source and passed the `sourceUrl` or `sourceId` in the redirect.</div>
        )}
      </div>
    </div>
  );
}
