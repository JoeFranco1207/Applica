import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function AIPaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        // Check multiple possible parameter names from PayMongo
        const sourceId = searchParams.get('source_id') || 
                         searchParams.get('sourceId') || 
                         searchParams.get('source') || 
                         searchParams.get('id');
        
        console.log('Query params:', Object.fromEntries(searchParams));
        console.log('Source ID found:', sourceId);
        
        // Fallback: if the redirect did not include the source id, try localStorage
        let finalSourceId = sourceId;
        if (!finalSourceId) {
          finalSourceId = localStorage.getItem('aiPremiumSourceId');
          if (finalSourceId) console.log('Falling back to sourceId from localStorage');
        }

        if (!finalSourceId) {
          setStatus('error');
          setMessage('Payment source ID not found in redirect.');
          return;
        }

        // Call the confirm endpoint
        const response = await axios.get(
          `http://localhost:8000/api/payments/ai-premium/confirm?sourceId=${encodeURIComponent(finalSourceId)}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (response.data?.data?.premiumAIAccess) {
          setStatus('success');
          setMessage('🎉 Payment successful! Your AI Premium access is now active.');
          setTimeout(() => {
            // Clear saved source id after successful confirmation
            try { localStorage.removeItem('aiPremiumSourceId'); } catch (e) {}
            navigate('/jobs');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Payment verification failed. Please try again.');
        }
      } catch (err) {
        console.error('Payment confirmation error:', err);
        setStatus('error');
        setMessage(err.response?.data?.message || 'Payment confirmation failed.');
      }
    };

    confirmPayment();
  }, [searchParams, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'processing' && (
          <>
            <div style={styles.spinner} />
            <p style={styles.text}>{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={styles.successIcon}>✓</div>
            <p style={styles.text}>{message}</p>
            <p style={styles.smallText}>Redirecting to Jobs...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={styles.errorIcon}>✕</div>
            <p style={styles.text}>{message}</p>
            <button
              onClick={() => navigate('/jobs')}
              style={styles.button}
            >
              Back to Jobs
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    maxWidth: '400px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #ddd',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  successIcon: {
    fontSize: '48px',
    color: '#27ae60',
    marginBottom: '20px',
    fontWeight: 'bold',
  },
  errorIcon: {
    fontSize: '48px',
    color: '#e74c3c',
    marginBottom: '20px',
    fontWeight: 'bold',
  },
  text: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '10px',
  },
  smallText: {
    fontSize: '14px',
    color: '#999',
    marginTop: '10px',
  },
  button: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

// Add CSS keyframe animation
if (!document.getElementById('payment-success-styles')) {
  const style = document.createElement('style');
  style.id = 'payment-success-styles';
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
