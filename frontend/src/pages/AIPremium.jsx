import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ThemeContext } from "../contexts/ThemeContext";
import { useTranslate } from "../hooks/useTranslate";

export default function AIPremium() {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const t = useTranslate();
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(localStorage.getItem("user") || "{}") : null;
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  const dispatchUserUpdatedEvent = () => {
    window.dispatchEvent(new Event('app:userUpdated'));
  };

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentMessage, setPaymentMessage] = useState('Choose a payment method to continue.');
  const [paymentError, setPaymentError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    number: '',
    expMonth: '',
    expYear: '',
    cvc: '',
  });
  const [supportedMethods, setSupportedMethods] = useState([]);
  const [methodLoading, setMethodLoading] = useState(true);
  const pollingRef = useRef(null);

  useEffect(() => {
    const loadSupportedMethods = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/payments/ai-premium/methods', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const methods = response.data?.data?.methods || [];
        setSupportedMethods(methods.map((item) => item.id));
      } catch (err) {
        console.error('Failed to load supported payment methods', err);
        setSupportedMethods(['gcash']);
      } finally {
        setMethodLoading(false);
      }
    };

    if (token) {
      loadSupportedMethods();
    } else {
      setMethodLoading(false);
    }
  }, [token]);

  const paymentMethods = [
    {
      id: "qrph",
      label: "QRPH",
      description:
        "Scan the code from your banking app or any QR payment app available in the Philippines.",
    },
    {
      id: "gcash",
      label: "GCash",
      description: "Pay instantly with GCash and finish the purchase inside Applica.",
    },
    {
      id: "maya",
      label: "Maya",
      description: "Use your Maya wallet to pay directly from the app.",
    },
    {
      id: "card",
      label: "Card",
      description: "Pay securely with your debit or credit card.",
    },
  ];

  const methodOptions = paymentMethods.map((method) => ({
    ...method,
    supported: methodLoading ? true : supportedMethods.includes(method.id),
  }));

  const plans = [
    {
      id: "monthly",
      name: "Monthly Plan",
      price: "₱69",
      duration: "1 Month",
      features: [
        "Unlimited AI-powered resume generation",
        "Resume matching for best-fit jobs",
        "AI-powered applicant filtering",
        "Priority access to premium tools",
      ],
      popular: false,
    },
    {
      id: "halfYearly",
      name: "Half-Year Plan",
      price: "₱450",
      duration: "6 Months",
      features: [
        "Everything in Monthly Plan",
        "Longer access at a lower rate",
        "AI resume and job matching",
        "Premium support and faster access",
      ],
      popular: true,
    },
    {
      id: "annual",
      name: "Annual Plan",
      price: "₱799",
      duration: "12 Months",
      features: [
        "Best value for long-term users",
        "Unlimited AI resume generation",
        "Resume matching and applicant filtering",
        "Priority support and savings",
      ],
      popular: false,
    },
  ];

  const handleSelectPlan = (plan) => {
    if (!token) {
      navigate("/auth");
      return;
    }
    setSelectedPlan(plan);
    setPaymentError("");
    setPaymentSession(null);
    setPaymentStatus('idle');
    setPaymentMessage('Choose a payment method to continue.');
  };

  const handleSelectMethod = (method) => {
    if (!method.supported) {
      setPaymentError(
        'This payment method is not available with your account. Please choose another method.'
      );
      return;
    }
    setSelectedMethod(method);
    setPaymentError("");
    setPaymentSession(null);
    setPaymentStatus('idle');
    setPaymentMessage('Ready for payment.');
  };

  const handleCardInput = (field, value) => {
    setCardData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateLocalUserPremium = (plan) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    try {
      const parsedUser = JSON.parse(storedUser);
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...parsedUser,
          premiumAIAccess: true,
          premiumPlan: plan || parsedUser.premiumPlan || parsedUser.lastAIPaymentPlan || parsedUser.premiumPlan,
        })
      );
    } catch (e) {
      console.warn('Unable to update premium user state in localStorage.', e);
    }
  };

  const startPaymentStatusPolling = () => {
    if (!selectedPlan || !paymentSession?.sourceId) return;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    setPaymentStatus('pending');
    setPaymentMessage('Waiting for PayMongo to confirm your payment...');
    setPaymentError('');

    const checkStatus = async () => {
      try {
        const response = await axios.get(
          'http://localhost:8000/api/payments/ai-premium/status',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const paymentData = response.data?.data || {};
        const isPremium = paymentData?.premiumAIAccess;
        const status = String(paymentData?.status || 'pending').toLowerCase();

        if (isPremium) {
          updateLocalUserPremium(paymentData.premiumPlan || selectedPlan.id);
          setPaymentStatus('success');
          setPaymentMessage('Payment confirmed. Premium access enabled!');
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          setTimeout(() => navigate('/ai-premium'), 1200);
          return;
        }

        const failedStatuses = ['failed', 'declined', 'canceled', 'cancelled', 'expired', 'voided'];
        const cancelledStatuses = ['canceled', 'cancelled'];

        if (cancelledStatuses.includes(status)) {
          setPaymentStatus('cancelled');
          setPaymentError('Payment was cancelled. Please try another method or retry.');
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          return;
        }

        if (failedStatuses.includes(status)) {
          setPaymentStatus('error');
          setPaymentError('Payment failed. Please retry or use a different method.');
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          return;
        }

        setPaymentMessage('Waiting for payment confirmation...');
      } catch (err) {
        console.error('Payment status polling error', err);
        setPaymentError('Unable to check payment status right now. Retrying...');
      }
    };

    checkStatus();
    pollingRef.current = setInterval(checkStatus, 4500);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search || '');
    const sourceId = params.get('id') || params.get('source') || params.get('sourceId');
    if (!sourceId) return;

    (async () => {
      try {
        await axios.get(`${BACKEND_URL}/api/payments/ai-premium/confirm-public?sourceId=${encodeURIComponent(sourceId)}`);
        if (token) {
          try {
            await axios.get(`${BACKEND_URL}/api/payments/ai-premium/confirm?sourceId=${encodeURIComponent(sourceId)}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch (e) {
            // ignore protected confirm failure
          }

          try {
            const me = await axios.get(`${BACKEND_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const newUser = me?.data?.data?.user;
            if (newUser) {
              localStorage.setItem('user', JSON.stringify(newUser));
              dispatchUserUpdatedEvent();
              setTimeout(() => { try { window.location.reload(); } catch (e) {} }, 700);
            } else {
              const stored = localStorage.getItem('user');
              if (stored) {
                const parsed = JSON.parse(stored);
                parsed.premiumAIAccess = true;
                localStorage.setItem('user', JSON.stringify(parsed));
                dispatchUserUpdatedEvent();
                setTimeout(() => { try { window.location.reload(); } catch (e) {} }, 700);
              }
            }
          } catch (e) {
            const stored = localStorage.getItem('user');
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.premiumAIAccess = true;
              localStorage.setItem('user', JSON.stringify(parsed));
              dispatchUserUpdatedEvent();
              setTimeout(() => { try { window.location.reload(); } catch (e) {} }, 700);
            }
          }

        } else {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.premiumAIAccess = true;
            localStorage.setItem('user', JSON.stringify(parsed));
            dispatchUserUpdatedEvent();
          }
        }

        setPaymentStatus('success');
        setPaymentMessage('Payment confirmed. Premium access enabled.');
        // Clean the query params from the URL
        window.history.replaceState({}, document.title, '/ai-premium');
      } catch (err) {
        console.error('Public confirm failed for sourceId=', sourceId, err);
      }
    })();
  }, []);

  useEffect(() => {
    if (
      !methodLoading &&
      selectedMethod &&
      supportedMethods.length > 0 &&
      !supportedMethods.includes(selectedMethod.id)
    ) {
      setSelectedMethod(null);
      setPaymentError(
        'The selected payment method is no longer available. Please choose another method.'
      );
    }
  }, [methodLoading, selectedMethod, supportedMethods]);

  const handlePurchase = async () => {
    if (!selectedPlan || !selectedMethod || !token) {
      setPaymentError('Please select a plan, payment method, and sign in.');
      return;
    }

    if (!selectedMethod.supported) {
      setPaymentError('Selected payment method is not supported. Please choose another method.');
      return;
    }

    if (selectedMethod.id === 'card') {
      if (!cardData.number || !cardData.expMonth || !cardData.expYear || !cardData.cvc) {
        setPaymentError('Please enter your card number, expiration month/year, and CVC.');
        return;
      }
    }

    setLoading(true);
    setPaymentError('');
    setPaymentStatus('initializing');
    setPaymentMessage('Creating payment session...');

    try {
      const response = await axios.post(
        'http://localhost:8000/api/payments/ai-premium',
        {
          plan: selectedPlan.id,
          paymentMethod: selectedMethod.id,
          card: selectedMethod.id === 'card' ? cardData : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const payload = response.data?.data;
      if (!payload || !payload.sourceId) {
        setPaymentError('Unable to initialize payment. Please try again.');
        setPaymentStatus('error');
        return;
      }

      setPaymentSession(payload);
      setPaymentStatus(payload.status || 'pending');
      setPaymentMessage(
        payload.qrCode
          ? 'Scan the QR code below with your banking app to complete payment.'
          : payload.checkoutUrl
          ? 'Open the payment link below to complete your GCash payment.'
          : 'Please follow the instructions to complete the payment.'
      );
      // Navigate to dedicated payment pages for better UX
      try {
        if (selectedMethod?.id === 'gcash') {
          const url = payload.checkoutUrl || payload.sourceAttributes?.redirect?.checkout_url || null;
          navigate('/payment/gcash', { state: { sourceUrl: url, sourceId: payload.sourceId } });
        } else if (selectedMethod?.id === 'qrph') {
          const qr = payload.qrCode || payload.sourceAttributes?.qr_code || null;
          navigate('/payment/qr', { state: { qr, sourceId: payload.sourceId, checkoutUrl: payload.checkoutUrl } });
        } else if (selectedMethod?.id === 'card') {
          navigate('/payment/card', { state: { sourceId: payload.sourceId, sourceAttributes: payload.sourceAttributes } });
        }
      } catch (e) {
        // ignore navigation errors
      }
      startPaymentStatusPolling();
    } catch (err) {
      console.error('AI premium checkout error', err);
      setPaymentError(
        err.response?.data?.message || 'Failed to create payment. Please try again.'
      );
      setPaymentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
      padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    header: {
      maxWidth: "1200px",
      margin: "0 auto 60px",
      textAlign: "center",
    },
    title: {
      fontSize: "42px",
      fontWeight: "800",
      color: isDarkMode ? "#f1f5f9" : "#0f172a",
      marginBottom: "16px",
      letterSpacing: "-1px",
    },
    subtitle: {
      fontSize: "18px",
      color: isDarkMode ? "#cbd5e1" : "#64748b",
      marginBottom: "8px",
    },
    description: {
      fontSize: "16px",
      color: isDarkMode ? "#94a3b8" : "#78909c",
      maxWidth: "600px",
      margin: "0 auto",
      lineHeight: "1.6",
    },
    plansContainer: {
      maxWidth: "1200px",
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "28px",
      marginBottom: "60px",
    },
    planCard: (popular, active) => ({
      backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
      borderRadius: "16px",
      padding: "32px 24px",
      border: active
        ? "2px solid #facc15"
        : popular
        ? "2px solid #1892aa"
        : isDarkMode
        ? "1px solid #334155"
        : "1px solid #e2e8f0",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      boxShadow: active
        ? "0 16px 40px rgba(250, 204, 21, 0.18)"
        : popular
        ? "0 10px 30px rgba(24, 146, 170, 0.15)"
        : isDarkMode
        ? "0 1px 3px rgba(0, 0, 0, 0.3)"
        : "0 1px 3px rgba(0, 0, 0, 0.1)",
      transform: active ? "translateY(-4px)" : "none",
      transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
    }),
    popularBadge: {
      position: "absolute",
      top: "-12px",
      right: "24px",
      background: "linear-gradient(90deg, #1892aa 0%, #275791 100%)",
      color: "#fff",
      padding: "6px 16px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "700",
      letterSpacing: "0.5px",
    },
    planName: {
      fontSize: "20px",
      fontWeight: "800",
      color: isDarkMode ? "#f1f5f9" : "#0f172a",
      marginBottom: "12px",
      marginTop: "0",
    },
    planPrice: {
      fontSize: "36px",
      fontWeight: "900",
      color: "#1892aa",
      marginBottom: "4px",
    },
    planDuration: {
      fontSize: "14px",
      color: isDarkMode ? "#94a3b8" : "#64748b",
      marginBottom: "24px",
    },
    featuresList: {
      listStyle: "none",
      padding: "0",
      margin: "0 0 32px 0",
      flex: 1,
    },
    featureItem: {
      fontSize: "14px",
      color: isDarkMode ? "#cbd5e1" : "#475569",
      padding: "12px 0",
      borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    featureIcon: {
      color: "#1892aa",
      fontSize: "18px",
      flexShrink: 0,
    },
    selectButton: (popular) => ({
      padding: "14px 24px",
      borderRadius: "10px",
      border: "none",
      fontWeight: "700",
      fontSize: "16px",
      cursor: "pointer",
      transition: "all 0.2s",
      backgroundColor: popular ? "#1892aa" : "transparent",
      color: popular ? "#fff" : "#1892aa",
      borderWidth: "2px",
      borderStyle: "solid",
      borderColor: "#1892aa",
    }),
    backButton: {
      maxWidth: "1200px",
      margin: "0 auto 40px",
      padding: "0 20px",
    },
    backBtn: {
      background: "transparent",
      border: "none",
      color: isDarkMode ? "#94a3b8" : "#64748b",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      padding: "8px 12px",
      marginLeft: "-12px",
    },
    checkoutPanel: {
      maxWidth: "900px",
      margin: "0 auto",
      padding: "30px 20px",
      borderRadius: "20px",
      backgroundColor: isDarkMode ? "#111827" : "#ffffff",
      border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
      boxShadow: isDarkMode
        ? "0 20px 60px rgba(0, 0, 0, 0.25)"
        : "0 10px 30px rgba(15, 23, 42, 0.08)",
      marginBottom: "40px",
    },
    checkoutHeader: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "6px",
      marginBottom: "20px",
    },
    checkoutTitle: {
      margin: 0,
      color: isDarkMode ? "#f8fafc" : "#0f172a",
      fontSize: "28px",
      fontWeight: "800",
    },
    checkoutSubtitle: {
      margin: 0,
      color: isDarkMode ? "#94a3b8" : "#475569",
      fontSize: "16px",
    },
    checkoutBox: {
      display: "grid",
      gap: "18px",
      padding: "24px",
      borderRadius: "18px",
      backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
      border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    },
    checkoutAmount: {
      fontSize: "44px",
      fontWeight: "900",
      color: "#1892aa",
      letterSpacing: "-1px",
    },
    checkoutDescription: {
      color: isDarkMode ? "#cbd5e1" : "#475569",
      fontSize: "15px",
      lineHeight: 1.8,
    },
    methodGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "16px",
      marginBottom: "22px",
    },
    methodCard: (active, disabled) => ({
      borderRadius: "16px",
      padding: "18px",
      textAlign: "left",
      backgroundColor: disabled
        ? isDarkMode
          ? "#111827"
          : "#f8fafc"
        : active
        ? "#1d4ed8"
        : isDarkMode
        ? "#0f172a"
        : "#ffffff",
      color: disabled
        ? isDarkMode
          ? "#6b7280"
          : "#94a3b8"
        : active
        ? "#fff"
        : isDarkMode
        ? "#f8fafc"
        : "#0f172a",
      border: disabled
        ? isDarkMode
          ? "1px solid #334155"
          : "1px solid #e2e8f0"
        : active
        ? "2px solid #2563eb"
        : isDarkMode
        ? "1px solid #334155"
        : "1px solid #e2e8f0",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "transform 0.2s, box-shadow 0.2s",
      boxShadow: disabled
        ? "none"
        : active
        ? "0 24px 60px rgba(13, 110, 253, 0.18)"
        : "0 6px 16px rgba(15, 23, 42, 0.08)",
      minHeight: "120px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      opacity: disabled ? 0.75 : 1,
    }),
    methodDisabledText: {
      marginTop: "12px",
      fontSize: "12px",
      color: isDarkMode ? "#94a3b8" : "#64748b",
    },
    methodLabel: {
      fontSize: "18px",
      fontWeight: "700",
      marginBottom: "8px",
    },
    methodDescription: {
      fontSize: "14px",
      lineHeight: 1.6,
      color: "inherit",
    },
    cardForm: {
      display: "grid",
      gap: "16px",
      padding: "16px",
      borderRadius: "16px",
      backgroundColor: isDarkMode ? "#111827" : "#ffffff",
      border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
      marginTop: "16px",
    },
    inputLabel: {
      fontSize: "14px",
      color: isDarkMode ? "#cbd5e1" : "#475569",
      fontWeight: "600",
      marginBottom: "8px",
      display: "block",
    },
    inputField: {
      width: "100%",
      padding: "14px 16px",
      borderRadius: "12px",
      border: "1px solid #cbd5e1",
      backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
      color: isDarkMode ? "#f8fafc" : "#0f172a",
      fontSize: "15px",
    },
    cardRow: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "14px",
    },
    cardSplit: {
      display: "grid",
      gap: "8px",
    },
    qrPanel: {
      marginTop: "20px",
      padding: "22px",
      borderRadius: "18px",
      textAlign: "center",
      backgroundColor: isDarkMode ? "#0b1120" : "#fff",
      border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    },
    qrImage: {
      width: "220px",
      height: "220px",
      maxWidth: "100%",
      borderRadius: "18px",
      marginBottom: "16px",
    },
    qrHint: {
      color: isDarkMode ? "#cbd5e1" : "#475569",
      fontSize: "14px",
      marginBottom: "12px",
    },
    qrData: {
      fontSize: "13px",
      color: isDarkMode ? "#94a3b8" : "#64748b",
      wordBreak: "break-break",
      lineHeight: 1.6,
      padding: "12px",
      borderRadius: "12px",
      backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
      border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
      marginTop: "10px",
    },
    checkoutLinkButton: {
      display: "inline-block",
      marginTop: "14px",
      padding: "12px 18px",
      backgroundColor: "#0f766e",
      color: "#ffffff",
      borderRadius: "12px",
      textDecoration: "none",
      fontWeight: "700",
    },
    instructionsBox: {
      padding: "18px",
      borderRadius: "16px",
      backgroundColor: isDarkMode ? "#121827" : "#f8fafc",
      border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
      marginTop: "16px",
    },
    statusBox: {
      marginTop: "20px",
      padding: "16px",
      borderRadius: "16px",
      backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
      border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    },
    statusText: {
      color: isDarkMode ? "#cbd5e1" : "#475569",
      fontSize: "14px",
    },
    successText: {
      color: "#22c55e",
      fontSize: "14px",
      marginTop: "10px",
    },
    errorText: {
      color: "#f87171",
      fontSize: "14px",
      marginTop: "10px",
    },
    errorBox: {
      color: "#b91c1c",
      backgroundColor: "#fee2e2",
      padding: "14px 16px",
      borderRadius: "12px",
      fontSize: "14px",
      border: "1px solid #fecaca",
    },
    purchaseButton: {
      padding: "16px 22px",
      borderRadius: "14px",
      border: "none",
      backgroundColor: "#1892aa",
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "opacity 0.2s",
    },
    poweredBy: {
      fontSize: "12px",
      color: isDarkMode ? "#94a3b8" : "#64748b",
      textAlign: "center",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.backButton}>
        <button
          style={styles.backBtn}
          onClick={() => navigate(-1)}
          title="Go back"
        >
          ← Back
        </button>
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>AI Premium</h1>
        <p style={styles.subtitle}>Unlock powerful AI features</p>
        <p style={styles.description}>
          Get unlimited AI-powered resume generation, resume matching, and AI
          applicant filtering to accelerate your job search or hiring process.
        </p>
      </div>

      <div style={styles.plansContainer}>
        {plans.map((plan) => {
          const isActive = selectedPlan?.id === plan.id;
          return (
            <div key={plan.id} style={styles.planCard(plan.popular, isActive)}>
              {plan.popular && (
                <div style={styles.popularBadge}>MOST POPULAR</div>
              )}
            <h3 style={styles.planName}>{plan.name}</h3>
            <div style={styles.planPrice}>{plan.price}</div>
            <div style={styles.planDuration}>{plan.duration}</div>

            <ul style={styles.featuresList}>
              {plan.features.map((feature, idx) => (
                <li key={idx} style={styles.featureItem}>
                  <span style={styles.featureIcon}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              style={styles.selectButton(plan.popular)}
              onClick={() => handleSelectPlan(plan)}
              disabled={loading}
            >
              {plan.popular ? "Get Started" : "Choose Plan"}
            </button>
          </div>
        );
      })}
      </div>

      {selectedPlan && (
        <div style={styles.checkoutPanel}>
          <div style={styles.checkoutHeader}>
            <h2 style={styles.checkoutTitle}>Selected Plan</h2>
            <p style={styles.checkoutSubtitle}>
              {selectedPlan.name} — {selectedPlan.duration}
            </p>
          </div>

          <div style={styles.checkoutBox}>
            <div style={styles.checkoutAmount}>{selectedPlan.price}</div>
            <div style={styles.checkoutDescription}>
              Complete your payment inside Applica using a method below.
            </div>

            <div style={styles.methodGrid}>
              {methodOptions.map((method) => {
                const active = selectedMethod?.id === method.id;
                const disabled = !method.supported;
                return (
                  <button
                    key={method.id}
                    onClick={() => !disabled && handleSelectMethod(method)}
                    style={styles.methodCard(active, disabled)}
                    type="button"
                    disabled={disabled}
                  >
                    <div style={styles.methodLabel}>{method.label}</div>
                    <div style={styles.methodDescription}>{method.description}</div>
                    {disabled && (
                      <div style={styles.methodDisabledText}>
                        Not available for your PayMongo setup.
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {methodLoading && (
              <div style={styles.statusBox}>
                Loading available payment methods...
              </div>
            )}

            {!methodLoading && supportedMethods.length === 0 && (
              <div style={styles.statusBox}>
                No payment methods are available for your PayMongo setup.
              </div>
            )}

            {selectedMethod && selectedMethod.id === 'card' && (
              <div style={styles.cardForm}>
                <label style={styles.inputLabel}>Cardholder Name</label>
                <input
                  value={cardData.name}
                  onChange={(e) => handleCardInput('name', e.target.value)}
                  style={styles.inputField}
                  placeholder="Full name as printed on card"
                />
                <label style={styles.inputLabel}>Card Number</label>
                <input
                  value={cardData.number}
                  onChange={(e) => handleCardInput('number', e.target.value)}
                  style={styles.inputField}
                  placeholder="1234 1234 1234 1234"
                />
                <div style={styles.cardRow}>
                  <div style={styles.cardSplit}>
                    <label style={styles.inputLabel}>Exp Month</label>
                    <input
                      value={cardData.expMonth}
                      onChange={(e) => handleCardInput('expMonth', e.target.value)}
                      style={styles.inputField}
                      placeholder="MM"
                    />
                  </div>
                  <div style={styles.cardSplit}>
                    <label style={styles.inputLabel}>Exp Year</label>
                    <input
                      value={cardData.expYear}
                      onChange={(e) => handleCardInput('expYear', e.target.value)}
                      style={styles.inputField}
                      placeholder="YYYY"
                    />
                  </div>
                  <div style={styles.cardSplit}>
                    <label style={styles.inputLabel}>CVC</label>
                    <input
                      value={cardData.cvc}
                      onChange={(e) => handleCardInput('cvc', e.target.value)}
                      style={styles.inputField}
                      placeholder="CVC"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentError && <div style={styles.errorBox}>{paymentError}</div>}

            {(
              paymentSession?.qrCode ||
              paymentSession?.sourceAttributes?.qr_code
            ) && (
              <div style={styles.qrPanel}>
                {(
                  paymentSession?.qrCode ||
                  paymentSession?.sourceAttributes?.qr_code
                ).image_url ? (
                  <>
                    <img
                      src={
                        paymentSession?.qrCode?.image_url ||
                        paymentSession?.sourceAttributes?.qr_code?.image_url
                      }
                      alt="PayMongo QR code"
                      style={styles.qrImage}
                    />
                    <div style={styles.qrHint}>
                      Scan the QR code above with your mobile wallet or banking app
                      to complete the payment.
                    </div>
                  </>
                ) : (
                  <div style={styles.qrHint}>
                    Use the code below in your banking or e-wallet app to
                    complete the payment.
                  </div>
                )}
                {(paymentSession?.qrCode?.data ||
                  paymentSession?.sourceAttributes?.qr_code?.data) && (
                  <div style={styles.qrData}>
                    {paymentSession?.qrCode?.data ||
                      paymentSession?.sourceAttributes?.qr_code?.data}
                  </div>
                )}
              </div>
            )}

            {(
              paymentSession?.checkoutUrl ||
              paymentSession?.sourceAttributes?.redirect?.checkout_url
            ) && (
              <div style={styles.instructionsBox}>
                <p style={styles.checkoutDescription}>
                  Payment session created for {selectedMethod.label}. Open the link
                  below to continue your payment.
                </p>
                <a
                  href={
                    paymentSession.checkoutUrl ||
                    paymentSession.sourceAttributes?.redirect?.checkout_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={styles.checkoutLinkButton}
                >
                  Continue to payment
                </a>
                <div style={styles.checkoutDescription}>
                  If the button does not work, copy and paste this link into your
                  browser:
                </div>
                <div style={styles.qrData}>
                  {paymentSession.checkoutUrl ||
                    paymentSession.sourceAttributes?.redirect?.checkout_url}
                </div>
              </div>
            )}

            {paymentSession &&
              !paymentSession?.qrCode &&
              !paymentSession?.checkoutUrl &&
              !paymentSession?.sourceAttributes?.redirect?.checkout_url && (
                <div style={styles.instructionsBox}>
                  <p style={styles.checkoutDescription}>
                    Payment session created for {selectedMethod.label}. Follow the
                    instructions above and wait for confirmation.
                  </p>
                </div>
              )}

            <button
              style={styles.purchaseButton}
              onClick={handlePurchase}
              disabled={loading || !selectedMethod || !selectedMethod.supported || Boolean(paymentSession)}
            >
              {loading
                ? 'Creating payment session...'
                : paymentSession
                ? 'Waiting for payment status'
                : `Pay ${selectedPlan.price} with ${selectedMethod?.label || 'selected method'}`}
            </button>

            <div style={styles.statusBox}>
              <p style={styles.statusText}>{paymentMessage}</p>
              {paymentStatus === 'success' && (
                <p style={styles.successText}>Premium activated successfully.</p>
              )}
              {paymentStatus === 'error' && (
                <p style={styles.errorText}>Please refresh and retry the payment.</p>
              )}
              {paymentStatus === 'cancelled' && (
                <p style={styles.errorText}>You cancelled the payment. Please choose another method.</p>
              )}
            </div>

            <div style={styles.poweredBy}>Powered by PayMongo</div>
          </div>
        </div>
      )}
    </div>
  );
}
