import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function AIPaymentSuccess({ failed }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(failed ? 'error' : 'processing');
  const [message, setMessage] = useState(
    failed
      ? 'Payment was not completed. Please try again or return to the premium page.'
      : 'Waiting for PayMongo payment confirmation...'
  );

  useEffect(() => {
    let mounted = true;
    let attempt = 0;

    const checkStatus = async () => {
      try {
        const response = await axios.get(
          'http://localhost:8000/api/payments/ai-premium/status',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (!mounted) return;
        if (failed) return;

        if (response.data?.data?.premiumAIAccess) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              localStorage.setItem(
                'user',
                JSON.stringify({ ...parsedUser, premiumAIAccess: true })
              );
            } catch (e) {
              console.warn('Unable to update user premium status in localStorage.', e);
            }
          }

          setStatus('success');
          setMessage('🎉 Payment successful! Your AI Premium access is now active.');
          setTimeout(() => {
            navigate('/explore');
          }, 2000);
          return;
        }

        attempt += 1;
        if (attempt < 12) {
          setTimeout(checkStatus, 5000);
        } else {
          setStatus('error');
          setMessage('Payment appears pending. If you completed checkout, please wait a moment and refresh this page.');
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Payment status error:', err);
        setStatus('error');
        setMessage(err.response?.data?.message || 'Payment verification failed.');
      }
    };

    checkStatus();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'processing' && (
          <>
            <div style={styles.spinner} />
            <p style={styles.text}>{message}</p>
            <p style={styles.smallText}>
              Your checkout page should be open in a new tab. Keep this tab open while we wait for confirmation.
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={styles.successIcon}>✓</div>
            <p style={styles.text}>{message}</p>
            <p style={styles.smallText}>Redirecting to Explore...</p>
            <button
              onClick={() => navigate('/ai-premium')}
              style={styles.button}
            >
              Return to Premium Page
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={styles.errorIcon}>✕</div>
            <p style={styles.text}>{message}</p>
            <button
              onClick={() => navigate('/ai-premium')}
              style={styles.button}
            >
              Return to Premium Page
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
