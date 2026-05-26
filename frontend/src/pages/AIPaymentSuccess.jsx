import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const STATUS_NAMES = {
  success: 'success',
  failed: 'error',
  cancelled: 'cancelled',
};

export default function AIPaymentSuccess({ page = 'success' }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(page === 'success' ? 'processing' : STATUS_NAMES[page]);
  const [message, setMessage] = useState(
    page === 'failed'
      ? 'Payment was not completed. Please try again or return to the premium page.'
      : page === 'cancelled'
      ? 'Payment was cancelled. You can try again or return to the premium page.'
      : 'Waiting for PayMongo payment confirmation...'
  );

  useEffect(() => {
    let mounted = true;
    let attempt = 0;
    const maxAttempts = 15;
    const pollingDelay = 4000;

    const dispatchUserUpdatedEvent = () => {
      window.dispatchEvent(new Event('app:userUpdated'));
    };

    const savePremiumToLocalStorage = (premiumPlan) => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      try {
        const parsedUser = JSON.parse(storedUser);
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...parsedUser,
            premiumAIAccess: true,
            premiumPlan: premiumPlan || parsedUser.premiumPlan || parsedUser.lastAIPaymentPlan || parsedUser.premiumPlan,
          })
        );
        dispatchUserUpdatedEvent();
        setTimeout(() => {
          try { window.location.reload(); } catch (e) { /* ignore */ }
        }, 700);
      } catch (e) {
        console.warn('Unable to update user premium status in localStorage.', e);
      }
    };

    const handleRedirect = (target) => {
      setTimeout(() => {
        navigate(target);
      }, 1200);
    };

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

    const tryConfirm = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sourceId = params.get('source') || params.get('sourceId') || params.get('id') || null;
        const storedUser = localStorage.getItem('user');
        let fallbackSource = null;
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            fallbackSource = parsed.lastAIPaymentSource || parsed.lastAIPaymentSource || null;
          } catch (e) {
            // ignore
          }
        }

        const finalSource = sourceId || fallbackSource;
        if (!finalSource) return null;
        // try public confirm first (works when sessions are not validated after redirect)
        try {
          const publicUrl = `${backendUrl}/api/payments/ai-premium/confirm-public?sourceId=${encodeURIComponent(finalSource)}`;
          const pubRes = await axios.get(publicUrl);
          if (pubRes?.data?.data) return pubRes.data.data;
        } catch (e) {
          // fall back to protected confirm
        }

        const url = `${backendUrl}/api/payments/ai-premium/confirm?sourceId=${encodeURIComponent(finalSource)}`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        return res.data?.data || null;
      } catch (e) {
        return null;
      }
    };

    const checkStatus = async () => {
      // try a direct confirm first (helps when webhook isn't delivered yet)
      try {
        const confirmResult = await tryConfirm();
        if (confirmResult?.premiumAIAccess) {
          savePremiumToLocalStorage(confirmResult?.premiumPlan || null);
          setStatus('success');
          setMessage('🎉 Payment successful! Redirecting to premium page...');
          handleRedirect('/ai-premium');
          return;
        }
      } catch (e) {
        // ignore and continue to polling
      }
      if (page !== 'success') {
        return;
      }

      try {
        const response = await axios.get(`${backendUrl}/api/payments/ai-premium/status`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!mounted) return;

        const data = response.data?.data || {};
        const isPremium = data?.premiumAIAccess;
        const paymentStatus = String(data?.status || 'pending').toLowerCase();
        const premiumPlan = data?.premiumPlan || null;

        if (isPremium) {
          savePremiumToLocalStorage(premiumPlan);
          setStatus('success');
          setMessage('🎉 Payment successful! Redirecting to premium page...');
          handleRedirect('/ai-premium');
          return;
        }

        const failedStatuses = ['failed', 'declined', 'canceled', 'cancelled', 'expired', 'voided'];
        const cancelledStatuses = ['canceled', 'cancelled'];

        if (cancelledStatuses.includes(paymentStatus)) {
          setStatus('cancelled');
          setMessage('Payment was cancelled. Redirecting to cancellation page...');
          handleRedirect('/payment-cancelled');
          return;
        }

        if (failedStatuses.includes(paymentStatus)) {
          setStatus('error');
          setMessage('Payment failed. Redirecting to failed payment page...');
          handleRedirect('/payment-failed');
          return;
        }

        attempt += 1;
        if (attempt >= maxAttempts) {
          setStatus('error');
          setMessage('Payment confirmation is still pending. Please refresh or return to premium.');
          return;
        }

        setTimeout(checkStatus, pollingDelay);
      } catch (err) {
        if (!mounted) return;
        console.error('Payment status error:', err);
        attempt += 1;

        if (attempt >= maxAttempts) {
          setStatus('error');
          setMessage('Unable to verify payment. Please return to the premium page and try again.');
          return;
        }

        setTimeout(checkStatus, pollingDelay);
      }
    };

    if (page === 'success') {
      checkStatus();
    }

    return () => {
      mounted = false;
    };
  }, [navigate, page]);

  const renderContent = () => {
    if (status === 'processing') {
      return (
        <>
          <div style={styles.spinner} />
          <p style={styles.text}>{message}</p>
          <p style={styles.smallText}>
            This page will update automatically once PayMongo confirms your payment.
          </p>
        </>
      );
    }

    if (status === 'success') {
      return (
        <>
          <div style={styles.successIcon}>✓</div>
          <p style={styles.text}>{message}</p>
          <p style={styles.smallText}>Redirecting to your premium page...</p>
          <button onClick={() => navigate('/ai-premium')} style={styles.button}>
            Go to Premium Page
          </button>
        </>
      );
    }

    if (status === 'cancelled') {
      return (
        <>
          <div style={styles.errorIcon}>⚠️</div>
          <p style={styles.text}>{message}</p>
          <button onClick={() => navigate('/ai-premium')} style={styles.button}>
            Return to Premium Page
          </button>
        </>
      );
    }

    return (
      <>
        <div style={styles.errorIcon}>✕</div>
        <p style={styles.text}>{message}</p>
        <button onClick={() => navigate('/ai-premium')} style={styles.button}>
          Return to Premium Page
        </button>
      </>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>{renderContent()}</div>
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
    maxWidth: '430px',
    width: '90%',
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
