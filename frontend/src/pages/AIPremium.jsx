import { useState, useContext } from "react";
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

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setError("");
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !token) {
      setError("Please select a plan and sign in");
      return;
    }

    setError("");
    setLoading(true);

    const paymentWindow = window.open('about:blank', '_blank');
    if (paymentWindow) {
      paymentWindow.opener = null;
      paymentWindow.document.write('<p style="font-family: sans-serif; padding: 20px;">Opening PayMongo checkout...</p>');
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/payments/ai-premium",
        { plan: selectedPlan.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const paymentUrl = response.data?.data?.paymentUrl;
      if (!paymentUrl) {
        if (paymentWindow) paymentWindow.close();
        setError("Could not start payment. Please try again later.");
        return;
      }

      if (!paymentWindow) {
        setError(
          "Popup blocked. Please allow popups for this site and try again."
        );
        return;
      }

      paymentWindow.location.href = paymentUrl;
      navigate('/ai-premium/success');
    } catch (err) {
      if (paymentWindow) paymentWindow.close();
      console.error("AI premium checkout error", err);
      setError(
        err.response?.data?.message ||
          "Failed to start payment. Please try again."
      );
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
              You will be redirected to PayMongo&apos;s secure checkout page to
              complete the purchase.
            </div>
            {error && (
              <div style={styles.errorBox}>{error}</div>
            )}
            <button
              style={styles.purchaseButton}
              onClick={handlePurchase}
              disabled={loading}
            >
              {loading ? 'Redirecting...' : `Upgrade to Premium — ${selectedPlan.price}`}
            </button>
            <div style={styles.poweredBy}>Powered by PayMongo</div>
          </div>
        </div>
      )}
    </div>
  );
}
