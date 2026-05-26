import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

export default function CardPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const sourceId = state.sourceId || state.source?.id || null;
  const sourceAttributes = state.sourceAttributes || state.source || null;
  const [message, setMessage] = useState('Open the card authorization link or verify payment status.');

  const handleCheck = async () => {
    try {
      // Let frontend poll the backend for confirmation if needed
      const res = await axios.get('/api/payments/ai-premium/status', { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
      const data = res.data?.data || {};
      if (data?.premiumAIAccess) {
        setMessage('Payment confirmed. Premium enabled.');
      } else {
        setMessage(`Status: ${data.status || 'pending'}`);
      }
    } catch (err) {
      setMessage('Unable to verify payment status now.');
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>← Back</button>
      <h2>Card Payment</h2>
      <p>If you provided card details we attempted to authorize a charge. You may need to complete 3DS or verify with your bank.</p>

      {sourceAttributes?.redirect?.checkout_url ? (
        <a href={sourceAttributes.redirect.checkout_url} target="_blank" rel="noreferrer" style={{ padding: '10px 14px', background: '#6366f1', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>Open card authorization</a>
      ) : (
        <div style={{ color: '#64748b' }}>No external authorization link available. You can check payment status below.</div>
      )}

      <div style={{ marginTop: 18 }}>
        <button onClick={handleCheck} style={{ padding: '10px 14px', borderRadius: 8 }}>Check payment status</button>
      </div>

      <div style={{ marginTop: 12 }}>{message}</div>
    </div>
  );
}
