import { useLocation, useNavigate } from 'react-router-dom';

export default function QRPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const qr = state.qr || state.qrCode || state.source?.qr_code || null;
  const checkoutUrl = state.checkoutUrl || state.sourceUrl || state.source?.redirect?.checkout_url || state.sourceAttributes?.redirect?.checkout_url || null;

  const qrData = qr?.data || qr?.code || null;
  const img = qr?.image_url || qr?.image || null;

  return (
    <div style={{ padding: 40 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>← Back</button>
      <h2>QR Payment</h2>
      <p>Scan the QR code below using your banking or e-wallet app to complete payment.</p>

      {img ? (
        <img src={img} alt="QR" style={{ width: 260, height: 260, borderRadius: 12 }} />
      ) : qrData ? (
        <div style={{ padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', maxWidth: 640 }}>{qrData}</div>
      ) : (
        <div style={{ color: '#64748b' }}>No QR data available. Please return to the checkout and try again.</div>
      )}

      {checkoutUrl && (
        <div style={{ marginTop: 18 }}>
          <a href={checkoutUrl} target="_blank" rel="noreferrer" style={{ padding: '10px 14px', background: '#0ea5a4', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>Open payment link</a>
        </div>
      )}
    </div>
  );
}
